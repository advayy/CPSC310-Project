"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlSearchUtil = void 0;
const IInsightFacade_1 = require("./IInsightFacade");
const http_1 = __importDefault(require("http"));
class HtmlSearchUtil {
    populateBuildingData(buildingURL, buildingAddress, fullname, shortname) {
        if (buildingURL !== "" && buildingAddress !== "") {
            const splitResult = buildingURL.split("./campus/discover/buildings-and-classrooms/");
            const fileName = splitResult.length > 1 ? splitResult.pop()?.replace(".htm", "") : null;
            if (!fileName) {
                throw new IInsightFacade_1.InsightError("problem parsing building url");
            }
            buildingAddress = buildingAddress.trim();
            buildingAddress = buildingAddress.replace(/<[^>]*>/g, "");
            shortname = shortname.trim();
            shortname = shortname.replace(/<[^>]*>/g, "");
            fullname = fullname.trim();
            let buildingData;
            buildingData = {
                url: buildingURL, address: buildingAddress, shortname: shortname, fullname: fullname
            };
            return buildingData;
        }
    }
    async populateRoomsData(buildingShortName, number, seats, furniture, type, href, buildingData, roomsData) {
        let fullname, shortname, name, address, lat, lon;
        fullname = buildingData[buildingShortName].fullname;
        shortname = buildingData[buildingShortName].shortname;
        name = shortname + "_" + number;
        address = buildingData[buildingShortName].address;
        seats = seats.trim();
        seats = seats.replace(/<[^>]*>/g, "");
        type = type.trim();
        type = type.replace(/<[^>]*>/g, "");
        furniture = furniture.trim();
        furniture = furniture.replace(/<[^>]*>/g, "");
        const geoResponse = await this.getGeolocation(address);
        if (geoResponse.lat && geoResponse.lon) {
            lat = geoResponse.lat;
            lon = geoResponse.lon;
        }
        if (geoResponse.error) {
            throw new IInsightFacade_1.InsightError("problem getting geolocation");
        }
        if (!lat || !lon) {
            throw new IInsightFacade_1.InsightError("problem getting geolocation");
        }
        const roomData = {
            fullname: String(fullname),
            shortname: String(shortname),
            number: String(number),
            name: String(name),
            address: String(address),
            lat: Number(lat),
            lon: Number(lon),
            seats: Number(seats),
            type: String(type),
            furniture: String(furniture),
            href: String(href)
        };
        roomsData.push(roomData);
    }
    async getGeolocation(address) {
        const encodedAddress = encodeURIComponent(address);
        const teamNumber = "278";
        const url = `http://cs310.students.cs.ubc.ca:11316/api/v1/project_team${teamNumber}/${encodedAddress}`;
        return new Promise((resolve, reject) => {
            http_1.default.get(url, (res) => {
                let data = "";
                res.on("data", (chunk) => {
                    data += chunk;
                });
                res.on("end", () => {
                    try {
                        const geoResponse = JSON.parse(data);
                        resolve(geoResponse);
                    }
                    catch (error) {
                        reject(error);
                    }
                });
                res.on("error", (error) => {
                    reject(error);
                });
            });
        });
    }
    async processRoomsTable(node, buildingShortName, roomsData, buildingData) {
        const trPromises = [];
        for (const child of node.childNodes) {
            if (child.nodeName === "tbody") {
                for (const child2 of child.childNodes) {
                    if (child2.nodeName === "tr") {
                        trPromises.push(this.processRoomRow(child2, buildingShortName, roomsData, buildingData));
                    }
                }
            }
        }
        await Promise.all(trPromises);
    }
    async processRoomRow(child2, buildingShortName, roomsData, buildingData) {
        let number = "", seats = "", type = "", furniture = "", href = "";
        let numField, seatField, typeField, furnitureField, hrefField;
        for (const child3 of child2.childNodes) {
            if (child3.nodeName === "td") {
                for (const attr of child3.attrs) {
                    switch (attr.value) {
                        case "views-field views-field-field-room-number":
                            numField = true;
                            number = this.extractRoomNumber(child3);
                            break;
                        case "views-field views-field-field-room-capacity":
                            seatField = true;
                            seats = this.extractTextByClassName(child3, "views-field views-field-field-room-capacity");
                            break;
                        case "views-field views-field-field-room-furniture":
                            furnitureField = true;
                            furniture = this.extractTextByClassName(child3, "views-field views-field-field-room-furniture");
                            break;
                        case "views-field views-field-field-room-type":
                            typeField = true;
                            type = this.extractTextByClassName(child3, "views-field views-field-field-room-type");
                            break;
                        case "views-field views-field-nothing":
                            hrefField = true;
                            href = this.extractRoomHref(child3);
                            break;
                    }
                }
            }
        }
        if (!buildingShortName || !numField || !seatField || !furnitureField || !typeField || !hrefField) {
            throw new IInsightFacade_1.InsightError("room missing field");
        }
        await this.populateRoomsData(buildingShortName, number, seats, furniture, type, href, buildingData, roomsData);
    }
    extractRoomNumber(node) {
        for (const child of node.childNodes) {
            if (child.nodeName === "a") {
                for (const aChild of child.childNodes) {
                    if (aChild.nodeName === "#text") {
                        return aChild.value;
                    }
                }
            }
        }
        return "";
    }
    extractTextByClassName(node, className) {
        for (const child of node.childNodes) {
            if (child.nodeName === "#text") {
                if (child.value) {
                    return child.value.trim();
                }
            }
        }
        console.log("issue with extractTextByClassName");
        return "";
    }
    extractRoomHref(node) {
        for (const child of node.childNodes) {
            if (child.nodeName === "a") {
                for (const attr of child.attrs) {
                    if (attr.name === "href") {
                        return attr.value;
                    }
                }
            }
        }
        return "";
    }
}
exports.HtmlSearchUtil = HtmlSearchUtil;
//# sourceMappingURL=htmlSearchUtil.js.map