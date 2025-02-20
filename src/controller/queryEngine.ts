import {
	InsightResult, ResultTooLargeError,
} from "./IInsightFacade";
import {Filter, QueryModel, QueryOptions, TRANSFORMATION} from "../models/queryModel";
import {CourseData} from "../models/courseData";
import TransformationHelper from "./transformationHelper";
import SortFunctions from "./sortFunctions";
import {DataModel} from "../models/dataModel";

export default class QueryEngine {
	public queryRunner(query: QueryModel, primID: string, data: DataModel[]): InsightResult[] {
		let output: DataModel[];
		if (query.WHERE.FILTER) { // WHERE not empty
			output = this.filterHandler(query.WHERE.FILTER, data);
		} else {
			output = data;
		}
		let relevantColumns = query.OPTIONS.COLUMNS; // return only relevant columns...
		let trimmedCols = this.getColumnsOnly(relevantColumns);
		let transformationOutput;
		let result: InsightResult[];
		let sorter = new SortFunctions();
		if(query.TRANSFORMATIONS) {
		// Form unique groups -> perform aggregation based off of those?
			transformationOutput = this.handleTRNF(output, query.TRANSFORMATIONS, relevantColumns, primID);
			if(transformationOutput.length > 5000) { // determine if you have a result too large
				throw new ResultTooLargeError("Query Result too Large");
			}
			result = [];
			for(let t of transformationOutput) {
				result.push(t);
			}

			if(query.OPTIONS.SORT?.simple) {
				result = sorter.sortByKeyAscending(result, query.OPTIONS.SORT.simple);
			} else {
				if(query.OPTIONS.SORT?.complex?.keys) {
					let keys: string[] = query.OPTIONS.SORT?.complex?.keys;
					result = sorter.sortByMultipleKeys(result, keys, query.OPTIONS.SORT?.complex?.direction);
				}
			}
			return result;
		}
		let numRows = output.length;
		if(numRows > 5000) { // determine if you have a result too large
			throw new ResultTooLargeError("Query Result too Large");
		}
		result = [];
		for(let course of output) {
			result.push(this.mapToInsightResult(course, trimmedCols, primID)); 	// format output into Insight result
		}
		if(query.OPTIONS.SORT?.simple) {
			result = sorter.sortByKeyAscending(result, query.OPTIONS.SORT.simple);
		} else {
			if(query.OPTIONS.SORT?.complex?.keys) {
				let keys: string[] = query.OPTIONS.SORT?.complex?.keys;
				result = sorter.sortByMultipleKeys(result, keys, query.OPTIONS.SORT?.complex?.direction);
			}
		}
		return result;
	}

	public getColumnsOnly(list: string[]): string[] {
		let trimmedCols: string[] = [];
		for (let column of list) {
			if(column.includes("_")) {
				trimmedCols.push(column.split("_")[1]);
			} else {
				trimmedCols.push(column);
			}
		}
		return trimmedCols;
	}

	public handleTRNF(data: DataModel[], trs: TRANSFORMATION, rel: string[], id: string): Array<{[key: string]: any}> {
		let helper = new TransformationHelper();
		let groups = this.handleGrouping(data, this.getColumnsOnly(trs.GROUP));
		let applyList = helper.getApplyList(trs.APPLY);
		let applyResult = helper.handleApply(groups, trs.APPLY);
		let filteredData: {[key: string]: any} = {};
		let trimmedGroups: Array<{[key: string]: string|number}> = [];

		for (let list of groups) {
			filteredData = {};
			for (let column of rel) {
				if(column.includes("_")) { // if it's a sections_column
					filteredData[column] = list[0][column.split("_")[1]];
				}
			}
			trimmedGroups.push(filteredData);
		}
		let index = 0;
		for (let applyKey of applyList) {
			let currentResult = applyResult[index];
			for (let i = 0; i < currentResult.length; i++) {
				trimmedGroups[i][applyKey] = Number(currentResult[i]);
			}
			index += 1;
		}


		return trimmedGroups;
	}

	public handleGrouping(data: DataModel[], grouping: string[]): DataModel[][] {
		const output: DataModel[][] = [];
		const groupMap: Map<string, DataModel[]> = new Map();

		// Build the grouping map
		for (const courseData of data) {
			const groupKey = grouping.map((key) => courseData[key]).join("_");
			if (!groupMap.has(groupKey)) {
				groupMap.set(groupKey, []);
			}
			const group = groupMap.get(groupKey); // Use ! to assert that groupKey exists
			if (group) {
				group.push(courseData);
			}
			// groupMap.get(groupKey).push(courseData);
		}

		// Collect the grouped data
		for (const group of groupMap.values()) {
			output.push(group);
		}

		return output;
	}

