import { MatchTransformedData, TransformedData } from "../transformers/ITransformer";

export interface MatchOddsData {
  matchDetails: MatchTransformedData;
  data: {
    asianHandicap: TransformedData;
    oneTimesTwo: TransformedData;
    totals: TransformedData;
  };
}

export interface JSONScraperOptions {
  timeout: number;
  viewPort?: {
    height: number;
    width: number;
  };
  blockedDomains?: string[];
  selectors: Selector;
  opts?: Record<string, unknown>;
}

export interface Selector {
  agreement: string;
  paginator: {
    totalPages: string;
  };
  events?: {
    oneTimesTwo: {
      home: string;
      draw: string;
      awat: string;
    };
  };
  matches: string;
  matchLink: string;
}

export default interface IScraper {
  crawl(url: string): Promise<string[] | Record<string, unknown>[] | MatchTransformedData[]>;
  scrape(url: string, opt?: Record<string, unknown>): Promise<MatchOddsData | Record<string, unknown>>;
}
