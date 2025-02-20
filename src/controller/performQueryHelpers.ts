import {
	InsightError,
} from "./IInsightFacade";
import {
	APPLYRULE,
	Filter,
	QueryModel,
	QueryOptions,
	SortOrder,
	TRANSFORMATION
} from "../models/queryModel";
import QueryValidationHelpers from "./queryValidationHelpers";

export default class PerformQueryHelpers {
	private applyKeys: string[] = [];
	private validator = new QueryValidationHelpers();

	public getPrimaryDatasetID = (): string => this.validator.getPrimaryDatasetID();

	public setApplyKey(key: string): void{
		this.applyKeys.push(key);
	}

	public assignAddedDatasetIDs(list: string[]): void {
		this.validator.assignAddedDatasetIDs(list);
	}

	public setPrimaryDatasetID(jsonKeys: string): void {
		this.validator.setPrimaryDatasetID(jsonKeys);
	}

		// input must be output of readJSONQuery
	public modelQuery(queryString: string, addedDatasets: string[], addedKinds: string[]): QueryModel {
		this.validator.assignAddedDatasetIDs(addedDatasets);
		this.validator.assignAddedKinds(addedKinds);
		let outputQuery: QueryModel;
		let filterSegment, optionsSegment,transformSegment;
		outputQuery = {WHERE: {}, OPTIONS: {COLUMNS:[""]}};
		let json = JSON.parse(queryString); // We know this will be valid json so don't need to try catch.
		if(!this.validator.noInvalidsInQueryBody(queryString)) {
			throw new InsightError("Invalid Key in Query Body");
		}
		let cols = [];
		try{
			if(json["OPTIONS"]) {
				this.validator.setPrimaryDatasetID(JSON.stringify(json));
				if(json["OPTIONS"]["COLUMNS"]) {
					cols = json["OPTIONS"]["COLUMNS"];
				}
			}
		} catch {
			throw new InsightError("Error in Options handler");
		}
		if(json["TRANSFORMATIONS"]) {
			try {
				transformSegment = json["TRANSFORMATIONS"];
				let transformString = JSON.stringify(transformSegment);
				let columnsListString = JSON.stringify(cols);
				outputQuery.TRANSFORMATIONS = this.handleTransformation(transformString, columnsListString); // FLAG no change on this line but on called
			} catch {
				throw new InsightError("Error in Transformations handler");
			}
		}
		if(json["OPTIONS"]) {
			optionsSegment = json["OPTIONS"];
			let optionsString = JSON.stringify(optionsSegment);
			outputQuery.OPTIONS = this.handleOptions(optionsString); // FLAG no change on this line but on called
		}
		if (json["WHERE"]) {// identify that there's a where segment
			filterSegment = json["WHERE"];
		} else {
			throw new InsightError("No Where block present");
		}
		if(JSON.stringify(filterSegment) === "{}") {	// Where handler
			outputQuery.WHERE = {};
		} else {
			outputQuery.WHERE.FILTER = this.handleFilter(JSON.stringify(filterSegment));
		}
		return outputQuery;
	}

	public handleTransformation(stringTransformation: string, cols: string): TRANSFORMATION {
		let json = JSON.parse(stringTransformation);
		let columns = JSON.parse(cols);
		let groupList;
		let applylist;

		if (json["GROUP"]) {
			for (let k of json["GROUP"]) {
				if (!this.validator.validKey(k)) {
					throw new InsightError("Invalid key in transformation (GROUP) body");
				}
			}
			groupList = json["GROUP"];
		} else {
			throw new InsightError("NO GROUP in transform body");
		}

		if (json["APPLY"]) {
			applylist = this.handleApplyRuleList(JSON.stringify(json["APPLY"]));
		} else {
			throw new InsightError("NO APPLY in transform body");
		}

		for (let c of columns) {
			if (!groupList.includes(c) && !this.applyKeys.includes(c)) {
				throw new InsightError("All keys in columns must be in either group or apply");
			}
		}

		return {
			GROUP: groupList,
			APPLY: applylist
		};
	}

	public handleApplyRuleList(jsonString: string): APPLYRULE[] {
		// FLAG add apply keys to private variable
		// MAY need to add an OR in the valid key check,
		// See how valid key is working -> it checks splits in execution
		let validTokens = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
		let validSKeyTokens = ["COUNT"];
		let jsonList = JSON.parse(jsonString);
		let out: APPLYRULE[] = [];

		for(let obj of jsonList) { // FLAG does this work
			let applyKey = Object.keys(obj)[0];
			let value = obj[applyKey];
			let token = Object.keys(value)[0];
			let key = value[token];

			if(this.applyKeys.includes(applyKey)) {
				throw new InsightError("Duplicate Apply key");
			}

			if (this.validator.validSKey(key) && validSKeyTokens.includes(token)) {
				let temp: APPLYRULE = {
					APPLYKEY: applyKey,
					TOKEN: token,
					KEY: key
				};
				out.push(temp);
				this.applyKeys.push(applyKey);
			} else if (validTokens.includes(token) && this.validator.validMKey(key)) {
				let temp: APPLYRULE = {
					APPLYKEY: applyKey,
					TOKEN: token,
					KEY: key
				};
				out.push(temp);
				this.applyKeys.push(applyKey);
			} else {
				throw new InsightError("Invalids in ApplyRuleList");
			}
		}
		return out;
	}

