import {DataModel} from "./dataModel";

export interface RoomsData extends DataModel{
    fullname: string;
    shortname: string;
    number: string;
    name: string;
    address: string;
    lat: number;
    lon: number;
    seats: number;
    type: string;
    furniture: string;
    href: string;
	[key: string]: string | number; // Add an index signature
}
