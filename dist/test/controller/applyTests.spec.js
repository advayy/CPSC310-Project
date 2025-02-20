"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const TestUtil_1 = require("../resources/archives/TestUtil");
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
chai_1.default.use(chai_as_promised_1.default);
const transformationHelper_1 = __importDefault(require("../../src/controller/transformationHelper"));
describe("MISC Helpers tests - APPLY Handler", function () {
    describe("APPLY TESTS", function () {
        let helper;
        beforeEach(function () {
            (0, TestUtil_1.clearDisk)();
            helper = new transformationHelper_1.default();
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
//# sourceMappingURL=applyTests.spec.js.map