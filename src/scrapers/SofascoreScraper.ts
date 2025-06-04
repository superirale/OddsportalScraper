import axios, { AxiosInstance } from "axios";
import { merge } from "lodash";
import { format, Match } from "date-fns";
import IScraper, { JSONScraperOptions } from "./IScraper";
import { PlayerStatisticTransformer } from "../transformers/PlayerStatisticsTransformer";
import {
  MatchWithPlayerData,
  PlayerPositionRaw,
  TransformedData,
} from "../transformers/ITransformer";
import IDatasource from "../datasource/IDataSource";
import Logger from "../utils/Logger";

interface SofascoreScraperOptions {
  leagueCode: string;
  seasonCode: string;
  totalRounds: number;
}
export interface MatchEvent {
    id: string;
    homeTeam: {
      shortName: string;
    };
    awayTeam: {
      shortName: string;
    };
    startTimestamp: number;

    venue: {
      name: string;
      city: { name: string };
      country: { name: string };
      stadium: { name: string; capacity: number };
      venueCoordinates: {
        latitude: number;
        longitude: number;
      };
    };
    referee: {
      name: string;
      yellowCards: number;
      redCards: number;
      yellowRedCards: number;
      games: number;
    };
    season: {
      year: string;
    };
    tournament: {
      slug: string;
    };
}

export default interface SingleMatchEvent {
  event: MatchEvent;
}

export interface Incident {
  text?: string;
  time: number;
  incidentType: "period" | "goal" | "substitution";
  from?: "try" | "onepoint" | "twopoints";
  player?: {
    name: string;
  };
  incidentClass?: "try" | "twoPoints" | "onePoint" | "regular";
  playerIn?: {
    name: string;
  };
  playerOut?: {
    name: string;
  };
  injury?: boolean;
}

interface IncidentData {
  incidents: Incident[];
}

export default class SofascoreScraper implements IScraper {
  private axiosInstance: AxiosInstance;
  constructor(
    readonly options: JSONScraperOptions,
    readonly transformers: {
      lineups: PlayerStatisticTransformer<MatchWithPlayerData>;
    },
    readonly dataSource: IDatasource,
    readonly logger: Logger
  ) {
    this.axiosInstance = axios.create({
      baseURL: "https://www.sofascore.com/api/v1/",
      timeout: 5000,
      headers: {
        "User-Agent": this.getRandomUserAgent(),
      },
    });
  }

  public async crawl(url: string): Promise<Record<string, unknown>[]> {
    const { leagueCode, seasonCode, totalRounds } = this.options
      ?.opts as unknown as SofascoreScraperOptions;
    if (!leagueCode || !seasonCode) {
      return [];
    }
    const results: Record<string, unknown>[] = [];
    const baseURL = `unique-tournament/${leagueCode}/season/${seasonCode}`;
    try {
      for (let roundNumber = 1; roundNumber <= totalRounds; roundNumber++) {
        let url = baseURL + `/events/round/${roundNumber}`;
        if (roundNumber == 28) {
          url += `/slug/semifinals`;
        }
        if (roundNumber == 29) {
          url += `/slug/final`;
        }
        const response = await this.fetchMatches(url);
        results.push(...response);
        setTimeout(() => {}, this.options.timeout);
      }
      return results;
    } catch (error) {
      console.log((error as Error).message);
      console.log((error as Error).message);
      return [];
    }
  }

