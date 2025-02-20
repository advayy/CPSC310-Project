"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SortFunctions {
    sortByKeyAscending(data, key) {
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
    sortByMultipleKeys(data, keys, direction) {
        return data.sort((a, b) => {
            let result = 0;
            for (const key of keys) {
                if (a[key] < b[key]) {
                    result = -1;
                    break;
                }
                else if (a[key] > b[key]) {
                    result = 1;
                    break;
                }
            }
            return direction === "DOWN" ? -result : result;
        });
    }
}
exports.default = SortFunctions;
//# sourceMappingURL=sortFunctions.js.map