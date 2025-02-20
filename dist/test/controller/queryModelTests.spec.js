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
const IInsightFacade_1 = require("../../src/controller/IInsightFacade");
const chai_1 = __importStar(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
chai_1.default.use(chai_as_promised_1.default);
const queryValidationHelpers_1 = __importDefault(require("../../src/controller/queryValidationHelpers"));
describe("Query Verification Test Suite", function () {
    describe("readJSONQuery tests", function () {
        let performQueryHelper;
        let validationHelper;
        beforeEach(function () {
            (0, TestUtil_1.clearDisk)();
            performQueryHelper = new performQueryHelpers_1.default();
            validationHelper = new queryValidationHelpers_1.default();
        });
        it("should return the valid json as a string - blank case", function () {
            const json = "{}";
            const result = validationHelper.readJSONQuery(json);
            (0, chai_1.expect)(result).equals("{}");
        });
        it("should return error for invalid syntax", function () {
            const json = "{";
            const testWrapper = () => {
                validationHelper.readJSONQuery(json);
            };
            (0, chai_1.expect)(testWrapper).to.throw(IInsightFacade_1.InsightError);
        });
    });
    describe.skip("Valid key tests", function () {
        let helper;
        beforeEach(function () {
            (0, TestUtil_1.clearDisk)();
            helper = new queryValidationHelpers_1.default();
            helper.assignAddedDatasetIDs(["sections"]);
            helper.setPrimaryDatasetID('{"COLUMNS":["sections_avg"]}');
        });
        it("should check if SKeys are valid", function () {
            let key = "sections_dept";
            (0, chai_1.expect)(helper.validSKey(key)).to.equal(true);
        });
        it("should check if SKeys are valid for second DB", function () {
            let key = "ubc_dept";
            helper.assignAddedDatasetIDs(["sections", "ubc"]);
            helper.setPrimaryDatasetID('{"COLUMNS":["ubc_avg"]}');
            (0, chai_1.expect)(helper.validSKey(key)).to.equal(true);
        });
        it("should reject invalid SKeys", function () {
            let key = "dept";
            (0, chai_1.expect)(helper.validSKey(key)).to.equal(false);
            key = "ubc_dept";
            (0, chai_1.expect)(helper.validSKey(key)).to.equal(false);
            key = "sections_hi_dept";
            (0, chai_1.expect)(helper.validSKey(key)).to.equal(false);
        });
        it("should check if Mkeys are valid", function () {
            let key = "sections_avg";
            (0, chai_1.expect)(helper.validMKey(key)).to.equal(true);
        });
        it("should check if Mkeys are valid for second DB", function () {
            let key = "ubc_avg";
            helper.assignAddedDatasetIDs(["sections", "ubc"]);
            helper.setPrimaryDatasetID('{"COLUMNS":["ubc_avg"]}');
            (0, chai_1.expect)(helper.validMKey(key)).to.equal(true);
        });
        it("should reject invalid Mkeys", function () {
            let key = "avg";
            (0, chai_1.expect)(helper.validMKey(key)).to.equal(false);
            key = "ubc_avg";
            (0, chai_1.expect)(helper.validMKey(key)).to.equal(false);
            key = "sections_hi_avg";
            (0, chai_1.expect)(helper.validMKey(key)).to.equal(false);
            key = "sections_dept";
            (0, chai_1.expect)(helper.validMKey(key)).to.equal(false);
        });
        it("should accept valid Keys", function () {
            let key1 = "sections_avg";
            let key2 = "sections_dept";
            (0, chai_1.expect)(helper.validKey(key1)).to.equal(true);
            (0, chai_1.expect)(helper.validKey(key2)).to.equal(true);
        });
        it("should Assign valid SKeys", function () {
            let block = '{"sections_dept":"cpsc"}';
            (0, chai_1.expect)(helper.assignValidSKey(block)).to.equal("sections_dept");
            (0, chai_1.expect)(helper.assignValidWord(block)).to.equal("cpsc");
        });
        it("should reject invalid SKeys", function () {
            let block = '{"sections_avg":1}';
            const testWrapper = () => {
                helper.assignValidSKey(block);
            };
            (0, chai_1.expect)(testWrapper).to.throw(IInsightFacade_1.InsightError);
            const testWrapper2 = () => {
                helper.assignValidWord(block);
            };
            (0, chai_1.expect)(testWrapper2).to.throw(IInsightFacade_1.InsightError);
        });
        it("should Assign valid MKeys", function () {
            let block = '{"sections_avg": 99}';
            (0, chai_1.expect)(helper.assignValidMKey(block)).to.equal("sections_avg");
            (0, chai_1.expect)(helper.assignValidNumber(block)).to.equal(99);
        });
        it("should reject invalid MKeys", function () {
            let block = '{"sections_dept":"cpsc"}';
            const testWrapper = () => {
                helper.assignValidMKey(block);
            };
            (0, chai_1.expect)(testWrapper).to.throw(IInsightFacade_1.InsightError);
            const testWrapper2 = () => {
                helper.assignValidNumber(block);
            };
            (0, chai_1.expect)(testWrapper2).to.throw(IInsightFacade_1.InsightError);
        });
    });
    describe.skip("Filter tests", function () {
        let helper;
        beforeEach(function () {
            (0, TestUtil_1.clearDisk)();
            helper = new performQueryHelpers_1.default();
            helper.assignAddedDatasetIDs(["sections"]);
            helper.setPrimaryDatasetID('{"COLUMNS":["sections_avg"]}');
        });
        it("Should return a Query when given a simple input with is", function () {
            let inp = '{"IS": {"sections_dept":"*ma"}}';
            let expectedOut;
            expectedOut = {};
            expectedOut.SCOMPARISON = {
                skey: "sections_dept",
                inputstring: "*ma"
            };
            (0, chai_1.expect)(helper.handleFilter(inp)).to.deep.equals(expectedOut);
        });
        it("Should return a Query when given a simple input with not", function () {
            let inp = '{"NOT":{"IS": {"sections_dept":"*ma"}}}';
            let expectedOut;
            expectedOut = {};
            expectedOut.NEGATION = {
                FILTER: {
                    SCOMPARISON: {
                        skey: "sections_dept",
                        inputstring: "*ma"
                    }
                }
            };
            (0, chai_1.expect)(helper.handleFilter(inp)).to.deep.equals(expectedOut);
        });
        it("Should return a Query when given a simple input with OR", function () {
            let inp = '{"OR" :[{"IS": {"sections_dept":"*ma"}}, {"IS": {"sections_id":"*ma"}}]}';
            let expectedOut;
            expectedOut = {};
            expectedOut.LOGICCOMPARISON = {
                LOGIC: "OR",
                FILTER_LIST: [
                    {
                        SCOMPARISON: {
                            skey: "sections_dept",
                            inputstring: "*ma"
                        }
                    },
                    {
                        SCOMPARISON: {
                            skey: "sections_id",
                            inputstring: "*ma"
                        }
                    }
                ]
            };
            (0, chai_1.expect)(helper.handleFilter(inp)).to.deep.equals(expectedOut);
        });
    });
    describe.skip("New version of Options test", function () {
        let helper;
        beforeEach(function () {
            (0, TestUtil_1.clearDisk)();
            helper = new performQueryHelpers_1.default();
            helper.assignAddedDatasetIDs(["sections"]);
        });
        it("Test Options...", function () {
            helper.setPrimaryDatasetID('{"COLUMNS":["sections_avg"]}');
            helper.setApplyKey("maxSeats");
            let inp = "{\n" +
                '    "COLUMNS": [\n' +
                '      "sections_avg",\n' +
                '      "maxSeats"\n' +
                "    ],\n" +
                '    "ORDER": {\n' +
                '      "dir": "DOWN",\n' +
                '      "keys": [\n' +
                '        "maxSeats"\n' +
                "      ]\n" +
                "    }\n" +
                "  }";
            let expectedOut;
            expectedOut = {
                COLUMNS: ["sections_avg", "maxSeats"],
                SORT: {
                    complex: {
                        direction: "DOWN",
                        keys: ["maxSeats"]
                    }
                }
            };
            (0, chai_1.expect)(helper.handleOptions(inp)).to.deep.equals(expectedOut);
        });
        it("Test Options simple...", function () {
            helper.setPrimaryDatasetID('{"COLUMNS":["sections_avg"]}');
            helper.setApplyKey("maxSeats");
            let inp = "{\n" +
                '    "COLUMNS": [\n' +
                '      "sections_avg",\n' +
                '      "maxSeats"\n' +
                "    ],\n" +
                '    "ORDER": \n' +
                '        "maxSeats"\n' +
                "  }";
            let expectedOut;
            expectedOut = {
                COLUMNS: ["sections_avg", "maxSeats"],
                SORT: {
                    simple: "maxSeats"
                }
            };
            (0, chai_1.expect)(helper.handleOptions(inp)).to.deep.equals(expectedOut);
        });
    });
    describe("Updated query validation tests", function () {
        let helper;
        beforeEach(function () {
            (0, TestUtil_1.clearDisk)();
            helper = new performQueryHelpers_1.default();
            helper.assignAddedDatasetIDs(["sections", "rooms"]);
        });
        it("should handle Query 1", function () {
            let inp = "{   \n" +
                ' "WHERE": {},   \n' +
                ' "OPTIONS": {       \n' +
                '      "COLUMNS": ["sections_title", "overallAvg"]   \n' +
                "   },   \n" +
                '   "TRANSFORMATIONS": {       \n' +
                '      "GROUP": ["sections_title"],       \n' +
                '      "APPLY": [{        \n' +
                '          "overallAvg": {        \n' +
                '             "AVG": "sections_avg"           \n' +
                "          }       \n" +
                "      }]   \n" +
                "   }\n" +
                "}";
            let expectedOut;
            expectedOut = {
                WHERE: {},
                OPTIONS: {
                    COLUMNS: ["sections_title", "overallAvg"]
                },
                TRANSFORMATIONS: {
                    GROUP: ["sections_title"],
                    APPLY: [
                        {
                            APPLYKEY: "overallAvg",
                            TOKEN: "AVG",
                            KEY: "sections_avg"
                        }
                    ]
                }
            };
            (0, chai_1.expect)(helper.modelQuery(inp, ["sections"], ["sections"])).to.deep.equals(expectedOut);
        });
        it("should handle Query 2", function () {
            let inp = "{\n" +
                '  "WHERE": {\n' +
                '    "AND": [\n' +
                "      {\n" +
                '        "IS": {\n' +
                '          "sections_uuid": "*15*"\n' +
                "        }\n" +
                "      },\n" +
                "      {\n" +
                '        "GT": {\n' +
                '          "sections_avg": 78\n' +
                "        }\n" +
                "      }\n" +
                "    ]\n" +
                "  },\n" +
                '  "OPTIONS": {\n' +
                '    "COLUMNS": [\n' +
                '      "sections_uuid",\n' +
                '      "maxSeats"\n' +
                "    ],\n" +
                '    "ORDER": {\n' +
                '      "dir": "DOWN",\n' +
                '      "keys": [\n' +
                '        "maxSeats"\n' +
                "      ]\n" +
                "    }\n" +
                "  },\n" +
                '  "TRANSFORMATIONS": {\n' +
                '    "GROUP": [\n' +
                '      "sections_uuid"\n' +
                "    ],\n" +
                '    "APPLY": [\n' +
                "      {\n" +
                '        "maxSeats": {\n' +
                '          "MAX": "sections_avg"\n' +
                "        }\n" +
                "      }\n" +
                "    ]\n" +
                "  }\n" +
                "}";
            let expectedOut;
            expectedOut = {
                WHERE: {
                    FILTER: {
                        LOGICCOMPARISON: {
                            LOGIC: "AND",
                            FILTER_LIST: [
                                {
                                    SCOMPARISON: {
                                        skey: "sections_uuid",
                                        inputstring: "*15*"
                                    }
                                },
                                {
                                    MCOMPARISON: {
                                        MCOMPARATOR: "GT",
                                        mkey: "sections_avg",
                                        number: 78
                                    }
                                }
                            ]
                        }
                    }
                },
                OPTIONS: {
                    COLUMNS: ["sections_uuid", "maxSeats"],
                    SORT: {
                        complex: {
                            direction: "DOWN",
                            keys: ["maxSeats"]
                        }
                    }
                },
                TRANSFORMATIONS: {
                    GROUP: ["sections_uuid"],
                    APPLY: [{
                            APPLYKEY: "maxSeats",
                            TOKEN: "MAX",
                            KEY: "sections_avg"
                        }]
                }
            };
            (0, chai_1.expect)(helper.modelQuery(inp, ["sections"], ["sections"])).to.deep.equals(expectedOut);
        });
        it("(ROOMS) should handle Query 3", function () {
            let inp = "{   \n" +
                ' "WHERE": {       \n' +
                '     "AND": [{           \n' +
                '        "IS": {               \n' +
                '            "rooms_furniture": "*Tables*"           \n' +
                "         }       \n" +
                "     }, {           \n" +
                '         "GT": {               \n' +
                '           "rooms_seats": 300           \n' +
                "          }       \n" +
                "    }]   \n" +
                "  },   \n" +
                '  "OPTIONS": {       \n' +
                '      "COLUMNS": [           \n' +
                '          "rooms_shortname",           \n' +
                '          "maxSeats"       \n' +
                "      ],       \n" +
                '  "ORDER": {           \n' +
                '     "dir": "DOWN",           \n' +
                '     "keys": ["maxSeats"]       \n' +
                "  }   \n" +
                "  },   \n" +
                '  "TRANSFORMATIONS": {       \n' +
                '      "GROUP": ["rooms_shortname"],       \n' +
                '      "APPLY": [{           \n' +
                '          "maxSeats": {               \n' +
                '              "MAX": "rooms_seats"           \n' +
                "           }       \n" +
                "      }]   \n" +
                "  }\n" +
                "}";
            let expectedOut;
            expectedOut = {
                WHERE: {
                    FILTER: {
                        LOGICCOMPARISON: {
                            LOGIC: "AND",
                            FILTER_LIST: [
                                {
                                    SCOMPARISON: {
                                        skey: "rooms_furniture",
                                        inputstring: "*Tables*"
                                    }
                                },
                                {
                                    MCOMPARISON: {
                                        MCOMPARATOR: "GT",
                                        mkey: "rooms_seats",
                                        number: 300
                                    }
                                }
                            ]
                        }
                    }
                },
                OPTIONS: {
                    COLUMNS: ["rooms_shortname", "maxSeats"],
                    SORT: {
                        complex: {
                            direction: "DOWN",
                            keys: ["maxSeats"]
                        }
                    }
                },
                TRANSFORMATIONS: {
                    GROUP: ["rooms_shortname"],
                    APPLY: [{
                            APPLYKEY: "maxSeats",
                            TOKEN: "MAX",
                            KEY: "rooms_seats"
                        }]
                }
            };
            (0, chai_1.expect)(helper.modelQuery(inp, ["rooms"], ["rooms"])).to.deep.equals(expectedOut);
        });
    });
    describe.skip("Transformations validation tests", function () {
        let helper;
        beforeEach(function () {
            (0, TestUtil_1.clearDisk)();
            helper = new performQueryHelpers_1.default();
            helper.assignAddedDatasetIDs(["sections"]);
            helper.setPrimaryDatasetID('{"COLUMNS":["sections_avg"]}');
        });
        it("transformations...", function () {
            let inp = '{"GROUP": ["sections_avg"],' +
                '"APPLY": [{"maxSeats": {"MAX": "sections_avg"}}]}';
            let expectedOut;
            expectedOut = {
                GROUP: ["sections_avg"],
                APPLY: [
                    { APPLYKEY: "maxSeats",
                        TOKEN: "MAX",
                        KEY: "sections_avg"
                    }
                ]
            };
            (0, chai_1.expect)(helper.handleTransformation(inp, '["sections_avg", "maxSeats"]')).to.deep.equals(expectedOut);
        });
    });
});
//# sourceMappingURL=queryModelTests.spec.js.map