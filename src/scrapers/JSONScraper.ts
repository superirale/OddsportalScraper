import { exit } from "process";
import axios from "axios";
import { merge } from "lodash";
import { Browser, HTTPRequest, HTTPResponse, Page } from "puppeteer-core";
import IScraper, { JSONScraperOptions, MatchOddsData } from "./IScraper";
import Itransformer, {
  AsianHandicapTransformedData,
  MatchRawData,
  MatchTransformedData,
  OneTimesTwoRawData,
  OneTimesTwoTransformedData,
  TotalsTransformedData,
} from "src/transformers/ITransformer";
import { saveJsonFile } from "../utils";

const nano = require("nano")("http://admin:Omokhudu1987@127.0.0.1:5984");
const db = nano.use("historical-odds");

// create a db abstraction in the future
export default class JSONScraper implements IScraper {
  constructor(
    readonly browser: Browser,
    readonly options: JSONScraperOptions,
    readonly transformers: {
      matchesList: Itransformer;
      odds: {
        oneTimesTwo?: {
          fullTime: Itransformer;
          firstHalf: Itransformer;
          secondHalf: Itransformer;
        };
        asianHandicap?: Itransformer;
        totals?: Itransformer;
      };
    }
  ) {}
  public async crawl(url: string): Promise<string[] | MatchTransformedData[]> {
    await this.openPage(url);
    return [];
  }

  public async scrape(
    url: string,
    opt?: Record<string, unknown>
  ): Promise<MatchOddsData> {
    await this.openPage(url, opt);
    return {} as MatchOddsData;
  }

  public async openPage(
    url: string,
    opt?: Record<string, unknown>
  ): Promise<void> {
    const page = await this.browser.newPage();
    page.setDefaultTimeout(this.options.timeout);
    await this.interceptAndGetJSONResponse(page, opt);

    await page
      .goto(url, {
        waitUntil: "domcontentloaded",
      })
      .catch((error: Error) => {
        console.log(error);
        exit(1);
      });

    await new Promise((r) => setTimeout(r, 20000));
    await page.close();
  }

  private async interceptAndGetJSONResponse(
    page: Page,
    opt?: Record<string, unknown>
  ): Promise<MatchTransformedData[]> {
    await page.setRequestInterception(true);
    let result: MatchTransformedData[] = [];
    page.on("request", async (req) => {
      switch (req.resourceType()) {
        case "font":
        case "image":
        case "stylesheet":
          req.abort();
          break;
        default:
          //   await this.blockHTTPRequests(req);
          req.continue();
      }
    });

    page.on("requestfinished", async (request) => {
      const response = await request.response();

      if (response) {
        if (request.redirectChain().length === 0) {
          if (
            request.url().includes("ajax-sport-country-tournament-archive_")
          ) {
            const matchesList = await this.fetchMatches(request, response);
            saveJsonFile("./data/matches.json", JSON.stringify(matchesList));
          } else if (request.url().includes("feed/match-event")) {
            // 1-2, 1-3, 1-4,

            if (request.url().includes("1-2")) {
              const fullTime =
                await this.getTransformedData<OneTimesTwoTransformedData>(
                  response,
                  this.transformers.odds.oneTimesTwo?.fullTime as Itransformer
                );
              await this.saveOddsData(opt as Record<string, unknown>, {
                odds: { oneTimesTwo: { fullTime } },
              });
            } else if (request.url().includes("1-3")) {
              const firstHalf =
                await this.getTransformedData<OneTimesTwoTransformedData>(
                  response,
                  this.transformers.odds.oneTimesTwo?.firstHalf as Itransformer
                );
              await this.saveOddsData(opt as Record<string, unknown>, {
                odds: { oneTimesTwo: { firstHalf } },
              });
            } else if (request.url().includes("1-4")) {
              const secondHalf =
                await this.getTransformedData<OneTimesTwoTransformedData>(
                  response,
                  this.transformers.odds.oneTimesTwo?.secondHalf as Itransformer
                );
              await this.saveOddsData(opt as Record<string, unknown>, {
                odds: { oneTimesTwo: { secondHalf } },
              });
            }
            if (request.url().includes("5-2")) {
              const fullTime =
                await this.getTransformedData<AsianHandicapTransformedData>(
                  response,
                  this.transformers.odds.asianHandicap as Itransformer
                );
              await this.saveOddsData(opt as Record<string, unknown>, {
                odds: { asianHandicap: { fullTime } },
              });
            } else if (request.url().includes("5-3")) {
              const firstHalf =
                await this.getTransformedData<AsianHandicapTransformedData>(
                  response,
                  this.transformers.odds.asianHandicap as Itransformer
                );
              await this.saveOddsData(opt as Record<string, unknown>, {
                odds: { asianHandicap: { firstHalf } },
              });
            } else if (request.url().includes("5-4")) {
              const secondHalf =
                await this.getTransformedData<AsianHandicapTransformedData>(
                  response,
                  this.transformers.odds.asianHandicap as Itransformer
                );
              await this.saveOddsData(opt as Record<string, unknown>, {
                odds: { asianHandicap: { secondHalf } },
              });
            }

            if (request.url().includes("2-2")) {
              const fullTime =
                await this.getTransformedData<TotalsTransformedData>(
                  response,
                  this.transformers.odds.totals as Itransformer
                );
              await this.saveOddsData(opt as Record<string, unknown>, {
                odds: { totals: { fullTime } },
              });
            } else if (request.url().includes("2-3")) {
              const firstHalf =
                await this.getTransformedData<TotalsTransformedData>(
                  response,
                  this.transformers.odds.totals as Itransformer
                );
              await this.saveOddsData(opt as Record<string, unknown>, {
                odds: { totals: { firstHalf } },
              });
            } else if (request.url().includes("2-4")) {
              const secondHalf =
                await this.getTransformedData<TotalsTransformedData>(
                  response,
                  this.transformers.odds.totals as Itransformer
                );
              await this.saveOddsData(opt as Record<string, unknown>, {
                odds: { totals: { secondHalf } },
              });
            }
          }
        }
      }
    });
    return result;
  }

