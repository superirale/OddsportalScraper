import { AsianHandicapAndTotalsRawData, RawData, TransformedData } from "../ITransformer";
import TotalsTransformer from "../TotalsTransformer";
import TotalsRawDataSample from "./fixtures/total_raw.json";
import BookiesMapping from "./fixtures/bookies_mapping.json";

describe("TotalsTransformer Test suite", () => {

    const RAW_DATA = TotalsRawDataSample as AsianHandicapAndTotalsRawData;
    const RESPONSE_DATA: TransformedData = [];
    let transformer: TotalsTransformer;
    let response: TransformedData;

    beforeEach(() => {
        transformer = new TotalsTransformer(BookiesMapping);
    })

    describe("Run smoothly", () => {

        test("should return transformed data", () => {
            response = transformer.transform(RAW_DATA as AsianHandicapAndTotalsRawData);
            expect(response).toEqual(RESPONSE_DATA);
        });
    });
});
