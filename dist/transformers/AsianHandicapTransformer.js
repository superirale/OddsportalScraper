"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AsianHandicapTransformer = /** @class */ (function () {
    function AsianHandicapTransformer(bookiesMapping) {
        this.bookiesMapping = bookiesMapping;
    }
    AsianHandicapTransformer.prototype.transform = function (inputData) {
        var result = {};
        var data = inputData.d.oddsdata.back;
        for (var handicapOutcomeObj in data) {
            var handicapOutcomeVal = data[handicapOutcomeObj].handicapValue;
            for (var _i = 0, _a = Object.entries(data[handicapOutcomeObj].odds); _i < _a.length; _i++) {
                var _b = _a[_i], closeBookieId = _b[0], closingOdd = _b[1];
                for (var _c = 0, _d = Object.entries(data[handicapOutcomeObj].openingOdd); _c < _d.length; _c++) {
                    var _e = _d[_c], openBookieId = _e[0], openingOdd = _e[1];
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
    };
    return AsianHandicapTransformer;
}());
exports.default = AsianHandicapTransformer;
//# sourceMappingURL=AsianHandicapTransformer.js.map