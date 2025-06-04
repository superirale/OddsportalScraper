import { Command } from "commander";
import { Queue, Worker, Job } from "bullmq";
import { Cluster } from "puppeteer-cluster";
import Puppeteer, { Page } from "puppeteer";

import { deleter } from "./deleter";
import { JSONScraperOptions, Selector } from "./scrapers/IScraper";
import JSONScraper from "./scrapers/JSONScraper";
import AsianHandicapTransformer from "./transformers/AsianHandicapTransformer";
import MatchTransformer from "./transformers/MatchTransformer";
import OneTimesTwoTransformer from "./transformers/OneTimesTwoTransformer";
import BookiesMapping from "./transformers/tests/fixtures/bookies_mapping.json";
import TotalsTransformer from "./transformers/TotalsTransformer";
import { readJsonFile } from "./utils";
import {
  MatchTransformedData,
  MatchWithPlayerData,
} from "./transformers/ITransformer";
import CouchDBDatasource from "./datasource/CouchDBDataSource";
import { PlayerStatisticTransformer } from "./transformers/PlayerStatisticsTransformer";
import SofascoreScraper from "./scrapers/SofascoreScraper";
import Logger from "./utils/Logger";

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
};
const options: JSONScraperOptions = {
  timeout: 60000,
  viewPort: {
    height: 2000,
    width: 2000,
  },
  blockedDomains: [],
  selectors: SELECTORS as unknown as Selector,
  opts: {
    leagueCode: 302,
    seasonCode: 57044,
    totalRounds: 29,
  },
};

interface LeagueOpt {
  season: string | number;
  country: string;
  league: string;
  sport: string;
}

interface ScrapingJob {
  url: string;
  opt: Record<string, unknown>;
}

interface ScrapingResult {
  url: string;
  jsonResponses: Record<string, unknown>[];
  // Add more fields as needed
}

interface ClusterData {
  page: Page;
  data: ScrapingJob;
}

// Redis connection configuration
const REDIS_CONFIG = {
  connection: {
    host: "localhost",
    port: 6379,
  },
} as const;

// Queue configuration
const QUEUE_NAME = "odds-test";

const scrapingQueue = new Queue<ScrapingJob, ScrapingResult>(QUEUE_NAME, {
  ...REDIS_CONFIG,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
  },
});

