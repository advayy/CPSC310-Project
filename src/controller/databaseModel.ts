import {InsightDataset, InsightDatasetKind, InsightError, InsightResult, NotFoundError} from "./IInsightFacade";
import {CourseData} from "../models/courseData";
import {RoomsData} from "../models/roomsData";
// import "../data/data.json";
import JSZip from "jszip";
import fs from "fs";
import * as parse5 from "parse5";
import {ParseUtil} from "./parseUtil";
import {DataModel} from "../models/dataModel";


export class DatabaseModel { // DATABASE
	private addedDatasetIDs: string[] = [];
	private coursesDatabase: CourseData[][] = [[]];
	private addedRoomsDatasetIDs: string[] = [];
	private roomsDatabase: RoomsData[][] = [[]];
	private dataSections: string[] = [];
	private dataRooms: string[] = [];
	// private list of sections ... DATA

	constructor() {
		this.coursesDatabase.pop();

		const folderPath = __dirname + "/../../data";
		const filePath = folderPath + "/data.json";
		if (fs.existsSync(filePath)) {
			const fileContents = fs.readFileSync(filePath, "utf8");
			if (fileContents !== "") {
				const data = JSON.parse(fileContents);
				const inlist: CourseData[][] = Object.values(data);
				// console.log("INLIST FLAG" + inlist);
				this.coursesDatabase = inlist; // FLAG !!! see if this works
				const datasetIDs = Object.keys(data);
				// console.log("IDS FLAG" + datasetIDs);
				this.addedDatasetIDs = datasetIDs;
			}
		}
		this.roomsDatabase.pop();
		const filePath2 = folderPath + "/dataRooms.json";
		if (fs.existsSync(filePath2)) {
			const fileContents = fs.readFileSync(filePath2, "utf8");
			if (fileContents !== "") {
				const data = JSON.parse(fileContents);
				const inlist: RoomsData[][] = Object.values(data);
				this.roomsDatabase = inlist;
				const datasetIDs = Object.keys(data);
				this.addedRoomsDatasetIDs = datasetIDs;
			}
		}
	}

	public getAddedIDs(): string[]{
		return this.addedDatasetIDs.concat(this.addedRoomsDatasetIDs);
	}

	public getAddedKinds(): string[]{
		return this.dataSections.concat(this.dataRooms);
	}

	public listAll(): InsightDataset[] {
		let output: InsightDataset[];
		output = [];
		for (let internalId of this.addedDatasetIDs) {
			let index = this.addedDatasetIDs.indexOf(internalId);
			let num = this.coursesDatabase[index].length;
			let dataIn: InsightDataset = {
				id: internalId,
				kind: InsightDatasetKind.Sections,
				numRows: num
			};
			output.push(dataIn);
		}
		// add rooms
		for (let internalId of this.addedRoomsDatasetIDs) {
			let index = this.addedRoomsDatasetIDs.indexOf(internalId);
			let num = this.roomsDatabase[index].length;
			let dataIn: InsightDataset = {
				id: internalId,
				kind: InsightDatasetKind.Rooms,
				numRows: num
			};
			output.push(dataIn);
		}
		return output;
	}

	public getDataFromID(id: string): DataModel[]{
		let index;
		if(this.addedDatasetIDs.indexOf(id) >= 0) {
			index = this.addedDatasetIDs.indexOf(id);
			return this.coursesDatabase[index];
		} else {
			index = this.addedRoomsDatasetIDs.indexOf(id);
			return this.roomsDatabase[index];
		}
	}

	public addDataset(id: string, data: CourseData[], kind: InsightDatasetKind): string[] {
		// FLAG R
		this.addedDatasetIDs.push(id);
		this.coursesDatabase.push(data);
		this.dataSections.push("sections");
		// console.log("COURSES DATABASE: " + this.coursesDatabase);
		this.saveToDisk(id, data, kind);
		return this.addedDatasetIDs;
	}

