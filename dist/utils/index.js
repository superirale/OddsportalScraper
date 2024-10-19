"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readJsonFile = exports.saveJsonFile = void 0;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
function saveJsonFile(filePath, data) {
    try {
        fs_1.default.mkdirSync(path_1.default.dirname(filePath), { recursive: true });
        fs_1.default.writeFileSync(filePath, data);
    }
    catch (error) {
        console.error('Error saving JSON file:', error);
    }
}
exports.saveJsonFile = saveJsonFile;
function readJsonFile(filePath) {
    try {
        var rawdata = fs_1.default.readFileSync(filePath);
        var data = JSON.parse(rawdata.toString());
        return data;
    }
    catch (error) {
        var message = void 0;
        if (error instanceof Error)
            message = error.message;
        console.log(message);
    }
}
exports.readJsonFile = readJsonFile;
//# sourceMappingURL=index.js.map