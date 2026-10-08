import { describe, expect, it } from "vitest";

import { mapErrorToHttpResponse } from "../../../modules/curation/mcp/error-envelope.js";
import { BusinessError } from "../../../modules/curation/service/errors.js";
import { renderErrorEnvelope } from "../../../shared/error-mapping.js";

const HTTP_CONFLICT = 409;
const HTTP_NOT_FOUND = 404;
const HTTP_UNPROCESSABLE = 422;

const ENTITY_EDIT_BUSINESS_REFUSALS: readonly string[] = [
  "BUSINESS_NODE_NOT_ACTIVE",
  "BUSINESS_ENTITY_EDIT_CONFLICT",
  "BUSINESS_ENTITY_EDIT_DISPUTED",
  "BUSINESS_ENTITY_EDIT_NO_CHANGES",
  "BUSINESS_INVALID_ATTRIBUTE_VALUE",
];

describe("entity edit refusal codes rendered over REST", () => {
  it("renders BUSINESS_NODE_NOT_ACTIVE as HTTP 409", () => {
    const code = "BUSINESS_NODE_NOT_ACTIVE";

    const result = renderErrorEnvelope(code, "node is not active");

    expect(result.statusCode).toBe(HTTP_CONFLICT);
  });

  it("renders BUSINESS_ENTITY_EDIT_CONFLICT as HTTP 409", () => {
    const code = "BUSINESS_ENTITY_EDIT_CONFLICT";

    const result = renderErrorEnvelope(code, "attribute changed elsewhere");

    expect(result.statusCode).toBe(HTTP_CONFLICT);
  });

  it("renders BUSINESS_ENTITY_EDIT_DISPUTED as HTTP 409", () => {
    const code = "BUSINESS_ENTITY_EDIT_DISPUTED";

    const result = renderErrorEnvelope(code, "attribute is disputed");

    expect(result.statusCode).toBe(HTTP_CONFLICT);
  });

  it("renders BUSINESS_ENTITY_EDIT_NO_CHANGES as HTTP 422", () => {
    const code = "BUSINESS_ENTITY_EDIT_NO_CHANGES";

    const result = renderErrorEnvelope(code, "edit changes nothing");

    expect(result.statusCode).toBe(HTTP_UNPROCESSABLE);
  });

  it("renders BUSINESS_UNKNOWN_ATTRIBUTE_KEY raised as a curation business error as HTTP 422 keeping its code and details", () => {
    const error = new BusinessError(
      "BUSINESS_UNKNOWN_ATTRIBUTE_KEY",
      "unknown attribute key for node type",
      { attribute_key: "nickname", node_type: "Person" }
    );

    const result = mapErrorToHttpResponse(error);

    expect(result.statusCode).toBe(HTTP_UNPROCESSABLE);
    expect(result.envelope.error.code).toBe("BUSINESS_UNKNOWN_ATTRIBUTE_KEY");
    expect(result.envelope.error.details).toEqual({
      attribute_key: "nickname",
      node_type: "Person",
    });
  });

  it("renders BUSINESS_INVALID_ATTRIBUTE_VALUE as HTTP 422 instead of an internal failure", () => {
    const code = "BUSINESS_INVALID_ATTRIBUTE_VALUE";

    const result = renderErrorEnvelope(code, "value does not parse");

    expect(result.statusCode).toBe(HTTP_UNPROCESSABLE);
  });

  it("keeps BUSINESS_UNKNOWN_ATTRIBUTE_KEY at HTTP 404 when rendered by code for the retrieval surface", () => {
    const code = "BUSINESS_UNKNOWN_ATTRIBUTE_KEY";

    const result = renderErrorEnvelope(code, "unknown attribute key");

    expect(result.statusCode).toBe(HTTP_NOT_FOUND);
  });

  it.each(ENTITY_EDIT_BUSINESS_REFUSALS)(
    "logs %s as a warning and never at error level",
    (code) => {
      const result = renderErrorEnvelope(code, "refused");

      expect(result.logLevel).toBe("warn");
    }
  );
});
