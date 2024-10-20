import Itransformer, {
  BookiesMapping,
  AsianHandicapAndTotalsRawData,
  TransformedData,
  TotalsTransformedData,
} from "./ITransformer";

export default class TotalsTransformer implements Itransformer {
  constructor(readonly bookiesMapping: BookiesMapping) {}
  setContextData<T>(contextData: T): void {
    throw new Error("Method not implemented.");
  }
  getContextData<T>(): T {
    throw new Error("Method not implemented.");
  }
  public transform(inputData: AsianHandicapAndTotalsRawData): TransformedData {
    let result: TotalsTransformedData = {};
    const data = inputData.d.oddsdata.back;

    for (const totalOutcomeObj in data) {
      const totalOutcomeVal = data[totalOutcomeObj].handicapValue;

      for (const [closeBookieId, closingOdd] of Object.entries(
        data[totalOutcomeObj].odds
      )) {
        for (const [openBookieId, openingOdd] of Object.entries(
          data[totalOutcomeObj].openingOdd
        )) {
          if (!result[totalOutcomeVal]) {
            result[totalOutcomeVal] = [];
          }

          if (closeBookieId === openBookieId) {
            result[totalOutcomeVal].push({
              bookieName: this.bookiesMapping[closeBookieId],
              odds: {
                closing: {
                  over: closingOdd[0],
                  under: closingOdd[1],
                },
                opening: {
                  over: openingOdd[0],
                  under: openingOdd[1],
                },
              },
            });
          }
        }
      }
    }
    return result;
  }
}
