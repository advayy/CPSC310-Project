export interface QueryModel {
	WHERE: {
		FILTER?: Filter;
	};
	OPTIONS: QueryOptions;
	TRANSFORMATIONS?: TRANSFORMATION
}

export interface TRANSFORMATION {
	GROUP: string[]; // flag keys,
	APPLY: APPLYRULE[]
}

export interface APPLYRULE {
	APPLYKEY: string,
	TOKEN: string,
	KEY: string
}

// APPLY ::= 'APPLY: [' APPLYRULE_LIST? ']'
// 	APPLYRULE_LIST ::=  APPLYRULE | APPLYRULE ', ' APPLYRULE_LIST
// APPLYRULE ::= '{' applykey ': {' APPLYTOKEN ':' KEY '} }'
// APPLYTOKEN ::= 'MAX' | 'MIN' | 'AVG' | 'COUNT' | 'SUM'


export interface QueryOptions {
	COLUMNS: [string, ...string[]]; // flag keys
	SORT?: SortOrder; // flag key
}

export interface SortOrder {
	complex?: {
		direction: string,
		keys: [string, ...string[]]
	},
	simple?: string
}

// SORT ::= 'ORDER: { dir:'  DIRECTION ', keys: [ ' ANYKEY_LIST '] }' | 'ORDER: ' ANYKEY


export interface Filter {
	LOGICCOMPARISON?: {
		LOGIC: string;
		FILTER_LIST: Filter[];
	};
	MCOMPARISON?: {
		MCOMPARATOR: string;
		mkey: string;
		number: number;
	};
	SCOMPARISON?: {
		skey: string;
		inputstring: string;
	};
	NEGATION?: {
		FILTER: Filter;
	};
}


// export type Key = Mkey | Skey;
// Key is idstring_Mfeild... or sfeild...

export type Mfield = "avg" | "pass" | "fail" | "audit" | "year";
export type Sfield = "dept" | "id" | "instructor" | "title" | "uuid";

// Useless defs:
//
// type IdString = string;
// type InputString = string;
// export interface KeyList {
// 	key: string;
// 	KEY_LIST?: KeyList;
// }
// export interface Mkey {
// 	mkey: Mfield;
// }
//
// export interface Skey {
// 	skey: Sfield;
// }
