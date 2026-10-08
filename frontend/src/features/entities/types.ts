export interface NodeTypeWire {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: number;
}

export interface NodeTypeListWire {
  readonly total: number;
  readonly items: readonly NodeTypeWire[];
}

export interface ListedNodeWire {
  readonly id: string;
  readonly node_type: string;
  readonly canonical_name: string;
  readonly status: string;
  readonly merged_into: string | null;
}

export interface NodeListingWire {
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
  readonly items: readonly ListedNodeWire[];
}

export interface NodeType {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: number;
}

export interface ListedNode {
  readonly id: string;
  readonly nodeType: string;
  readonly canonicalName: string;
  readonly status: string;
  readonly mergedInto: string | null;
}

export interface NodeListing {
  readonly total: number;
  readonly items: readonly ListedNode[];
}

export interface NodeListingNarrowing {
  readonly namePrefix?: string | null;
  readonly nodeType?: string | null;
}
