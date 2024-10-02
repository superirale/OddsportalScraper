"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var oneTimesTwoTransformer_1 = __importDefault(require("../oneTimesTwoTransformer"));
var _1x2_raw_json_1 = __importDefault(require("./fixtures/1x2_raw.json"));
var _1x2_transformed_result_json_1 = __importDefault(require("./fixtures/1x2_transformed_result.json"));
var bookies_mapping_json_1 = __importDefault(require("./fixtures/bookies_mapping.json"));
describe("OneTimesTwoTransformer Test suite", function () {
    var RAW_DATA = _1x2_raw_json_1.default;
    var RESPONSE_DATA = _1x2_transformed_result_json_1.default;
    var transformer;
    var response;
    var key = "E-1-2-0-0-0";
    beforeEach(function () {
        transformer = new oneTimesTwoTransformer_1.default(key, bookies_mapping_json_1.default);
    });
    describe("Run smoothly", function () {
        test("should return transformed data", function () {
            response = transformer.transform(RAW_DATA);
            expect(response).toEqual(RESPONSE_DATA);
        });
    });
});
//# sourceMappingURL=OneTimeTwoTransformer.test.js.map