import { mock, MockProxy } from "jest-mock-extended";
import axios from "axios";
import { JSONScraperOptions, Selector } from "../IScraper";
import SofascoreScraper, { Incident } from "../SofascoreScraper";
import IDatasource from "../../datasource/IDataSource";
import Logger from "../../utils/Logger";
import { PlayerStatisticTransformer } from "../../transformers/PlayerStatisticsTransformer";
import {
  fetchMatchFromDB,
  getLineUps,
  getMatchDetails,
  getMatchIncidences,
  getTransformedData,
} from "./fixtures";
import { MatchWithPlayerData } from "../../transformers/ITransformer";

jest.mock("axios");

describe("Sofascore Scraper Test suite", () => {
  let scraper: SofascoreScraper;
  let options: JSONScraperOptions;
  let dataSource: MockProxy<IDatasource>;
  let lineUpTransformer: PlayerStatisticTransformer<MatchWithPlayerData>;
  let logger: Logger;
  let mockAxiosGet: jest.Mock;

  beforeEach(() => {
    mockAxiosGet = jest.fn();
    (axios.create as jest.Mock).mockReturnValue({
      get: mockAxiosGet,
    });
    logger = new Logger();
    options = {
      timeout: 1000,
      selectors: {} as Selector,
      opts: {
        leagueCode: 222,
        seasonCode: 111,
        totalRounds: 1,
      },
    };
    lineUpTransformer = new PlayerStatisticTransformer<MatchWithPlayerData>(
      logger
    );
    const transformers = {
      lineups: lineUpTransformer,
    };
    dataSource = mock<IDatasource>();
    scraper = new SofascoreScraper(options, transformers, dataSource, logger);
  });

  describe("Successful crawling test cases", () => {
    let result: Record<string, unknown>[];

    beforeEach(async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          events: [
            {
              id: 36214423,
              homeTeam: { shortName: "Wigan" },
              awayTeam: { shortName: "Hull KR" },
              season: { year: 2024 },
              tournament: { slug: "super-league" },
              startTimestamp: 1704067200,
            },
          ],
        },
      });

      result = await scraper.crawl("");
    });

    test("check the crawl games", async () => {
      expect(result).toMatchObject([
        {
          matchId: 36214423,
          homeTeamName: "Wigan",
          awayTeamName: "Hull KR",
          season: 2024,
          league: "super-league",
          date: "2024-01-01",
        },
      ]);
    });
  });

  describe("Succesfully scraping test cases", () => {
    let result: Record<string, unknown>;

    beforeEach(async () => {
      mockAxiosGet
        .mockResolvedValueOnce({ data: getMatchDetails() })
        .mockResolvedValueOnce({ data: getLineUps() })
        .mockResolvedValueOnce({ data: getMatchIncidences() });

      dataSource.fetch.mockResolvedValue(fetchMatchFromDB());

      const opt = {
        league: "super-league",
        season: 2024,
        date: "2024-01-01",
        homeTeamName: "Huddersfield",
        awayTeamName: "Castleford",
      };

      result = await scraper.scrape("12709225", opt);
    });

    test("check if the match details are scraped correctly", async () => {
      expect(mockAxiosGet).toHaveBeenNthCalledWith(1, "event/12709225");
      expect(mockAxiosGet).toHaveBeenNthCalledWith(2, "event/12709225/lineups");
      expect(mockAxiosGet).toHaveBeenNthCalledWith(
        3,
        "event/12709225/incidents"
      );
    });

    test("check the db fetch query", async () => {
      expect(dataSource.fetch).toHaveBeenCalledWith({
        selector: {
          league: { $eq: "super-league" },
          season: { $eq: 2024 },
          date: { $eq: "2024-01-01" },
          homeTeamName: { $eq: "Huddersfield" },
          awayTeamName: { $eq: "Castleford" },
        },
        limit: 1,
      });
    });

    test("check data saved to DB", async () => {
      const matchIncidenceData = getMatchIncidences() as unknown as Incident;

      expect(dataSource.save).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: "5f9367a3b33e3d3333333333",
          homeLineUp: {
            playerStats: getTransformedData()["home"],
          },
          awayLineUp: {
            playerStats: getTransformedData()["away"],
          },
          stadium: {
            name: "The John Smith's Stadium",
            city: "Huddersfield",
            country: "England",
            capacity: 24500,
            coordinates: { latitude: 53.64904, longitude: -1.78416 },
          },
          referee: {
            name: "James Vella",
            yellowCards: 14,
            redCards: 0,
            yellowRedCards: 0,
            games: 18,
          },
          incidences: matchIncidenceData,
        })
      );
    });

    test("should returned the transformed data", async () => {
      expect(result).toMatchObject(getTransformedData());
    });
  });
});