  private async fetchMatches(
    request: HTTPRequest,
    response: HTTPResponse,
    page: number = 1
  ): Promise<MatchTransformedData[]> {
    const responseBody = JSON.parse(
      (await response.buffer()).toString()
    ) as MatchRawData;
    console.log("======");
    console.log(responseBody);
    console.log("======");
    let url = request.url().split("?")[0];
    let count = 1;
    let data: MatchTransformedData[] = [];
    const matches = this.transformers.matchesList.transform(
      responseBody
    ) as MatchTransformedData[];
    matches.map((match: MatchTransformedData) => data.push(match));

    const totalPages = Math.ceil(responseBody.d.total / responseBody.d.onePage);

    for (let index = count; index < totalPages; index++) {
      count++;
      const URL = url + `page/${count}`;
      const jsonResponse = await this.getJsonMatchesList(
        URL,
        request.headers()
      );
      const trandformedData = this.transformers.matchesList.transform(
        jsonResponse
      ) as MatchTransformedData[];
      for (const jsonData of trandformedData) {
        data.push(jsonData);
      }
    }

    return data;
  }

  private async getJsonMatchesList(
    url: string,
    headers: Record<string, string>
  ): Promise<MatchRawData> {
    const resp = await axios.get(url, { headers });
    return resp.data;
  }

  private async getTransformedData<K>(
    response: HTTPResponse,
    transformer: Itransformer
  ): Promise<K | undefined> {
    const responseBody = JSON.parse(
      (await response.buffer()).toString()
    ) as OneTimesTwoRawData;
    const result = transformer.transform(responseBody);
    return result as K;
  }

  private async saveOddsData(
    queryOpt: Record<string, unknown>,
    data: unknown
  ): Promise<void> {
    const { season, sport, leagueName, date, matchName } = queryOpt;

    try {
  
      const q = {
        selector: {
          leagueName: { $eq: leagueName },
          season: { $eq: season },
          sport: { $eq: sport },
          date: { $eq: date },
          matchName: { $eq: matchName },
        },
        limit: 1,
      };
      const existingRecords = await db.find(q);
      if (existingRecords.docs.length == 0) {
        console.log("does not exists");
        await db.insert({
          matchName,
          leagueName,
          season,
          sport,
          date,
          ...(data as Record<string, unknown>),
        });
      } else {
        console.log("updating existing record", {
          existingRecord: existingRecords.docs[0],
          newRecords: data,
        });
        const { odds } = data as Record<string, unknown>;
        const newOdds = merge(odds, existingRecords.docs[0].odds)
        const updatedData = {
          _id: existingRecords.docs[0]._id,
          _rev: existingRecords.docs[0]._rev,
          matchName: existingRecords.docs[0].matchName,
          leagueName: existingRecords.docs[0].leagueName,
          season: existingRecords.docs[0].season,
          sport: existingRecords.docs[0].sport,
          date: existingRecords.docs[0].date,
          odds: newOdds,
        };

        await db.insert(updatedData);
      }
      console.log("record saved!");
    } catch (error) {
      let message;
      if (error instanceof Error) message = error.message;
      console.log({
        data,
        error: message,
        context: {
          ...queryOpt,
        },
      });
    }
  }
}