	public mapToInsightResult(course: DataModel, relevantColumns: string[], primID: string): InsightResult {
		const insightResult: InsightResult = {};
		// Iterate through relevant column names and copy values
		relevantColumns.forEach((column) => {
			let insightColumn = primID + "_" + column;
			insightResult[insightColumn] = (course as any)[column];
		});
		return insightResult;
	}

	public filterHandler(filter: Filter, data: DataModel[]): DataModel[] {
		let filterSection = filter;
		if(filterSection?.LOGICCOMPARISON) {
			if(filterSection.LOGICCOMPARISON.LOGIC === "AND") {
				return this.filterHandleAND(filterSection.LOGICCOMPARISON.FILTER_LIST, data);
			} else {
				return this.filterHandleOR(filterSection.LOGICCOMPARISON.FILTER_LIST, data);
			}
		} else if (filterSection?.MCOMPARISON) {
			let comparator = filterSection.MCOMPARISON.MCOMPARATOR;
			let key = filterSection.MCOMPARISON.mkey;
			let no = filterSection.MCOMPARISON.number;
			key = key.split("_")[1];
			return this.handleMCOMP(comparator, key, no, data);
		} else if (filterSection?.SCOMPARISON) {
			let key = filterSection.SCOMPARISON.skey;
			key = key.split("_")[1];
			let stringInput = filterSection.SCOMPARISON.inputstring;
			return this.handleSCOMP(key, stringInput, data);
		} else if (filterSection?.NEGATION) {
			let negationFilterResult = this.filterHandler(filterSection.NEGATION.FILTER, data);
			return data.filter((item) => !negationFilterResult.includes(item));
		}

		return [];
	}

	public filterHandleAND(filterList: Filter[] , data: DataModel[]): DataModel[] {
		let outlist: [DataModel[]] = [[]];
		outlist.pop();
		for (let filter of filterList) {
			outlist.push(this.filterHandler(filter, data));
		}
		return this.takeIntersectionUntilEmpty(outlist);
	}

	public takeIntersectionUntilEmpty(lists: [DataModel[]]): DataModel[] {
		let result = lists[0]; // Start with the first list as the initial result
		for (const sublist of lists.slice(1)) {
			// Calculate the intersection with the current sublist
			result = result.filter((item) => sublist.includes(item));
			// If the result becomes empty, break the loop
			if (result.length === 0) {
				break;
			}
		}
		return result;
	}

	public filterHandleOR(filterList: Filter[] , data: DataModel[]): DataModel[] {
		let outlist: [DataModel[]] = [[]];
		outlist.pop();
		for (let filter of filterList) {
			outlist.push(this.filterHandler(filter, data));
		}
		return this.takeUnion(outlist);
	}

	public takeUnion(lists: [DataModel[]]): DataModel[] {
		let result: DataModel[] = [];
		for (const sublist of lists) {
			// Calculate the union with the current sublist
			result = [...new Set([...result, ...sublist])];
		}
		return result;
	}

	public handleMCOMP(comparator: string, key: string, no: number, data: DataModel[]): DataModel[] {
		let output: DataModel[];
		output = [];
		for(let course of data){
			let value = (course as any)[key]; // FLAG !!!

			if (comparator === "GT") {
				if (value > no) {
					output.push(course);
				}
			} else if (comparator === "LT") {
				if (value < no) {
					output.push(course);
				}
			} else if (comparator === "EQ") {
				if (value === no) {
					output.push(course);
				}
			}
		}
		return output;
	}

	public handleSCOMP(key: string, inputString: string, data: DataModel[]): DataModel[] {
		let outlist: DataModel[] = [];
		const hasLeadingAsterisk = inputString.startsWith("*");
		const hasTrailingAsterisk = inputString.endsWith("*");
		for (let entry of data) {
			let valueToMatch = (entry as any)[key];

			if (inputString === valueToMatch) {
				outlist.push(entry);
			} else if (hasLeadingAsterisk && hasTrailingAsterisk) {
				const middlePattern = inputString.substring(1, inputString.length - 1);
				if (valueToMatch.includes(middlePattern)) {
					outlist.push(entry);
				}
			} else if (hasLeadingAsterisk) {
				const tailPattern = inputString.substring(1);
				if (valueToMatch.endsWith(tailPattern)) {
					outlist.push(entry);
				}
			} else if (hasTrailingAsterisk) {
				const headPattern = inputString.substring(0, inputString.length - 1);
				if (valueToMatch.startsWith(headPattern)) {
					outlist.push(entry);
				}
			}
		}
		return outlist;
	}
}
