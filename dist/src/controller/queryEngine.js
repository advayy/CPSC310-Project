"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("./IInsightFacade");
const transformationHelper_1 = __importDefault(require("./transformationHelper"));
const sortFunctions_1 = __importDefault(require("./sortFunctions"));
class QueryEngine {
    queryRunner(query, primID, data) {
        let output;
        if (query.WHERE.FILTER) {
            output = this.filterHandler(query.WHERE.FILTER, data);
        }
        else {
            output = data;
        }
        let relevantColumns = query.OPTIONS.COLUMNS;
        let trimmedCols = this.getColumnsOnly(relevantColumns);
        let transformationOutput;
        let result;
        let sorter = new sortFunctions_1.default();
        if (query.TRANSFORMATIONS) {
            transformationOutput = this.handleTRNF(output, query.TRANSFORMATIONS, relevantColumns, primID);
            if (transformationOutput.length > 5000) {
                throw new IInsightFacade_1.ResultTooLargeError("Query Result too Large");
            }
            result = [];
            for (let t of transformationOutput) {
                result.push(t);
            }
            if (query.OPTIONS.SORT?.simple) {
                result = sorter.sortByKeyAscending(result, query.OPTIONS.SORT.simple);
            }
            else {
                if (query.OPTIONS.SORT?.complex?.keys) {
                    let keys = query.OPTIONS.SORT?.complex?.keys;
                    result = sorter.sortByMultipleKeys(result, keys, query.OPTIONS.SORT?.complex?.direction);
                }
            }
            return result;
        }
        let numRows = output.length;
        if (numRows > 5000) {
            throw new IInsightFacade_1.ResultTooLargeError("Query Result too Large");
        }
        result = [];
        for (let course of output) {
            result.push(this.mapToInsightResult(course, trimmedCols, primID));
        }
        if (query.OPTIONS.SORT?.simple) {
            result = sorter.sortByKeyAscending(result, query.OPTIONS.SORT.simple);
        }
        else {
            if (query.OPTIONS.SORT?.complex?.keys) {
                let keys = query.OPTIONS.SORT?.complex?.keys;
                result = sorter.sortByMultipleKeys(result, keys, query.OPTIONS.SORT?.complex?.direction);
            }
        }
        return result;
    }
    getColumnsOnly(list) {
        let trimmedCols = [];
        for (let column of list) {
            if (column.includes("_")) {
                trimmedCols.push(column.split("_")[1]);
            }
            else {
                trimmedCols.push(column);
            }
        }
        return trimmedCols;
    }
    handleTRNF(data, trs, rel, id) {
        let helper = new transformationHelper_1.default();
        let groups = this.handleGrouping(data, this.getColumnsOnly(trs.GROUP));
        let applyList = helper.getApplyList(trs.APPLY);
        let applyResult = helper.handleApply(groups, trs.APPLY);
        let filteredData = {};
        let trimmedGroups = [];
        for (let list of groups) {
            filteredData = {};
            for (let column of rel) {
                if (column.includes("_")) {
                    filteredData[column] = list[0][column.split("_")[1]];
                }
            }
            trimmedGroups.push(filteredData);
        }
        let index = 0;
        for (let applyKey of applyList) {
            let currentResult = applyResult[index];
            for (let i = 0; i < currentResult.length; i++) {
                trimmedGroups[i][applyKey] = Number(currentResult[i]);
            }
            index += 1;
        }
        return trimmedGroups;
    }
    handleGrouping(data, grouping) {
        const output = [];
        const groupMap = new Map();
        for (const courseData of data) {
            const groupKey = grouping.map((key) => courseData[key]).join("_");
            if (!groupMap.has(groupKey)) {
                groupMap.set(groupKey, []);
            }
            const group = groupMap.get(groupKey);
            if (group) {
                group.push(courseData);
            }
        }
        for (const group of groupMap.values()) {
            output.push(group);
        }
        return output;
    }
    mapToInsightResult(course, relevantColumns, primID) {
        const insightResult = {};
        relevantColumns.forEach((column) => {
            let insightColumn = primID + "_" + column;
            insightResult[insightColumn] = course[column];
        });
        return insightResult;
    }
    filterHandler(filter, data) {
        let filterSection = filter;
        if (filterSection?.LOGICCOMPARISON) {
            if (filterSection.LOGICCOMPARISON.LOGIC === "AND") {
                return this.filterHandleAND(filterSection.LOGICCOMPARISON.FILTER_LIST, data);
            }
            else {
                return this.filterHandleOR(filterSection.LOGICCOMPARISON.FILTER_LIST, data);
            }
        }
        else if (filterSection?.MCOMPARISON) {
            let comparator = filterSection.MCOMPARISON.MCOMPARATOR;
            let key = filterSection.MCOMPARISON.mkey;
            let no = filterSection.MCOMPARISON.number;
            key = key.split("_")[1];
            return this.handleMCOMP(comparator, key, no, data);
        }
        else if (filterSection?.SCOMPARISON) {
            let key = filterSection.SCOMPARISON.skey;
            key = key.split("_")[1];
            let stringInput = filterSection.SCOMPARISON.inputstring;
            return this.handleSCOMP(key, stringInput, data);
        }
        else if (filterSection?.NEGATION) {
            let negationFilterResult = this.filterHandler(filterSection.NEGATION.FILTER, data);
            return data.filter((item) => !negationFilterResult.includes(item));
        }
        return [];
    }
    filterHandleAND(filterList, data) {
        let outlist = [[]];
        outlist.pop();
        for (let filter of filterList) {
            outlist.push(this.filterHandler(filter, data));
        }
        return this.takeIntersectionUntilEmpty(outlist);
    }
    takeIntersectionUntilEmpty(lists) {
        let result = lists[0];
        for (const sublist of lists.slice(1)) {
            result = result.filter((item) => sublist.includes(item));
            if (result.length === 0) {
                break;
            }
        }
        return result;
    }
    filterHandleOR(filterList, data) {
        let outlist = [[]];
        outlist.pop();
        for (let filter of filterList) {
            outlist.push(this.filterHandler(filter, data));
        }
        return this.takeUnion(outlist);
    }
    takeUnion(lists) {
        let result = [];
        for (const sublist of lists) {
            result = [...new Set([...result, ...sublist])];
        }
        return result;
    }
    handleMCOMP(comparator, key, no, data) {
        let output;
        output = [];
        for (let course of data) {
            let value = course[key];
            if (comparator === "GT") {
                if (value > no) {
                    output.push(course);
                }
            }
            else if (comparator === "LT") {
                if (value < no) {
                    output.push(course);
                }
            }
            else if (comparator === "EQ") {
                if (value === no) {
                    output.push(course);
                }
            }
        }
        return output;
    }
    handleSCOMP(key, inputString, data) {
        let outlist = [];
        const hasLeadingAsterisk = inputString.startsWith("*");
        const hasTrailingAsterisk = inputString.endsWith("*");
        for (let entry of data) {
            let valueToMatch = entry[key];
            if (inputString === valueToMatch) {
                outlist.push(entry);
            }
            else if (hasLeadingAsterisk && hasTrailingAsterisk) {
                const middlePattern = inputString.substring(1, inputString.length - 1);
                if (valueToMatch.includes(middlePattern)) {
                    outlist.push(entry);
                }
            }
            else if (hasLeadingAsterisk) {
                const tailPattern = inputString.substring(1);
                if (valueToMatch.endsWith(tailPattern)) {
                    outlist.push(entry);
                }
            }
            else if (hasTrailingAsterisk) {
                const headPattern = inputString.substring(0, inputString.length - 1);
                if (valueToMatch.startsWith(headPattern)) {
                    outlist.push(entry);
                }
            }
        }
        return outlist;
    }
}
exports.default = QueryEngine;
//# sourceMappingURL=queryEngine.js.map