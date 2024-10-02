"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var TotalsTransformer_1 = __importDefault(require("../TotalsTransformer"));
var total_raw_json_1 = __importDefault(require("./fixtures/total_raw.json"));
var bookies_mapping_json_1 = __importDefault(require("./fixtures/bookies_mapping.json"));
describe("TotalsTransformer Test suite", function () {
    var RAW_DATA = total_raw_json_1.default;
    var RESPONSE_DATA = [];
    var transformer;
    var response;
    beforeEach(function () {
        transformer = new TotalsTransformer_1.default(bookies_mapping_json_1.default);
    });
    describe("Run smoothly", function () {
        test("should return transformed data", function () {
            response = transformer.transform(RAW_DATA);
            expect(response).toEqual(RESPONSE_DATA);
        });
    });
});
//# sourceMappingURL=TotalsTransformer.test.js.map