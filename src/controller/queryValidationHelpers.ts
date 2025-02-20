import {
	InsightError,
} from "./IInsightFacade";

export default class QueryValidationHelpers {
	private addedDatasetIDs: string[] = [];
	private primaryDatasetID = "";
	private datasetType = ""; // CAN BE S or R -> section or room
	private addedKinds: string[] = [];

	public getPrimaryDatasetID = (): string => this.primaryDatasetID;

	public assignAddedDatasetIDs(list: string[]): void {
		this.addedDatasetIDs = list;
	}

	public assignAddedKinds(list: string[]): void {
		this.addedKinds = list;
	}

	public setPrimaryDatasetID(jsonKeys: string): void {
		let json;
		json = JSON.parse(jsonKeys);
		let columnKeys = json["OPTIONS"]["COLUMNS"];
		let groupKeys: string[] = [];
		try{
			if(json["TRANSFORMATIONS"]) {
				groupKeys = json["TRANSFORMATIONS"]["GROUP"];
			}
		} catch {
			// do nothing
		}
		let output: [string];
		output = [""];
		output.pop();
		let firstKey = "";
		let allKeys;
		if(groupKeys.length === 0) {
			allKeys = columnKeys;
		} else {
			allKeys = columnKeys.concat(groupKeys);
		}

		for(let key of allKeys) {
			if(key.includes("_")) {
				firstKey = key;
				break;
			}
		}
		firstKey = firstKey.split("_")[0];
		let index;
		if(this.addedDatasetIDs.includes(firstKey)) {
			this.primaryDatasetID = firstKey;
			this.setTypeFlag(this.addedDatasetIDs.indexOf(firstKey));
		} else {
			throw new InsightError("Database not added");
		}
	}

	public setTypeFlag(index: number) {
		let kind = this.addedKinds[index];
		if(kind === "sections") {
			this.datasetType = "S";
		} else if (kind === "rooms") {
			this.datasetType = "R";
		}
		// } else { // FLAG
		// 	throw new InsightError("Unrecognized Dataset type...")
		// }
	}

	public readJSONQuery(stringInput: string): string {
		let json;
		try {
			json = JSON.parse(stringInput);
		} catch {
			throw new InsightError("Invalid JSON syntax");
		}
		return JSON.stringify(json);
	}

	public validateInputString(s: string){
		const trimmedString = s.substring(1, s.length - 1);
		let asteriskCount = 0;
		// Loop through the characters in the trimmed string
		for (let c of trimmedString) {
			if (c === "*") {
				throw new InsightError("astrix present in id string");
			}
		}
	}

	public assignValidNumber(block: string): number {
		let json = JSON.parse(block);
		let num = json[Object.keys(json)[0]];
		if(typeof num === "number") {
			return num;
		}
		throw new InsightError("Operator didnt receive a number");
	}

	public validFilterBody(levelJSONString: string): boolean {
		let json = JSON.parse(levelJSONString);
		let validQueryKeys = ["AND", "OR", "NOT", "IS", "LT" , "GT" , "EQ"];
		let presentKeys = Object.keys(json);
		if(!(presentKeys.length === 1)) {
			return false;
		}
		for (let k of presentKeys) {
			if(!validQueryKeys.includes(k)) {
				return false;
			}
		}
		return true;
	}

	public assignValidWord(block: string): string {
		let json = JSON.parse(block);
		let str = json[Object.keys(json)[0]];
		if(typeof str === "string") {
			return str;
		}
		throw new InsightError("Operator didnt receive a String");
	}

	public noInvalidsInOptionsBody(levelJSONString: string): boolean {
		// FLAG <A> COLUMNS and an ORDER but only 1
		let json = JSON.parse(levelJSONString);
		let validQueryKeys = ["COLUMNS", "ORDER"];
		let presentKeys = Object.keys(json);
		if(presentKeys.length > 2) {
			return false;
		}
		for (let k of presentKeys) {
			if(!validQueryKeys.includes(k)) {
				return false;
			}
		}
		return true;
	}

	// Only Looks for invalid Keys in body
	public noInvalidsInQueryBody(levelJSONString: string): boolean {
		let json = JSON.parse(levelJSONString);
		let validQueryKeys = ["WHERE", "OPTIONS", "TRANSFORMATIONS"];
		let presentKeys = Object.keys(json);
		if(presentKeys.length > 3) {
			return false;
		}
		if(presentKeys.length === 3) {
			for (let k of presentKeys) {
				if(!validQueryKeys.includes(k)) {
					return false;
				}
			}
		} else {
			validQueryKeys = ["WHERE", "OPTIONS"];
			for (let k of presentKeys) {
				if (!validQueryKeys.includes(k)) {
					return false;
				}
			}
		}
		return true;
	}

	public validKey(key: string): boolean {
		return this.validSKey(key) || this.validMKey(key);
	}


	public assignValidSKey(block: string): string {
		let json = JSON.parse(block);
		if(Object.keys(json).length === 1) {
			let skey = Object.keys(json)[0];
			if(this.validSKey(skey)) {
				return skey;
			}
		}
		throw new InsightError("Invalid SKey");
	}

	public assignValidMKey(block: string): string {
		let json = JSON.parse(block);
		if(Object.keys(json).length === 1) {
			let mkey = Object.keys(json)[0];
			if(this.validMKey(mkey)) {
				return mkey;
			}
		}
		throw new InsightError("Invalid MKey");
	}

	public validateMSKey(key: string, validFields: string[]): boolean {
		let keyPieces = key.split("_");
		let KeyID, KeyField;
		if(keyPieces.length > 1 && keyPieces.length < 3) {
			KeyID = keyPieces[0];
			KeyField = keyPieces[1];
			// check if id and field are in supersets
			if (validFields.includes(KeyField) && KeyID === this.primaryDatasetID) {
				return true; // FLAG UNCOMMENT
			}
		}
		return false; // FLAG UNCOMMENT
	}

	public validMKey(key: string): boolean {
		let validFields = ["avg", "pass", "fail", "audit", "year"];
		if (this.datasetType === "R") {
			validFields = ["lat", "lon", "seats"];
		}
		return this.validateMSKey(key, validFields);
	}

	public validSKey(key: string): boolean {
		let validFields = ["dept", "id", "instructor", "title", "uuid"];
		if (this.datasetType === "R") {
			validFields = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
		}
		return this.validateMSKey(key, validFields);
	}
}

