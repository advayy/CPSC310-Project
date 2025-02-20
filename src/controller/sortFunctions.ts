import {InsightResult} from "./IInsightFacade";


export type Direction = "UP" | "DOWN";
export default class SortFunctions {
	public sortByKeyAscending(data: InsightResult[], key: keyof InsightResult): InsightResult[] {
		return data.slice().sort((a, b) => {
			const valueA = a[key];
			const valueB = b[key];

			if (valueA < valueB) {
				return -1;
			}
			if (valueA > valueB) {
				return 1;
			}
			return 0;
		});
	}

	public sortByMultipleKeys(data: InsightResult[], keys: string[], direction: string): InsightResult[] {
		return data.sort((a, b) => {
			let result = 0;
			for (const key of keys) {
				if (a[key] < b[key]) {
					result = -1;
					break;
				} else if (a[key] > b[key]) {
					result = 1;
					break;
				}
			}

			// Reverse the result if the direction is "DOWN"
			return direction === "DOWN" ? -result : result;
		});
	}


}
