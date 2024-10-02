import { get } from "lodash";
import Itransformer, {
  BookiesMapping,
  OneTimesTwoTransformedData,
  OneTimesTwoRawData,
  TransformedData,
} from "./ITransformer";

export default class OneTimesTwoTransformer implements Itransformer {
  constructor(readonly key: string, readonly bookiesMapping: BookiesMapping) {}
  public transform(inputData: OneTimesTwoRawData): TransformedData {
    const closingOdds = get(inputData.d.oddsdata.back[this.key], "odds", {});
    const openingOdds = get(
      inputData.d.oddsdata.back[this.key],
      "openingOdd",
      {}
    );
    let result: OneTimesTwoTransformedData[] = [];

    for (const [closingBookingId, closingOdd] of Object.entries(closingOdds)) {
      for (const [openingBookingId, openingOdd] of Object.entries(
        openingOdds
      )) {
        if (closingBookingId == openingBookingId) {
          result.push({
            bookieName: this.bookiesMapping[closingBookingId],
            odds: {
              home: {
                closing: get(closingOdd, "0", 0),
                opening: get(openingOdd, "0", 0),
              },
              draw: {
                closing: get(closingOdd, "1", 0),
                opening: get(openingOdd, "1", 0),
              },
              away: {
                closing: get(closingOdd, "2", 0),
                opening: get(openingOdd, "2", 0),
              },
            },
          });
        }
      }
    }
    return result;
  }
}
