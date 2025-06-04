"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = require("lodash");
var OneTimesTwoTransformer = /** @class */ (function () {
    function OneTimesTwoTransformer(key, bookiesMapping) {
        this.key = key;
        this.bookiesMapping = bookiesMapping;
    }
    OneTimesTwoTransformer.prototype.setContextData = function (contextData) {
        throw new Error("Method not implemented.");
    };
    OneTimesTwoTransformer.prototype.getContextData = function () {
        throw new Error("Method not implemented.");
    };
    OneTimesTwoTransformer.prototype.transform = function (inputData) {
        var closingOdds = (0, lodash_1.get)(inputData.d.oddsdata.back[this.key], "odds", {});
        var openingOdds = (0, lodash_1.get)(inputData.d.oddsdata.back[this.key], "openingOdd", {});
        var result = [];
        for (var _i = 0, _a = Object.entries(closingOdds); _i < _a.length; _i++) {
            var _b = _a[_i], closingBookingId = _b[0], closingOdd = _b[1];
            for (var _c = 0, _d = Object.entries(openingOdds); _c < _d.length; _c++) {
                var _e = _d[_c], openingBookingId = _e[0], openingOdd = _e[1];
                if (closingBookingId == openingBookingId) {
                    result.push({
                        bookieName: this.bookiesMapping[closingBookingId],
                        odds: {
                            home: {
                                closing: (0, lodash_1.get)(closingOdd, "0", 0),
                                opening: (0, lodash_1.get)(openingOdd, "0", 0),
                            },
                            draw: {
                                closing: (0, lodash_1.get)(closingOdd, "1", 0),
                                opening: (0, lodash_1.get)(openingOdd, "1", 0),
                            },
                            away: {
                                closing: (0, lodash_1.get)(closingOdd, "2", 0),
                                opening: (0, lodash_1.get)(openingOdd, "2", 0),
                            },
                        },
                    });
                }
            }
        }
        return result;
    };
    return OneTimesTwoTransformer;
}());
exports.default = OneTimesTwoTransformer;
//# sourceMappingURL=OneTimesTwoTransformer.js.map