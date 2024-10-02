import { exit } from "process";
import puppeteer from "puppeteer-core";
import Redis, { RedisOptions } from "ioredis";
import { v4 as uuidv4 } from "uuid";
import chalk from "chalk";
import { add } from "date-fns";
import Queue, { Job } from "bullmq";
import IScraper, { JSONScraperOptions, Selector } from "./scrapers/IScraper";
import JSONScraper from "./scrapers/JSONScraper";
import AsianHandicapTransformer from "./transformers/AsianHandicapTransformer";
import { MatchTransformedData } from "./transformers/ITransformer";
import MatchTransformer from "./transformers/MatchTransformer";
import OneTimesTwoTransformer from "./transformers/OneTimesTwoTransformer";
import BookiesMapping from "./transformers/tests/fixtures/bookies_mapping.json";
import TotalsTransformer from "./transformers/TotalsTransformer";
import { readJsonFile } from "./utils";
import { JobData } from "./utils/RedisJobQueue";

interface ScrapeParams {
  url: string;
  opt: Record<string, unknown>;
}
let client: Redis;
let subscriber: Redis;
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redisOpts = {
  // redisOpts here will contain at least a property of connectionName which will identify the queue based on its name
  createClient: function (type: string, redisOpts: RedisOptions) {
    switch (type) {
      case "client":
        if (!client) {
          client = new Redis(REDIS_URL, {
            ...redisOpts,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
          });
        }
        return client;
      case "subscriber":
        if (!subscriber) {
          subscriber = new Redis(REDIS_URL, {
            ...redisOpts,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
          });
        }
        return subscriber;
      case "bclient":
        return new Redis(REDIS_URL, {
          ...redisOpts,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        });
      default:
        throw new Error("Unexpected connection type: " + type);
    }
  },
  limiter: {
    max: 1000,
    duration: 50000,
  },
  settings: {
    backoffStrategies: {
      // truncated binary exponential backoff
      binaryExponential: function (
        attemptsMade: number,
        err: any,
        options: { delay?: any; truncate?: any }
      ) {
        // Options can be undefined, you need to handle it by yourself
        if (!options) {
          options = {};
        }
        const delay = options.delay || 1000;
        const truncate = options.truncate || 1000;
        console.error({ attemptsMade, err, options });
        return Math.round(
          Math.random() *
            (Math.pow(2, Math.max(attemptsMade, truncate)) - 1) *
            delay
        );
      },
    },
  },
};

// const LEAGUE = "united-rugby-championship";
// const SEASON = "2022-2023";
// const SPORT = "rugby-union";
// const COUNTRY = "world";

const LEAGUE = "super-league";
const SEASON = "2024";
const SPORT = "rugby-league";
const COUNTRY = "england";

const SELECTORS = {
  agreement: "#onetrust-accept-btn-handler",
  bookieRow: "#odds-data-table > div:nth-child(1) > table > tbody > tr",
  homeWin: "td:nth-child(2) > div",
  draw: "td:nth-child(3) > div",
  awayWin: "td:nth-child(4) > div",
  bookieName: "td:nth-child(1) > div",
  //   tooltipSel: "#tooltiptext",
  dateSel: "#col-content > p.date.datet",
  tooltipSel: "#tooltipdiv",
  matchName: "#col-content > h1",
  matches: "#tournamentTable > tbody > tr.deactivate",
  matchLink: "td.name.table-participant > a",
  highestOdds: {
    container:
      "#odds-data-table > div:nth-child(1) > table > tfoot > tr.highest",
    homeWin: "td:nth-child(2)",
    draw: "td:nth-child(3)",
    awayWin: "td:nth-child(4)",
  },
  tabList: "#bettype-tabs > ul > li",
  tabContentLists: {
    listItems: "#odds-data-table > div.table-container",
    listItemName: "div.table-header-light > strong > a",
    listItemBookies: "div > span.odds-co > a",
  },
  paginator: {
    nextSel: "#pagination > a:nth-child(6) > span",
    totalPages: "#pagination > a:last-child",
    currentPage: "#pagination > span.active-page",
  },
  //   event: {
  //     oneTimesTwo: {
  //         home: "",
  //         draw: "",
  //         away: "",
  //     }
  //   },
};

