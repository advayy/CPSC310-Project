"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = __importDefault(require("decimal.js"));
class TransformationHelper {
    getApplyList(list) {
        let output = [];
        for (let rule of list) {
            output.push(rule.APPLYKEY);
        }
        return output;
    }
    handleApply(groups, applyRules) {
        let output = [];
        for (let apply of applyRules) {
            let key = apply.KEY.split("_")[1];
            let temp = [];
            if (apply.TOKEN === "MIN") {
                temp = this.handleMIN(key, groups);
            }
            else if (apply.TOKEN === "MAX") {
                temp = this.handleMAX(key, groups);
            }
            else if (apply.TOKEN === "COUNT") {
                temp = this.handleCOUNT(key, groups);
            }
            else if (apply.TOKEN === "SUM") {
                temp = this.handleSUM(key, groups);
            }
            else if (apply.TOKEN === "AVG") {
                temp = this.handleAVG(key, groups);
            }
            output.push(temp);
        }
        return output;
    }
    handleMIN(key, data) {
        let output = [];
        for (let courseList of data) {
            let min = Number.MAX_VALUE;
            for (let course of courseList) {
                const value = course[key];
                if (typeof value === "number" && value < min) {
                    min = value;
                }
            }
            output.push(min);
        }
        return output;
    }
    handleMAX(key, data) {
        let output = [];
        for (let courseList of data) {
            let max = Number.MIN_VALUE;
            for (let course of courseList) {
                const value = course[key];
                if (typeof value === "number" && value > max) {
                    max = value;
                }
            }
            output.push(max);
        }
        return output;
    }
    handleCOUNT(key, data) {
        let output = [];
        for (let courseList of data) {
            let uniqueValues = new Set();
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
    handleSUM(key, data) {
        let output = [];
        for (let courseList of data) {
            let sum = new decimal_js_1.default(0);
            for (let course of courseList) {
                const value = new decimal_js_1.default(course[key]);
                sum = sum.add(value);
            }
            let avg = Number(sum.toFixed(2));
            output.push(avg);
        }
        return output;
    }
    handleAVG(key, data) {
        let output = [];
        for (let courseList of data) {
            let sum = new decimal_js_1.default(0);
            let numRows = 0;
            for (let course of courseList) {
                const value = new decimal_js_1.default(course[key]);
                sum = sum.add(value);
                numRows += 1;
            }
            let avg = Number((sum.toNumber() / numRows).toFixed(2));
            output.push(avg);
        }
        return output;
    }
}
exports.default = TransformationHelper;
//# sourceMappingURL=transformationHelper.js.map