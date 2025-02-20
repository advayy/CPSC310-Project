import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError
} from "./IInsightFacade";
// import {CourseData} from "../models/courseData";
// import {Filter, QueryModel, QueryOptions} from "../models/queryModel";
// import JSZip from "jszip";
import PerformQueryHelpers from "./performQueryHelpers";
import {DatabaseModel} from "./databaseModel";
import QueryEngine from "./queryEngine";
import QueryValidationHelpers from "./queryValidationHelpers";
import {DataModel} from "../models/dataModel";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private database: DatabaseModel;

	constructor() {
		// instantiate database
		console.log("InsightFacadeImpl::init()");
		this.database = new DatabaseModel();

	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// return Promise.reject("Not implemented.");
		// check if provided dataset id is valid
		if (!this.database.validDatasetID(id)) {
			throw new InsightError("Invalid dataset id");
		}
		// check if dataset already in disk
		if (this.database.datasetExists(id)) {
			throw new InsightError("Dataset already exists");
		}
		// check if content is correctly formatted
		if (!this.database.validContent(content, kind)) {
			throw new InsightError("Invalid content");
		}

		// load and process data from given zip files
		// convert into data model
		// save to disk
		// add new dataset id to list of added dataset ids
		// return promise with list of added dataset ids
		let data;
		if (kind === InsightDatasetKind.Sections) {
			data = await this.database.extractAndParseZip(content);
			return Promise.resolve(this.database.addDataset(id, data, kind));
		} else if (kind === InsightDatasetKind.Rooms) {
			data = await this.database.extractAndParseRooms(content);
			return Promise.resolve(this.database.addRoomsDataset(id, data, kind));
		} else {
			throw new InsightError("Invalid dataset kind");
		}
		// return Promise.resolve(this.database.addDataset(id, data, kind));
	}


	public removeDataset(id: string): Promise<string> {
		// throw new InsightError("Not implemented.");
		if (!this.database.validDatasetID(id)) {
			// throw new InsightError("Invalid dataset id");
			return Promise.reject(new InsightError("Invalid dataset id"));
		}
		// check if dataset already in disk
		if (!this.database.datasetExists(id)) {
			// throw new NotFoundError("Dataset does not exist");
			return Promise.reject(new NotFoundError("dataset doesn't exist"));
		}
		// remove dataset
		// const returnID = this.database.removeDataset(id);
		return Promise.resolve(this.database.removeDataset(id));
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.resolve(this.database.listAll());
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		let helper = new PerformQueryHelpers();
		let helper2 = new QueryValidationHelpers();
		let queryEngine = new QueryEngine();
		let queryString;

		if (typeof query === "string") {
			queryString = query;
		} else {
			queryString = JSON.stringify(query);
		}

		let jsonString = helper2.readJSONQuery(queryString);

		let queryObject = helper.modelQuery(jsonString, this.database.getAddedIDs(),
			this.database.getAddedKinds());

		let primaryID = helper.getPrimaryDatasetID();
		let data: DataModel[] = this.database.getDataFromID(primaryID);
		// let result = queryEngine.queryRunner(queryObject, primaryID, data);

		return Promise.resolve(queryEngine.queryRunner(queryObject, primaryID, data));
	}
}
