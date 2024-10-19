"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var process_1 = require("process");
var axios_1 = __importDefault(require("axios"));
var lodash_1 = require("lodash");
var utils_1 = require("../utils");
var nano = require("nano")("http://admin:Omokhudu1987@127.0.0.1:5984");
var db = nano.use("historical-odds");
// create a db abstraction in the future
var JSONScraper = /** @class */ (function () {
    function JSONScraper(page, options, transformers) {
        this.page = page;
        this.options = options;
        this.transformers = transformers;
    }
    JSONScraper.prototype.crawl = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.openPage(url, { timeout: 60000 })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, []];
                }
            });
        });
    };
    JSONScraper.prototype.scrape = function (url, opt) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.openPage(url, opt)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, {}];
                }
            });
        });
    };
    JSONScraper.prototype.openPage = function (url, opt) {
        return __awaiter(this, void 0, void 0, function () {
            var resp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.page.setDefaultTimeout(this.options.timeout);
                        return [4 /*yield*/, this.interceptAndGetJSONResponse(opt)];
                    case 1:
                        resp = _a.sent();
                        return [4 /*yield*/, this.page
                                .goto(url, {
                                waitUntil: "domcontentloaded",
                            })
                                .catch(function (error) {
                                console.log(error);
                                (0, process_1.exit)(1);
                            })];
                    case 2:
                        _a.sent();
                        if (!((opt === null || opt === void 0 ? void 0 : opt.timeout) && !resp)) return [3 /*break*/, 4];
                        return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, opt.timeout); })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    JSONScraper.prototype.interceptAndGetJSONResponse = function (opt) {
        return __awaiter(this, void 0, void 0, function () {
            var result, doneAsync;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.page.setRequestInterception(true)];
                    case 1:
                        _a.sent();
                        result = [];
                        doneAsync = false;
                        this.page.on("request", function (req) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (req.resourceType()) {
                                    case "font":
                                    case "image":
                                    case "stylesheet":
                                    case "media":
                                    case "websocket":
                                    case "ping":
                                        req.abort();
                                        break;
                                    default:
                                        req.continue();
                                }
                                return [2 /*return*/];
                            });
                        }); });
                        this.page.on("requestfinished", function (request) { return __awaiter(_this, void 0, void 0, function () {
                            var response, fullTime, firstHalf, secondHalf, fullTime, firstHalf, secondHalf, fullTime, firstHalf, secondHalf;
                            var _a, _b, _c;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0: return [4 /*yield*/, request.response()];
                                    case 1:
                                        response = _d.sent();
                                        if (!response) return [3 /*break*/, 31];
                                        if (!(request.redirectChain().length === 0)) return [3 /*break*/, 31];
                                        if (!request.url().includes("ajax-sport-country-tournament-archive_")) return [3 /*break*/, 3];
                                        return [4 /*yield*/, this.fetchMatches(request, response)];
                                    case 2:
                                        result = _d.sent();
                                        if (result.length) {
                                            (0, utils_1.saveJsonFile)("./data/matches.json", JSON.stringify(result));
                                        }
                                        doneAsync = true;
                                        return [3 /*break*/, 31];
                                    case 3:
                                        if (!request.url().includes("feed/match-event")) return [3 /*break*/, 31];
                                        if (!request.url().includes("1-2")) return [3 /*break*/, 6];
                                        return [4 /*yield*/, this.getTransformedData(response, (_a = this.transformers.odds.oneTimesTwo) === null || _a === void 0 ? void 0 : _a.fullTime)];
                                    case 4:
                                        fullTime = _d.sent();
                                        return [4 /*yield*/, this.saveOddsData(opt, {
                                                odds: { oneTimesTwo: { fullTime: fullTime } },
                                            })];
                                    case 5:
                                        _d.sent();
                                        return [3 /*break*/, 12];
                                    case 6:
                                        if (!request.url().includes("1-3")) return [3 /*break*/, 9];
                                        return [4 /*yield*/, this.getTransformedData(response, (_b = this.transformers.odds.oneTimesTwo) === null || _b === void 0 ? void 0 : _b.firstHalf)];
                                    case 7:
                                        firstHalf = _d.sent();
                                        return [4 /*yield*/, this.saveOddsData(opt, {
                                                odds: { oneTimesTwo: { firstHalf: firstHalf } },
                                            })];
                                    case 8:
                                        _d.sent();
                                        return [3 /*break*/, 12];
                                    case 9:
                                        if (!request.url().includes("1-4")) return [3 /*break*/, 12];
                                        return [4 /*yield*/, this.getTransformedData(response, (_c = this.transformers.odds.oneTimesTwo) === null || _c === void 0 ? void 0 : _c.secondHalf)];
                                    case 10:
                                        secondHalf = _d.sent();
                                        return [4 /*yield*/, this.saveOddsData(opt, {
                                                odds: { oneTimesTwo: { secondHalf: secondHalf } },
                                            })];
                                    case 11:
                                        _d.sent();
                                        _d.label = 12;
                                    case 12:
                                        if (!request.url().includes("5-2")) return [3 /*break*/, 15];
                                        return [4 /*yield*/, this.getTransformedData(response, this.transformers.odds.asianHandicap)];
                                    case 13:
                                        fullTime = _d.sent();
                                        return [4 /*yield*/, this.saveOddsData(opt, {
                                                odds: { asianHandicap: { fullTime: fullTime } },
                                            })];
                                    case 14:
                                        _d.sent();
                                        return [3 /*break*/, 21];
                                    case 15:
                                        if (!request.url().includes("5-3")) return [3 /*break*/, 18];
                                        return [4 /*yield*/, this.getTransformedData(response, this.transformers.odds.asianHandicap)];
                                    case 16:
                                        firstHalf = _d.sent();
                                        return [4 /*yield*/, this.saveOddsData(opt, {
                                                odds: { asianHandicap: { firstHalf: firstHalf } },
                                            })];
                                    case 17:
                                        _d.sent();
                                        return [3 /*break*/, 21];
                                    case 18:
                                        if (!request.url().includes("5-4")) return [3 /*break*/, 21];
                                        return [4 /*yield*/, this.getTransformedData(response, this.transformers.odds.asianHandicap)];
                                    case 19:
                                        secondHalf = _d.sent();
                                        return [4 /*yield*/, this.saveOddsData(opt, {
                                                odds: { asianHandicap: { secondHalf: secondHalf } },
                                            })];
                                    case 20:
                                        _d.sent();
                                        _d.label = 21;
                                    case 21:
                                        if (!request.url().includes("2-2")) return [3 /*break*/, 24];
                                        return [4 /*yield*/, this.getTransformedData(response, this.transformers.odds.totals)];
                                    case 22:
                                        fullTime = _d.sent();
                                        return [4 /*yield*/, this.saveOddsData(opt, {
                                                odds: { totals: { fullTime: fullTime } },
                                            })];
                                    case 23:
                                        _d.sent();
                                        return [3 /*break*/, 30];
                                    case 24:
                                        if (!request.url().includes("2-3")) return [3 /*break*/, 27];
                                        return [4 /*yield*/, this.getTransformedData(response, this.transformers.odds.totals)];
                                    case 25:
                                        firstHalf = _d.sent();
                                        return [4 /*yield*/, this.saveOddsData(opt, {
                                                odds: { totals: { firstHalf: firstHalf } },
                                            })];
                                    case 26:
                                        _d.sent();
                                        return [3 /*break*/, 30];
                                    case 27:
                                        if (!request.url().includes("2-4")) return [3 /*break*/, 30];
                                        return [4 /*yield*/, this.getTransformedData(response, this.transformers.odds.totals)];
                                    case 28:
                                        secondHalf = _d.sent();
                                        return [4 /*yield*/, this.saveOddsData(opt, {
                                                odds: { totals: { secondHalf: secondHalf } },
                                            })];
                                    case 29:
                                        _d.sent();
                                        _d.label = 30;
                                    case 30:
                                        doneAsync = true;
                                        _d.label = 31;
                                    case 31: return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/, result.length ? result : doneAsync];
                }
            });
        });
    };
    JSONScraper.prototype.fetchMatches = function (request, response, page) {
        if (page === void 0) { page = 1; }
        return __awaiter(this, void 0, void 0, function () {
            var responseBody, _a, _b, url, count, data, matches, totalPages, index, URL_1, jsonResponse, trandformedData, _i, trandformedData_1, jsonData;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _b = (_a = JSON).parse;
                        return [4 /*yield*/, response.buffer()];
                    case 1:
                        responseBody = _b.apply(_a, [(_c.sent()).toString()]);
                        url = request.url().split("?")[0];
                        count = 1;
                        data = [];
                        matches = this.transformers.matchesList.transform(responseBody);
                        matches.map(function (match) { return data.push(match); });
                        totalPages = Math.ceil(responseBody.d.total / responseBody.d.onePage);
                        index = count;
                        _c.label = 2;
                    case 2:
                        if (!(index < totalPages)) return [3 /*break*/, 5];
                        count++;
                        URL_1 = url + "page/".concat(count);
                        return [4 /*yield*/, this.getJsonMatchesList(URL_1, request.headers())];
                    case 3:
                        jsonResponse = _c.sent();
                        trandformedData = this.transformers.matchesList.transform(jsonResponse);
                        for (_i = 0, trandformedData_1 = trandformedData; _i < trandformedData_1.length; _i++) {
                            jsonData = trandformedData_1[_i];
                            data.push(jsonData);
                        }
                        _c.label = 4;
                    case 4:
                        index++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, data];
                }
            });
        });
    };
    JSONScraper.prototype.getJsonMatchesList = function (url, headers) {
        return __awaiter(this, void 0, void 0, function () {
            var resp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, axios_1.default.get(url, { headers: headers })];
                    case 1:
                        resp = _a.sent();
                        return [2 /*return*/, resp.data];
                }
            });
        });
    };
    JSONScraper.prototype.getTransformedData = function (response, transformer) {
        return __awaiter(this, void 0, void 0, function () {
            var responseBody, _a, _b, result;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _b = (_a = JSON).parse;
                        return [4 /*yield*/, response.buffer()];
                    case 1:
                        responseBody = _b.apply(_a, [(_c.sent()).toString()]);
                        result = transformer.transform(responseBody);
                        return [2 /*return*/, result];
                }
            });
        });
    };
    JSONScraper.prototype.saveOddsData = function (queryOpt, data) {
        return __awaiter(this, void 0, void 0, function () {
            var season, sport, leagueName, date, matchName, q, existingRecords, odds, newOdds, updatedData, error_1, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        season = queryOpt.season, sport = queryOpt.sport, leagueName = queryOpt.leagueName, date = queryOpt.date, matchName = queryOpt.matchName;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        q = {
                            selector: {
                                leagueName: { $eq: leagueName },
                                season: { $eq: season },
                                sport: { $eq: sport },
                                date: { $eq: date },
                                matchName: { $eq: matchName },
                            },
                            limit: 1,
                        };
                        return [4 /*yield*/, db.find(q)];
                    case 2:
                        existingRecords = _a.sent();
                        if (!(existingRecords.docs.length == 0)) return [3 /*break*/, 4];
                        console.log("does not exists, inserting");
                        return [4 /*yield*/, db.insert(__assign({ matchName: matchName, leagueName: leagueName, season: season, sport: sport, date: date }, data))];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        console.log("updating existing record");
                        odds = data.odds;
                        newOdds = (0, lodash_1.merge)(odds, existingRecords.docs[0].odds);
                        updatedData = {
                            _id: existingRecords.docs[0]._id,
                            _rev: existingRecords.docs[0]._rev,
                            matchName: existingRecords.docs[0].matchName,
                            leagueName: existingRecords.docs[0].leagueName,
                            season: existingRecords.docs[0].season,
                            sport: existingRecords.docs[0].sport,
                            date: existingRecords.docs[0].date,
                            odds: newOdds,
                        };
                        return [4 /*yield*/, db.insert(updatedData)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        console.log("record saved!");
                        return [3 /*break*/, 8];
                    case 7:
                        error_1 = _a.sent();
                        message = void 0;
                        if (error_1 instanceof Error)
                            message = error_1.message;
                        console.log({
                            data: data,
                            error: message,
                            context: __assign({}, queryOpt),
                        });
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    return JSONScraper;
}());
exports.default = JSONScraper;
//# sourceMappingURL=JSONScraper.js.map