  public async scrape(
    url: string,
    opt?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const baseURL = "event/";
    const eventURL = baseURL + url;

    const { data: eventDataResult } = await this.axiosInstance.get<SingleMatchEvent>(
      eventURL
    );
    const { event: eventData } = eventDataResult;
    setTimeout(() => {}, 5000);

    if (!eventData) {
      return {};
    }

    const lineUpsURL = baseURL + url + "/lineups";
    const { data: LineUpData } = await this.axiosInstance.get(lineUpsURL);
    setTimeout(() => {}, 5000);

    if (!LineUpData || !opt) {
      return {};
    }
    const { home, away } = LineUpData;

    const matchIncidences = await this.fetchIncidences(eventURL);
    setTimeout(() => {}, 5000);

    const matches = await this.dataSource.fetch<MatchWithPlayerData[]>({
      selector: {
        league: { $eq: opt.league },
        season: { $eq: opt.season },
        date: { $eq: opt.date },
        homeTeamName: { $eq: opt.homeTeamName },
        awayTeamName: { $eq: opt.awayTeamName },
      },
      limit: 1,
    });

    if (matches.length === 0) {
      return {};
    }

    const storedMatch = matches[0];
    if (!storedMatch || !home || !away) {
      return {};
    }
    this.transformers.lineups.setContextData<MatchWithPlayerData>({
      ...storedMatch,
      sofascoreMatchId: url,
      key: "home",
    });

    const transformedHomeData: TransformedData[] = home.players.map(
      (player: PlayerPositionRaw) => this.transformers.lineups.transform(player)
    );
    this.transformers.lineups.setContextData<MatchWithPlayerData>({
      ...storedMatch,
      sofascoreMatchId: url,
      key: "away",
    });
    const transformedAwayData: TransformedData[] = away.players.map(
      (player: PlayerPositionRaw) => this.transformers.lineups.transform(player)
    );
  
    const data = {
      ...storedMatch,
      sofascoreMatchId: url,
      homeLineUp: {
        playerStats: merge(
          storedMatch.homeLineUp?.playerStats,
          transformedHomeData,
        ),
      },
      awayLineUp: {
        playerStats: merge(
          storedMatch.awayLineUp?.playerStats,
          transformedAwayData
        ),
      },
      stadium: {
        name: eventData.venue?.name || eventData.venue?.stadium?.name || "",
        city: eventData.venue?.city?.name || "",
        country: eventData.venue?.country?.name || "",
        capacity: eventData.venue?.stadium?.capacity || "",
        coordinates: eventData.venue?.venueCoordinates || {},
      },
      referee: {
        name: eventData?.referee?.name || "",
        yellowCards: eventData?.referee?.yellowCards || 0,
        redCards: eventData?.referee?.redCards || 0,
        yellowRedCards: eventData?.referee?.yellowRedCards || 0,
        games: eventData?.referee?.games || 0,
      },
      incidences: matchIncidences || [],
    };

    this.logger.info("=================");
    this.logger.info(JSON.stringify(data));
    this.logger.info(JSON.stringify(transformedHomeData));
    this.logger.info(JSON.stringify(transformedAwayData));
    this.logger.info("=================");


    // await this.dataSource.save(data);
    process.exit(1);

    return { home: transformedHomeData, away: transformedAwayData };
    
  }

  private getRandomUserAgent(): string {
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6446.92 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3; rv:110.0) Gecko/20100101 Firefox/110.0",
      "Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/605.1.15",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/605.1.15",

      "Mozilla/5.0 (Android 13; Pixel 7 Pro; en-US; Pixel 7 Pro Build/QP1A.20230407.017; wv) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6446.92 Mobile Safari/537.36",
    ];

    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  private async fetchMatches(url: string): Promise<Record<string, unknown>[]> {
    try {
      const { data } = await this.axiosInstance.get(url);

      if (data) {
        const { events } = data;
        if (events) {
          let results = events.map((event: MatchEvent) => {
            return {
              matchId: event?.id || "",
              homeTeamName: event.homeTeam.shortName || "",
              awayTeamName: event.awayTeam?.shortName || "",
              season: parseInt(event.season.year),
              league: event.tournament.slug,
              date: format(new Date(event.startTimestamp * 1000), "yyyy-MM-dd"),
            } as Record<string, unknown>;
          });
          return results;
        }
      }
      return [] as Record<string, unknown>[];
    } catch (error) {
      console.log((error as Error).message);
      console.log(url);
      return {} as Record<string, unknown>[];
    }
  }
  private async fetchIncidences(url: string): Promise<IncidentData> {
    try {
      const fullURL = url + "/incidents";
      const { data } = await this.axiosInstance.get(fullURL);
      if (data) {
        return data;
      }
      return {} as IncidentData;
    } catch (error) {
      console.log("Error fetching incidence", error);
      return {} as IncidentData;
    }
  }
}
