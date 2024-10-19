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
// Types and interfaces
var BASE_URL = "https://www.oddsportal.com";
var LEAGUE = "nrl";
var SEASON = "2023";
var SPORT = "rugby-league";
var bullmq_1 = require("bullmq");
var puppeteer_cluster_1 = require("puppeteer-cluster");
var puppeteer_1 = __importDefault(require("puppeteer"));
var JSONScraper_1 = __importDefault(require("./scrapers/JSONScraper"));
var AsianHandicapTransformer_1 = __importDefault(require("./transformers/AsianHandicapTransformer"));
var MatchTransformer_1 = __importDefault(require("./transformers/MatchTransformer"));
var OneTimesTwoTransformer_1 = __importDefault(require("./transformers/OneTimesTwoTransformer"));
var bookies_mapping_json_1 = __importDefault(require("./transformers/tests/fixtures/bookies_mapping.json"));
var TotalsTransformer_1 = __importDefault(require("./transformers/TotalsTransformer"));
var utils_1 = require("./utils");
var COUNTRY = "australia";
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
};
var options = {
    timeout: 60000,
    viewPort: {
        height: 2000,
        width: 2000,
    },
    blockedDomains: [],
    selectors: SELECTORS,
};
// Redis connection configuration
var REDIS_CONFIG = {
    connection: {
        host: "localhost",
        port: 6379,
        // maxRetriesPerRequest: null,
        // enableReadyCheck: false,
    },
};
// Queue configuration
var QUEUE_NAME = "odds-test";
var JOB_NAME = "scrape";
// Initialize Puppeteer Cluster
function initCluster() {
    return __awaiter(this, void 0, void 0, function () {
        var clusterInstance;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, puppeteer_cluster_1.Cluster.launch({
                        concurrency: puppeteer_cluster_1.Cluster.CONCURRENCY_PAGE,
                        maxConcurrency: 2,
                        puppeteerOptions: {
                            headless: true,
                            defaultViewport: {
                                width: 1920,
                                height: 1080,
                            },
                            args: [
                                "--disable-gpu",
                                "--disable-background-timer-throttling",
                                "--disable-background-timer-ticks",
                                "--disable-dev-shm-usage",
                                "--disable-extensions",
                                "--disable-features=TranslateUI",
                                "--disable-features=Autoplay",
                                "--no-sandbox",
                                "-remote-debugging-port=9222",
                                "--user-data-dir=/tmp/chrome-testing",
                                "--disable-features=site-per-process",
                                "--js-flags=--max-old-space-size=512",
                                "--disable-dev-shm-usage",
                            ],
                        },
                        monitor: true,
                        timeout: 60000,
                        retryLimit: 10,
                        retryDelay: 30000,
                        // workerCreationDelay: 100,
                    })];
                case 1:
                    clusterInstance = _a.sent();
                    return [4 /*yield*/, clusterInstance.task(function (_a) {
                            var page = _a.page, data = _a.data;
                            return __awaiter(_this, void 0, void 0, function () {
                                var url, opt, jsonResponses, scraper, error_1;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            url = data.url, opt = data.opt;
                                            jsonResponses = [];
                                            _b.label = 1;
                                        case 1:
                                            _b.trys.push([1, 3, 4, 6]);
                                            scraper = new JSONScraper_1.default(page, options, {
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
                                            return [4 /*yield*/, scraper.scrape(url, opt)];
                                        case 2:
                                            _b.sent();
                                            return [2 /*return*/, {
                                                    url: url,
                                                    jsonResponses: jsonResponses,
                                                }];
                                        case 3:
                                            error_1 = _b.sent();
                                            throw new Error("Failed to scrape ".concat(url, ": ").concat(error_1.message));
                                        case 4:
                                            // Clean up
                                            page.removeAllListeners();
                                            return [4 /*yield*/, page.close().catch(console.error)];
                                        case 5:
                                            _b.sent();
                                            return [7 /*endfinally*/];
                                        case 6: return [2 /*return*/];
                                    }
                                });
                            });
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, clusterInstance];
            }
        });
    });
}
// Define the scraping task with proper typing
// Create a queue scheduler for better job management
// Create a BullMQ Queue with types
// const scrapingQueue = new Queue<ScrapingJob, ScrapingResult>(QUEUE_NAME, {
//   connection: REDIS_CONFIG.connection,
//   defaultJobOptions: {
//     attempts: 5,
//     backoff: {
//       type: "exponential",
//       delay: 3000,
//     },
//     removeOnComplete: true, // Remove completed jobs to free up Redis memory
//     removeOnFail: false,
//   },
// });
var scrapingQueue = new bullmq_1.Queue(QUEUE_NAME, __assign(__assign({}, REDIS_CONFIG), { defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
    } }));
