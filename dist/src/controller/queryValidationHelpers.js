"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("./IInsightFacade");
class QueryValidationHelpers {
    addedDatasetIDs = [];
    primaryDatasetID = "";
    datasetType = "";
    addedKinds = [];
    getPrimaryDatasetID = () => this.primaryDatasetID;
    assignAddedDatasetIDs(list) {
        this.addedDatasetIDs = list;
    }
    assignAddedKinds(list) {
        this.addedKinds = list;
    }
    setPrimaryDatasetID(jsonKeys) {
        let json;
        json = JSON.parse(jsonKeys);
        let columnKeys = json["OPTIONS"]["COLUMNS"];
        let groupKeys = [];
        try {
            if (json["TRANSFORMATIONS"]) {
                groupKeys = json["TRANSFORMATIONS"]["GROUP"];
            }
        }
        catch {
        }
        let output;
        output = [""];
        output.pop();
        let firstKey = "";
        let allKeys;
        if (groupKeys.length === 0) {
            allKeys = columnKeys;
        }
        else {
            allKeys = columnKeys.concat(groupKeys);
        }
        for (let key of allKeys) {
            if (key.includes("_")) {
                firstKey = key;
                break;
            }
        }
        firstKey = firstKey.split("_")[0];
        let index;
        if (this.addedDatasetIDs.includes(firstKey)) {
            this.primaryDatasetID = firstKey;
            this.setTypeFlag(this.addedDatasetIDs.indexOf(firstKey));
        }
        else {
            throw new IInsightFacade_1.InsightError("Database not added");
        }
    }
    setTypeFlag(index) {
        let kind = this.addedKinds[index];
        if (kind === "sections") {
            this.datasetType = "S";
        }
        else if (kind === "rooms") {
            this.datasetType = "R";
        }
    }
    readJSONQuery(stringInput) {
        let json;
        try {
            json = JSON.parse(stringInput);
        }
        catch {
            throw new IInsightFacade_1.InsightError("Invalid JSON syntax");
        }
        return JSON.stringify(json);
    }
    validateInputString(s) {
        const trimmedString = s.substring(1, s.length - 1);
        let asteriskCount = 0;
        for (let c of trimmedString) {
            if (c === "*") {
                throw new IInsightFacade_1.InsightError("astrix present in id string");
            }
        }
    }
    assignValidNumber(block) {
        let json = JSON.parse(block);
        let num = json[Object.keys(json)[0]];
        if (typeof num === "number") {
            return num;
        }
        throw new IInsightFacade_1.InsightError("Operator didnt receive a number");
    }
    validFilterBody(levelJSONString) {
        let json = JSON.parse(levelJSONString);
        let validQueryKeys = ["AND", "OR", "NOT", "IS", "LT", "GT", "EQ"];
        let presentKeys = Object.keys(json);
        if (!(presentKeys.length === 1)) {
            return false;
        }
        for (let k of presentKeys) {
            if (!validQueryKeys.includes(k)) {
                return false;
            }
        }
        return true;
    }
    assignValidWord(block) {
        let json = JSON.parse(block);
        let str = json[Object.keys(json)[0]];
        if (typeof str === "string") {
            return str;
        }
        throw new IInsightFacade_1.InsightError("Operator didnt receive a String");
    }
    noInvalidsInOptionsBody(levelJSONString) {
        let json = JSON.parse(levelJSONString);
        let validQueryKeys = ["COLUMNS", "ORDER"];
        let presentKeys = Object.keys(json);
        if (presentKeys.length > 2) {
            return false;
        }
        for (let k of presentKeys) {
            if (!validQueryKeys.includes(k)) {
                return false;
            }
        }
        return true;
    }
    noInvalidsInQueryBody(levelJSONString) {
        let json = JSON.parse(levelJSONString);
        let validQueryKeys = ["WHERE", "OPTIONS", "TRANSFORMATIONS"];
        let presentKeys = Object.keys(json);
        if (presentKeys.length > 3) {
            return false;
        }
        if (presentKeys.length === 3) {
            for (let k of presentKeys) {
                if (!validQueryKeys.includes(k)) {
                    return false;
                }
            }
        }
        else {
            validQueryKeys = ["WHERE", "OPTIONS"];
            for (let k of presentKeys) {
                if (!validQueryKeys.includes(k)) {
                    return false;
                }
            }
        }
        return true;
    }
    validKey(key) {
        return this.validSKey(key) || this.validMKey(key);
    }
    assignValidSKey(block) {
        let json = JSON.parse(block);
        if (Object.keys(json).length === 1) {
            let skey = Object.keys(json)[0];
            if (this.validSKey(skey)) {
                return skey;
            }
        }
        throw new IInsightFacade_1.InsightError("Invalid SKey");
    }
    assignValidMKey(block) {
        let json = JSON.parse(block);
        if (Object.keys(json).length === 1) {
            let mkey = Object.keys(json)[0];
            if (this.validMKey(mkey)) {
                return mkey;
            }
        }
        throw new IInsightFacade_1.InsightError("Invalid MKey");
    }
    validateMSKey(key, validFields) {
        let keyPieces = key.split("_");
        let KeyID, KeyField;
        if (keyPieces.length > 1 && keyPieces.length < 3) {
            KeyID = keyPieces[0];
            KeyField = keyPieces[1];
            if (validFields.includes(KeyField) && KeyID === this.primaryDatasetID) {
                return true;
            }
        }
        return false;
    }
    validMKey(key) {
        let validFields = ["avg", "pass", "fail", "audit", "year"];
        if (this.datasetType === "R") {
            validFields = ["lat", "lon", "seats"];
        }
        return this.validateMSKey(key, validFields);
    }
    validSKey(key) {
        let validFields = ["dept", "id", "instructor", "title", "uuid"];
        if (this.datasetType === "R") {
            validFields = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
        }
        return this.validateMSKey(key, validFields);
    }
}
exports.default = QueryValidationHelpers;
//# sourceMappingURL=queryValidationHelpers.js.map