import axios from "axios";
import { format } from "date-fns";
import IScraper, { JSONScraperOptions } from "./IScraper";
import { PlayerStatisticTransformer } from "../transformers/PlayerStatisticsTransformer";
import { MatchWithPlayerData, PlayerPositionRaw } from "../transformers/ITransformer";
import IDatasource from "../datasource/IDataSource";

interface SofascoreScraperOptions {
  leagueCode: string;
  seasonCode: string;
  totalRounds: number;
}
interface MatchEvent {
  id: string;
  homeTeam: {
    name: string;
  };
  awayTeam: {
    name: string;
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
}

interface Incident {
    text?: string;
    time: number;
    incidentType: "period" | "goal" | "substitution";
    from?: "try" | "onepoint" | "twopoints" ;
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
  constructor(
    readonly options: JSONScraperOptions,
    readonly transformers: {
      lineups: PlayerStatisticTransformer;
    },
    readonly dataSource: IDatasource
  ) {}
  public async crawl(url: string): Promise<Record<string, unknown>[]> {
    const { leagueCode, seasonCode, totalRounds } = this.options
      ?.opts as unknown as SofascoreScraperOptions;
    if (!leagueCode || !seasonCode) {
      return [];
    }
    const results: Record<string, unknown>[] = [];
    const baseURL = `https://www.sofascore.com/api/v1/unique-tournament/${leagueCode}/season/${seasonCode}`;
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
  private async fetchMatches(url: string): Promise<Record<string, unknown>[]> {
    try {
      const { data } = await axios.get(url);
      if (data) {
        const { events } = data;
        if (events) {
          let results = events.map((event: MatchEvent) => {
            return {
              matchId: event?.id || "",
              homeTeamName: event.homeTeam.name || "",
              awayTeamName: event.awayTeam?.name || "",
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
  public async scrape(
    url: string,
    opt?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const baseURL = "https://www.sofascore.com/api/v1/event/";
    const fullURL = baseURL + url + "/lineups";
    const { data: LineUpData } = await axios.get(fullURL);
    if (!LineUpData || !opt) {
      return {};
    }
    const { home, away } = LineUpData;

    const eventURL = baseURL + url;

    const { data: eventData } = await axios.get(fullURL);

    const matchIncidences = await this.fetchIncidences(eventURL);

    const matches = await this.dataSource.fetch<MatchWithPlayerData[]>({
        selector: {
          league: { $eq: "super-league" },
          season: { $eq: 2024 },
          date: { $eq: opt.date },
          homeTeamName: { $eq: opt.homeTeam },
          awayTeamName: { $eq: opt.awayTeam },
        },
        limit: 1
      });
    
      if (matches.length === 0) {
        return {};
      }
    const storedMatch = matches[0];
    if (!storedMatch || !home || !away) {
        return {};
    }

    this.transformers.lineups.setContextData<MatchWithPlayerData>(storedMatch);

    const transformedHomeData = home.players.map((player: PlayerPositionRaw) =>
      this.transformers.lineups.transform(player)
    );

    const transformedAwayData = this.transformers.lineups.transform(
      away.players as PlayerPositionRaw
    );
    // fetch game in db
    const match = await this.dataSource.fetch({
      homeTeamName: opt.homeTeamName || "",
      awayTeamName: opt.homeTeamName || "",
      date: opt.date,
    });
    if (match) {
      // update game in db
      await this.dataSource.save({
        ...match,
        homeLineups: { playerStats: transformedHomeData },
        awayLineups: { playerStats: transformedAwayData },
        stadium: {
            name: eventData.venue?.name ||eventData.venue?.stadium?.name || "",
            city: eventData.venue?.city?.name || "",
            country: eventData.venue?.country?.name || "",
            capacity: eventData.venue?.stadium?.capacity || "",
            coordinates: eventData.venue?.venueCoordinates || {},
          },
          referee: {
            name: eventData?.referee?.name || "",
            yellowCards: eventData?.referee?.yellowCards || "",
            redCards: eventData?.referee?.redCards || "",
            yellowRedCards: eventData?.referee?.yellowRedCards || "",
            games: eventData?.referee?.games || "",
          },
          incidences: matchIncidences || [],
      });
    }

    return { home: transformedHomeData, away: transformedAwayData };
  }

  private async fetchIncidences(
    url: string
  ): Promise<IncidentData> {
    try {
      const fullURL = url + "/incidents";
      const { data } = await axios.get(fullURL);
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
