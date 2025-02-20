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
const InsightFacade_1 = __importDefault(require("../../src/controller/InsightFacade"));
const TestUtil_1 = require("../resources/archives/TestUtil");
const IInsightFacade_1 = require("../../src/controller/IInsightFacade");
const chai_1 = __importStar(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const folder_test_1 = require("@ubccpsc310/folder-test");
chai_1.default.use(chai_as_promised_1.default);
describe("Test Suite", function () {
    describe("Crash Test", function () {
        let onlyCS;
        let facade;
        let facade2;
        let campus;
        let campusMissing;
        before(function () {
            onlyCS = (0, TestUtil_1.getContentFromArchives)("onlyCS.zip");
            campus = (0, TestUtil_1.getContentFromArchives)("campus.zip");
            campusMissing = (0, TestUtil_1.getContentFromArchives)("campus-incomplete.zip");
        });
        beforeEach(function () {
            (0, TestUtil_1.clearDisk)();
            facade = new InsightFacade_1.default();
        });
        it("should handle crashes (sections)", async function () {
            const result = await facade.addDataset("ubc", onlyCS, IInsightFacade_1.InsightDatasetKind.Sections);
            const list1 = await facade.listDatasets();
            facade2 = new InsightFacade_1.default();
            const list2 = await facade2.listDatasets();
            (0, chai_1.expect)(list1).to.have.deep.equals(list2);
        });
        it("should handle crashes (rooms)", async function () {
            const result = await facade.addDataset("ubc", campusMissing, IInsightFacade_1.InsightDatasetKind.Rooms);
            const list1 = await facade.listDatasets();
            facade2 = new InsightFacade_1.default();
            const list2 = await facade2.listDatasets();
            (0, chai_1.expect)(list1).to.have.deep.equals(list2);
        });
    });
    describe("addDataset", function () {
        let sections;
        let sections2;
        let sections3;
        let sections4;
        let onlyCS;
        let campus;
        let campusMissing;
        let campusNoRooms;
        let campusNoIndexTable;
        let facade;
        before(function () {
            sections = (0, TestUtil_1.getContentFromArchives)("pair.zip");
            sections2 = (0, TestUtil_1.getContentFromArchives)("Courses2.zip");
            sections3 = (0, TestUtil_1.getContentFromArchives)("Courses3.zip");
            sections4 = (0, TestUtil_1.getContentFromArchives)("Courses4.zip");
            onlyCS = (0, TestUtil_1.getContentFromArchives)("onlyCS.zip");
            campus = (0, TestUtil_1.getContentFromArchives)("campus.zip");
            campusMissing = (0, TestUtil_1.getContentFromArchives)("campus-incomplete.zip");
            campusNoRooms = (0, TestUtil_1.getContentFromArchives)("campus-noRooms.zip");
            campusNoIndexTable = (0, TestUtil_1.getContentFromArchives)("campus-no-index-table.zip");
        });
        beforeEach(function () {
            (0, TestUtil_1.clearDisk)();
            facade = new InsightFacade_1.default();
        });
        it("(addDataset) should successfully add one sections dataset", async function () {
            const result = await facade.addDataset("ubc", onlyCS, IInsightFacade_1.InsightDatasetKind.Sections);
            (0, chai_1.expect)(result).to.have.deep.members(["ubc"]);
        });
        it("(addDataset) should successfully add one rooms dataset", async function () {
            this.timeout(3000);
            const result = await facade.addDataset("ubc", campus, IInsightFacade_1.InsightDatasetKind.Rooms);
            (0, chai_1.expect)(result).to.have.deep.members(["ubc"]);
        });
        it("(addDataset) should successfully add rooms dataset with missing files", async function () {
            const result = await facade.addDataset("ubc", campusMissing, IInsightFacade_1.InsightDatasetKind.Rooms);
            (0, chai_1.expect)(result).to.have.deep.members(["ubc"]);
        });
        it("(addDataset) should fail to add rooms dataset with no valid rooms", async function () {
            const result = facade.addDataset("ubc", campusNoRooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("(addDataset) should successfully add two rooms datasets", async function () {
            this.timeout(5000);
            await facade.addDataset("ubc", campus, IInsightFacade_1.InsightDatasetKind.Rooms);
            const result = await facade.addDataset("ubc2", campusMissing, IInsightFacade_1.InsightDatasetKind.Rooms);
            (0, chai_1.expect)(result).to.have.deep.members(["ubc", "ubc2"]);
        });
        it("(addDataset) should fail with no buildings table in index.htm", async function () {
            const result = facade.addDataset("ubc", campusNoIndexTable, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("(addDataset) should successfully add two datasets", async function () {
            await facade.addDataset("ubc", onlyCS, IInsightFacade_1.InsightDatasetKind.Sections);
            const result = await facade.addDataset("ubc2", onlyCS, IInsightFacade_1.InsightDatasetKind.Sections);
            (0, chai_1.expect)(result).to.have.deep.members(["ubc", "ubc2"]);
        });
        it("(addDataset) should reject with an empty dataset id", async function () {
            const result = facade.addDataset("", onlyCS, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("(addDataset) should reject with an invalid dataset id (rooms)", async function () {
            const result = facade.addDataset("", campus, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("(addDataset) should reject with a whitespace dataset id", async function () {
            const result = facade.addDataset(" ", onlyCS, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("(addDataset) should reject with an UNDERSCORE dataset id", async function () {
            const result = facade.addDataset("_UBC", onlyCS, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("(addDataset) should fail to add a second dataset", async function () {
            await facade.addDataset("ubc", onlyCS, IInsightFacade_1.InsightDatasetKind.Sections);
            const result = facade.addDataset("ubc", onlyCS, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("(addDataset) Should reject invalid zip", async function () {
            const result = facade.addDataset("ubc", "sections", IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("(addDataset) Given an invalid (empty) zip", async function () {
            const result = facade.addDataset("ubc", sections2, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("(addDataset) Given an invalid json file", async function () {
            const result = facade.addDataset("ubc", sections3, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("(addDataset) Given an invalid dir name", async function () {
            const result = facade.addDataset("ubc", sections4, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
    });
    describe("removeDataset", function () {
        let onlyCS;
        let campusMissing;
        let facade;
        before(function () {
            onlyCS = (0, TestUtil_1.getContentFromArchives)("onlyCS.zip");
            campusMissing = (0, TestUtil_1.getContentFromArchives)("campus-incomplete.zip");
        });
        beforeEach(async function () {
            (0, TestUtil_1.clearDisk)();
            facade = new InsightFacade_1.default();
            await facade.addDataset("ubc", onlyCS, IInsightFacade_1.InsightDatasetKind.Sections);
        });
        it("(removeDataset) should successfully remove a dataset", async function () {
            const result = await facade.removeDataset("ubc");
            (0, chai_1.expect)(result).to.equal("ubc");
        });
        it("(removeDataset) should reject an underscore id", async function () {
            const result = facade.removeDataset("ubc_");
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("(removeDataset) should reject a whitespace id", async function () {
            const result = facade.removeDataset("  ");
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("(removeDataset) should reject an empty string id", async function () {
            const result = facade.removeDataset("");
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("(removeDataset) should reject the id with not found", async function () {
            const result = facade.removeDataset("doesNotExist");
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.NotFoundError);
        });
        it("(removeDataset) should successfully remove the first dataset and fail the second", async function () {
            await facade.removeDataset("ubc");
            const result = facade.removeDataset("ubc");
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.NotFoundError);
        });
    });
    describe("listDataset", function () {
        let onlyCS;
        let facade;
        let campus;
        let campusMissing;
        before(function () {
            onlyCS = (0, TestUtil_1.getContentFromArchives)("onlyCS.zip");
            campus = (0, TestUtil_1.getContentFromArchives)("campus.zip");
            campusMissing = (0, TestUtil_1.getContentFromArchives)("campus-incomplete.zip");
        });
        beforeEach(function () {
            (0, TestUtil_1.clearDisk)();
            facade = new InsightFacade_1.default();
        });
        it("(listDatasets) should list the dataset successfully", async function () {
            await facade.addDataset("ubc", onlyCS, IInsightFacade_1.InsightDatasetKind.Sections);
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result).to.have.deep.members([{
                    id: "ubc",
                    kind: IInsightFacade_1.InsightDatasetKind.Sections,
                    numRows: 1111
                }]);
        });
        it("(listDatasets) should list campus after remove", async function () {
            await facade.addDataset("ubc", campus, IInsightFacade_1.InsightDatasetKind.Rooms);
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result).to.have.deep.members([
                {
                    id: "ubc",
                    kind: IInsightFacade_1.InsightDatasetKind.Rooms,
                    numRows: 364
                }
            ]);
        });
        it("(listDatasets) should list the rooms dataset successfully", async function () {
            await facade.addDataset("ubc", campusMissing, IInsightFacade_1.InsightDatasetKind.Rooms);
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result).to.have.deep.members([
                {
                    id: "ubc",
                    kind: IInsightFacade_1.InsightDatasetKind.Rooms,
                    numRows: 152
                }
            ]);
        });
        it("(listDatasets) should list the rooms and sections datasets successfully", async function () {
            await facade.addDataset("ubcSections", onlyCS, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.addDataset("ubcRooms", campusMissing, IInsightFacade_1.InsightDatasetKind.Rooms);
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result).to.have.deep.members([
                {
                    id: "ubcRooms",
                    kind: IInsightFacade_1.InsightDatasetKind.Rooms,
                    numRows: 152
                },
                {
                    id: "ubcSections",
                    kind: IInsightFacade_1.InsightDatasetKind.Sections,
                    numRows: 1111
                }
            ]);
        });
        it("(listDatasets) should list nothing after remove rooms", async function () {
            await facade.addDataset("ubc", campusMissing, IInsightFacade_1.InsightDatasetKind.Rooms);
            await facade.removeDataset("ubc");
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result).to.have.deep.members([]);
        });
        it("(listDatasets) first should successfully remove a dataset and list nothing", async function () {
            await facade.addDataset("ubc", onlyCS, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.removeDataset("ubc");
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result).to.have.deep.members([]);
        });
        it("(listDatasets) should list both datasets", async function () {
            await facade.addDataset("ubc", onlyCS, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.addDataset("cube", onlyCS, IInsightFacade_1.InsightDatasetKind.Sections);
            const result = await facade.listDatasets();
            (0, chai_1.expect)(result).to.have.deep.members([
                {
                    id: "ubc",
                    kind: IInsightFacade_1.InsightDatasetKind.Sections,
                    numRows: 1111
                },
                {
                    id: "cube",
                    kind: IInsightFacade_1.InsightDatasetKind.Sections,
                    numRows: 1111
                },
            ]);
        });
    });
    describe("performQuery", function () {
        this.timeout(45000);
        let sections;
        let rooms;
        let facade;
        before(async function () {
            (0, TestUtil_1.clearDisk)();
            facade = new InsightFacade_1.default();
            sections = (0, TestUtil_1.getContentFromArchives)("pair.zip");
            rooms = (0, TestUtil_1.getContentFromArchives)("campus.zip");
            await facade.addDataset("sections", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
        });
        after(async function () {
            let listOfAll = await facade.listDatasets();
            let listIDs = [];
            for (let dataset of listOfAll) {
                listIDs.push(dataset.id);
            }
            let promises = listIDs.map(async (id) => {
                facade.removeDataset(id);
            });
            let result = await Promise.all(promises);
            (0, TestUtil_1.clearDisk)();
        });
        function errorValidator(error) {
            return error === "InsightError" || error === "ResultTooLargeError";
        }
        function assertOnError(actual, expected) {
            if (expected === "InsightError") {
                (0, chai_1.expect)(actual).to.be.an.instanceof(IInsightFacade_1.InsightError);
            }
            else if (expected === "ResultTooLargeError") {
                (0, chai_1.expect)(actual).to.be.an.instanceof(IInsightFacade_1.ResultTooLargeError);
            }
            else {
                chai_1.expect.fail("UNEXPECTED ERROR");
            }
        }
        function assertOnResult(actual, expected) {
            (0, chai_1.expect)(actual).to.have.deep.members(expected);
        }
        function target(input) {
            return facade.performQuery(input);
        }
        (0, folder_test_1.folderTest)("performQuery", target, "./test/resources/json", {
            errorValidator,
            assertOnError,
            assertOnResult
        });
    });
});
//# sourceMappingURL=InsightFacade.spec.js.map