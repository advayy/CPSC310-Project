import {InsightError} from "./IInsightFacade";
import {RoomsData} from "../models/roomsData";
import {GeoResponse} from "../models/geoResponse";
import http from "http";

export class HtmlSearchUtil {
	public populateBuildingData(buildingURL: string,
		buildingAddress: string,
		fullname: string,
		shortname: string): any {
		if (buildingURL !== "" && buildingAddress !== "") {
			const splitResult = buildingURL.split("./campus/discover/buildings-and-classrooms/");
			const fileName = splitResult.length > 1 ? splitResult.pop()?.replace(".htm", "") : null;
			if (!fileName) {
				throw new InsightError("problem parsing building url");
			}
            // Remove leading and trailing white spaces, including '\n'
			buildingAddress = buildingAddress.trim();
            // Remove HTML elements by stripping HTML tags
			buildingAddress = buildingAddress.replace(/<[^>]*>/g, "");
			shortname = shortname.trim();
			shortname = shortname.replace(/<[^>]*>/g, "");
			fullname = fullname.trim();
			let buildingData: {url: string; address: string; fullname: string; shortname: string;};
			buildingData = {
				url: buildingURL, address: buildingAddress, shortname: shortname, fullname: fullname};
			return buildingData;
		}
	}

	public async populateRoomsData(
		buildingShortName: string,
		number: string,
		seats: string,
		furniture: string,
		type: string,
		href: string,
		buildingData: any,
		roomsData: RoomsData[]): Promise<void> {
		// if (number && seats && furniture && type && href) {
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
			throw new InsightError("problem getting geolocation");
		}
		if (!lat || !lon) {
			throw new InsightError("problem getting geolocation");
		}
		const roomData: RoomsData = {
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
			// console.log("rooms_name: ", name);
            // console.log("roomData:", roomData); // FLAG
            // console.log("roomsData:", this.roomsData); // FLAG
		// }
	}

	public async getGeolocation(address: string): Promise<GeoResponse> {
		const encodedAddress = encodeURIComponent(address);

        // Construct the URL
		const teamNumber = "278"; // Replace with your actual team number
		const url = `http://cs310.students.cs.ubc.ca:11316/api/v1/project_team${teamNumber}/${encodedAddress}`;

		return new Promise<GeoResponse>((resolve, reject) => {
			http.get(url, (res) => {
				let data = "";
				res.on("data", (chunk) => {
					data += chunk;
				});
				res.on("end", () => {
					try {
						const geoResponse: GeoResponse = JSON.parse(data);
						resolve(geoResponse);
					} catch (error) {
						reject(error);
					}
				});
				res.on("error", (error) => {
					reject(error);
				});
			});
		});
	}

	public async processRoomsTable(node: any, buildingShortName: string, roomsData: RoomsData[], buildingData: any) {
		const trPromises: Array<Promise<void>> = [];

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
		// console.log("roomsData:", roomsData); // FLAG
	}


	private async processRoomRow(child2: any, buildingShortName: string, roomsData: RoomsData[], buildingData: any):
		Promise<void> {
		let number = "", seats = "", type = "", furniture = "", href = "";
		let numField, seatField, typeField, furnitureField, hrefField;
		for (const child3 of child2.childNodes) {
			if (child3.nodeName === "td") {
				// console.log("child3:", child3); // FLAG
				for (const attr of child3.attrs) {
					switch (attr.value) {
						case "views-field views-field-field-room-number":
							numField = true;
							number = this.extractRoomNumber(child3);
							// console.log("number:", number); // FLAG
							break;
						case "views-field views-field-field-room-capacity":
							seatField = true;
							seats = this.extractTextByClassName(child3, "views-field views-field-field-room-capacity");
							// console.log("seats:", seats); // FLAG
							break;
						case "views-field views-field-field-room-furniture":
							furnitureField = true;
							furniture = this.extractTextByClassName(
								child3, "views-field views-field-field-room-furniture");
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
		// if (!buildingShortName || !number || !seats || !furniture || !type || !href) {
		// 	console.log(buildingShortName, number);
		// 	return;
		// 	throw new InsightError("room missing field");
		// }
		if (!buildingShortName || !numField || !seatField || !furnitureField || !typeField || !hrefField) {

			throw new InsightError("room missing field");
		}
		await this.populateRoomsData(
			buildingShortName, number, seats, furniture, type, href, buildingData, roomsData);
		// console.log("roomsData:", roomsData); // FLAG
	}

	private extractRoomNumber(node: any): string {
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

	private extractTextByClassName(node: any, className: string): string {
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

	private extractRoomHref(node: any): string {
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
