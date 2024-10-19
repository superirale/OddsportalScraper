

// Types and interfaces
const BASE_URL = "https://www.oddsportal.com";
const LEAGUE = "nrl";
const SEASON = "2023";
const SPORT = "rugby-league";import { Queue, Worker, Job } from "bullmq";
import { Cluster } from "puppeteer-cluster";
import Puppeteer, { Page } from "puppeteer";

import { JSONScraperOptions, Selector } from "./scrapers/IScraper";
import JSONScraper from "./scrapers/JSONScraper";
import AsianHandicapTransformer from "./transformers/AsianHandicapTransformer";
import MatchTransformer from "./transformers/MatchTransformer";
import OneTimesTwoTransformer from "./transformers/OneTimesTwoTransformer";
import BookiesMapping from "./transformers/tests/fixtures/bookies_mapping.json";
import TotalsTransformer from "./transformers/TotalsTransformer";
import { readJsonFile } from "./utils";
import { MatchTransformedData } from "./transformers/ITransformer";
const COUNTRY = "australia";
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
};

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
    // maxRetriesPerRequest: null,
    // enableReadyCheck: false,
  },
} as const;

// Queue configuration
const QUEUE_NAME = "odds-test";
const JOB_NAME = "scrape";

// Initialize Puppeteer Cluster
async function initCluster(): Promise<Cluster<ScrapingJob, ScrapingResult>> {
  const clusterInstance = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 2,
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
    retryDelay: 30000,
    // workerCreationDelay: 100,
  });
  await clusterInstance.task(
    async ({ page, data }: ClusterData): Promise<ScrapingResult> => {
      const { url, opt } = data;
      const jsonResponses: Record<string, unknown>[] = [];

      try {
        const scraper = new JSONScraper(page, options, {
          matchesList: new MatchTransformer(),
          odds: {
            oneTimesTwo: {
              fullTime: new OneTimesTwoTransformer(
                "E-1-2-0-0-0",
                BookiesMapping
              ),
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
        await scraper.scrape(url, opt);

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
    }
  );

  return clusterInstance;
}

// Define the scraping task with proper typing

// Create a queue scheduler for better job management

// Create a BullMQ Queue with types
// const scrapingQueue = new Queue<ScrapingJob, ScrapingResult>(QUEUE_NAME, {
//   connection: REDIS_CONFIG.connection,
//   defaultJobOptions: {
//     attempts: 5,
//     backoff: {
//       type: "exponential",
//       delay: 3000,
//     },
//     removeOnComplete: true, // Remove completed jobs to free up Redis memory
//     removeOnFail: false,
//   },
// });

const scrapingQueue = new Queue<ScrapingJob, ScrapingResult>(QUEUE_NAME, {
  ...REDIS_CONFIG,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
  }
});

// Process jobs using BullMQ Worker
const worker = new Worker<ScrapingJob, ScrapingResult>(
  QUEUE_NAME,
  async (job: Job<ScrapingJob>): Promise<ScrapingResult> => {
    let cluster: Cluster<ScrapingJob, ScrapingResult> | null = null;

    try {
      cluster = await initCluster();

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

// Example of adding jobs to the queue
async function addScrapingJobs(): Promise<void> {
  let URL;

  if (parseInt(SEASON) !== new Date().getFullYear()) {
    URL = `${BASE_URL}/${SPORT}/${COUNTRY}/${LEAGUE}-${SEASON}/results/`;
  } else {
    URL = `${BASE_URL}/${SPORT}/${COUNTRY}/${LEAGUE}/results/`;
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
      const url = BASE_URL + match.url + prefix;
      const opt = {
        ...match,
        matchName: `${match.homeTeamName} - ${match.awayTeamName}`,
        leagueName: LEAGUE,
        season: SEASON,
        sport: SPORT,
      };
      await data.push({ url, opt });
    }
  }

  const jobs = data.map(({ url, opt }) => ({
    name: JOB_NAME,
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
}

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

// retrying failed jobs
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

addScrapingJobs().catch((error: Error) => {
  console.error("Failed to add scraping jobs:", error);
  process.exit(1);
});

// if (process.env.NODE_ENV === "dev") {
//   setInterval(() => {
//     const used = process.memoryUsage();
//     console.log({
//       rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
//       heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
//       heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
//     });
//   }, 30000);
// }
// retryAllFailed()
//   .then(() => console.log('Completed retrying failed jobs'))
//   .catch(console.error);
