import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";

import {expect} from "chai";
import request, {Response} from "supertest";
import {InsightDatasetKind} from "../../src/controller/IInsightFacade";
import {getContentFromArchives} from "../resources/archives/TestUtil";
import fs from "fs";

describe("Facade D3", function () {
	let server: Server;

	before(function () {
		server = new Server(4321);
		server.start();
		// TODO: start server here once and handle errors properly
	});

	after(async function () {
		// TODO: stop server here once!
		await server.stop();
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	// Sample on how to format PUT requests

	it("PUT test for courses dataset - AddDatasets", function () {
		let data = fs.readFileSync("test/resources/archives/pair.zip");
		const payload = Buffer.from(data);

		try {
			return request("http://localhost:4321")
				.put("/dataset/sections/sections")
				.send(payload)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					console.log("added");
					// console.log(res.body);
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.log(err);
		}
	});

	it("GET test for datasets - ListDatasets", async function () {
		try {
			return request("http://localhost:4321")
				.get("/datasets")
				.then(function (res: Response) {
					// some logging here please!
					console.log("listing");
					// console.log(res.body);
					expect(res.status).to.be.equal(200);
				}).catch(function (err) {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.error(err);
			expect.fail();
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

		// Perform the query
		try {
			return request("http://localhost:4321")
				.post("/query")
				.send(query)
				.then(function (res: Response) {
					// some logging here please!
					console.log("Queried");
					// console.log(res.body);
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.error(err);
			expect.fail();
		}
	});

	it("should remove datasets", () => {
		try {
			return request("http://localhost:4321")
				.delete("/dataset/sections")
				.then(function (res: Response) {
					// some logging here please!
					console.log("removed");
					// console.log(res.body);
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			console.log(err);
		}
	});


	// The other endpoints work similarly. You should be able to find all instructions at the supertest documentation
});
