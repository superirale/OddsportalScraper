import Itransformer, {
    BookiesMapping,
    AsianHandicapAndTotalsRawData,
    TransformedData,
    AsianHandicapTransformedData,
  } from "./ITransformer";
  
  export default class AsianHandicapTransformer implements Itransformer {
    constructor(readonly bookiesMapping: BookiesMapping) {}
    public transform(inputData: AsianHandicapAndTotalsRawData): TransformedData {
      let result: AsianHandicapTransformedData = {};
      const data = inputData.d.oddsdata.back;
  
      for (const handicapOutcomeObj in data) {
        const handicapOutcomeVal = data[handicapOutcomeObj].handicapValue;
  
        for (const [closeBookieId, closingOdd] of Object.entries(
          data[handicapOutcomeObj].odds
        )) {
          for (const [openBookieId, openingOdd] of Object.entries(
            data[handicapOutcomeObj].openingOdd
          )) {
            if (!result[handicapOutcomeVal]) {
              result[handicapOutcomeVal] = [];
            }
  
            if (closeBookieId === openBookieId) {
              result[handicapOutcomeVal].push({
                bookieName: this.bookiesMapping[closeBookieId],
                odds: {
                  closing: {
                    one: closingOdd[0],
                    two: closingOdd[1],
                  },
                  opening: {
                    one: openingOdd[0],
                    two: openingOdd[1],
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
  