"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Server_1 = __importDefault(require("../../src/rest/Server"));
const chai_1 = require("chai");
const supertest_1 = __importDefault(require("supertest"));
const fs_1 = __importDefault(require("fs"));
describe("Facade D3", function () {
    let server;
    before(function () {
        server = new Server_1.default(4321);
        server.start();
    });
    after(async function () {
        await server.stop();
    });
    beforeEach(function () {
    });
    afterEach(function () {
    });
    it("PUT test for courses dataset - AddDatasets", function () {
        let data = fs_1.default.readFileSync("test/resources/archives/pair.zip");
        const payload = Buffer.from(data);
        try {
            return (0, supertest_1.default)("http://localhost:4321")
                .put("/dataset/sections/sections")
                .send(payload)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res) {
                console.log("added");
                (0, chai_1.expect)(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                console.log(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            console.log(err);
        }
    });
    it("GET test for datasets - ListDatasets", async function () {
        try {
            return (0, supertest_1.default)("http://localhost:4321")
                .get("/datasets")
                .then(function (res) {
                console.log("listing");
                (0, chai_1.expect)(res.status).to.be.equal(200);
            }).catch(function (err) {
                console.log(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            console.error(err);
            chai_1.expect.fail();
        }
    });
    it("POST test for query - PerformQuery", async function () {
        const query = {
            WHERE: {
                GT: {
                    sections_avg: 97
                }
            },
            OPTIONS: {
                COLUMNS: [
                    "sections_dept",
                    "sections_avg"
                ],
                ORDER: "sections_avg"
            }
        };
        try {
            return (0, supertest_1.default)("http://localhost:4321")
                .post("/query")
                .send(query)
                .then(function (res) {
                console.log("Queried");
                (0, chai_1.expect)(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                console.log(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            console.error(err);
            chai_1.expect.fail();
        }
    });
    it("should remove datasets", () => {
        try {
            return (0, supertest_1.default)("http://localhost:4321")
                .delete("/dataset/sections")
                .then(function (res) {
                console.log("removed");
                (0, chai_1.expect)(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                console.log(err);
                chai_1.expect.fail();
            });
        }
        catch (err) {
            console.log(err);
        }
    });
});
//# sourceMappingURL=Server.spec.js.map