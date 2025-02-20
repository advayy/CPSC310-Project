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
import TransformationHelper from "../../src/controller/transformationHelper";

describe("MISC Helpers tests - APPLY Handler", function () {
	describe("APPLY TESTS", function () {
		let helper: TransformationHelper;
		beforeEach(function() {
			clearDisk();
			helper = new TransformationHelper();
		});

		it("Should handle an apply", function () {
			helper.handleApply([[]], [
				{
					APPLYKEY: "maximum",
					TOKEN: "MAX",
					KEY: "sections_avg"
				}
			]);
		});

	});
});
