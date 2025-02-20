import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError, ResultTooLargeError,
} from "./IInsightFacade";
import {APPLYRULE, Filter, QueryModel, QueryOptions, TRANSFORMATION} from "../models/queryModel";
import InsightFacade from "./InsightFacade";
import {CourseData} from "../models/courseData";
import {resolveObjectURL} from "buffer";
import Decimal from "decimal.js";
import {DataModel} from "../models/dataModel";


export default class TransformationHelper {

	public getApplyList(list: APPLYRULE[]) {
		let output = [];
		for(let rule of list){
			output.push(rule.APPLYKEY);
		}
		return output;
	}

	public handleApply(groups: DataModel[][], applyRules: APPLYRULE[]): number[][] {
		let output: number[][] = [];
		// return a nd list the length of the no of groups, where in is the no of apply rules
		// EG if we are applying 2 rules to 3 groups, then 2 cols and 3 values per col....

		for(let apply of applyRules) {
			let key = apply.KEY.split("_")[1];
			let temp: number[] = [];
			if (apply.TOKEN === "MIN") {
				temp = this.handleMIN(key, groups);
			} else if (apply.TOKEN === "MAX") {
				temp = this.handleMAX(key, groups);
			} else if (apply.TOKEN === "COUNT") {
				temp = this.handleCOUNT(key, groups);
			} else if (apply.TOKEN === "SUM") {
				temp = this.handleSUM(key, groups);
			} else if (apply.TOKEN === "AVG") {
				temp = this.handleAVG(key, groups);
			}
			output.push(temp);
		}
		return output;
	}

	public handleMIN(key: string, data: DataModel[][]): number[]{
		let output: number[] = [];
		for(let courseList of data) {
			let min = Number.MAX_VALUE; // Initialize min with a large value

			for(let course of courseList) {
				const value = course[key];
				if (typeof value === "number" && value < min) {
					min = value;
				}
			}

			output.push(min);
		}
		return output;
	}

	public handleMAX(key: string, data: DataModel[][]): number[]{
		let output: number[] = [];
		for(let courseList of data) {
			let max = Number.MIN_VALUE; // Initialize min with a large value

			for(let course of courseList) {
				const value = course[key];
				if (typeof value === "number" && value > max) {
					max = value;
				}
			}

			output.push(max);
		}
		return output;
	}

	public handleCOUNT(key: string, data: DataModel[][]): number[] {
		let output: number[] = [];

		for (let courseList of data) {
			let uniqueValues = new Set<string | number>();

			for (let course of courseList) {
				const value = course[key];
				if (value !== undefined) {
					uniqueValues.add(value);
				}
			}

			output.push(uniqueValues.size);
		}

		return output;
	}

	public handleSUM(key: string, data: DataModel[][]): number[]{
		let output: number[] = [];
		for(let courseList of data) {
			let sum = new Decimal(0); // Initialize min with a large value
			for(let course of courseList) {
				const value = new Decimal(course[key]);
				sum = sum.add(value);
			}

			let avg = Number(sum.toFixed(2));
			output.push(avg);
		}
		return output;
	}

	public handleAVG(key: string, data: DataModel[][]): number[]{
		let output: number[] = [];
		for(let courseList of data) {
			let sum = new Decimal(0); // Initialize min with a large value
			let numRows = 0;
			for(let course of courseList) {
				const value = new Decimal(course[key]);
				sum = sum.add(value);
				numRows += 1;
			}

			let avg = Number((sum.toNumber() / numRows).toFixed(2));
			output.push(avg);
		}
		return output;
	}

}
