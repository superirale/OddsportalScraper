"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TotalsTransformer = /** @class */ (function () {
    function TotalsTransformer(bookiesMapping) {
        this.bookiesMapping = bookiesMapping;
    }
    TotalsTransformer.prototype.transform = function (inputData) {
        var result = {};
        var data = inputData.d.oddsdata.back;
        for (var totalOutcomeObj in data) {
            var totalOutcomeVal = data[totalOutcomeObj].handicapValue;
            for (var _i = 0, _a = Object.entries(data[totalOutcomeObj].odds); _i < _a.length; _i++) {
                var _b = _a[_i], closeBookieId = _b[0], closingOdd = _b[1];
                for (var _c = 0, _d = Object.entries(data[totalOutcomeObj].openingOdd); _c < _d.length; _c++) {
                    var _e = _d[_c], openBookieId = _e[0], openingOdd = _e[1];
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
    };
    return TotalsTransformer;
}());
exports.default = TotalsTransformer;
//# sourceMappingURL=TotalsTransformer.js.map