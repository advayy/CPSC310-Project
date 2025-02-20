import {InsightError} from "./IInsightFacade";
import JSZip from "jszip";
import * as parse5 from "parse5";
import {CourseData} from "../models/courseData";
import {RoomsData} from "../models/roomsData";
import http from "http";
import {GeoResponse} from "../models/geoResponse";
import {HtmlSearchUtil} from "./htmlSearchUtil";

export class ParseUtil {
	// private buildingData: [] = [];
	private buildingData: {[name: string]: {
		url: string; address: string; fullname: string; shortname: string;}} = {};

	private htmlSearchUtil: HtmlSearchUtil = new HtmlSearchUtil(); // flag

	public async extractZip(zipData: string): Promise<JSZip> {
		const zip = new JSZip();
		const archive = await zip.loadAsync(zipData, {base64: true}); // runs but still looks like base64 input=
		const courses = archive.folder("courses");
		if (!courses) { // FLAG: check if null
			throw new InsightError("Empty zip file or no courses folder");
		}
		return courses;
	}

	public async extractAndParseZip(zipData: string): Promise<CourseData[]> {
		try {
			const courses = await this.extractZip(zipData);
            // create array to store all course data
			let courseData: CourseData[] = [];
            // Iterate through files in courses folder
			const files = courses.file(/.*/);
			if (files.length === 0 || !files) {
				throw new InsightError("No files in courses folder");
			}
			const promises = files.map(async (file) => {
				if (!file.dir) {
					try {
						const fileContent = await file.async("text");
						const parsedContent = JSON.parse(fileContent);
						if (parsedContent.result) {
							const resultData = parsedContent.result.map((resultObj: any) => {
								let year: number;
                                // Check if the "sections" key is set to "overall"
								if (resultObj.Section === "overall") {
                                    // Set the year to 1900
									year = 1900;
								} else {
									year = Number(resultObj.Year);
								}
								return {
									uuid: String(resultObj.id),
									id: String(resultObj.Course),
									title: String(resultObj.Title),
									instructor: String(resultObj.Professor),
									dept: String(resultObj.Subject),
									year: year,
									avg: Number(resultObj.Avg),
									pass: Number(resultObj.Pass),
									fail: Number(resultObj.Fail),
									audit: Number(resultObj.Audit),
								};
							});
							// console.log("resultData:", resultData); // FLAG
							return resultData;
						} else {
							throw new InsightError("No result field");
						}
					} catch {
						throw new InsightError("problem parsing json");
					}
				}
			});
            // try {
			const result = await Promise.all(promises);
			courseData = courseData.concat(...result);
            // } catch {
            // 	throw new InsightError("problem parsing json");
            // }
			return courseData;
		} catch {
			throw new InsightError("problem extracting zip file");
		}
	}

	public async extractRooms(roomsData: string): Promise<JSZip> {
		const zip = new JSZip();
		const archive = await zip.loadAsync(roomsData, {base64: true}); // runs but still looks like base64 input=
        // const campus = archive.folder("campus");
        // if (!campus) { // FLAG: check if null
        // 	throw new InsightError("Empty zip file or no campus folder");
        // }
		return archive;
	}

	public async extractAndParseRooms(zipData: string): Promise<RoomsData[]> {
		try {
			let roomsData: RoomsData[] = [], visitedBuildingNodes = new Set(), visitedRoomsNodes = new Set();
			const zip = await this.extractRooms(zipData);
			// const campus = zip.folder("campus");
			// if (!campus) {
			// 	throw new InsightError("no campus folder");
			// }
			const index = zip.file("index.htm");
			if (!index) {
				throw new InsightError("no index.htm file");
			}
			// const discover = campus.folder("discover");
			// if (!discover) {
			// 	throw new InsightError("no discover folder");
			// }
			// const buildings = discover.folder("buildings-and-classrooms");
			// if (!buildings) {
			// 	throw new InsightError("no buildings-and-classrooms folder");
			// }
			const indexText = await index.async("text");
			const indexDocument = parse5.parse(indexText); // returns structure of index.htm parsed
			const indexRootNode = indexDocument.childNodes.find((node) => node.nodeName === "html");
			// let buildingLinks: string[] = [];
			const validBuildingsTable = this.findValidBuildingsTable(indexRootNode, visitedBuildingNodes);
			if (!validBuildingsTable) {
				throw new InsightError("no valid buildings table");
			}
			// find building links
			this.findBuildingData(validBuildingsTable);
			// find rooms data in each building
			const filePromises = [];
			for (const building in this.buildingData) {
				// Get link from buildingData
				let link = this.buildingData[building].url.replace("./", "");

				// Remove leading ./
				// link = link.replace("./", "");
				if (zip.file(link)) {
					const fileAtLink = zip.file(link);
					if (!fileAtLink) {
						throw new InsightError("problem parsing rooms");
					}
					// Create a promise to parse the file
					filePromises.push(
						(async () => {
							const fileContents = await fileAtLink.async("text");
							if (!fileContents) {
								throw new InsightError("problem parsing rooms");
							}
							const roomRootNode =
								parse5.parse(fileContents).childNodes.find((node) => node.nodeName === "html");
							// Pass parsed file into findValidRoomsTable
							await this.findValidRoomsTable(
								roomRootNode, this.buildingData[building].shortname, roomsData, visitedRoomsNodes);
						})()
					);
				}
			}

// Wait for all promises to complete
			await Promise.all(filePromises);
			if (roomsData.length === 0) {
				console.log("no valid rooms in dataset");
				throw new InsightError("no valid rooms");
			}
			// console.log("roomsData:", roomsData); // FLAG
			return roomsData;
		} catch (error) {
			// console.log(error);
			throw new InsightError("problem parsing rooms");
		}
	}

