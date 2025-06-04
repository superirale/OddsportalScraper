"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var moment_1 = __importDefault(require("moment"));
var MatchTransformer = /** @class */ (function () {
    function MatchTransformer() {
    }
    MatchTransformer.prototype.setContextData = function (contextData) {
        throw new Error("Method not implemented.");
    };
    MatchTransformer.prototype.getContextData = function () {
        throw new Error("Method not implemented.");
    };
    MatchTransformer.prototype.transform = function (inputData) {
        var result = [];
        var data = inputData.d;
        for (var _i = 0, _a = data.rows; _i < _a.length; _i++) {
            var matchData = _a[_i];
            var match = {
                homeTeamName: matchData["home-name"],
                awayTeamName: matchData["away-name"],
                date: moment_1.default
                    .unix(parseInt(matchData["date-start-base"]))
                    .format("YYYY-MM-DD"),
                url: matchData["url"],
            };
            result.push(match);
        }
        return result;
    };
    return MatchTransformer;
}());
exports.default = MatchTransformer;
//# sourceMappingURL=MatchTransformer.js.map