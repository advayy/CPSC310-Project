"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModel = void 0;
const IInsightFacade_1 = require("./IInsightFacade");
const fs_1 = __importDefault(require("fs"));
const parseUtil_1 = require("./parseUtil");
class DatabaseModel {
    addedDatasetIDs = [];
    coursesDatabase = [[]];
    addedRoomsDatasetIDs = [];
    roomsDatabase = [[]];
    dataSections = [];
    dataRooms = [];
    constructor() {
        this.coursesDatabase.pop();
        const folderPath = __dirname + "/../../data";
        const filePath = folderPath + "/data.json";
        if (fs_1.default.existsSync(filePath)) {
            const fileContents = fs_1.default.readFileSync(filePath, "utf8");
            if (fileContents !== "") {
                const data = JSON.parse(fileContents);
                const inlist = Object.values(data);
                this.coursesDatabase = inlist;
                const datasetIDs = Object.keys(data);
                this.addedDatasetIDs = datasetIDs;
            }
        }
        this.roomsDatabase.pop();
        const filePath2 = folderPath + "/dataRooms.json";
        if (fs_1.default.existsSync(filePath2)) {
            const fileContents = fs_1.default.readFileSync(filePath2, "utf8");
            if (fileContents !== "") {
                const data = JSON.parse(fileContents);
                const inlist = Object.values(data);
                this.roomsDatabase = inlist;
                const datasetIDs = Object.keys(data);
                this.addedRoomsDatasetIDs = datasetIDs;
            }
        }
    }
    getAddedIDs() {
        return this.addedDatasetIDs.concat(this.addedRoomsDatasetIDs);
    }
    getAddedKinds() {
        return this.dataSections.concat(this.dataRooms);
    }
    listAll() {
        let output;
        output = [];
        for (let internalId of this.addedDatasetIDs) {
            let index = this.addedDatasetIDs.indexOf(internalId);
            let num = this.coursesDatabase[index].length;
            let dataIn = {
                id: internalId,
                kind: IInsightFacade_1.InsightDatasetKind.Sections,
                numRows: num
            };
            output.push(dataIn);
        }
        for (let internalId of this.addedRoomsDatasetIDs) {
            let index = this.addedRoomsDatasetIDs.indexOf(internalId);
            let num = this.roomsDatabase[index].length;
            let dataIn = {
                id: internalId,
                kind: IInsightFacade_1.InsightDatasetKind.Rooms,
                numRows: num
            };
            output.push(dataIn);
        }
        return output;
    }
    getDataFromID(id) {
        let index;
        if (this.addedDatasetIDs.indexOf(id) >= 0) {
            index = this.addedDatasetIDs.indexOf(id);
            return this.coursesDatabase[index];
        }
        else {
            index = this.addedRoomsDatasetIDs.indexOf(id);
            return this.roomsDatabase[index];
        }
    }
    addDataset(id, data, kind) {
        this.addedDatasetIDs.push(id);
        this.coursesDatabase.push(data);
        this.dataSections.push("sections");
        this.saveToDisk(id, data, kind);
        return this.addedDatasetIDs;
    }
    addRoomsDataset(id, data, kind) {
        this.addedRoomsDatasetIDs.push(id);
        this.roomsDatabase.push(data);
        this.dataRooms.push("rooms");
        this.saveToDisk(id, data, kind);
        return this.addedRoomsDatasetIDs;
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
    datasetExists(id) {
        if (this.addedDatasetIDs.includes(id)) {
            return true;
        }
        if (this.addedRoomsDatasetIDs.includes(id)) {
            return true;
        }
        return false;
    }
    validContent(content, kind) {
        if (content == null || content === "") {
            return false;
        }
        return true;
    }
    async extractAndParseZip(zipData) {
        const parseUtil = new parseUtil_1.ParseUtil();
        const result = await parseUtil.extractAndParseZip(zipData);
        return result;
    }
    async extractAndParseRooms(zipData) {
        const parseUtil = new parseUtil_1.ParseUtil();
        try {
            const result = await parseUtil.extractAndParseRooms(zipData);
            return result;
        }
        catch (error) {
            throw new IInsightFacade_1.InsightError("Invalid zip file");
        }
    }
    saveToDisk(id, data, kind) {
        const folderPath = __dirname + "/../../data";
        let filePath = "";
        if (kind === IInsightFacade_1.InsightDatasetKind.Sections) {
            filePath = folderPath + "/data.json";
        }
        if (kind === IInsightFacade_1.InsightDatasetKind.Rooms) {
            filePath = folderPath + "/dataRooms.json";
        }
        if (filePath === "") {
            throw new IInsightFacade_1.InsightError("Invalid dataset kind");
        }
        if (!fs_1.default.existsSync(folderPath)) {
            fs_1.default.mkdirSync(folderPath);
        }
        let existingData = {};
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
    removeDataset(id) {
        let index;
        const folderPath = __dirname + "/../../data";
        let filePath;
        if (this.addedDatasetIDs.includes(id)) {
            index = this.addedDatasetIDs.indexOf(id);
            this.addedDatasetIDs.splice(index, 1);
            this.coursesDatabase.splice(index, 1);
            filePath = folderPath + "/data.json";
        }
        else if (this.addedRoomsDatasetIDs.includes(id)) {
            index = this.addedRoomsDatasetIDs.indexOf(id);
            this.addedRoomsDatasetIDs.splice(index, 1);
            this.roomsDatabase.splice(index, 1);
            filePath = folderPath + "/dataRooms.json";
        }
        else {
            throw new IInsightFacade_1.InsightError("Dataset does not exist");
        }
        if (index <= -1) {
            throw new IInsightFacade_1.InsightError("Dataset does not exist");
        }
        if (fs_1.default.existsSync(filePath)) {
            const fileContents = fs_1.default.readFileSync(filePath, "utf8");
            if (fileContents !== "") {
                const existingData = JSON.parse(fileContents);
                delete existingData[id];
                fs_1.default.writeFileSync(filePath, JSON.stringify(existingData));
            }
        }
        return id;
    }
}
exports.DatabaseModel = DatabaseModel;
//# sourceMappingURL=databaseModel.js.map