	public addRoomsDataset(id: string, data: RoomsData[], kind: InsightDatasetKind): string[] {
		this.addedRoomsDatasetIDs.push(id);
		this.roomsDatabase.push(data);
		this.dataRooms.push("rooms");
		this.saveToDisk(id, data, kind);
		return this.addedRoomsDatasetIDs;
	}


	public validDatasetID(id: string): boolean {
		// null id
		if (id === null) {
			return false;
		} else if (id === undefined) {
			return false;
		}
		// whitespace id
		// id is empty string
		// Trim whitespace and check for empty string
		if (id.trim() === "") {
			return false;
		}

		// Check for underscores in the id
		if (id.includes("_")) {
			return false;
		}
		return true;
	}

	public datasetExists(id: string): boolean {
		// check if dataset already in disk
		if (this.addedDatasetIDs.includes(id)) {
			return true;
		}
		if (this.addedRoomsDatasetIDs.includes(id)) {
			return true;
		} // FLAG
		return false;
	}

	public validContent(content: string, kind: InsightDatasetKind): boolean {
		if(content == null || content === "") {
			return false;
		}
		// FLAG: Check if its a valid zip file?

		return true;
	}


	public async extractAndParseZip(zipData: string): Promise<CourseData[]> {
		// call parseUtil
		const parseUtil = new ParseUtil();
		const result = await parseUtil.extractAndParseZip(zipData);
		return result;
	}

	public async extractAndParseRooms(zipData: string): Promise<RoomsData[]> {
		// call parseUtil
		const parseUtil = new ParseUtil();
		try {
			const result = await parseUtil.extractAndParseRooms(zipData);
			return result;
		} catch (error) {
			// console.log(error);
			throw new InsightError("Invalid zip file");
		}
		// return result;
	}

	public saveToDisk(id: string, data: unknown, kind: InsightDatasetKind): void {
		// return;
		const folderPath = __dirname + "/../../data";
		let filePath = "";
		if (kind === InsightDatasetKind.Sections) {
			filePath = folderPath + "/data.json";
		}
		if (kind === InsightDatasetKind.Rooms) {
			filePath = folderPath + "/dataRooms.json";
		}
		if (filePath === "") {
			throw new InsightError("Invalid dataset kind");
		}
		if (!fs.existsSync(folderPath)) {
			fs.mkdirSync(folderPath);
		}
		let existingData: any = {};
		if (fs.existsSync(filePath)) {
			const fileContents = fs.readFileSync(filePath, "utf8");
			if (fileContents !== "") {
				existingData = JSON.parse(fileContents);
			}
		}
		existingData[id] = data;
		fs.writeFileSync(filePath, JSON.stringify(existingData));
		return;
	}

	public removeDataset(id: string): string {
		// for removing sections
		let index;
		const folderPath = __dirname + "/../../data";
		let filePath;
		if (this.addedDatasetIDs.includes(id)) {
			// return this.removeSectionsDataset(id);
			index = this.addedDatasetIDs.indexOf(id);
			this.addedDatasetIDs.splice(index, 1);
			this.coursesDatabase.splice(index, 1);
			filePath = folderPath + "/data.json";
		} else if (this.addedRoomsDatasetIDs.includes(id)) {
			index = this.addedRoomsDatasetIDs.indexOf(id);
			this.addedRoomsDatasetIDs.splice(index, 1);
			this.roomsDatabase.splice(index, 1);
			filePath = folderPath + "/dataRooms.json";
		} else {
			throw new InsightError("Dataset does not exist");
		}

		if (index <= -1) {
			throw new InsightError("Dataset does not exist");
		}
		// remove datasetID from addedDatasetIDs
		// remove dataset from disk
		if (fs.existsSync(filePath)) {
			const fileContents = fs.readFileSync(filePath, "utf8");
			if (fileContents !== "") {
				const existingData = JSON.parse(fileContents);
				delete existingData[id];
				fs.writeFileSync(filePath, JSON.stringify(existingData));
			}
		}
		return id;
	}
}
