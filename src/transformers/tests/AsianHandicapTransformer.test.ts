import { AsianHandicapAndTotalsRawData, RawData, TransformedData } from "../ITransformer";
import AsianHandicapTransformer from "../AsianHandicapTransformer";
import AsianHandicapRawDataSample from "./fixtures/asian_handicap_raw.json";
import BookiesMapping from "./fixtures/bookies_mapping.json";

describe("AsianHandicapTransformer Test suite", () => {

    const RAW_DATA = AsianHandicapRawDataSample as AsianHandicapAndTotalsRawData;
    const RESPONSE_DATA: TransformedData = [];
    let transformer: AsianHandicapTransformer;
    let response: TransformedData;

    beforeEach(() => {
        transformer = new AsianHandicapTransformer(BookiesMapping);
    })

    describe("Run smoothly", () => {

        test("should return transformed data", () => {
            response = transformer.transform(RAW_DATA as AsianHandicapAndTotalsRawData);
            expect(response).toEqual(RESPONSE_DATA);
        });
    });
});
