CREATE TYPE document_context_status AS ENUM ('produced', 'single-chunk', 'too-long', 'failed');

ALTER TABLE llm_run
  ADD COLUMN document_context        jsonb,
  ADD COLUMN document_context_status document_context_status;
