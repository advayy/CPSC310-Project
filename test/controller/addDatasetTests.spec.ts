import InsightFacade from "../../src/controller/InsightFacade";
import {DatabaseModel} from "../../src/controller/databaseModel";
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

describe("Add Dataset Test Suite", function () {
	describe("validDatasetID", function () {
		let facade: InsightFacade;
		let helper: DatabaseModel;
		before(function() {
			facade = new InsightFacade();
			helper = new DatabaseModel();
		});
		it ("(validDatasetID) should return false with an empty dataset id",  function() {
			const result = helper.validDatasetID("");
			return expect(result).to.equal(false);
			// return expect(result).to.eventually.be.rejectedWith(Error);
		});
		it ("(validDatasetID) should reject with a whitespace dataset id",  function() {
			const result = helper.validDatasetID(" ");
			return expect(result).to.equal(false);
		});
		// it ("(validDatasetID) should reject with a null dataset id",  function() {
		// 	const result = facade.validDatasetID(null);
		// 	return expect(result).to.eventually.be.rejectedWith(InsightError);
		// });
		// it ("(validDatasetID) should reject with an undefined dataset id",  function() {
		// 	const result = facade.validDatasetID(undefined);
		// 	return expect(result).to.eventually.be.rejectedWith(InsightError);
		// });
		it ("(validDatasetID) should reject with an underscore dataset id",  function() {
			const result = helper.validDatasetID("ubc_courses");
			return expect(result).to.equal(false);
		});
	});
	describe("validContent", function () {
		let facade: InsightFacade;
		let helper: DatabaseModel;
		before(function() {
			facade = new InsightFacade();
			helper = new DatabaseModel();
		});
		it ("(validContent) should return false with an empty content",  function() {
			const result = helper.validContent("", InsightDatasetKind.Sections);
			return expect(result).to.equal(false);
		});
		// it ("(validContent) should return false with not a zip",  function() {
		// 	const result = facade.validContent("not a zip", InsightDatasetKind.Sections);
		// 	return expect(result).to.equal(false);
		// });
	});
	describe("extractAndParseZip", function () {
		let onlyCS: string; // smaller dataset
		// let facade: InsightFacade;
		let helper: DatabaseModel;
		before(function() {
			// facade = new InsightFacade();
			helper = new DatabaseModel();
		});
		it ("(extractAndParseZip) should successfully extract and parse onlyCS",  async function() {
			// Replace 'valid-zip-file.zip' with the path to your valid test zip file
			onlyCS = getContentFromArchives("onlyCS.zip");
			// Call the extractAndParseZip function

			const courseData = await helper.extractAndParseZip(onlyCS);
			// Assert that courseData is an array of CourseData objects
			expect(courseData).to.be.an("array");
			expect(courseData).to.have.length.above(0);

			// Optionally, you can perform more specific assertions on the courseData
			// For example, you can check if the properties of the first course object are as expected
			const firstCourse = courseData[0];
			expect(firstCourse).to.have.property("id");
			expect(firstCourse).to.have.property("avg");
			expect(firstCourse).to.have.property("instructor");
		});
	});
	describe("saveToDisk", function () {
		let onlyCS: string;
		let id2: string;
		let helper: DatabaseModel;
		before(function() {
			helper = new DatabaseModel();
		});
		it ("(saveToDisk) should successfully save onlyCS to disk", async function() {
			onlyCS = getContentFromArchives("onlyCS.zip");
			const courseData = await helper.extractAndParseZip(onlyCS);
			// console.log("first save courseData:", courseData);
			helper.saveToDisk("onlyCS", courseData, InsightDatasetKind.Sections);
		});
	});
});
