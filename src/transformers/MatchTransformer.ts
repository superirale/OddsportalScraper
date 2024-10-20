import moment from "moment";
import Itransformer, { MatchRawData, MatchTransformedData, TransformedData } from "./ITransformer";

export default class MatchTransformer implements Itransformer {
  constructor() {}
  setContextData<T>(contextData: T): void {
    throw new Error("Method not implemented.");
  }
  getContextData<T>(): T {
    throw new Error("Method not implemented.");
  }
  public transform(inputData: MatchRawData): TransformedData {
    let result = [];
    const data = inputData.d;

    for (const matchData of data.rows) {
      const match: MatchTransformedData = {
        homeTeamName: matchData["home-name"],
        awayTeamName: matchData["away-name"],
        date: moment
          .unix(parseInt(matchData["date-start-base"]))
          .format("YYYY-MM-DD"),
        url: matchData["url"],
      };
      result.push(match);
    }
    return result;
  }
}
