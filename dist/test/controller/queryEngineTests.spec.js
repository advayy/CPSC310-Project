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
const performQueryHelpers_1 = __importDefault(require("../../src/controller/performQueryHelpers"));
const TestUtil_1 = require("../resources/archives/TestUtil");
const chai_1 = __importStar(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
chai_1.default.use(chai_as_promised_1.default);
const queryEngine_1 = __importDefault(require("../../src/controller/queryEngine"));
describe("Query Engine Test Suite", function () {
    describe("Grouping tests", function () {
        let queryEngine;
        beforeEach(function () {
            (0, TestUtil_1.clearDisk)();
            queryEngine = new queryEngine_1.default();
        });
        it("should handle simple grouping", function () {
            let data;
            let columns;
            data = [
                {
                    uuid: "string",
                    id: "string",
                    title: "string",
                    instructor: "string",
                    dept: "string",
                    year: 0,
                    avg: 0,
                    pass: 0,
                    fail: 0,
                    audit: 0,
                }
            ];
            columns = ["Avg"];
            (0, chai_1.expect)(queryEngine.handleGrouping(data, columns)).to.have.deep.equals([data]);
        });
        it("should handle DOUBLE grouping", function () {
            let data;
            let columns;
            data = [
                {
                    uuid: "string",
                    id: "string",
                    title: "string",
                    instructor: "string",
                    dept: "string",
                    year: 1,
                    avg: 0,
                    pass: 0,
                    fail: 0,
                    audit: 0,
                },
                {
                    uuid: "string",
                    id: "string",
                    title: "string",
                    instructor: "string",
                    dept: "string",
                    year: 2,
                    avg: 0,
                    pass: 0,
                    fail: 0,
                    audit: 0,
                },
                {
                    uuid: "bing",
                    id: "bong",
                    title: "sling",
                    instructor: "slong",
                    dept: "ring",
                    year: 1,
                    avg: 10,
                    pass: 0,
                    fail: 0,
                    audit: 0,
                },
                {
                    uuid: "bing",
                    id: "bong",
                    title: "sling",
                    instructor: "slong",
                    dept: "ring",
                    year: 2,
                    avg: 10,
                    pass: 0,
                    fail: 0,
                    audit: 0,
                }
            ];
            let output = [
                [{
                        uuid: "string",
                        id: "string",
                        title: "string",
                        instructor: "string",
                        dept: "string",
                        year: 1,
                        avg: 0,
                        pass: 0,
                        fail: 0,
                        audit: 0,
                    }],
                [{
                        uuid: "string",
                        id: "string",
                        title: "string",
                        instructor: "string",
                        dept: "string",
                        year: 2,
                        avg: 0,
                        pass: 0,
                        fail: 0,
                        audit: 0,
                    }],
                [{
                        uuid: "bing",
                        id: "bong",
                        title: "sling",
                        instructor: "slong",
                        dept: "ring",
                        year: 1,
                        avg: 10,
                        pass: 0,
                        fail: 0,
                        audit: 0,
                    }],
                [{
                        uuid: "bing",
                        id: "bong",
                        title: "sling",
                        instructor: "slong",
                        dept: "ring",
                        year: 2,
                        avg: 10,
                        pass: 0,
                        fail: 0,
                        audit: 0,
                    }]
            ];
            columns = ["avg", "year"];
            (0, chai_1.expect)(queryEngine.handleGrouping(data, columns)).to.have.deep.equals(output);
        });
    });
    describe("modelQuery tests", function () {
        let performQueryHelper;
        let queryEngine;
        beforeEach(function () {
            (0, TestUtil_1.clearDisk)();
            performQueryHelper = new performQueryHelpers_1.default();
            queryEngine = new queryEngine_1.default();
        });
        it("should handle simple no where query", function () {
            let json;
            json = '{"WHERE":{}, "OPTIONS":{"COLUMNS": ["sections_dept","sections_avg"], "ORDER": "sections_avg"}}';
            const query = performQueryHelper.modelQuery(json, ["sections"], ["sections"]);
            queryEngine.queryRunner(query, "ubc", []);
        });
        it.skip("should handle identify IS where query", function () {
            let inp;
            inp = '{"WHERE":{"IS":{"sections_dept":"ma*"}},"OPTIONS"' +
                ':{"COLUMNS":["sections_dept","sections_id","sections_avg"],"ORDER":"sections_avg"}}';
            const query = performQueryHelper.modelQuery(inp, ["sections"], ["sections"]);
            const filter = query.WHERE.FILTER;
            if (filter) {
                queryEngine.filterHandler(filter, []);
            }
        });
        it.skip("should handle nested queries", function () {
            let inp;
            inp = '{"WHERE":{"AND":[{"IS":{"sections_dept":"ma*"}}]},"OPTIONS"' +
                ':{"COLUMNS":["sections_dept","sections_id","sections_avg"],"ORDER":"sections_avg"}}';
            const value = performQueryHelper.modelQuery(inp, ["sections"], ["sections"]);
            inp = JSON.stringify(JSON.parse(inp));
            console.log(value);
            console.log(value["WHERE"]["FILTER"]);
            console.log(value["WHERE"]["FILTER"]?.LOGICCOMPARISON);
            (0, chai_1.expect)(JSON.stringify(value)).to.equal(inp);
        });
        it.skip("should handle nested queries with GT LT", function () {
            let inp;
            inp = "{\n" +
                '\t\t"WHERE": {\n' +
                '\t\t\t"AND": [\n' +
                "\t\t\t\t{\n" +
                '\t\t\t\t\t"GT": {\n' +
                '\t\t\t\t\t\t"sections_avg": 90\n' +
                "\t\t\t\t\t}\n" +
                "\t\t\t\t},\n" +
                "\t\t\t\t{\n" +
                '\t\t\t\t\t"LT": {\n' +
                '\t\t\t\t\t\t"sections_avg": 91\n' +
                "\t\t\t\t\t}\n" +
                "\t\t\t\t}\n" +
                "\t\t\t]\n" +
                "\t\t},\n" +
                '\t\t"OPTIONS": {\n' +
                '\t\t\t"COLUMNS": [\n' +
                '\t\t\t\t"sections_dept",\n' +
                '\t\t\t\t"sections_id",\n' +
                '\t\t\t\t"sections_avg"\n' +
                "\t\t\t],\n" +
                '\t\t\t"ORDER": "sections_avg"\n' +
                "\t\t}\n" +
                "\t}";
            const query = performQueryHelper.modelQuery(inp, ["sections", "ubc"], ["sections", "sections"]);
        });
        it.skip("should handle nested queries with NOT", function () {
            let inp;
            inp = '{"WHERE":{"NOT":{"GT":{"sections_avg":1}}},"OPTIONS":{"COLUMNS":["sections_dept","sections_avg"],' +
                '"ORDER":"sections_avg"}}';
            const value = performQueryHelper.modelQuery(inp, ["sections"], ["sections"]);
            inp = JSON.stringify(JSON.parse(inp));
            console.log(value);
            console.log(value["WHERE"]["FILTER"]);
            console.log(value["WHERE"]["FILTER"]?.LOGICCOMPARISON);
            (0, chai_1.expect)(JSON.stringify(value)).to.equal(inp);
        });
    });
});
//# sourceMappingURL=queryEngineTests.spec.js.map