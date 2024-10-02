import { OneTimesTwoRawData, TransformedData } from "../ITransformer";
import OneTimesTwoTransformer from "../oneTimesTwoTransformer";
import OneTimesTwoRawDataSample from "./fixtures/1x2_raw.json";
import OneTimesTwoTransformedDataSample from "./fixtures/1x2_transformed_result.json";
import BookiesMapping from "./fixtures/bookies_mapping.json";

describe("OneTimesTwoTransformer Test suite", () => {

    const RAW_DATA = OneTimesTwoRawDataSample as OneTimesTwoRawData;
    const RESPONSE_DATA: TransformedData = OneTimesTwoTransformedDataSample;
    let transformer: OneTimesTwoTransformer;
    let response: TransformedData;
    let key = "E-1-2-0-0-0";

    beforeEach(() => {
        transformer = new OneTimesTwoTransformer(key, BookiesMapping);
    })

    describe("Run smoothly", () => {

        test("should return transformed data", () => {
            response = transformer.transform(RAW_DATA);
            expect(response).toEqual(RESPONSE_DATA);
        });
    });
});