async function processJobs() {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 4,
    puppeteerOptions: {
      headless: true,
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
      args: [
        "--disable-gpu",
        "--disable-background-timer-throttling",
        "--disable-background-timer-ticks",
        "--disable-dev-shm-usage",
        "--disable-extensions",
        "--disable-features=TranslateUI",
        "--disable-features=Autoplay",
        "--no-sandbox",
        "-remote-debugging-port=9222",
        "--user-data-dir=/tmp/chrome-testing",
        "--disable-features=site-per-process",
        "--js-flags=--max-old-space-size=512",
        "--disable-dev-shm-usage",
      ],
    },
    monitor: true,
    timeout: 60000,
    retryLimit: 10,
    retryDelay: 10000,
  });

  cluster.task(async ({ page, data }: ClusterData): Promise<ScrapingResult> => {
    const { url, opt } = data;
    const jsonResponses: Record<string, unknown>[] = [];

    try {
      const scraper = new JSONScraper(page, options, {
        matchesList: new MatchTransformer(),
        odds: {
          oneTimesTwo: {
            fullTime: new OneTimesTwoTransformer("E-1-2-0-0-0", BookiesMapping),
            firstHalf: new OneTimesTwoTransformer(
              "E-1-3-0-0-0",
              BookiesMapping
            ),
            secondHalf: new OneTimesTwoTransformer(
              "E-1-4-0-0-0",
              BookiesMapping
            ),
          },
          asianHandicap: new AsianHandicapTransformer(BookiesMapping),
          totals: new TotalsTransformer(BookiesMapping),
        },
      });
      await scraper.scrape(url, { ...opt, timeout: 4000 });
      return {
        url,
        jsonResponses,
      };
    } catch (error) {
      throw new Error(`Failed to scrape ${url}: ${(error as Error).message}`);
    } finally {
      // Clean up
      page.removeAllListeners();
      await page.close().catch(console.error);
    }
  });

  cluster.on("worker:error", (error, worker) => {
    console.error("Worker error:", error);
    worker.exit();
  });

  // Process tasks from the queue
  const worker = new Worker<ScrapingJob, ScrapingResult>(
    QUEUE_NAME,
    async (job: Job<ScrapingJob>): Promise<ScrapingResult> => {
      try {
        if (!cluster) {
          throw new Error("Cluster not created");
        }
        const result = await cluster.execute(job.data);
        await cluster.idle();
        await cluster.close();
        return result;
      } catch (error) {
        throw error;
      } finally {
        if (cluster) {
          await cluster.close().catch(console.error);
        }
      }
    },
    {
      ...REDIS_CONFIG,
      concurrency: 1,
      maxStalledCount: 5,
      limiter: {
        max: 100,
        duration: 1000 * 60, // 1 minute
      },
    }
  );

  // Graceful shutdown handler
  async function gracefulShutdown(): Promise<void> {
    try {
      await Promise.all([worker.close(), scrapingQueue.close()]);
      process.exit(0);
    } catch (error) {
      console.error("Shutdown error:", error);
      process.exit(1);
    }
  }

  // Register shutdown handlers
  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);

  // Event handlers with type-safe callbacks
  worker.on(
    "completed",
    (job: Job<ScrapingJob, ScrapingResult>, _: ScrapingResult) => {
      console.log(`Job ${job.id} completed`);
    }
  );

  worker.on(
    "failed",
    (
      job: Job<ScrapingJob, ScrapingResult, string> | undefined,
      error: Error,
      prev?: string
    ) => {
      if (job) {
        console.error(`Job ${job.id} failed:`, error.message);
      } else {
        console.error("Job failed:", error.message);
      }
    }
  );

  // Error handler for worker events
  worker.on("error", (error: Error) => {
    console.error("Worker error:", error);
  });

  await cluster.idle();
  await cluster.close();
}

