// Typed sentinel errors emitted by the knowledge-graph services. The route
// layer maps each one to its HTTP status + `error.code` envelope (CLAUDE.md
// "Architecture / Backend"). Unhandled errors propagate to the global
// Fastify error handler.

export class ResourceNotFoundError extends Error {
  public readonly statusCode = 404;
  public readonly code = "RESOURCE_NOT_FOUND" as const;
  public readonly entity: string;
  public readonly entityId: string;

  constructor(entity: string, entityId: string) {
    super(`${entity} ${entityId} not found.`);
    this.name = "ResourceNotFoundError";
    this.entity = entity;
    this.entityId = entityId;
  }
}

/** BR-11 — `KnowledgeNode.status = 'deleted'` returns HTTP 410. */
export class NodeDeletedError extends Error {
  public readonly statusCode = 410;
  public readonly code = "BUSINESS_NODE_DELETED" as const;
  public readonly nodeId: string;

  constructor(nodeId: string) {
    super(`KnowledgeNode ${nodeId} is marked as deleted.`);
    this.name = "NodeDeletedError";
    this.nodeId = nodeId;
  }
}

/** BR-03 — `node_type` filter does not match the catalog. */
export class UnknownNodeTypeError extends Error {
  public readonly statusCode = 422;
  public readonly code = "BUSINESS_UNKNOWN_NODE_TYPE" as const;
  public readonly nodeType: string;

  constructor(nodeType: string) {
    super(`node_type '${nodeType}' is not registered in the catalog.`);
    this.name = "UnknownNodeTypeError";
    this.nodeType = nodeType;
  }
}

/** BR-04 — a `link_types[]` element is not registered in the catalog. */
export class UnknownLinkTypeError extends Error {
  public readonly statusCode = 422;
  public readonly code = "BUSINESS_UNKNOWN_LINK_TYPE" as const;
  public readonly linkType: string;

  constructor(linkType: string) {
    super(`link_type '${linkType}' is not registered in the catalog.`);
    this.name = "UnknownLinkTypeError";
    this.linkType = linkType;
  }
}

/** BR-05 — `depth` parameter is outside `[TRAVERSAL_DEPTH_MIN, TRAVERSAL_DEPTH_MAX]`. */
export class InvalidTraverseDepthError extends Error {
  public readonly statusCode = 422;
  public readonly code = "BUSINESS_INVALID_TRAVERSE_DEPTH" as const;
  public readonly depth: number;
  public readonly max: number;

  constructor(depth: number, max: number) {
    super(`depth must be between 1 and ${max} (got ${depth}).`);
    this.name = "InvalidTraverseDepthError";
    this.depth = depth;
    this.max = max;
  }
}

/** BR-20 — `(node_type, key)` pair is not registered in the catalog. */
export class UnknownAttributeKeyError extends Error {
  public readonly statusCode = 404;
  public readonly code = "BUSINESS_UNKNOWN_ATTRIBUTE_KEY" as const;
  public readonly nodeType: string;
  public readonly key: string;

  constructor(nodeType: string, key: string) {
    super(
      `AttributeKey '${key}' is not registered for NodeType '${nodeType}'.`
    );
    this.name = "UnknownAttributeKeyError";
    this.nodeType = nodeType;
    this.key = key;
  }
}
