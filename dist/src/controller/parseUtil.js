"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseUtil = void 0;
const IInsightFacade_1 = require("./IInsightFacade");
const jszip_1 = __importDefault(require("jszip"));
const parse5 = __importStar(require("parse5"));
const htmlSearchUtil_1 = require("./htmlSearchUtil");
class ParseUtil {
    buildingData = {};
    htmlSearchUtil = new htmlSearchUtil_1.HtmlSearchUtil();
    async extractZip(zipData) {
        const zip = new jszip_1.default();
        const archive = await zip.loadAsync(zipData, { base64: true });
        const courses = archive.folder("courses");
        if (!courses) {
            throw new IInsightFacade_1.InsightError("Empty zip file or no courses folder");
        }
        return courses;
    }
    async extractAndParseZip(zipData) {
        try {
            const courses = await this.extractZip(zipData);
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
                            const resultData = parsedContent.result.map((resultObj) => {
                                let year;
                                if (resultObj.Section === "overall") {
                                    year = 1900;
                                }
                                else {
                                    year = Number(resultObj.Year);
                                }
                                return {
                                    uuid: String(resultObj.id),
                                    id: String(resultObj.Course),
                                    title: String(resultObj.Title),
                                    instructor: String(resultObj.Professor),
                                    dept: String(resultObj.Subject),
                                    year: year,
                                    avg: Number(resultObj.Avg),
                                    pass: Number(resultObj.Pass),
                                    fail: Number(resultObj.Fail),
                                    audit: Number(resultObj.Audit),
                                };
                            });
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
    async extractRooms(roomsData) {
        const zip = new jszip_1.default();
        const archive = await zip.loadAsync(roomsData, { base64: true });
        return archive;
    }
    async extractAndParseRooms(zipData) {
        try {
            let roomsData = [], visitedBuildingNodes = new Set(), visitedRoomsNodes = new Set();
            const zip = await this.extractRooms(zipData);
            const index = zip.file("index.htm");
            if (!index) {
                throw new IInsightFacade_1.InsightError("no index.htm file");
            }
            const indexText = await index.async("text");
            const indexDocument = parse5.parse(indexText);
            const indexRootNode = indexDocument.childNodes.find((node) => node.nodeName === "html");
            const validBuildingsTable = this.findValidBuildingsTable(indexRootNode, visitedBuildingNodes);
            if (!validBuildingsTable) {
                throw new IInsightFacade_1.InsightError("no valid buildings table");
            }
            this.findBuildingData(validBuildingsTable);
            const filePromises = [];
            for (const building in this.buildingData) {
                let link = this.buildingData[building].url.replace("./", "");
                if (zip.file(link)) {
                    const fileAtLink = zip.file(link);
                    if (!fileAtLink) {
                        throw new IInsightFacade_1.InsightError("problem parsing rooms");
                    }
                    filePromises.push((async () => {
                        const fileContents = await fileAtLink.async("text");
                        if (!fileContents) {
                            throw new IInsightFacade_1.InsightError("problem parsing rooms");
                        }
                        const roomRootNode = parse5.parse(fileContents).childNodes.find((node) => node.nodeName === "html");
                        await this.findValidRoomsTable(roomRootNode, this.buildingData[building].shortname, roomsData, visitedRoomsNodes);
                    })());
                }
            }
            await Promise.all(filePromises);
            if (roomsData.length === 0) {
                console.log("no valid rooms in dataset");
                throw new IInsightFacade_1.InsightError("no valid rooms");
            }
            return roomsData;
        }
        catch (error) {
            throw new IInsightFacade_1.InsightError("problem parsing rooms");
        }
    }
    findValidBuildingsTable(node, visitedNodes) {
        visitedNodes.add(node);
        if (node.nodeName === "table") {
            for (const child of node.childNodes) {
                if (child.nodeName === "tbody") {
                    for (const child2 of child.childNodes) {
                        if (child2.nodeName === "tr") {
                            let title = false;
                            let address = false;
                            for (const child3 of child2.childNodes) {
                                if (child3.nodeName === "td") {
                                    for (const attr of child3.attrs) {
                                        if (attr.name === "class") {
                                            if (attr.value === "views-field views-field-title") {
                                                title = true;
                                            }
                                            if (attr.value === "views-field views-field-field-building-address") {
                                                address = true;
                                            }
                                            if (title && address) {
                                                return node;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        for (const child of node.childNodes) {
            if (!visitedNodes.has(child)) {
                if (child.nodeName && child.nodeName !== "#text" && child.nodeName !== "#comment") {
                    const result = this.findValidBuildingsTable(child, visitedNodes);
                    if (result) {
                        return result;
                    }
                }
            }
        }
        return null;
    }
    findBuildingData(node) {
        for (const child of node.childNodes) {
            if (child.nodeName === "tbody") {
                for (const tr of child.childNodes) {
                    if (tr.nodeName === "tr") {
                        let buildingURL = "", buildingAddress = "", fullname = "", shortname = "";
                        for (const td of tr.childNodes) {
                            if (td.nodeName === "td") {
                                for (const attr of td.attrs) {
                                    if (attr.name === "class") {
                                        if (attr.value === "views-field views-field-title") {
                                            for (const a of td.childNodes) {
                                                if (a.nodeName === "a") {
                                                    for (const attr2 of a.attrs) {
                                                        if (attr2.name === "href") {
                                                            buildingURL = attr2.value;
                                                        }
                                                    }
                                                    for (const aChild of a.childNodes) {
                                                        if (aChild.nodeName === "#text") {
                                                            fullname = aChild.value;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        else if (attr.value === "views-field views-field-field-building-address") {
                                            for (const tdChild of td.childNodes) {
                                                if (tdChild.nodeName === "#text") {
                                                    buildingAddress = tdChild.value;
                                                }
                                            }
                                        }
                                        else if (attr.value === "views-field views-field-field-building-code") {
                                            for (const tdChild of td.childNodes) {
                                                if (tdChild.nodeName === "#text") {
                                                    shortname = tdChild.value;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        const thisBuilding = this.htmlSearchUtil.populateBuildingData(buildingURL, buildingAddress, fullname, shortname);
                        this.buildingData[thisBuilding.shortname] = (thisBuilding);
                    }
                }
            }
        }
    }
    async findValidRoomsTable(node, buildingShortName, roomsData, visitedRoomsNodes) {
        visitedRoomsNodes.add(node);
        const promises = [];
        if (node.nodeName === "table") {
            promises.push(this.htmlSearchUtil.processRoomsTable(node, buildingShortName, roomsData, this.buildingData));
        }
        for (const child of node.childNodes) {
            if (!visitedRoomsNodes.has(child) && child.nodeName &&
                child.nodeName !== "#text" && child.nodeName !== "#comment") {
                promises.push(this.findValidRoomsTable(child, buildingShortName, roomsData, visitedRoomsNodes));
            }
        }
        await Promise.all(promises);
        return null;
    }
}
exports.ParseUtil = ParseUtil;
//# sourceMappingURL=parseUtil.js.map