const WS_END_POINT =
  "ws://127.0.0.1:9222/devtools/browser/f641254f-a3be-42b0-ac85-7492e3a764ef";
const BASE_URL = "https://www.oddsportal.com";

const queue = new Queue("Odds Scraping", redisOpts);

const options: JSONScraperOptions = {
  timeout: 10000,
  viewPort: {
    height: 2000,
    width: 2000,
  },
  blockedDomains: [],
  selectors: SELECTORS as unknown as Selector,
};

(async () => {
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: WS_END_POINT,
    });

    const scraper = new JSONScraper(browser, options, {
      matchesList: new MatchTransformer(),
      odds: {
        oneTimesTwo: {
          fullTime: new OneTimesTwoTransformer("E-1-2-0-0-0", BookiesMapping),
          firstHalf: new OneTimesTwoTransformer("E-1-3-0-0-0", BookiesMapping),
          secondHalf: new OneTimesTwoTransformer("E-1-4-0-0-0", BookiesMapping),
        },
        asianHandicap: new AsianHandicapTransformer(BookiesMapping),
        totals: new TotalsTransformer(BookiesMapping),
      },
    });

    queue.on("completed", (job) =>
      console.log(
        chalk.blueBright(`Job processed: ${job.id}`)
      )
    );

    queue.on('drained', () => {
      // Queue is drained, no more jobs left
      console.log(chalk.greenBright(`Queue is empty`));
    });
    
    queue.on('failed', (job: Job) => {
      // job has failed
      console.log(
        chalk.redBright(`Job processed: ${job.id}`)
      );
    });

    queue.on("error", (error) =>
      console.error(chalk.redBright("Queue error:", error))
    );

    queue.process(async (job: any, done) => {

      const { data } = job.data as JobData;
      const { url, opt } = data as ScrapeParams;

      try {
        console.log(chalk.blueBright(`Job started: ${job.id}, url: ${url}`));
        await scraper.scrape(url, opt);
        done();
      } catch (error) {
        return job.moveToFailed(
          {
            message: "Call to external service failed!",
          },
          true
        );
      }
    });

    let URL;

    if (parseInt(SEASON) !== new Date().getFullYear()) {
      URL = `${BASE_URL}/${SPORT}/${COUNTRY}/${LEAGUE}-${SEASON}/results/`;
    } else {
      URL = `${BASE_URL}/${SPORT}/${COUNTRY}/${LEAGUE}/results/`;
    }

    // await scraper.crawl(URL);

    // get the matches url from the json created by the crawler
    const matches = readJsonFile(
      "./data/matches.json"
    ) as MatchTransformedData[];

    const urlPrefixes = [
      "#ah;2",
      "#ah;3",
      "#ah;4",
      "#over-under;2",
      "#over-under;3",
      "#over-under;4",
      "#1X2;2",
      "#1X2;3",
      "#1X2;4",
    ];

    const controlMatch = matches[0];
    const matchYear = new Date(controlMatch.date).getFullYear();
    // const matchYear = "2022-2023";

    // this will only work for seasons within one year
    if (matchYear !== parseInt(SEASON)) {
      console.log(controlMatch);
      exit(1);
    }

    for (const match of matches) {
      for (const prefix of urlPrefixes) {
        const url = BASE_URL + match.url + prefix;
        const opt = {
          ...match,
          matchName: `${match.homeTeamName} - ${match.awayTeamName}`,
          leagueName: LEAGUE,
          season: SEASON,
          sport: SPORT,
        };
        await queue.add(
          {
            id: uuidv4(),
            data: {
              url,
              opt,
            },
          },
          {
            delay: 60000,
            attempts: 10,
            backoff: {
              type: "binaryExponential",
              options: {
                delay: 60000,
                truncate: 5,
              },
            },
            removeOnComplete: true, 
            removeOnFail: false
          }
        );
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 60000));
  } catch (error) {
    throw new Error((error as Error).message);
  } finally {
    // queue.stopProcessing();
    // await queue.disconnect();
  }
})();
