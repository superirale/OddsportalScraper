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
var puppeteer_core_1 = __importDefault(require("puppeteer-core"));
var ioredis_1 = __importDefault(require("ioredis"));
var uuid_1 = require("uuid");
var chalk_1 = __importDefault(require("chalk"));
var bull_1 = __importDefault(require("bull"));
var JSONScraper_1 = __importDefault(require("./scrapers/JSONScraper"));
var AsianHandicapTransformer_1 = __importDefault(require("./transformers/AsianHandicapTransformer"));
var MatchTransformer_1 = __importDefault(require("./transformers/MatchTransformer"));
var OneTimesTwoTransformer_1 = __importDefault(require("./transformers/OneTimesTwoTransformer"));
var bookies_mapping_json_1 = __importDefault(require("./transformers/tests/fixtures/bookies_mapping.json"));
var TotalsTransformer_1 = __importDefault(require("./transformers/TotalsTransformer"));
var utils_1 = require("./utils");
var client;
var subscriber;
var REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
var redisOpts = {
    // redisOpts here will contain at least a property of connectionName which will identify the queue based on its name
    createClient: function (type, redisOpts) {
        switch (type) {
            case "client":
                if (!client) {
                    client = new ioredis_1.default(REDIS_URL, __assign(__assign({}, redisOpts), { maxRetriesPerRequest: null, enableReadyCheck: false }));
                }
                return client;
            case "subscriber":
                if (!subscriber) {
                    subscriber = new ioredis_1.default(REDIS_URL, __assign(__assign({}, redisOpts), { maxRetriesPerRequest: null, enableReadyCheck: false }));
                }
                return subscriber;
            case "bclient":
                return new ioredis_1.default(REDIS_URL, __assign(__assign({}, redisOpts), { maxRetriesPerRequest: null, enableReadyCheck: false }));
            default:
                throw new Error("Unexpected connection type: " + type);
        }
    },
    limiter: {
        max: 1000,
        duration: 50000,
    },
    settings: {
        backoffStrategies: {
            // truncated binary exponential backoff
            binaryExponential: function (attemptsMade, err, options) {
                // Options can be undefined, you need to handle it by yourself
                if (!options) {
                    options = {};
                }
                var delay = options.delay || 1000;
                var truncate = options.truncate || 1000;
                console.error({ attemptsMade: attemptsMade, err: err, options: options });
                return Math.round(Math.random() *
                    (Math.pow(2, Math.max(attemptsMade, truncate)) - 1) *
                    delay);
            },
        },
    },
};
// const LEAGUE = "united-rugby-championship";
// const SEASON = "2022-2023";
// const SPORT = "rugby-union";
// const COUNTRY = "world";
var LEAGUE = "super-league";
var SEASON = "2024";
var SPORT = "rugby-league";
var COUNTRY = "england";
var SELECTORS = {
    agreement: "#onetrust-accept-btn-handler",
    bookieRow: "#odds-data-table > div:nth-child(1) > table > tbody > tr",
    homeWin: "td:nth-child(2) > div",
    draw: "td:nth-child(3) > div",
    awayWin: "td:nth-child(4) > div",
    bookieName: "td:nth-child(1) > div",
    //   tooltipSel: "#tooltiptext",
    dateSel: "#col-content > p.date.datet",
    tooltipSel: "#tooltipdiv",
    matchName: "#col-content > h1",
    matches: "#tournamentTable > tbody > tr.deactivate",
    matchLink: "td.name.table-participant > a",
    highestOdds: {
        container: "#odds-data-table > div:nth-child(1) > table > tfoot > tr.highest",
        homeWin: "td:nth-child(2)",
        draw: "td:nth-child(3)",
        awayWin: "td:nth-child(4)",
    },
    tabList: "#bettype-tabs > ul > li",
    tabContentLists: {
        listItems: "#odds-data-table > div.table-container",
        listItemName: "div.table-header-light > strong > a",
        listItemBookies: "div > span.odds-co > a",
    },
    paginator: {
        nextSel: "#pagination > a:nth-child(6) > span",
        totalPages: "#pagination > a:last-child",
        currentPage: "#pagination > span.active-page",
    },
    //   event: {
    //     oneTimesTwo: {
    //         home: "",
    //         draw: "",
    //         away: "",
    //     }
    //   },
};
var WS_END_POINT = "ws://127.0.0.1:9222/devtools/browser/f641254f-a3be-42b0-ac85-7492e3a764ef";
var BASE_URL = "https://www.oddsportal.com";
var queue = new bull_1.default("Odds Scraping", redisOpts);
var options = {
    timeout: 10000,
    viewPort: {
        height: 2000,
        width: 2000,
    },
    blockedDomains: [],
    selectors: SELECTORS,
};
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var browser, scraper_1, URL_1, matches, urlPrefixes, controlMatch, matchYear, _i, matches_1, match, _a, urlPrefixes_1, prefix, url, opt, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 9, 10, 11]);
                return [4 /*yield*/, puppeteer_core_1.default.connect({
                        browserWSEndpoint: WS_END_POINT,
                    })];
            case 1:
                browser = _b.sent();
                scraper_1 = new JSONScraper_1.default(browser, options, {
                    matchesList: new MatchTransformer_1.default(),
                    odds: {
                        oneTimesTwo: {
                            fullTime: new OneTimesTwoTransformer_1.default("E-1-2-0-0-0", bookies_mapping_json_1.default),
                            firstHalf: new OneTimesTwoTransformer_1.default("E-1-3-0-0-0", bookies_mapping_json_1.default),
                            secondHalf: new OneTimesTwoTransformer_1.default("E-1-4-0-0-0", bookies_mapping_json_1.default),
                        },
                        asianHandicap: new AsianHandicapTransformer_1.default(bookies_mapping_json_1.default),
                        totals: new TotalsTransformer_1.default(bookies_mapping_json_1.default),
                    },
                });
                queue.on("completed", function (job) {
                    return console.log(chalk_1.default.blueBright("Job processed: ".concat(job.id)));
                });
                queue.on("error", function (error) {
                    return console.error(chalk_1.default.red("Queue error:", error));
                });
                queue.process(function (job, done) { return __awaiter(void 0, void 0, void 0, function () {
                    var data, _a, url, opt, error_2;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                data = job.data.data;
                                _a = data, url = _a.url, opt = _a.opt;
                                _b.label = 1;
                            case 1:
                                _b.trys.push([1, 3, , 4]);
                                console.log(chalk_1.default.blueBright("Job started: ".concat(job.id, ", url: ").concat(url)));
                                return [4 /*yield*/, scraper_1.scrape(url, opt)];
                            case 2:
                                _b.sent();
                                done();
                                return [3 /*break*/, 4];
                            case 3:
                                error_2 = _b.sent();
                                return [2 /*return*/, job.moveToFailed({
                                        message: "Call to external service failed!",
                                    }, true)];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); });
                if (parseInt(SEASON) !== new Date().getFullYear()) {
                    URL_1 = "".concat(BASE_URL, "/").concat(SPORT, "/").concat(COUNTRY, "/").concat(LEAGUE, "-").concat(SEASON, "/results/");
                }
                else {
                    URL_1 = "".concat(BASE_URL, "/").concat(SPORT, "/").concat(COUNTRY, "/").concat(LEAGUE, "/results/");
                }
                matches = (0, utils_1.readJsonFile)("./data/matches.json");
                urlPrefixes = [
                    "#ah;2",
                    "#ah;3",
                    "#ah;4",
                    "#over-under;2",
                    "#over-under;3",
                    "#over-under;4",
                    "#1X2;2",
                    "#1X2;3",
                    "#1X2;4",
                ];
                controlMatch = matches[0];
                matchYear = new Date(controlMatch.date).getFullYear();
                // const matchYear = "2022-2023";
                // this will only work for seasons within one year
                if (matchYear !== parseInt(SEASON)) {
                    console.log(controlMatch);
                    (0, process_1.exit)(1);
                }
                _i = 0, matches_1 = matches;
                _b.label = 2;
            case 2:
                if (!(_i < matches_1.length)) return [3 /*break*/, 7];
                match = matches_1[_i];
                _a = 0, urlPrefixes_1 = urlPrefixes;
                _b.label = 3;
            case 3:
                if (!(_a < urlPrefixes_1.length)) return [3 /*break*/, 6];
                prefix = urlPrefixes_1[_a];
                url = BASE_URL + match.url + prefix;
                opt = __assign(__assign({}, match), { matchName: "".concat(match.homeTeamName, " - ").concat(match.awayTeamName), leagueName: LEAGUE, season: SEASON, sport: SPORT });
                return [4 /*yield*/, queue.add({
                        id: (0, uuid_1.v4)(),
                        data: {
                            url: url,
                            opt: opt,
                        },
                    }, {
                        delay: 60000,
                        attempts: 10,
                        backoff: {
                            type: "binaryExponential",
                            options: {
                                delay: 60000,
                                truncate: 5,
                            },
                        },
                    })];
            case 4:
                _b.sent();
                _b.label = 5;
            case 5:
                _a++;
                return [3 /*break*/, 3];
            case 6:
                _i++;
                return [3 /*break*/, 2];
            case 7: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 60000); })];
            case 8:
                _b.sent();
                return [3 /*break*/, 11];
            case 9:
                error_1 = _b.sent();
                throw new Error(error_1.message);
            case 10: return [7 /*endfinally*/];
            case 11: return [2 /*return*/];
        }
    });
}); })();
//# sourceMappingURL=index.js.map