import InsightFacade from "../../src/controller/InsightFacade";
import PerformQueryHelpers from "../../src/controller/performQueryHelpers";
import {clearDisk, getContentFromArchives} from "../resources/archives/TestUtil";
import {
	InsightDatasetKind,
	InsightError
} from "../../src/controller/IInsightFacade";
import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import mocha from "mocha";
import {folderTest} from "@ubccpsc310/folder-test";
import fs from "fs";
import exp from "constants";
import {QueryOptions, QueryModel, Filter, TRANSFORMATION} from "../../src/models/queryModel";
import QueryEngine from "../../src/controller/queryEngine";
import QueryValidationHelpers from "../../src/controller/queryValidationHelpers";

describe("Query Verification Test Suite", function () {
	describe("readJSONQuery tests", function () {

		let performQueryHelper: PerformQueryHelpers;
		let validationHelper: QueryValidationHelpers;
		beforeEach(function() {
			clearDisk();
			performQueryHelper = new PerformQueryHelpers();
			validationHelper = new QueryValidationHelpers();
		});

		it("should return the valid json as a string - blank case", function (){
			const json = "{}";
			const result = validationHelper.readJSONQuery(json);
			expect(result).equals("{}");
		});

		it("should return error for invalid syntax", function (){
			const json = "{";
			const testWrapper = () => {
				validationHelper.readJSONQuery(json);
			};
			expect(testWrapper).to.throw(InsightError);
		});
	});


	describe.skip("Valid key tests", function () {
		let helper: QueryValidationHelpers;
		beforeEach(function() {
			clearDisk();
			helper = new QueryValidationHelpers();
			helper.assignAddedDatasetIDs(["sections"]);
			helper.setPrimaryDatasetID('{"COLUMNS":["sections_avg"]}');
		});

		it("should check if SKeys are valid", function () {
			let key = "sections_dept";
			expect(helper.validSKey(key)).to.equal(true);
		});

		it("should check if SKeys are valid for second DB", function () {
			let key = "ubc_dept";
			helper.assignAddedDatasetIDs(["sections", "ubc"]);
			helper.setPrimaryDatasetID('{"COLUMNS":["ubc_avg"]}');
			expect(helper.validSKey(key)).to.equal(true);
		});

		it("should reject invalid SKeys", function () {
			let key = "dept";
			expect(helper.validSKey(key)).to.equal(false);
			key = "ubc_dept";
			expect(helper.validSKey(key)).to.equal(false);
			key = "sections_hi_dept";
			expect(helper.validSKey(key)).to.equal(false);
		});


		it("should check if Mkeys are valid", function () {
			let key = "sections_avg";
			expect(helper.validMKey(key)).to.equal(true);
		});

		it("should check if Mkeys are valid for second DB", function () {
			let key = "ubc_avg";
			helper.assignAddedDatasetIDs(["sections", "ubc"]);
			helper.setPrimaryDatasetID('{"COLUMNS":["ubc_avg"]}');
			expect(helper.validMKey(key)).to.equal(true);
		});

		it("should reject invalid Mkeys", function () {
			let key = "avg";
			expect(helper.validMKey(key)).to.equal(false);
			key = "ubc_avg";
			expect(helper.validMKey(key)).to.equal(false);
			key = "sections_hi_avg";
			expect(helper.validMKey(key)).to.equal(false);
			key = "sections_dept";
			expect(helper.validMKey(key)).to.equal(false);
		});

		it("should accept valid Keys", function () {
			let key1 = "sections_avg";
			let key2 = "sections_dept";

			expect(helper.validKey(key1)).to.equal(true);
			expect(helper.validKey(key2)).to.equal(true);
		});


		it("should Assign valid SKeys", function () {
			let block = '{"sections_dept":"cpsc"}';
			expect(helper.assignValidSKey(block)).to.equal("sections_dept");
			expect(helper.assignValidWord(block)).to.equal("cpsc");
		});

		it("should reject invalid SKeys", function () {
			let block = '{"sections_avg":1}';
			const testWrapper = () => {
				helper.assignValidSKey(block);
			};
			expect(testWrapper).to.throw(InsightError);

			const testWrapper2 = () => {
				helper.assignValidWord(block);
			};
			expect(testWrapper2).to.throw(InsightError);
		});

		it("should Assign valid MKeys", function () {
			let block = '{"sections_avg": 99}';
			expect(helper.assignValidMKey(block)).to.equal("sections_avg");
			expect(helper.assignValidNumber(block)).to.equal(99);
		});

		it("should reject invalid MKeys", function () {
			let block = '{"sections_dept":"cpsc"}';
			const testWrapper = () => {
				helper.assignValidMKey(block);
			};
			expect(testWrapper).to.throw(InsightError);

			const testWrapper2 = () => {
				helper.assignValidNumber(block);
			};
			expect(testWrapper2).to.throw(InsightError);
		});
	});

	describe.skip("Filter tests", function () {
		let helper: PerformQueryHelpers;
		beforeEach(function() {
			clearDisk();
			helper = new PerformQueryHelpers();
			helper.assignAddedDatasetIDs(["sections"]);
			helper.setPrimaryDatasetID('{"COLUMNS":["sections_avg"]}');
		});

		it("Should return a Query when given a simple input with is", function (){
			let inp = '{"IS": {"sections_dept":"*ma"}}';
			let expectedOut: Filter;
			expectedOut = {}; // filters can be none
			expectedOut.SCOMPARISON = {
				skey : "sections_dept",
				inputstring : "*ma"
			};
			expect(helper.handleFilter(inp)).to.deep.equals(expectedOut);
		});

		it("Should return a Query when given a simple input with not", function (){
			let inp = '{"NOT":{"IS": {"sections_dept":"*ma"}}}';
			let expectedOut: Filter;
			expectedOut = {}; // filters can be none
			expectedOut.NEGATION = {
				FILTER: {
					SCOMPARISON: {
						skey : "sections_dept",
						inputstring : "*ma"
					}
				}
			};
			expect(helper.handleFilter(inp)).to.deep.equals(expectedOut);
		});

		it("Should return a Query when given a simple input with OR", function (){
			let inp = '{"OR" :[{"IS": {"sections_dept":"*ma"}}, {"IS": {"sections_id":"*ma"}}]}';
			let expectedOut: Filter;
			expectedOut = {}; // filters can be none
			expectedOut.LOGICCOMPARISON = {
				LOGIC: "OR",
				FILTER_LIST: [
					{
						SCOMPARISON: {
							skey : "sections_dept",
							inputstring : "*ma"
						}
					},
					{
						SCOMPARISON: {
							skey : "sections_id",
							inputstring : "*ma"
						}
					}
				]
			};
			expect(helper.handleFilter(inp)).to.deep.equals(expectedOut);
		});

	});

	describe.skip("New version of Options test", function () {
		let helper: PerformQueryHelpers;
		beforeEach(function() {
			clearDisk();
			helper = new PerformQueryHelpers();
			helper.assignAddedDatasetIDs(["sections"]);
		});

		it("Test Options...", function (){
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
			let expectedOut: QueryOptions;
			expectedOut = {
				COLUMNS: ["sections_avg", "maxSeats"],
				SORT: {
					complex: {
						direction: "DOWN",
						keys: ["maxSeats"]
					}
				}
			};
			expect(helper.handleOptions(inp)).to.deep.equals(expectedOut);
		});

		it("Test Options simple...", function (){
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
			let expectedOut: QueryOptions;
			expectedOut = {
				COLUMNS: ["sections_avg", "maxSeats"],
				SORT: {
					simple: "maxSeats"
				}
			};
			expect(helper.handleOptions(inp)).to.deep.equals(expectedOut);
		});
	});

	describe("Updated query validation tests", function () {
		let helper: PerformQueryHelpers;
		beforeEach(function() {
			clearDisk();
			helper = new PerformQueryHelpers();
			helper.assignAddedDatasetIDs(["sections", "rooms"]); // flag this line doesnt matter
		});

		it("should handle Query 1", function (){
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
			let expectedOut: QueryModel;
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
			expect(helper.modelQuery(inp, ["sections"], ["sections"])).to.deep.equals(expectedOut);
		});

		it("should handle Query 2", function (){
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
			let expectedOut: QueryModel;
			expectedOut = {
				WHERE: {
					FILTER: {
						LOGICCOMPARISON: {
							LOGIC: "AND",
							FILTER_LIST: [
								{
									SCOMPARISON: {
										skey:"sections_uuid",
										inputstring: "*15*"

									}
								},
								{
									MCOMPARISON: {
										MCOMPARATOR: "GT",
										mkey:"sections_avg",
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
			expect(helper.modelQuery(inp, ["sections"], ["sections"])).to.deep.equals(expectedOut);
		});

		it("(ROOMS) should handle Query 3", function (){
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
			let expectedOut: QueryModel;
			expectedOut = {
				WHERE: {
					FILTER: {
						LOGICCOMPARISON: {
							LOGIC: "AND",
							FILTER_LIST: [
								{
									SCOMPARISON: {
										skey:"rooms_furniture",
										inputstring: "*Tables*"

									}
								},
								{
									MCOMPARISON: {
										MCOMPARATOR: "GT",
										mkey:"rooms_seats",
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
			expect(helper.modelQuery(inp, ["rooms"], ["rooms"])).to.deep.equals(expectedOut);
		});
	});

	describe.skip("Transformations validation tests", function () {
		let helper: PerformQueryHelpers;
		beforeEach(function() {
			clearDisk();
			helper = new PerformQueryHelpers();
			helper.assignAddedDatasetIDs(["sections"]);
			helper.setPrimaryDatasetID('{"COLUMNS":["sections_avg"]}');
		});

		it("transformations...", function (){
			let inp = '{"GROUP": ["sections_avg"],' +
				'"APPLY": [{"maxSeats": {"MAX": "sections_avg"}}]}';
			let expectedOut: TRANSFORMATION;
			expectedOut = {
				GROUP: ["sections_avg"],
				APPLY: [
					{APPLYKEY: "maxSeats",
						TOKEN: "MAX",
						KEY: "sections_avg"
					}
				]
			};
			expect(helper.handleTransformation(inp, '["sections_avg", "maxSeats"]')).to.deep.equals(expectedOut);
		});
	});

	// describe("modelQuery tests", function () {
	//
	// 	let performQueryHelper: PerformQueryHelpers;
	// 	beforeEach(function() {
	// 		clearDisk();
	// 		performQueryHelper = new PerformQueryHelpers();
	// 	});
	//
	// 	it("should handle simple no where query", function () {
	// 		let binp;
	// 		binp = '{"WHERE":{}, "OPTIONS":{"COLUMNS": ["sections_dept","sections_avg"], "ORDER": "sections_avg"}}';
	// 		const value =  performQueryHelper.modelQuery(binp, ["sections"]);
	//
	// 		// reformats the input
	// 		binp = JSON.stringify(JSON.parse(binp));
	//
	// 		expect(JSON.stringify(value)).to.equal(binp);
	// 	});
	//
	// 	it("should fail when order isnt in list", function () {
	// 		let inp: string;
	// 		inp = '{"WHERE":{}, "OPTIONS":{"COLUMNS": ["sections_dept","sections_avg"], "ORDER": "sections_uuid"}}';
	// 		inp = JSON.stringify(JSON.parse(inp));
	// 		const testWrapper = () => {
	// 			performQueryHelper.modelQuery(inp, ["sections"]);
	// 		};
	//
	// 		expect(testWrapper).to.throw(InsightError);
	// 	});
	//
	// 	it.skip("return keys", function () {
	// 		let inp;
	// 		inp = '{"COLUMNS": ["sections_dept","sections_avg"]}';
	// 		const value =  performQueryHelper.returnKeysFromCols(inp);
	// 		expect(value).to.have.deep.members(["sections_dept","sections_avg"]);
	// 	});
	//
	// 	it.skip("should handle simple IS where query",
	// 		function () {
	// 			let inp;
	// 			inp = '{"WHERE":{"IS":{"sections_dept":"ma*"}},"OPTIONS"' +
	// 				':{"COLUMNS":["sections_dept","sections_id","sections_avg"],"ORDER":"sections_avg"}}';
	// 			const value = performQueryHelper.modelQuery(inp, ["sections"]);
	//
	// 			// reformats the input
	// 			inp = JSON.stringify(JSON.parse(inp));
	//
	// 			console.log(value);
	// 			console.log(value["WHERE"]["FILTER"]);
	//
	// 			expect(JSON.stringify(value)).to.equal(inp);
	// 		});
	//
	// 	it.skip("should handle nested queries", function () {
	// 		let inp;
	// 		inp = '{"WHERE":{"AND":[{"IS":{"sections_dept":"ma*"}}]},"OPTIONS"' +
	// 				':{"COLUMNS":["sections_dept","sections_id","sections_avg"],"ORDER":"sections_avg"}}';
	// 		const value = performQueryHelper.modelQuery(inp, ["sections"]);
	//
	// 			// reformats the input
	// 		inp = JSON.stringify(JSON.parse(inp));
	//
	// 		console.log(value);
	// 		console.log(value["WHERE"]["FILTER"]);
	// 		console.log(value["WHERE"]["FILTER"]?.LOGICCOMPARISON);
	//
	// 		expect(JSON.stringify(value)).to.equal(inp);
	// 	});
	//
	// 	it.skip("should handle nested queries with GT LT", function () {
	// 		let inp;
	// 		inp = "{\n" +
	// 			'\t\t"WHERE": {\n' +
	// 			'\t\t\t"AND": [\n' +
	// 			"\t\t\t\t{\n" +
	// 			'\t\t\t\t\t"GT": {\n' +
	// 			'\t\t\t\t\t\t"sections_avg": 90\n' +
	// 			"\t\t\t\t\t}\n" +
	// 			"\t\t\t\t},\n" +
	// 			"\t\t\t\t{\n" +
	// 			'\t\t\t\t\t"LT": {\n' +
	// 			'\t\t\t\t\t\t"sections_avg": 91\n' +
	// 			"\t\t\t\t\t}\n" +
	// 			"\t\t\t\t}\n" +
	// 			"\t\t\t]\n" +
	// 			"\t\t},\n" +
	// 			'\t\t"OPTIONS": {\n' +
	// 			'\t\t\t"COLUMNS": [\n' +
	// 			'\t\t\t\t"sections_dept",\n' +
	// 			'\t\t\t\t"sections_id",\n' +
	// 			'\t\t\t\t"sections_avg"\n' +
	// 			"\t\t\t],\n" +
	// 			'\t\t\t"ORDER": "sections_avg"\n' +
	// 			"\t\t}\n" +
	// 			"\t}";
	// 		const value = performQueryHelper.modelQuery(inp, ["sections", "ubc"]);
	//
	// 		// reformats the input
	// 		inp = JSON.stringify(JSON.parse(inp));
	//
	// 		// console.log(value);
	// 		// console.log(value["WHERE"]["FILTER"]);
	// 		console.log(value["WHERE"]["FILTER"]?.LOGICCOMPARISON?.FILTER_LIST);
	//
	// 		expect(JSON.stringify(value)).to.equal(inp);
	// 	});
	//
	// 	it.skip("should handle nested queries with NOT", function () {
	// 		let inp;
	// 		inp = '{"WHERE":{"NOT":{"GT":{"sections_avg":1}}},"OPTIONS":{"COLUMNS":["sections_dept","sections_avg"],' +
	// 			'"ORDER":"sections_avg"}}';
	// 		const value = performQueryHelper.modelQuery(inp, ["sections"]);
	//
	// 		// reformats the input
	// 		inp = JSON.stringify(JSON.parse(inp));
	//
	// 		console.log(value);
	// 		console.log(value["WHERE"]["FILTER"]);
	// 		console.log(value["WHERE"]["FILTER"]?.LOGICCOMPARISON);
	//
	// 		expect(JSON.stringify(value)).to.equal(inp);
	// 	});
	//
	// });
});
