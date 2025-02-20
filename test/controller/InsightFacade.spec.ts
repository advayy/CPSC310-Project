import InsightFacade from "../../src/controller/InsightFacade";
import {clearDisk, getContentFromArchives} from "../resources/archives/TestUtil";
import {
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError
} from "../../src/controller/IInsightFacade";
import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
import {folderTest} from "@ubccpsc310/folder-test";

chai.use(chaiAsPromised);


describe("Test Suite", function () {

	describe("Crash Test", function () {
		let onlyCS: string;
		let facade: InsightFacade;
		let facade2: InsightFacade;
		let campus: string; // rooms dataset
		let campusMissing: string; // rooms dataset with missing files

		before(function() {
			onlyCS = getContentFromArchives("onlyCS.zip");
			campus = getContentFromArchives("campus.zip"); // rooms dataset
			campusMissing = getContentFromArchives("campus-incomplete.zip"); // rooms dataset with missing files

		});

		beforeEach(function() {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should handle crashes (sections)", async function() {
			const result = await facade.addDataset("ubc", onlyCS, InsightDatasetKind.Sections);
			const list1 = await facade.listDatasets();
			facade2 = new InsightFacade();
			const list2 = await facade2.listDatasets();
			expect(list1).to.have.deep.equals(list2);
		});


		it("should handle crashes (rooms)", async function() {
			const result = await facade.addDataset("ubc", campusMissing, InsightDatasetKind.Rooms);
			const list1 = await facade.listDatasets();
			facade2 = new InsightFacade();
			const list2 = await facade2.listDatasets();
			expect(list1).to.have.deep.equals(list2);
		});
	});

	describe("addDataset", function () {
		let sections: string;
		let sections2: string; // for empty zip
		let sections3: string; // for messed up json
		let sections4: string; // for invalid dir
		let onlyCS: string; // smaller dataset
		let campus: string; // rooms dataset
		let campusMissing: string; // rooms dataset with missing files
		let campusNoRooms: string; // rooms dataset with no valid rooms
		let campusNoIndexTable: string; // rooms dataset with no index.htm
		let facade: InsightFacade;

		before(function() {
			sections = getContentFromArchives("pair.zip");
			sections2 = getContentFromArchives("Courses2.zip");
			sections3 = getContentFromArchives("Courses3.zip");
			sections4 = getContentFromArchives("Courses4.zip");
			onlyCS = getContentFromArchives("onlyCS.zip");
			campus = getContentFromArchives("campus.zip"); // rooms dataset
			campusMissing = getContentFromArchives("campus-incomplete.zip"); // rooms dataset with missing files
			campusNoRooms = getContentFromArchives("campus-noRooms.zip"); // rooms dataset with no valid rooms
			campusNoIndexTable = getContentFromArchives("campus-no-index-table.zip"); // rooms dataset with no index.htm
		});

		beforeEach(function() {
			clearDisk();
			facade = new InsightFacade();
		});


		it ("(addDataset) should successfully add one sections dataset", async function() {
			const result = await facade.addDataset("ubc", onlyCS, InsightDatasetKind.Sections);
			expect(result).to.have.deep.members(["ubc"]);
		});

		it ("(addDataset) should successfully add one rooms dataset", async function() {
			this.timeout(3000);
			const result = await facade.addDataset("ubc", campus, InsightDatasetKind.Rooms);
			expect(result).to.have.deep.members(["ubc"]);
		});

		it ("(addDataset) should successfully add rooms dataset with missing files", async function() {
			const result = await facade.addDataset("ubc", campusMissing, InsightDatasetKind.Rooms);
			expect(result).to.have.deep.members(["ubc"]);
		});


		it ("(addDataset) should fail to add rooms dataset with no valid rooms", async function() {
			const result = facade.addDataset("ubc", campusNoRooms, InsightDatasetKind.Rooms);
			// expect(result).to.have.deep.members(["ubc"]);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("(addDataset) should successfully add two rooms datasets", async function() {
			this.timeout(5000);
			await facade.addDataset("ubc", campus, InsightDatasetKind.Rooms);
			const result = await facade.addDataset("ubc2", campusMissing, InsightDatasetKind.Rooms);
			expect(result).to.have.deep.members(["ubc", "ubc2"]);
		});

		it ("(addDataset) should fail with no buildings table in index.htm", async function() {
			const result = facade.addDataset("ubc", campusNoIndexTable, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("(addDataset) should successfully add two datasets", async function() {
			await facade.addDataset("ubc", onlyCS, InsightDatasetKind.Sections);
			const result = await facade.addDataset("ubc2", onlyCS, InsightDatasetKind.Sections);
			expect(result).to.have.deep.members(["ubc", "ubc2"]);
		});

		// got rid of the await and it worked? FLAG - I put back thr awaits waitingf TA approval
		it ("(addDataset) should reject with an empty dataset id",  async function() {
			const result = facade.addDataset("", onlyCS, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("(addDataset) should reject with an invalid dataset id (rooms)",  async function() {
			const result = facade.addDataset("", campus, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("(addDataset) should reject with a whitespace dataset id",  async function() {
			const result = facade.addDataset(" ", onlyCS, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("(addDataset) should reject with an UNDERSCORE dataset id",  async function() {
			const result = facade.addDataset("_UBC", onlyCS, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("(addDataset) should fail to add a second dataset", async function() {
			await facade.addDataset("ubc", onlyCS, InsightDatasetKind.Sections);
			const result = facade.addDataset("ubc", onlyCS, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		// flag
		// no return, no eventually
		it ("(addDataset) Should reject invalid zip", async function() {
			const result = facade.addDataset("ubc", "sections", InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("(addDataset) Given an invalid (empty) zip", async function() {
			const result = facade.addDataset("ubc", sections2, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("(addDataset) Given an invalid json file", async function () {
			const result = facade.addDataset("ubc", sections3, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("(addDataset) Given an invalid dir name", async function () {
			const result = facade.addDataset("ubc", sections4, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
	}); // End addDataset

	describe("removeDataset", function () {
		let onlyCS: string;
		let campusMissing: string; // rooms dataset with missing files
		let facade: InsightFacade;

		before(function() {
			onlyCS = getContentFromArchives("onlyCS.zip");
			campusMissing = getContentFromArchives("campus-incomplete.zip"); // rooms dataset with missing files
		});

		beforeEach(async function() {
			clearDisk();
			facade = new InsightFacade();
			await facade.addDataset("ubc", onlyCS, InsightDatasetKind.Sections);
		});


		// could have been the curlys
		it ("(removeDataset) should successfully remove a dataset", async function() {
			const result = await facade.removeDataset("ubc");
			expect(result).to.equal("ubc");
		});

		it("(removeDataset) should reject an underscore id", async function () {
			const result = facade.removeDataset("ubc_");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("(removeDataset) should reject a whitespace id",  async function () {
			const result = facade.removeDataset("  ");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("(removeDataset) should reject an empty string id",  async function () {
			const result = facade.removeDataset("");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("(removeDataset) should reject the id with not found",  async function () {
			const result = facade.removeDataset("doesNotExist");
			return expect(result).to.eventually.be.rejectedWith(NotFoundError);
		});

		// flag - changed to sections
		it ("(removeDataset) should successfully remove the first dataset and fail the second", async function() {
			await facade.removeDataset("ubc");
			const result = facade.removeDataset("ubc");
			return expect(result).to.eventually.be.rejectedWith(NotFoundError);
		});
	}); // End removeDataset

	describe("listDataset", function () {
		let onlyCS: string;
		let facade: InsightFacade;
		let campus: string;
		let campusMissing: string; // rooms dataset with missing files

		before(function() {
			onlyCS = getContentFromArchives("onlyCS.zip");
			campus = getContentFromArchives("campus.zip"); // rooms dataset
			campusMissing = getContentFromArchives("campus-incomplete.zip"); // rooms dataset with missing files
		});

		beforeEach(function() {
			clearDisk();
			facade = new InsightFacade();
		});

		it("(listDatasets) should list the dataset successfully",  async function () {
			await facade.addDataset("ubc", onlyCS, InsightDatasetKind.Sections);
			const result = await facade.listDatasets();

			expect(result).to.have.deep.members(
				[{
					id: "ubc",
					kind: InsightDatasetKind.Sections,
					numRows: 1111
				}]);
		});

		it ("(listDatasets) should list campus after remove", async function() {
			await facade.addDataset("ubc", campus, InsightDatasetKind.Rooms);
			const result = await facade.listDatasets();
			expect(result).to.have.deep.members(
				[
					{
						id: "ubc",
						kind: InsightDatasetKind.Rooms,
						numRows: 364
					}
				]
			);
		});

		// list rooms dataset
		it("(listDatasets) should list the rooms dataset successfully",  async function () {
			await facade.addDataset("ubc", campusMissing, InsightDatasetKind.Rooms);
			const result = await facade.listDatasets();
			expect(result).to.have.deep.members(
				[
					{
						id: "ubc",
						kind: InsightDatasetKind.Rooms,
						numRows: 152
					}
				]
			);
		});

		// list a sections and a rooms dataset
		it("(listDatasets) should list the rooms and sections datasets successfully",  async function () {
			await facade.addDataset("ubcSections", onlyCS, InsightDatasetKind.Sections);
			await facade.addDataset("ubcRooms", campusMissing, InsightDatasetKind.Rooms);
			const result = await facade.listDatasets();
			expect(result).to.have.deep.members(
				[
					{
						id: "ubcRooms",
						kind: InsightDatasetKind.Rooms,
						numRows: 152
					}
					,

					{
						id: "ubcSections",
						kind: InsightDatasetKind.Sections,
						numRows: 1111
					}
				]
			);
		});

		it ("(listDatasets) should list nothing after remove rooms",  async function () {
			await facade.addDataset("ubc", campusMissing, InsightDatasetKind.Rooms);
			await facade.removeDataset("ubc"); // not working yet
			const result = await facade.listDatasets();
			expect(result).to.have.deep.members([]);
		});

		// remove the first thing
		it ("(listDatasets) first should successfully remove a dataset and list nothing", async function() {
			await facade.addDataset("ubc", onlyCS, InsightDatasetKind.Sections);
			await facade.removeDataset("ubc");
			const result = await facade.listDatasets();
			expect(result).to.have.deep.members([]);
		});


		it("(listDatasets) should list both datasets",  async function () {
			await facade.addDataset("ubc", onlyCS, InsightDatasetKind.Sections);
			await facade.addDataset("cube", onlyCS, InsightDatasetKind.Sections);
			const result = await facade.listDatasets();
			expect(result).to.have.deep.members([
				{
					id: "ubc",
					kind: InsightDatasetKind.Sections,
					numRows: 1111
				},
				{
					id: "cube",
					kind: InsightDatasetKind.Sections,
					numRows: 1111
				},
			]);
		});
	}); // End listDataset

	describe("performQuery", function() {
		this.timeout(45000);
		let sections: string;
		let rooms: string;
		let facade: InsightFacade;
		type Input = unknown;
		type Output = InsightResult[];
		type Error = "InsightError" | "ResultTooLargeError";

		before(async function() {
			clearDisk();
			facade = new InsightFacade();
			sections = getContentFromArchives("pair.zip");
			rooms = getContentFromArchives("campus.zip");
			await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
			await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
		});

		after( async function() {
			let listOfAll = await facade.listDatasets();
			let listIDs = [];

			for (let dataset of listOfAll) {
				listIDs.push(dataset.id);
			}

			let promises = listIDs.map(async (id) => {
				facade.removeDataset(id);
			});
			let result = await Promise.all(promises);
			clearDisk();
		});

		// Section adapted from
		// https://github.com/kekerr/AdditionCalculator/blob/master/test/AdditionCalculator.spec.ts#L150C5-L159C6
		function errorValidator(error: any): error is Error {
			return error === "InsightError" || error === "ResultTooLargeError";
		}

		function assertOnError(actual: unknown, expected: Error): void {
			if (expected === "InsightError") {
				expect(actual).to.be.an.instanceof(InsightError);
			} else if (expected === "ResultTooLargeError") {
				expect(actual).to.be.an.instanceof(ResultTooLargeError);
			} else {
				// this should be unreachable
				expect.fail("UNEXPECTED ERROR");
			}
		}

		function assertOnResult(actual: unknown, expected: Output): void {
			expect(actual).to.have.deep.members(expected);
		}

		function target(input: Input): Promise<Output> {
			return facade.performQuery(input);
		}

		folderTest<Input, Output, Error>(
			"performQuery",
			target,
			"./test/resources/json",
			{
				errorValidator, // ?
				assertOnError,
				assertOnResult
			}
		);
	});
});
