"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
var redis_1 = require("redis");
var events_1 = require("events");
var RedisJobQueue = /** @class */ (function (_super) {
    __extends(RedisJobQueue, _super);
    function RedisJobQueue(queueName, maxRetries, retryDelay, processingInterval) {
        if (maxRetries === void 0) { maxRetries = 3; }
        if (retryDelay === void 0) { retryDelay = 1000; }
        if (processingInterval === void 0) { processingInterval = 1000; }
        var _this = _super.call(this) || this;
        _this.isProcessing = false;
        _this.reconnectTimeout = null;
        _this.reconnectInterval = 5000; // 5 seconds
        _this.jobCallback = null;
        _this.queueName = queueName;
        _this.processingQueueName = "".concat(queueName, ":processing");
        _this.deadLetterQueueName = "".concat(queueName, ":deadletter");
        _this.maxRetries = maxRetries;
        _this.retryDelay = retryDelay;
        _this.processingInterval = processingInterval;
        _this.client = _this.createRedisClient();
        return _this;
    }
    RedisJobQueue.prototype.createRedisClient = function () {
        var _this = this;
        var client = (0, redis_1.createClient)({
            socket: {
                reconnectStrategy: function (retries) {
                    if (retries > 10) {
                        console.error('Redis reconnection failed after 10 attempts');
                        return new Error('Redis reconnection failed');
                    }
                    return Math.min(retries * 100, 3000);
                }
            }
        });
        client.on('error', function (err) {
            console.error('Redis client error:', err);
            _this.emit('error', err);
        });
        client.on('connect', function () {
            console.log('Redis client connected');
            _this.emit('connect');
            _this.resumeProcessingIfNeeded();
        });
        client.on('reconnecting', function () {
            console.log('Redis client reconnecting');
            _this.emit('reconnecting');
        });
        client.on('end', function () {
            console.log('Redis client connection closed');
            _this.emit('end');
            _this.scheduleReconnect();
        });
        return client;
    };
    RedisJobQueue.prototype.scheduleReconnect = function () {
        var _this = this;
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }
        if (!this.client.isOpen) {
            this.reconnectTimeout = setTimeout(function () {
                console.log('Attempting to reconnect to Redis...');
                _this.connect().catch(function (err) {
                    console.error('Failed to reconnect:', err);
                    _this.scheduleReconnect();
                });
            }, this.reconnectInterval);
        }
    };
    RedisJobQueue.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.client.isOpen) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.client.connect()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    RedisJobQueue.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.stopProcessing();
                        if (this.reconnectTimeout) {
                            clearTimeout(this.reconnectTimeout);
                        }
                        if (!this.client.isOpen) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.client.quit()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    RedisJobQueue.prototype.withRetry = function (operation) {
        return __awaiter(this, void 0, void 0, function () {
            var lastError, attempt, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        lastError = null;
                        attempt = 0;
                        _a.label = 1;
                    case 1:
                        if (!(attempt < this.maxRetries)) return [3 /*break*/, 9];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 6, , 8]);
                        if (!!this.client.isOpen) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.connect()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [4 /*yield*/, operation()];
                    case 5: return [2 /*return*/, _a.sent()];
                    case 6:
                        error_1 = _a.sent();
                        console.error("Attempt ".concat(attempt + 1, " failed:"), error_1);
                        lastError = error_1;
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, _this.retryDelay); })];
                    case 7:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 8:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 9: throw new Error("Operation failed after ".concat(this.maxRetries, " attempts. Last error: ").concat(lastError === null || lastError === void 0 ? void 0 : lastError.message));
                }
            });
        });
    };
    RedisJobQueue.prototype.enqueue = function (jobData, retries) {
        if (retries === void 0) { retries = 5; }
        return __awaiter(this, void 0, void 0, function () {
            var score;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!jobData.retries) {
                            jobData.retries = retries;
                        }
                        score = jobData.runAt || Date.now();
                        return [4 /*yield*/, this.withRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.client.zAdd(this.queueName, {
                                                score: score,
                                                value: JSON.stringify(jobData)
                                            })];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        this.emit('jobEnqueued', jobData);
                        return [2 /*return*/];
                }
            });
        });
    };
    RedisJobQueue.prototype.moveJobToProcessing = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = Date.now();
                        return [4 /*yield*/, this.withRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                                var result;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.client.eval("\n        local job = redis.call('ZRANGEBYSCORE', KEYS[1], '-inf', ARGV[1], 'LIMIT', 0, 1)\n        if #job > 0 then\n          redis.call('ZREM', KEYS[1], job[1])\n          redis.call('ZADD', KEYS[2], ARGV[1], job[1])\n          return job[1]\n        end\n        return nil\n      ", {
                                                keys: [this.queueName, this.processingQueueName],
                                                arguments: [now.toString()]
                                            })];
                                        case 1:
                                            result = _a.sent();
                                            if (result) {
                                                return [2 /*return*/, JSON.parse(result)];
                                            }
                                            return [2 /*return*/, null];
                                    }
                                });
                            }); })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    RedisJobQueue.prototype.finishJob = function (jobData) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.withRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.client.zRem(this.processingQueueName, JSON.stringify(jobData))];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    RedisJobQueue.prototype.getQueueLength = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.withRetry(function () { return _this.client.zCard(_this.queueName); })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    RedisJobQueue.prototype.startProcessing = function (callback) {
        if (this.isProcessing) {
            console.warn('Job processing is already running.');
            return;
        }
        this.isProcessing = true;
        this.jobCallback = callback;
        this.processJobs();
    };
    RedisJobQueue.prototype.stopProcessing = function () {
        this.isProcessing = false;
        this.jobCallback = null;
    };
    RedisJobQueue.prototype.processJobs = function () {
        return __awaiter(this, void 0, void 0, function () {
            var job, error_2, error_3;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.isProcessing && this.jobCallback)) return [3 /*break*/, 19];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 16, , 18]);
                        return [4 /*yield*/, this.moveJobToProcessing()];
                    case 2:
                        job = _a.sent();
                        if (!job) return [3 /*break*/, 13];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 6, , 12]);
                        return [4 /*yield*/, this.jobCallback(job)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this.finishJob(job)];
                    case 5:
                        _a.sent();
                        this.emit('jobProcessed', job);
                        return [3 /*break*/, 12];
                    case 6:
                        error_2 = _a.sent();
                        console.error('Job processing failed:', error_2);
                        if (!(job.retries && (job.retries || 0) > 0)) return [3 /*break*/, 9];
                        job.retries--;
                        job.runAt = Date.now() + this.retryDelay; // Delay retry
                        return [4 /*yield*/, this.enqueue(job)];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, this.finishJob(job)];
                    case 8:
                        _a.sent();
                        console.log("Job ".concat(job.id, " requeued. Remaining retries: ").concat(job.retries));
                        this.emit('jobRetried', job);
                        return [3 /*break*/, 11];
                    case 9:
                        console.error("Job ".concat(job.id, " failed after all retry attempts. Move to dead letter queue."));
                        return [4 /*yield*/, this.moveToDeadLetterQueue(job)];
                    case 10:
                        _a.sent();
                        this.emit('jobFailed', job);
                        _a.label = 11;
                    case 11: return [3 /*break*/, 12];
                    case 12: return [3 /*break*/, 15];
                    case 13: 
                    // No jobs ready, wait for the next interval
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, _this.processingInterval); })];
                    case 14:
                        // No jobs ready, wait for the next interval
                        _a.sent();
                        _a.label = 15;
                    case 15: return [3 /*break*/, 18];
                    case 16:
                        error_3 = _a.sent();
                        console.error('Error in job processing loop:', error_3);
                        // Wait before retrying to avoid tight loop on persistent errors
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, _this.processingInterval); })];
                    case 17:
                        // Wait before retrying to avoid tight loop on persistent errors
                        _a.sent();
                        return [3 /*break*/, 18];
                    case 18: return [3 /*break*/, 0];
                    case 19: return [2 /*return*/];
                }
            });
        });
    };
    RedisJobQueue.prototype.resumeProcessingIfNeeded = function () {
        if (this.isProcessing && this.jobCallback && !this.client.isOpen) {
            console.log('Resuming job processing after reconnection');
            this.processJobs();
        }
    };
    RedisJobQueue.prototype.recoverInProgressJobs = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, jobs, _i, jobs_1, jobString, job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = Date.now();
                        return [4 /*yield*/, this.client.zRangeByScore(this.processingQueueName, '-inf', now)];
                    case 1:
                        jobs = _a.sent();
                        _i = 0, jobs_1 = jobs;
                        _a.label = 2;
                    case 2:
                        if (!(_i < jobs_1.length)) return [3 /*break*/, 6];
                        jobString = jobs_1[_i];
                        job = JSON.parse(jobString);
                        console.log("Recovering job ".concat(job.id));
                        return [4 /*yield*/, this.enqueue(job)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.client.zRem(this.processingQueueName, jobString)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 2];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    RedisJobQueue.prototype.moveToDeadLetterQueue = function (job) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.zAdd(this.deadLetterQueueName, {
                            score: Date.now(),
                            value: JSON.stringify(job),
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    RedisJobQueue.prototype.replayDeadLetterQueue = function (callback) {
        return __awaiter(this, void 0, void 0, function () {
            var jobs, _i, jobs_2, jobString, job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.zRangeByScore(this.deadLetterQueueName, '-inf', '+inf')];
                    case 1:
                        jobs = _a.sent();
                        _i = 0, jobs_2 = jobs;
                        _a.label = 2;
                    case 2:
                        if (!(_i < jobs_2.length)) return [3 /*break*/, 6];
                        jobString = jobs_2[_i];
                        job = JSON.parse(jobString);
                        job.retries = this.maxRetries;
                        return [4 /*yield*/, this.enqueue(job)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.client.zRem(this.deadLetterQueueName, jobString)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 2];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return RedisJobQueue;
}(events_1.EventEmitter));
exports.default = RedisJobQueue;
//# sourceMappingURL=RedisJobQueue.js.map