async function addScrapingJobs(opt: LeagueOpt): Promise<void> {
  let URL;
  const { season, country, league, sport } = opt;

  const baseURL = "https://www.oddsportal.com";

  if (season !== new Date().getFullYear().toString()) {
    URL = `${baseURL}/${sport}/${country}/${league}-${season}/results/`;
  } else {
    URL = `${baseURL}/${sport}/${country}/${league}/results/`;
  }
  const browser = await Puppeteer.launch();
  const page = await browser.newPage();

  const scraper = new JSONScraper(page, options, {
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
  await scraper.crawl(URL);

  await page.close();
  await browser.close();

  await new Promise((resolve) => setTimeout(resolve, 10000));
  const matches = readJsonFile("./data/matches.json") as MatchTransformedData[];

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

  let data = [];
  for (const match of matches) {
    for (const prefix of urlPrefixes) {
      const url = baseURL + match.url + prefix;
      const opt = {
        ...match,
        matchName: `${match.homeTeamName} - ${match.awayTeamName}`,
        leagueName: league,
        season,
        sport,
      };
      await data.push({ url, opt });
    }
  }

  const jobs = data.map(({ url, opt }) => ({
    name: QUEUE_NAME,
    data: {
      url,
      opt,
    },
    opts: {
      priority: 1,
      delay: 60000,
      attempts: 10,
      backoff: {
        type: "exponential",
        options: {
          delay: 3000,
          truncate: 5,
        },
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  }));

  await scrapingQueue.addBulk(jobs);
  process.exit(1);
}
async function crawlSofascoreRL(): Promise<void> {
  const dataSource = new CouchDBDatasource(
    "http://admin:Omokhudu1987@127.0.0.1:5984",
    "rugby-results"
  );

  const logger = new Logger();

  const transformer = new PlayerStatisticTransformer<MatchWithPlayerData>(logger);

  const scraper = new SofascoreScraper(
    options,
    {
      lineups: transformer,
    },
    dataSource,
    logger
  );
  const results = await scraper.crawl("");

  let data = [];
  for (const result of results) {
    const url = result.matchId as string;
    const opt = {
      ...result,
    };
    await data.push({ url, opt });
  }

  const jobs = data.map(({ url, opt }) => ({
    name: "lineups",
    data: {
      url,
      opt,
    },
    opts: {
      priority: 1,
      delay: 60000,
      attempts: 10,
      backoff: {
        type: "exponential",
        options: {
          delay: 3000,
          truncate: 5,
        },
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  }));

  await scrapingQueue.addBulk(jobs);
  process.exit(1);
}

async function processSofascoreJobs() {

  const dataSource = new CouchDBDatasource(
    "http://admin:Omokhudu1987@127.0.0.1:5984",
    "rugby-results"
  );

  const logger = new Logger();

  // only needed in the function to scrap

  const transformer = new PlayerStatisticTransformer<MatchWithPlayerData>(logger);

  const scraper = new SofascoreScraper(
    options,
    {
      lineups: transformer,
    },
    dataSource,
    logger,
  );
  // Process tasks from the queue
  const worker = new Worker<ScrapingJob, ScrapingResult>(
    QUEUE_NAME,
    async (job: Job<ScrapingJob>): Promise<ScrapingResult> => {
      try {
        const { url, opt } = job.data as ScrapingJob;
        const result = await scraper.scrape(url, opt);
  
        return result as unknown as ScrapingResult;
      } catch (error) {
        throw error;
      }
    },
    {
      ...REDIS_CONFIG,
      concurrency: 1,
      maxStalledCount: 5,
      limiter: {
        max: 100,
        duration: 1000 * 60, // 1 minute
      },
    }
  );

  // Graceful shutdown handler
  async function gracefulShutdown(): Promise<void> {
    try {
      await Promise.all([worker.close(), scrapingQueue.close()]);
      process.exit(0);
    } catch (error) {
      console.error("Shutdown error:", error);
      process.exit(1);
    }
  }

  // Register shutdown handlers
  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);

  // Event handlers with type-safe callbacks
  worker.on(
    "completed",
    (job: Job<ScrapingJob, ScrapingResult>, _: ScrapingResult) => {
      console.log(`Job ${job.id} completed`);
    }
  );

  worker.on(
    "failed",
    (
      job: Job<ScrapingJob, ScrapingResult, string> | undefined,
      error: Error,
      prev?: string
    ) => {
      if (job) {
        console.error(`Job ${job.id} failed:`, error.message);
      } else {
        console.error("Job failed:", error.message);
      }
    }
  );

  // Error handler for worker events
  worker.on("error", (error: Error) => {
    console.error("Worker error:", error);
  });
}

async function retryAllFailed() {
  // Get all failed jobs
  const failedJobs = await scrapingQueue.getFailed();

  console.log(`Found ${failedJobs.length} failed jobs`);

  // Retry each failed job
  for (const job of failedJobs) {
    await job.retry();
    console.log(`Retried job ${job.id}`);
  }
}
const VERSION = "0.0.1";
const program = new Command();
program
  .version(VERSION)
  .command("crawler")
  .argument("<country>", "Country name")
  .argument("<sport>", "sport name")
  .argument("<league>", "League name")
  .argument("<season>", "League season")
  .description("Run crawler")
  .action((country, sport, league, season) => {
    addScrapingJobs({ sport, league, season, country });
  });

program
  .command("scraper")
  .description("scrape url added to the redis queue")
  .action(processJobs);
program
  .command("retry-failed")
  .description("requeue failed redis queue")
  .action(retryAllFailed);

program
  .command("crawl-sofascore")
  .description("Crawl sofa score")
  .action(crawlSofascoreRL);

program
  .command("scrape-sofascore")
  .description("Scrape sofa score")
  .action(processSofascoreJobs);

program
  .command("delete")
  .argument("<league>", "League name")
  .argument("<season>", "League season")
  .argument("<sport>", "sport name")
  .description("Delete records from db")
  .action((league, season, sport) => {
    deleter(league, season, sport);
  });

program.parse(process.argv);
