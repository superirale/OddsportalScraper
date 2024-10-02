"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var AsianHandicapTransformer_1 = __importDefault(require("../AsianHandicapTransformer"));
var asian_handicap_raw_json_1 = __importDefault(require("./fixtures/asian_handicap_raw.json"));
var bookies_mapping_json_1 = __importDefault(require("./fixtures/bookies_mapping.json"));
describe("AsianHandicapTransformer Test suite", function () {
    var RAW_DATA = asian_handicap_raw_json_1.default;
    var RESPONSE_DATA = [];
    var transformer;
    var response;
    beforeEach(function () {
        transformer = new AsianHandicapTransformer_1.default(bookies_mapping_json_1.default);
    });
    describe("Run smoothly", function () {
        test("should return transformed data", function () {
            response = transformer.transform(RAW_DATA);
            expect(response).toEqual(RESPONSE_DATA);
        });
    });
});
//# sourceMappingURL=AsianHandicapTransformer.test.js.map