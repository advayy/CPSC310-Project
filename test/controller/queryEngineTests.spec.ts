import PerformQueryHelpers from "../../src/controller/performQueryHelpers";
import {clearDisk, getContentFromArchives} from "../resources/archives/TestUtil";
import {
	InsightDatasetKind,
	InsightError
} from "../../src/controller/IInsightFacade";
import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import {QueryOptions, QueryModel, Filter} from "../../src/models/queryModel";
import QueryEngine from "../../src/controller/queryEngine";
import {CourseData} from "../../src/models/courseData";

describe("Query Engine Test Suite", function () {

	describe("Grouping tests", function () {
		let queryEngine: QueryEngine;
		beforeEach(function() {
			clearDisk();
			queryEngine = new QueryEngine();
		});

		it("should handle simple grouping", function () {
			let data: CourseData[];
			let columns: string[];

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

			expect(queryEngine.handleGrouping(data, columns)).to.have.deep.equals([data]);
		});

		it("should handle DOUBLE grouping", function () {
			let data: CourseData[];
			let columns: string[];

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

			let output: CourseData[][] = [
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

			expect(queryEngine.handleGrouping(data, columns)).to.have.deep.equals(output);
		});
	});

	describe("modelQuery tests", function () {

		let performQueryHelper: PerformQueryHelpers;
		let queryEngine: QueryEngine;

		beforeEach(function() {
			clearDisk();
			performQueryHelper = new PerformQueryHelpers();
			queryEngine = new QueryEngine();
		});

		it("should handle simple no where query", function () {
			let json;
			json = '{"WHERE":{}, "OPTIONS":{"COLUMNS": ["sections_dept","sections_avg"], "ORDER": "sections_avg"}}';
			const query =  performQueryHelper.modelQuery(json, ["sections"], ["sections"]);

			queryEngine.queryRunner(query, "ubc", []);

		});


		it.skip("should handle identify IS where query",
			function () {
				let inp;
				inp = '{"WHERE":{"IS":{"sections_dept":"ma*"}},"OPTIONS"' +
					':{"COLUMNS":["sections_dept","sections_id","sections_avg"],"ORDER":"sections_avg"}}';
				const query = performQueryHelper.modelQuery(inp, ["sections"], ["sections"]);
				const filter = query.WHERE.FILTER;
				if(filter) {
					queryEngine.filterHandler(filter, []);
				}
			});

		it.skip("should handle nested queries", function () {
			let inp;
			inp = '{"WHERE":{"AND":[{"IS":{"sections_dept":"ma*"}}]},"OPTIONS"' +
					':{"COLUMNS":["sections_dept","sections_id","sections_avg"],"ORDER":"sections_avg"}}';
			const value = performQueryHelper.modelQuery(inp, ["sections"], ["sections"]);

				// reformats the input
			inp = JSON.stringify(JSON.parse(inp));

			console.log(value);
			console.log(value["WHERE"]["FILTER"]);
			console.log(value["WHERE"]["FILTER"]?.LOGICCOMPARISON);

			expect(JSON.stringify(value)).to.equal(inp);
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

			// reformats the input
			inp = JSON.stringify(JSON.parse(inp));

			console.log(value);
			console.log(value["WHERE"]["FILTER"]);
			console.log(value["WHERE"]["FILTER"]?.LOGICCOMPARISON);

			expect(JSON.stringify(value)).to.equal(inp);
		});

	});
});
