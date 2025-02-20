"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("./IInsightFacade");
const queryValidationHelpers_1 = __importDefault(require("./queryValidationHelpers"));
class PerformQueryHelpers {
    applyKeys = [];
    validator = new queryValidationHelpers_1.default();
    getPrimaryDatasetID = () => this.validator.getPrimaryDatasetID();
    setApplyKey(key) {
        this.applyKeys.push(key);
    }
    assignAddedDatasetIDs(list) {
        this.validator.assignAddedDatasetIDs(list);
    }
    setPrimaryDatasetID(jsonKeys) {
        this.validator.setPrimaryDatasetID(jsonKeys);
    }
    modelQuery(queryString, addedDatasets, addedKinds) {
        this.validator.assignAddedDatasetIDs(addedDatasets);
        this.validator.assignAddedKinds(addedKinds);
        let outputQuery;
        let filterSegment, optionsSegment, transformSegment;
        outputQuery = { WHERE: {}, OPTIONS: { COLUMNS: [""] } };
        let json = JSON.parse(queryString);
        if (!this.validator.noInvalidsInQueryBody(queryString)) {
            throw new IInsightFacade_1.InsightError("Invalid Key in Query Body");
        }
        let cols = [];
        try {
            if (json["OPTIONS"]) {
                this.validator.setPrimaryDatasetID(JSON.stringify(json));
                if (json["OPTIONS"]["COLUMNS"]) {
                    cols = json["OPTIONS"]["COLUMNS"];
                }
            }
        }
        catch {
            throw new IInsightFacade_1.InsightError("Error in Options handler");
        }
        if (json["TRANSFORMATIONS"]) {
            try {
                transformSegment = json["TRANSFORMATIONS"];
                let transformString = JSON.stringify(transformSegment);
                let columnsListString = JSON.stringify(cols);
                outputQuery.TRANSFORMATIONS = this.handleTransformation(transformString, columnsListString);
            }
            catch {
                throw new IInsightFacade_1.InsightError("Error in Transformations handler");
            }
        }
        if (json["OPTIONS"]) {
            optionsSegment = json["OPTIONS"];
            let optionsString = JSON.stringify(optionsSegment);
            outputQuery.OPTIONS = this.handleOptions(optionsString);
        }
        if (json["WHERE"]) {
            filterSegment = json["WHERE"];
        }
        else {
            throw new IInsightFacade_1.InsightError("No Where block present");
        }
        if (JSON.stringify(filterSegment) === "{}") {
            outputQuery.WHERE = {};
        }
        else {
            outputQuery.WHERE.FILTER = this.handleFilter(JSON.stringify(filterSegment));
        }
        return outputQuery;
    }
    handleTransformation(stringTransformation, cols) {
        let json = JSON.parse(stringTransformation);
        let columns = JSON.parse(cols);
        let groupList;
        let applylist;
        if (json["GROUP"]) {
            for (let k of json["GROUP"]) {
                if (!this.validator.validKey(k)) {
                    throw new IInsightFacade_1.InsightError("Invalid key in transformation (GROUP) body");
                }
            }
            groupList = json["GROUP"];
        }
        else {
            throw new IInsightFacade_1.InsightError("NO GROUP in transform body");
        }
        if (json["APPLY"]) {
            applylist = this.handleApplyRuleList(JSON.stringify(json["APPLY"]));
        }
        else {
            throw new IInsightFacade_1.InsightError("NO APPLY in transform body");
        }
        for (let c of columns) {
            if (!groupList.includes(c) && !this.applyKeys.includes(c)) {
                throw new IInsightFacade_1.InsightError("All keys in columns must be in either group or apply");
            }
        }
        return {
            GROUP: groupList,
            APPLY: applylist
        };
    }
    handleApplyRuleList(jsonString) {
        let validTokens = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
        let validSKeyTokens = ["COUNT"];
        let jsonList = JSON.parse(jsonString);
        let out = [];
        for (let obj of jsonList) {
            let applyKey = Object.keys(obj)[0];
            let value = obj[applyKey];
            let token = Object.keys(value)[0];
            let key = value[token];
            if (this.applyKeys.includes(applyKey)) {
                throw new IInsightFacade_1.InsightError("Duplicate Apply key");
            }
            if (this.validator.validSKey(key) && validSKeyTokens.includes(token)) {
                let temp = {
                    APPLYKEY: applyKey,
                    TOKEN: token,
                    KEY: key
                };
                out.push(temp);
                this.applyKeys.push(applyKey);
            }
            else if (validTokens.includes(token) && this.validator.validMKey(key)) {
                let temp = {
                    APPLYKEY: applyKey,
                    TOKEN: token,
                    KEY: key
                };
                out.push(temp);
                this.applyKeys.push(applyKey);
            }
            else {
                throw new IInsightFacade_1.InsightError("Invalids in ApplyRuleList");
            }
        }
        return out;
    }
    handleFilter(stringFilter) {
        let filterBlock = JSON.parse(stringFilter);
        let filterBlockString = stringFilter;
        let outputFilter;
        outputFilter = {};
        if (!this.validator.validFilterBody(filterBlockString)) {
            throw new IInsightFacade_1.InsightError("Invalid Filter Body");
        }
        if (filterBlock["AND"] || filterBlock["OR"]) {
            let outList = [];
            for (let filters of filterBlock[Object.keys(filterBlock)[0]]) {
                outList.push(this.handleFilter(JSON.stringify(filters)));
            }
            if (outList.length < 1) {
                throw new IInsightFacade_1.InsightError("Empty AND/OR filter block");
            }
            outputFilter.LOGICCOMPARISON = {
                LOGIC: Object.keys(filterBlock)[0],
                FILTER_LIST: outList
            };
        }
        else if (filterBlock["LT"] || filterBlock["GT"] || filterBlock["EQ"]) {
            let comparator;
            if (filterBlock["LT"]) {
                comparator = "LT";
            }
            else if (filterBlock["GT"]) {
                comparator = "GT";
            }
            else {
                comparator = "EQ";
            }
            let valNo = this.validator.assignValidNumber(JSON.stringify(filterBlock[comparator]));
            let valMKey = this.validator.assignValidMKey(JSON.stringify(filterBlock[comparator]));
            outputFilter.MCOMPARISON = {
                MCOMPARATOR: comparator,
                mkey: valMKey,
                number: valNo,
            };
        }
        else if (filterBlock["NOT"]) {
            outputFilter.NEGATION = { FILTER: this.handleFilter(JSON.stringify(filterBlock["NOT"])) };
        }
        else if (filterBlock["IS"]) {
            let valWord = this.validator.assignValidWord(JSON.stringify(filterBlock["IS"]));
            let valSKey = this.validator.assignValidSKey(JSON.stringify(filterBlock["IS"]));
            this.validator.validateInputString(valWord);
            outputFilter.SCOMPARISON = {
                skey: valSKey,
                inputstring: valWord,
            };
        }
        return outputFilter;
    }
    handleOptions(jsonOptions) {
        let outputOptions;
        outputOptions = { COLUMNS: [""] };
        let json;
        if (!this.validator.noInvalidsInOptionsBody(jsonOptions)) {
            throw new IInsightFacade_1.InsightError("Invalid Key in Options");
        }
        let keylist = [];
        json = JSON.parse(jsonOptions);
        try {
            if (json["COLUMNS"]) {
                keylist = this.returnKeysFromCols(JSON.stringify(json));
                outputOptions.COLUMNS = keylist;
            }
            else {
                throw new IInsightFacade_1.InsightError("Invalid column keys");
            }
            if (json["ORDER"]) {
                if (json["ORDER"]["dir"]) {
                    let complex = JSON.stringify(json["ORDER"]);
                    outputOptions.SORT = this.handleComplexSort(complex, keylist);
                }
                else if (keylist.includes(json["ORDER"])) {
                    outputOptions.SORT = {
                        simple: json["ORDER"]
                    };
                }
                else {
                    throw new IInsightFacade_1.InsightError("Order Key not specified in columns");
                }
            }
        }
        catch {
            throw new IInsightFacade_1.InsightError("Invalid EBNF - missing columns or options");
        }
        return outputOptions;
    }
    handleComplexSort(jsonString, columnsKeylist) {
        let dir;
        let keylist;
        let json = JSON.parse(jsonString);
        if (json["dir"] === "UP" || json["dir"] === "DOWN") {
            dir = json["dir"];
        }
        else {
            throw new IInsightFacade_1.InsightError("Invalid Direction");
        }
        if (json["keys"]) {
            let keys = json["keys"];
            for (let k of keys) {
                if (!columnsKeylist.includes(k)) {
                    throw new IInsightFacade_1.InsightError("sort key not in column list");
                }
            }
            keylist = json["keys"];
        }
        else {
            throw new IInsightFacade_1.InsightError("No keys in sort key list");
        }
        let sortorder = {
            complex: {
                direction: dir,
                keys: keylist
            }
        };
        return sortorder;
    }
    returnKeysFromCols(jsonKeys) {
        let json;
        json = JSON.parse(jsonKeys);
        let columnKeys = json["COLUMNS"];
        let output;
        output = [""];
        output.pop();
        for (let key of columnKeys) {
            if (this.validator.validKey(key) || this.applyKeys.includes(key)) {
                output.push(key);
            }
            else {
                throw new IInsightFacade_1.InsightError("Invalid Keys in Columns");
            }
        }
        return output;
    }
}
exports.default = PerformQueryHelpers;
//# sourceMappingURL=performQueryHelpers.js.map