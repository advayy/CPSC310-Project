"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddDatasetHelpers = void 0;
const IInsightFacade_1 = require("./IInsightFacade");
const jszip_1 = __importDefault(require("jszip"));
const fs_1 = __importDefault(require("fs"));
class AddDatasetHelpers {
    addedDatasetIDs = [];
    constructor() {
        console.log("AddDatasetHelpers::init()");
    }
    validDatasetID(id) {
        if (id === null) {
            return false;
        }
        else if (id === undefined) {
            return false;
        }
        if (id.trim() === "") {
            return false;
        }
        if (id.includes("_")) {
            return false;
        }
        return true;
    }
    validContent(content, kind) {
        if (content == null || content === "") {
            return false;
        }
        return true;
    }
    async extractAndParseZip(zipData) {
        try {
            const zip = new jszip_1.default();
            const archive = await zip.loadAsync(zipData, { base64: true });
            const courses = archive.folder("courses");
            if (!courses) {
                throw new IInsightFacade_1.InsightError("Empty zip file or no courses folder");
            }
            let courseData = [];
            const files = courses.file(/.*/);
            if (files.length === 0 || !files) {
                throw new IInsightFacade_1.InsightError("No files in courses folder");
            }
            const promises = files.map(async (file) => {
                if (!file.dir) {
                    try {
                        const fileContent = await file.async("text");
                        const parsedContent = JSON.parse(fileContent);
                        if (parsedContent.result) {
                            const resultData = parsedContent.result.map((resultObj) => ({
                                uuid: resultObj.id,
                                id: resultObj.Course,
                                title: resultObj.Title,
                                instructor: resultObj.Professor,
                                dept: resultObj.Subject,
                                year: resultObj.Year,
                                avg: resultObj.Avg,
                                pass: resultObj.Pass,
                                fail: resultObj.Fail,
                                audit: resultObj.Audit,
                            }));
                            return resultData;
                        }
                        else {
                            throw new IInsightFacade_1.InsightError("No result field");
                        }
                    }
                    catch {
                        throw new IInsightFacade_1.InsightError("problem parsing json");
                    }
                }
            });
            const result = await Promise.all(promises);
            courseData = courseData.concat(...result);
            return courseData;
        }
        catch {
            throw new IInsightFacade_1.InsightError("problem extracting zip file");
        }
    }
    saveToDisk(id, data, kind) {
        const folderPath = __dirname + "/../data";
        const filePath = folderPath + "/data.json";
        if (!fs_1.default.existsSync(folderPath)) {
            fs_1.default.mkdirSync(folderPath);
        }
        let existingData = {};
        console.log("filePath:", filePath);
        if (fs_1.default.existsSync(filePath)) {
            const fileContents = fs_1.default.readFileSync(filePath, "utf8");
            if (fileContents !== "") {
                existingData = JSON.parse(fileContents);
            }
        }
        existingData[id] = data;
        fs_1.default.writeFileSync(filePath, JSON.stringify(existingData));
        return;
    }
}
exports.AddDatasetHelpers = AddDatasetHelpers;
//# sourceMappingURL=addDatasetHelpers.js.map