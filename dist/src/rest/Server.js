"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const InsightFacade_1 = __importDefault(require("../controller/InsightFacade"));
const IInsightFacade_1 = require("../controller/IInsightFacade");
class Server {
    port;
    express;
    server;
    facade;
    constructor(port) {
        console.info(`Server::<init>( ${port} )`);
        this.port = port;
        this.express = (0, express_1.default)();
        this.registerMiddleware();
        this.registerRoutes();
        this.facade = new InsightFacade_1.default();
        this.express.use(express_1.default.static("./frontend/public"));
    }
    start() {
        return new Promise((resolve, reject) => {
            console.info("Server::start() - start");
            if (this.server !== undefined) {
                console.error("Server::start() - server already listening");
                reject();
            }
            else {
                this.server = this.express.listen(this.port, () => {
                    console.info(`Server::start() - server listening on port: ${this.port}`);
                    resolve();
                }).on("error", (err) => {
                    console.error(`Server::start() - server ERROR: ${err.message}`);
                    reject(err);
                });
            }
        });
    }
    stop() {
        console.info("Server::stop()");
        return new Promise((resolve, reject) => {
            if (this.server === undefined) {
                console.error("Server::stop() - ERROR: server not started");
                reject();
            }
            else {
                this.server.close(() => {
                    console.info("Server::stop() - server closed");
                    resolve();
                });
            }
        });
    }
    registerMiddleware() {
        this.express.use(express_1.default.json());
        this.express.use(express_1.default.raw({ type: "application/*", limit: "10mb" }));
        this.express.use((0, cors_1.default)());
    }
    registerRoutes() {
        this.express.get("/echo/:msg", Server.echo);
        this.express.put("/dataset/:id/:kind", this.addDataset.bind(this));
        this.express.delete("/dataset/:id", this.removeDataset.bind(this));
        this.express.post("/query", this.performQuery.bind(this));
        this.express.get("/datasets", this.listDatasets.bind(this));
    }
    static echo(req, res) {
        try {
            console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
            const response = Server.performEcho(req.params.msg);
            res.status(200).json({ result: response });
        }
        catch (err) {
            res.status(400).json({ error: err });
        }
    }
    static performEcho(msg) {
        if (typeof msg !== "undefined" && msg !== null) {
            return `${msg}...${msg}`;
        }
        else {
            return "Message not provided";
        }
    }
    async addDataset(req, res) {
        try {
            const id = req.params.id;
            const kind = req.params.kind;
            let insightKind;
            if (kind === IInsightFacade_1.InsightDatasetKind.Sections) {
                insightKind = IInsightFacade_1.InsightDatasetKind.Sections;
            }
            else if (kind === IInsightFacade_1.InsightDatasetKind.Rooms) {
                insightKind = IInsightFacade_1.InsightDatasetKind.Rooms;
            }
            else {
                throw new IInsightFacade_1.InsightError("Invalid Kind");
            }
            const contentBuffer = req.body;
            const content = contentBuffer.toString("base64");
            const result = await this.facade.addDataset(id, content, insightKind);
            res.status(200).json({ result });
        }
        catch (err) {
            if (err instanceof IInsightFacade_1.InsightError) {
                res.status(400).json({ error: err.message });
            }
            else {
                res.status(400).json({ error: "An unknown error occurred" });
            }
        }
    }
    async listDatasets(req, res) {
        try {
            const result = await this.facade.listDatasets();
            res.status(200).json({ result });
        }
        catch (err) {
            if (err instanceof IInsightFacade_1.InsightError) {
                res.status(400).json({ error: err.message });
            }
            else {
                res.status(400).json({ error: "An unknown error occurred" });
            }
        }
    }
    async performQuery(req, res) {
        try {
            const query = req.body;
            console.log("Received query:", req.body);
            const result = await this.facade.performQuery(query);
            res.status(200).json({ result });
            console.log("Query performed successfully");
            console.log("result", result);
        }
        catch (err) {
            if (err instanceof IInsightFacade_1.InsightError) {
                res.status(400).json({ error: err.message });
            }
            else {
                res.status(400).json({ error: "An unknown error occurred" });
            }
        }
    }
    async removeDataset(req, res) {
        try {
            const { id } = req.params;
            const result = await this.facade.removeDataset(id);
            res.status(200).json({ result });
        }
        catch (err) {
            if (err instanceof IInsightFacade_1.InsightError) {
                res.status(400).json({ error: err.message });
            }
            else if (err instanceof IInsightFacade_1.NotFoundError) {
                res.status(404).json({ error: err.message });
            }
            else {
                res.status(400).json({ error: "An unknown error occurred" });
            }
        }
    }
}
exports.default = Server;
//# sourceMappingURL=Server.js.map