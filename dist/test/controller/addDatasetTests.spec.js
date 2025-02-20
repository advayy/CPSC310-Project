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
const databaseModel_1 = require("../../src/controller/databaseModel");
const TestUtil_1 = require("../resources/archives/TestUtil");
const IInsightFacade_1 = require("../../src/controller/IInsightFacade");
const chai_1 = __importStar(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
chai_1.default.use(chai_as_promised_1.default);
describe("Add Dataset Test Suite", function () {
    describe("validDatasetID", function () {
        let facade;
        let helper;
        before(function () {
            facade = new InsightFacade_1.default();
            helper = new databaseModel_1.DatabaseModel();
        });
        it("(validDatasetID) should return false with an empty dataset id", function () {
            const result = helper.validDatasetID("");
            return (0, chai_1.expect)(result).to.equal(false);
        });
        it("(validDatasetID) should reject with a whitespace dataset id", function () {
            const result = helper.validDatasetID(" ");
            return (0, chai_1.expect)(result).to.equal(false);
        });
        it("(validDatasetID) should reject with an underscore dataset id", function () {
            const result = helper.validDatasetID("ubc_courses");
            return (0, chai_1.expect)(result).to.equal(false);
        });
    });
    describe("validContent", function () {
        let facade;
        let helper;
        before(function () {
            facade = new InsightFacade_1.default();
            helper = new databaseModel_1.DatabaseModel();
        });
        it("(validContent) should return false with an empty content", function () {
            const result = helper.validContent("", IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.equal(false);
        });
    });
    describe("extractAndParseZip", function () {
        let onlyCS;
        let helper;
        before(function () {
            helper = new databaseModel_1.DatabaseModel();
        });
        it("(extractAndParseZip) should successfully extract and parse onlyCS", async function () {
            onlyCS = (0, TestUtil_1.getContentFromArchives)("onlyCS.zip");
            const courseData = await helper.extractAndParseZip(onlyCS);
            (0, chai_1.expect)(courseData).to.be.an("array");
            (0, chai_1.expect)(courseData).to.have.length.above(0);
            const firstCourse = courseData[0];
            (0, chai_1.expect)(firstCourse).to.have.property("id");
            (0, chai_1.expect)(firstCourse).to.have.property("avg");
            (0, chai_1.expect)(firstCourse).to.have.property("instructor");
        });
    });
    describe("saveToDisk", function () {
        let onlyCS;
        let id2;
        let helper;
        before(function () {
            helper = new databaseModel_1.DatabaseModel();
        });
        it("(saveToDisk) should successfully save onlyCS to disk", async function () {
            onlyCS = (0, TestUtil_1.getContentFromArchives)("onlyCS.zip");
            const courseData = await helper.extractAndParseZip(onlyCS);
            helper.saveToDisk("onlyCS", courseData, IInsightFacade_1.InsightDatasetKind.Sections);
        });
    });
});
//# sourceMappingURL=addDatasetTests.spec.js.map