// Process jobs using BullMQ Worker
var worker = new bullmq_1.Worker(QUEUE_NAME, function (job) { return __awaiter(void 0, void 0, void 0, function () {
    var cluster, result, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                cluster = null;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 6, 7, 10]);
                return [4 /*yield*/, initCluster()];
            case 2:
                cluster = _a.sent();
                if (!cluster) {
                    throw new Error("Cluster not created");
                }
                return [4 /*yield*/, cluster.execute(job.data)];
            case 3:
                result = _a.sent();
                return [4 /*yield*/, cluster.idle()];
            case 4:
                _a.sent();
                return [4 /*yield*/, cluster.close()];
            case 5:
                _a.sent();
                return [2 /*return*/, result];
            case 6:
                error_2 = _a.sent();
                throw error_2;
            case 7:
                if (!cluster) return [3 /*break*/, 9];
                return [4 /*yield*/, cluster.close().catch(console.error)];
            case 8:
                _a.sent();
                _a.label = 9;
            case 9: return [7 /*endfinally*/];
            case 10: return [2 /*return*/];
        }
    });
}); }, __assign(__assign({}, REDIS_CONFIG), { concurrency: 1, maxStalledCount: 5, limiter: {
        max: 100,
        duration: 1000 * 60, // 1 minute
    } }));
// Example of adding jobs to the queue
function addScrapingJobs() {
    return __awaiter(this, void 0, void 0, function () {
        var URL, browser, page, scraper, matches, urlPrefixes, data, _i, matches_1, match, _a, urlPrefixes_1, prefix, url, opt, jobs;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (parseInt(SEASON) !== new Date().getFullYear()) {
                        URL = "".concat(BASE_URL, "/").concat(SPORT, "/").concat(COUNTRY, "/").concat(LEAGUE, "-").concat(SEASON, "/results/");
                    }
                    else {
                        URL = "".concat(BASE_URL, "/").concat(SPORT, "/").concat(COUNTRY, "/").concat(LEAGUE, "/results/");
                    }
                    return [4 /*yield*/, puppeteer_1.default.launch()];
                case 1:
                    browser = _b.sent();
                    return [4 /*yield*/, browser.newPage()];
                case 2:
                    page = _b.sent();
                    scraper = new JSONScraper_1.default(page, options, {
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
                    return [4 /*yield*/, scraper.crawl(URL)];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, page.close()];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, browser.close()];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 10000); })];
                case 6:
                    _b.sent();
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
                    data = [];
                    _i = 0, matches_1 = matches;
                    _b.label = 7;
                case 7:
                    if (!(_i < matches_1.length)) return [3 /*break*/, 12];
                    match = matches_1[_i];
                    _a = 0, urlPrefixes_1 = urlPrefixes;
                    _b.label = 8;
                case 8:
                    if (!(_a < urlPrefixes_1.length)) return [3 /*break*/, 11];
                    prefix = urlPrefixes_1[_a];
                    url = BASE_URL + match.url + prefix;
                    opt = __assign(__assign({}, match), { matchName: "".concat(match.homeTeamName, " - ").concat(match.awayTeamName), leagueName: LEAGUE, season: SEASON, sport: SPORT });
                    return [4 /*yield*/, data.push({ url: url, opt: opt })];
                case 9:
                    _b.sent();
                    _b.label = 10;
                case 10:
                    _a++;
                    return [3 /*break*/, 8];
                case 11:
                    _i++;
                    return [3 /*break*/, 7];
                case 12:
                    jobs = data.map(function (_a) {
                        var url = _a.url, opt = _a.opt;
                        return ({
                            name: JOB_NAME,
                            data: {
                                url: url,
                                opt: opt,
                            },
                            opts: {
                                priority: 1,
                                delay: 60000,
                                attempts: 10,
                                backoff: {
                                    type: "exponential",
                                    options: {
                                        delay: 3000,
                                        truncate: 5,
                                    },
                                },
                                removeOnComplete: true,
                                removeOnFail: false,
                            },
                        });
                    });
                    return [4 /*yield*/, scrapingQueue.addBulk(jobs)];
                case 13:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Event handlers with type-safe callbacks
worker.on("completed", function (job, _) {
    console.log("Job ".concat(job.id, " completed"));
});
worker.on("failed", function (job, error, prev) {
    if (job) {
        console.error("Job ".concat(job.id, " failed:"), error.message);
    }
    else {
        console.error("Job failed:", error.message);
    }
});
// Error handler for worker events
worker.on("error", function (error) {
    console.error("Worker error:", error);
});
// retrying failed jobs
function retryAllFailed() {
    return __awaiter(this, void 0, void 0, function () {
        var failedJobs, _i, failedJobs_1, job;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, scrapingQueue.getFailed()];
                case 1:
                    failedJobs = _a.sent();
                    console.log("Found ".concat(failedJobs.length, " failed jobs"));
                    _i = 0, failedJobs_1 = failedJobs;
                    _a.label = 2;
                case 2:
                    if (!(_i < failedJobs_1.length)) return [3 /*break*/, 5];
                    job = failedJobs_1[_i];
                    return [4 /*yield*/, job.retry()];
                case 3:
                    _a.sent();
                    console.log("Retried job ".concat(job.id));
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Graceful shutdown handler
function gracefulShutdown() {
    return __awaiter(this, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Promise.all([worker.close(), scrapingQueue.close()])];
                case 1:
                    _a.sent();
                    process.exit(0);
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error("Shutdown error:", error_3);
                    process.exit(1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Register shutdown handlers
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
addScrapingJobs().catch(function (error) {
    console.error("Failed to add scraping jobs:", error);
    process.exit(1);
});
// if (process.env.NODE_ENV === "dev") {
//   setInterval(() => {
//     const used = process.memoryUsage();
//     console.log({
//       rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
//       heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
//       heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
//     });
//   }, 30000);
// }
// retryAllFailed()
//   .then(() => console.log('Completed retrying failed jobs'))
//   .catch(console.error);
//# sourceMappingURL=runner.js.map