	public handleFilter(stringFilter: string): Filter {
		let filterBlock = JSON.parse(stringFilter);
		let filterBlockString = stringFilter;
		let outputFilter: Filter;
		outputFilter = {};

		if(!this.validator.validFilterBody(filterBlockString)) {
			throw new InsightError("Invalid Filter Body");
		}
		if (filterBlock["AND"] || filterBlock["OR"]) { // LOGICCOMPARISON
			let outList = [];
			for (let filters of filterBlock[Object.keys(filterBlock)[0]]) {
				outList.push(this.handleFilter(JSON.stringify(filters)));
			}
			if (outList.length < 1) {
				throw new InsightError("Empty AND/OR filter block");
			}
			outputFilter.LOGICCOMPARISON = {
				LOGIC: Object.keys(filterBlock)[0],
				FILTER_LIST: outList
			};
		} else if (filterBlock["LT"] || filterBlock["GT"] || filterBlock["EQ"] ) { // MCOMPARISON - 'LT' | 'GT' | 'EQ
			let comparator;
			if(filterBlock["LT"]) {
				comparator = "LT";
			} else if (filterBlock["GT"]) {
				comparator = "GT";
			} else {
				comparator = "EQ";
			}
			let valNo = this.validator.assignValidNumber(JSON.stringify(filterBlock[comparator]));
			let valMKey = this.validator.assignValidMKey(JSON.stringify(filterBlock[comparator]));
			outputFilter.MCOMPARISON = {
				MCOMPARATOR: comparator,
				mkey: valMKey,
				number: valNo,
			};
		} else if (filterBlock["NOT"]) {
			outputFilter.NEGATION = {FILTER: this.handleFilter(JSON.stringify(filterBlock["NOT"]))};
		} else if (filterBlock["IS"]) {
			let valWord = this.validator.assignValidWord(JSON.stringify(filterBlock["IS"]));
			let valSKey = this.validator.assignValidSKey(JSON.stringify(filterBlock["IS"]));
			this.validator.validateInputString(valWord);
			outputFilter.SCOMPARISON = {
				skey: valSKey,
				inputstring: valWord,
			};
		}
		return outputFilter;
	}

	public handleOptions(jsonOptions: string): QueryOptions { // Takes the value from (Options: {}) and parses it
		let outputOptions: QueryOptions;
		outputOptions = {COLUMNS:[""]};		// instantiate a default value
		let json;
		if(!this.validator.noInvalidsInOptionsBody(jsonOptions)) {
			throw new InsightError("Invalid Key in Options");
		}
		let keylist = [];
		json = JSON.parse(jsonOptions);
		try {
			if(json["COLUMNS"]) { // Operator returns false if there are none returned
				keylist = this.returnKeysFromCols(JSON.stringify(json));
				outputOptions.COLUMNS = keylist;
			} else {
				throw new InsightError("Invalid column keys");
			}

			if(json["ORDER"]) {
				if(json["ORDER"]["dir"]){
					let complex = JSON.stringify(json["ORDER"]);
					outputOptions.SORT = this.handleComplexSort(complex, keylist);
				} else if(keylist.includes(json["ORDER"])) {
					outputOptions.SORT = {
						simple:json["ORDER"]
					};
				} else {
					throw new InsightError("Order Key not specified in columns");
				}


			}
		} catch {
			throw new InsightError("Invalid EBNF - missing columns or options");
		}
		return outputOptions;
	}

	public handleComplexSort(jsonString: string, columnsKeylist: string[]): SortOrder {
		let dir;
		let keylist;

		let json = JSON.parse(jsonString);
		if(json["dir"] === "UP" || json["dir"] === "DOWN") {
			dir = json["dir"];
		} else {
			throw new InsightError("Invalid Direction");
		}
		if(json["keys"]) {
			let keys = json["keys"];
			for(let k of keys ) {
				if (!columnsKeylist.includes(k)) {
					throw new InsightError("sort key not in column list");
				}
			}
			keylist = json["keys"];
		} else {
			throw new InsightError("No keys in sort key list"); // FLAG Not sure if needed but...
		}
		let sortorder: SortOrder = {
			complex: {
				direction: dir,
				keys: keylist
			}
		};
		return sortorder;
	}

	public returnKeysFromCols(jsonKeys: string): [string] {
		let json;
		json = JSON.parse(jsonKeys);
		let columnKeys = json["COLUMNS"];
		let output: [string];
		output = [""];
		output.pop();
		for (let key of columnKeys) { 		// loop and call valid key?
			if(this.validator.validKey(key) || this.applyKeys.includes(key)) { // all have the same initial segments or apply key
				output.push(key);
			} else {
				throw new InsightError("Invalid Keys in Columns");
			}
		}
		return output; // flag
	}
}