	public findValidBuildingsTable(node: any, visitedNodes: Set<unknown>): any {
		visitedNodes.add(node);
		if (node.nodeName === "table") {
            // look in table for tbody
			for (const child of node.childNodes) {
				if (child.nodeName === "tbody") {
                    // look in tbody for tr
					for (const child2 of child.childNodes) {
						if (child2.nodeName === "tr") {
                            // look in tr for td
							let title = false;
							let address = false;
							for (const child3 of child2.childNodes) {
								if (child3.nodeName === "td") {
                                    // check if class name = "views-field views-field-title"
                                    // check if class name = "views-field views-field-field-building-address"
									for (const attr of child3.attrs) {
										if (attr.name === "class") {
											if (attr.value === "views-field views-field-title") {
												title = true;
											}
											if (attr.value === "views-field views-field-field-building-address") {
												address = true;
											}
											if (title && address) {
												return node;
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
		for (const child of node.childNodes) {
			if (!visitedNodes.has(child)) {
				if (child.nodeName && child.nodeName !== "#text" && child.nodeName !== "#comment") {
					const result = this.findValidBuildingsTable(child, visitedNodes);
					if (result) {
						return result; // return found table from recursive call
					}
				}
			}
		}
		return null;
	}

	public findBuildingData(node: any): void {
		for (const child of node.childNodes) {
			if (child.nodeName === "tbody") {
				// look in tbody for tr
				for (const tr of child.childNodes) {
					if (tr.nodeName === "tr") {
						let buildingURL = "", buildingAddress = "", fullname = "", shortname = "";
						// let buildingAddress = "";
						// let fullname = "";
						// let shortname = "";
						// look in tr for td
						for (const td of tr.childNodes) {
							if (td.nodeName === "td") {
								// check if class name = "views-field views-field-title"
								// check if class name = "views-field views-field-field-building-address"
								for (const attr of td.attrs) {
									if (attr.name === "class") {
										if (attr.value === "views-field views-field-title") {
											// get link
											for (const a of td.childNodes) {
												if (a.nodeName === "a") {
													for (const attr2 of a.attrs) {
														if (attr2.name === "href") {
															// this.buildingData.push(attr2.value);
															buildingURL = attr2.value;
														}
													}
													for (const aChild of a.childNodes) {
														if (aChild.nodeName === "#text") {
															fullname = aChild.value;
														}
													}
												}
											}
										} else if (attr.value === "views-field views-field-field-building-address") {
											// get address
											for (const tdChild of td.childNodes) {
												if (tdChild.nodeName === "#text") {
													buildingAddress = tdChild.value;
												}
											}
										} else if (attr.value === "views-field views-field-field-building-code") {
											for (const tdChild of td.childNodes) {
												if (tdChild.nodeName === "#text") {
													shortname = tdChild.value;
												}
											}
										}
									}
								}
							}
						}
						const thisBuilding = this.htmlSearchUtil.populateBuildingData(
							buildingURL, buildingAddress, fullname, shortname);
						this.buildingData[thisBuilding.shortname] = (thisBuilding);
					}
				}
			}
		}
	}

	public async findValidRoomsTable(
		node: any, buildingShortName: string, roomsData: RoomsData[], visitedRoomsNodes: Set<unknown>): Promise<any> {
		visitedRoomsNodes.add(node);
		const promises: Array<Promise<void>> = [];
		if (node.nodeName === "table") {
			promises.push(this.htmlSearchUtil.processRoomsTable(node, buildingShortName, roomsData, this.buildingData));
		}
		for (const child of node.childNodes) {
			if (!visitedRoomsNodes.has(child) && child.nodeName &&
				child.nodeName !== "#text" && child.nodeName !== "#comment") {
				promises.push(this.findValidRoomsTable(child, buildingShortName, roomsData, visitedRoomsNodes));
			}
		}
		await Promise.all(promises);
		return null;
	}
}
