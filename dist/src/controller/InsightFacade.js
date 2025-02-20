"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("./IInsightFacade");
const performQueryHelpers_1 = __importDefault(require("./performQueryHelpers"));
const databaseModel_1 = require("./databaseModel");
const queryEngine_1 = __importDefault(require("./queryEngine"));
const queryValidationHelpers_1 = __importDefault(require("./queryValidationHelpers"));
class InsightFacade {
    database;
    constructor() {
        console.log("InsightFacadeImpl::init()");
        this.database = new databaseModel_1.DatabaseModel();
    }
    async addDataset(id, content, kind) {
        if (!this.database.validDatasetID(id)) {
            throw new IInsightFacade_1.InsightError("Invalid dataset id");
        }
        if (this.database.datasetExists(id)) {
            throw new IInsightFacade_1.InsightError("Dataset already exists");
        }
        if (!this.database.validContent(content, kind)) {
            throw new IInsightFacade_1.InsightError("Invalid content");
        }
        let data;
        if (kind === IInsightFacade_1.InsightDatasetKind.Sections) {
            data = await this.database.extractAndParseZip(content);
            return Promise.resolve(this.database.addDataset(id, data, kind));
        }
        else if (kind === IInsightFacade_1.InsightDatasetKind.Rooms) {
            data = await this.database.extractAndParseRooms(content);
            return Promise.resolve(this.database.addRoomsDataset(id, data, kind));
        }
        else {
            throw new IInsightFacade_1.InsightError("Invalid dataset kind");
        }
    }
    removeDataset(id) {
        if (!this.database.validDatasetID(id)) {
            return Promise.reject(new IInsightFacade_1.InsightError("Invalid dataset id"));
        }
        if (!this.database.datasetExists(id)) {
            return Promise.reject(new IInsightFacade_1.NotFoundError("dataset doesn't exist"));
        }
        return Promise.resolve(this.database.removeDataset(id));
    }
    listDatasets() {
        return Promise.resolve(this.database.listAll());
    }
    performQuery(query) {
        let helper = new performQueryHelpers_1.default();
        let helper2 = new queryValidationHelpers_1.default();
        let queryEngine = new queryEngine_1.default();
        let queryString;
        if (typeof query === "string") {
            queryString = query;
        }
        else {
            queryString = JSON.stringify(query);
        }
        let jsonString = helper2.readJSONQuery(queryString);
        let queryObject = helper.modelQuery(jsonString, this.database.getAddedIDs(), this.database.getAddedKinds());
        let primaryID = helper.getPrimaryDatasetID();
        let data = this.database.getDataFromID(primaryID);
        return Promise.resolve(queryEngine.queryRunner(queryObject, primaryID, data));
    }
}
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map