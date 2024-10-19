export interface oneTimesTwoOdds {
  [key: string]: {
    "0": number;
    "1": number;
    "2": number;
  };
}

export interface OneTimesTwoRawData {
  d: {
    oddsdata: {
      back: {
        [key: string]: {
          odds: oneTimesTwoOdds;
          openingOdd: oneTimesTwoOdds;
        };
      };
    };
  };
}
export interface AsianHandicapAndTotalsRawData {
  d: {
    oddsdata: {
      back: {
        [key: string]: {
          handicapValue: string;
          odds: {
            [key: string]: number[];
          };
          openingOdd: {
            [key: string]: number[];
          };
        };
      };
    };
  };
}

export interface TotalsTransformedData {
  [key: string]: {
    bookieName: string;
    odds: {
      closing: {
        over: number;
        under: number;
      };
      opening: {
        over: number;
        under: number;
      };
    };
  }[];
}
export interface OneTimesTwoTransformedData {
  bookieName: string;
  odds: {
    home: {
      opening: number;
      closing: number;
    };
    draw: {
      opening: number;
      closing: number;
    };
    away: {
      opening: number;
      closing: number;
    };
  };
}
export interface AsianHandicapTransformedData {
  [key: string]: {
    bookieName: string;
    odds: {
      closing: { one: number; two: number };
      opening: { one: number; two: number };
    };
  }[];
}

export enum PlayerPosition {
  fullback = "fullback",
  winger = "winger",
  center = "center",
  standoff = "stand-off",
  halfback = "halfback",
  prop = "prop",
  secondRow = "second-row",
  lock = "lock",
  hooker = "hooker",
}

export interface matchData {
  url: string;
  "home-name": string;
  "away-name": string;
  "date-start-base": string;
}
export
 interface MatchRawData {
  d: {
    total: number;
    onePage: number;
    page: number;
    rows: matchData[];
  }
}

export interface PlayerTransformedData {
  position: PlayerPosition;
  name: string;
  tries: number;
  tryAssists: number;
  tackles: number;
  markerTackles: number;
  missedTackles: number;
  tackleBusts: number;
  attackingkicks: number;
  carries: number;
  metres: number;
  avGain: number;
  cleanBreak: number;
  runFromDummyHalf: number;
  errors: number;
  fortyTwenty: number;
  goals: number;
  missedGoals: number;
  offload: number;
  penalties: number;
  dropGoals: number;
  kickInGeneralPlay: number;
  yellowCard: number;
  redCard: number;
}

export type RawData = OneTimesTwoRawData | AsianHandicapAndTotalsRawData | MatchRawData | PlayerTransformedData;

export interface MatchTransformedData {
  homeTeamName: string;
  awayTeamName: string;
  date: string;
  url: string;
}

export type TransformedData =
  | AsianHandicapTransformedData
  | MatchTransformedData[]
  | OneTimesTwoTransformedData[]
  | TotalsTransformedData
  | PlayerTransformedData;

export interface BookiesMapping {
  [key: string]: string;
}

export default interface Itransformer {
  transform(inputData: RawData): TransformedData;
}
