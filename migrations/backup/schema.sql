-- schema.sql — snapshot SCHEMA-ONLY (DDL) do banco Neon (schema public).
-- Gerado via funcoes DDL nativas do Postgres (pg_get_*def) — sem dados.
-- Objetos pertencentes a extensoes sao excluidos (recriados por CREATE EXTENSION).
-- PostgreSQL server: 18.4 (eaf151e). NAO editar a mao — regenerar com migrations/backup/.

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pg_session_jwt";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================================
-- TYPES (ENUM)
-- ============================================================================
CREATE TYPE "alias_kind" AS ENUM ('canonical', 'alias');
CREATE TYPE "assertion_status" AS ENUM ('active', 'uncertain', 'disputed', 'superseded', 'deleted');
CREATE TYPE "attribute_value_type" AS ENUM ('date', 'number', 'text', 'bool');
CREATE TYPE "chat_message_role" AS ENUM ('user', 'assistant');
CREATE TYPE "fragment_status" AS ENUM ('proposed', 'accepted', 'rejected', 'superseded', 'deleted');
CREATE TYPE "llm_run_status" AS ENUM ('running', 'completed', 'failed');
CREATE TYPE "node_status" AS ENUM ('active', 'needs_review', 'merged', 'deleted');
CREATE TYPE "source_type" AS ENUM ('pdf', 'email', 'ata', 'chat', 'artigo', 'transcricao', 'outro');
CREATE TYPE "valid_from_source" AS ENUM ('stated', 'document', 'received');
CREATE TYPE "validation_outcome" AS ENUM ('accepted', 'consolidated', 'superseded_previous', 'needs_review', 'uncertain', 'disputed', 'rejected', 'error');

-- ============================================================================
-- FUNCTIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.canonical_date(v text)
 RETURNS date
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
RETURN (v)::date;
CREATE OR REPLACE FUNCTION public.canonical_number(v text)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
RETURN (v)::numeric;
CREATE OR REPLACE FUNCTION public.immutable_unaccent(t text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
RETURN unaccent('unaccent'::regdictionary, t);
CREATE OR REPLACE FUNCTION public.norm(t text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
RETURN lower(immutable_unaccent(regexp_replace(btrim(t), '\s+'::text, ' '::text, 'g'::text)));
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

-- ============================================================================
-- TABLES
-- ============================================================================
CREATE TABLE "attribute_key" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "node_type_id" uuid NOT NULL,
  "key" text NOT NULL,
  "value_type" attribute_value_type NOT NULL,
  "is_temporal" boolean NOT NULL,
  "allows_multiple_current" boolean NOT NULL,
  "requires_valid_from" boolean NOT NULL,
  "description" text NOT NULL,
  "version" integer DEFAULT 1 NOT NULL
);
CREATE TABLE "attribute_valid_value" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "attribute_key_id" uuid NOT NULL,
  "value" text NOT NULL,
  "label" text,
  "sort_order" integer,
  "description" text,
  "version" integer DEFAULT 1 NOT NULL
);
CREATE TABLE "chat_conversation" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" text,
  "summary_rolling" text,
  "archived_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "chat_graph_view" (
  "conversation_id" uuid NOT NULL,
  "snapshot" jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "chat_message" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL,
  "role" chat_message_role NOT NULL,
  "content" jsonb NOT NULL,
  "stop_reason" text,
  "idempotency_key" uuid,
  "model" text,
  "tokens_in" integer,
  "tokens_out" integer,
  "latency_ms" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "chat_tool_call" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL,
  "message_id" uuid,
  "tool_name" text NOT NULL,
  "arguments" jsonb NOT NULL,
  "result" jsonb,
  "is_error" boolean DEFAULT false NOT NULL,
  "error_message" text,
  "duration_ms" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "compliance_deletion" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "raw_information_id" uuid NOT NULL,
  "reason" text NOT NULL,
  "executed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "affected" jsonb DEFAULT '{}'::jsonb NOT NULL
);
CREATE TABLE "curation_action" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "action" text NOT NULL,
  "target_kind" text NOT NULL,
  "target_id" uuid,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "entity_match_review" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "node_id" uuid NOT NULL,
  "candidate_node_id" uuid NOT NULL,
  "similarity" numeric NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "fragment_source" (
  "fragment_id" uuid NOT NULL,
  "raw_chunk_id" uuid NOT NULL
);
CREATE TABLE "information_fragment" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "llm_run_id" uuid NOT NULL,
  "text" text NOT NULL,
  "confidence" numeric NOT NULL,
  "status" fragment_status DEFAULT 'proposed'::fragment_status NOT NULL,
  "superseded_at" timestamp with time zone,
  "text_search" tsvector GENERATED ALWAYS AS (to_tsvector('pt_unaccent_v1'::regconfig, text)) STORED,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "knowledge_link" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "source_node_id" uuid NOT NULL,
  "target_node_id" uuid NOT NULL,
  "link_type_id" uuid NOT NULL,
  "valid_from" date,
  "valid_to" date,
  "recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
  "superseded_at" timestamp with time zone,
  "status" assertion_status NOT NULL,
  "confidence" numeric NOT NULL,
  "valid_from_source" valid_from_source,
  "created_by_run_id" uuid,
  "supersedes_link_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "knowledge_node" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "node_type_id" uuid NOT NULL,
  "canonical_name" text NOT NULL,
  "status" node_status DEFAULT 'active'::node_status NOT NULL,
  "merged_into_node_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "link_type" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "label" text NOT NULL,
  "description" text NOT NULL,
  "inverse_name" text NOT NULL,
  "is_temporal" boolean NOT NULL,
  "allows_multiple_current" boolean NOT NULL,
  "requires_valid_from" boolean NOT NULL,
  "requires_valid_to_on_change" boolean NOT NULL,
  "version" integer DEFAULT 1 NOT NULL
);
CREATE TABLE "link_type_rule" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "link_type_id" uuid NOT NULL,
  "source_node_type_id" uuid NOT NULL,
  "target_node_type_id" uuid NOT NULL,
  "valid_from" date,
  "valid_to" date
);
CREATE TABLE "llm_run" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "model" text NOT NULL,
  "prompt_version" text NOT NULL,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "finished_at" timestamp with time zone,
  "status" llm_run_status DEFAULT 'running'::llm_run_status NOT NULL,
  "attempts" integer DEFAULT 1 NOT NULL,
  "input_raw_information_id" uuid NOT NULL,
  "idempotency_key" text NOT NULL
);
CREATE TABLE "node_alias" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "node_id" uuid NOT NULL,
  "alias" text NOT NULL,
  "alias_norm" text GENERATED ALWAYS AS (norm(alias)) STORED,
  "kind" alias_kind DEFAULT 'alias'::alias_kind NOT NULL,
  "created_by_run_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "node_attribute" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "node_id" uuid NOT NULL,
  "attribute_key_id" uuid NOT NULL,
  "value_type" attribute_value_type NOT NULL,
  "value" text NOT NULL,
  "value_date" date GENERATED ALWAYS AS (
CASE
    WHEN (value_type = 'date'::attribute_value_type) THEN canonical_date(value)
    ELSE NULL::date
END) STORED,
  "value_number" numeric GENERATED ALWAYS AS (
CASE
    WHEN (value_type = 'number'::attribute_value_type) THEN canonical_number(value)
    ELSE NULL::numeric
END) STORED,
  "valid_from" date,
  "valid_to" date,
  "recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
  "superseded_at" timestamp with time zone,
  "status" assertion_status NOT NULL,
  "confidence" numeric NOT NULL,
  "valid_from_source" valid_from_source,
  "created_by_run_id" uuid,
  "supersedes_attribute_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "node_type" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "version" integer DEFAULT 1 NOT NULL
);
CREATE TABLE "provenance" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "link_id" uuid,
  "attribute_id" uuid,
  "fragment_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "raw_chunk" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "raw_information_id" uuid NOT NULL,
  "chunk_index" integer NOT NULL,
  "text" text NOT NULL,
  "offset_start" integer NOT NULL,
  "offset_end" integer NOT NULL,
  "locator" jsonb,
  "chunking_version" text DEFAULT 'v1'::text NOT NULL,
  "status" node_status DEFAULT 'active'::node_status NOT NULL,
  "superseded_at" timestamp with time zone,
  "text_search" tsvector GENERATED ALWAYS AS (to_tsvector('pt_unaccent_v1'::regconfig, text)) STORED
);
CREATE TABLE "raw_information" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "source_type" source_type NOT NULL,
  "content" text NOT NULL,
  "storage_ref" text,
  "content_hash" text NOT NULL,
  "received_at" timestamp with time zone DEFAULT now() NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" node_status DEFAULT 'active'::node_status NOT NULL,
  "superseded_at" timestamp with time zone,
  "original_input" text
);
CREATE TABLE "tool_call" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "llm_run_id" uuid NOT NULL,
  "tool_name" text NOT NULL,
  "arguments" jsonb NOT NULL,
  "result" jsonb,
  "validation_outcome" validation_outcome NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================
ALTER TABLE attribute_key ADD CONSTRAINT "attribute_key_allows_multiple_current_not_null" NOT NULL allows_multiple_current;
ALTER TABLE attribute_key ADD CONSTRAINT "attribute_key_description_not_null" NOT NULL description;
ALTER TABLE attribute_key ADD CONSTRAINT "attribute_key_id_not_null" NOT NULL id;
ALTER TABLE attribute_key ADD CONSTRAINT "attribute_key_id_value_type_key" UNIQUE (id, value_type);
ALTER TABLE attribute_key ADD CONSTRAINT "attribute_key_is_temporal_not_null" NOT NULL is_temporal;
ALTER TABLE attribute_key ADD CONSTRAINT "attribute_key_key_not_null" NOT NULL key;
ALTER TABLE attribute_key ADD CONSTRAINT "attribute_key_node_type_id_key_key" UNIQUE (node_type_id, key);
ALTER TABLE attribute_key ADD CONSTRAINT "attribute_key_node_type_id_not_null" NOT NULL node_type_id;
ALTER TABLE attribute_key ADD CONSTRAINT "attribute_key_pkey" PRIMARY KEY (id);
ALTER TABLE attribute_key ADD CONSTRAINT "attribute_key_requires_valid_from_not_null" NOT NULL requires_valid_from;
ALTER TABLE attribute_key ADD CONSTRAINT "attribute_key_value_type_not_null" NOT NULL value_type;
ALTER TABLE attribute_key ADD CONSTRAINT "attribute_key_version_not_null" NOT NULL version;
ALTER TABLE attribute_valid_value ADD CONSTRAINT "attribute_valid_value_attribute_key_id_not_null" NOT NULL attribute_key_id;
ALTER TABLE attribute_valid_value ADD CONSTRAINT "attribute_valid_value_attribute_key_id_value_key" UNIQUE (attribute_key_id, value);
ALTER TABLE attribute_valid_value ADD CONSTRAINT "attribute_valid_value_id_not_null" NOT NULL id;
ALTER TABLE attribute_valid_value ADD CONSTRAINT "attribute_valid_value_pkey" PRIMARY KEY (id);
ALTER TABLE attribute_valid_value ADD CONSTRAINT "attribute_valid_value_value_not_null" NOT NULL value;
ALTER TABLE attribute_valid_value ADD CONSTRAINT "attribute_valid_value_version_not_null" NOT NULL version;
ALTER TABLE chat_conversation ADD CONSTRAINT "chat_conversation_created_at_not_null" NOT NULL created_at;
ALTER TABLE chat_conversation ADD CONSTRAINT "chat_conversation_id_not_null" NOT NULL id;
ALTER TABLE chat_conversation ADD CONSTRAINT "chat_conversation_pkey" PRIMARY KEY (id);
ALTER TABLE chat_conversation ADD CONSTRAINT "chat_conversation_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE chat_graph_view ADD CONSTRAINT "chat_graph_view_conversation_id_not_null" NOT NULL conversation_id;
ALTER TABLE chat_graph_view ADD CONSTRAINT "chat_graph_view_pkey" PRIMARY KEY (conversation_id);
ALTER TABLE chat_graph_view ADD CONSTRAINT "chat_graph_view_snapshot_not_null" NOT NULL snapshot;
ALTER TABLE chat_graph_view ADD CONSTRAINT "chat_graph_view_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE chat_message ADD CONSTRAINT "chat_message_content_not_null" NOT NULL content;
ALTER TABLE chat_message ADD CONSTRAINT "chat_message_conversation_id_not_null" NOT NULL conversation_id;
ALTER TABLE chat_message ADD CONSTRAINT "chat_message_created_at_not_null" NOT NULL created_at;
ALTER TABLE chat_message ADD CONSTRAINT "chat_message_id_not_null" NOT NULL id;
ALTER TABLE chat_message ADD CONSTRAINT "chat_message_pkey" PRIMARY KEY (id);
ALTER TABLE chat_message ADD CONSTRAINT "chat_message_role_not_null" NOT NULL role;
ALTER TABLE chat_tool_call ADD CONSTRAINT "chat_tool_call_arguments_not_null" NOT NULL arguments;
ALTER TABLE chat_tool_call ADD CONSTRAINT "chat_tool_call_conversation_id_not_null" NOT NULL conversation_id;
ALTER TABLE chat_tool_call ADD CONSTRAINT "chat_tool_call_created_at_not_null" NOT NULL created_at;
ALTER TABLE chat_tool_call ADD CONSTRAINT "chat_tool_call_duration_ms_not_null" NOT NULL duration_ms;
ALTER TABLE chat_tool_call ADD CONSTRAINT "chat_tool_call_id_not_null" NOT NULL id;
ALTER TABLE chat_tool_call ADD CONSTRAINT "chat_tool_call_is_error_not_null" NOT NULL is_error;
ALTER TABLE chat_tool_call ADD CONSTRAINT "chat_tool_call_pkey" PRIMARY KEY (id);
ALTER TABLE chat_tool_call ADD CONSTRAINT "chat_tool_call_tool_name_not_null" NOT NULL tool_name;
ALTER TABLE compliance_deletion ADD CONSTRAINT "compliance_deletion_affected_not_null" NOT NULL affected;
ALTER TABLE compliance_deletion ADD CONSTRAINT "compliance_deletion_executed_at_not_null" NOT NULL executed_at;
ALTER TABLE compliance_deletion ADD CONSTRAINT "compliance_deletion_id_not_null" NOT NULL id;
ALTER TABLE compliance_deletion ADD CONSTRAINT "compliance_deletion_pkey" PRIMARY KEY (id);
ALTER TABLE compliance_deletion ADD CONSTRAINT "compliance_deletion_raw_information_id_not_null" NOT NULL raw_information_id;
ALTER TABLE compliance_deletion ADD CONSTRAINT "compliance_deletion_reason_not_null" NOT NULL reason;
ALTER TABLE curation_action ADD CONSTRAINT "curation_action_action_not_null" NOT NULL action;
ALTER TABLE curation_action ADD CONSTRAINT "curation_action_created_at_not_null" NOT NULL created_at;
ALTER TABLE curation_action ADD CONSTRAINT "curation_action_id_not_null" NOT NULL id;
ALTER TABLE curation_action ADD CONSTRAINT "curation_action_payload_not_null" NOT NULL payload;
ALTER TABLE curation_action ADD CONSTRAINT "curation_action_pkey" PRIMARY KEY (id);
ALTER TABLE curation_action ADD CONSTRAINT "curation_action_target_kind_not_null" NOT NULL target_kind;
ALTER TABLE entity_match_review ADD CONSTRAINT "entity_match_review_candidate_node_id_not_null" NOT NULL candidate_node_id;
ALTER TABLE entity_match_review ADD CONSTRAINT "entity_match_review_created_at_not_null" NOT NULL created_at;
ALTER TABLE entity_match_review ADD CONSTRAINT "entity_match_review_distinct_ck" CHECK ((node_id <> candidate_node_id));
ALTER TABLE entity_match_review ADD CONSTRAINT "entity_match_review_id_not_null" NOT NULL id;
ALTER TABLE entity_match_review ADD CONSTRAINT "entity_match_review_node_id_candidate_node_id_key" UNIQUE (node_id, candidate_node_id);
ALTER TABLE entity_match_review ADD CONSTRAINT "entity_match_review_node_id_not_null" NOT NULL node_id;
ALTER TABLE entity_match_review ADD CONSTRAINT "entity_match_review_pkey" PRIMARY KEY (id);
ALTER TABLE entity_match_review ADD CONSTRAINT "entity_match_review_similarity_check" CHECK (((similarity >= (0)::numeric) AND (similarity <= (1)::numeric)));
ALTER TABLE entity_match_review ADD CONSTRAINT "entity_match_review_similarity_not_null" NOT NULL similarity;
ALTER TABLE fragment_source ADD CONSTRAINT "fragment_source_fragment_id_not_null" NOT NULL fragment_id;
ALTER TABLE fragment_source ADD CONSTRAINT "fragment_source_pkey" PRIMARY KEY (fragment_id, raw_chunk_id);
ALTER TABLE fragment_source ADD CONSTRAINT "fragment_source_raw_chunk_id_not_null" NOT NULL raw_chunk_id;
ALTER TABLE information_fragment ADD CONSTRAINT "information_fragment_confidence_check" CHECK (((confidence >= (0)::numeric) AND (confidence <= (1)::numeric)));
ALTER TABLE information_fragment ADD CONSTRAINT "information_fragment_confidence_not_null" NOT NULL confidence;
ALTER TABLE information_fragment ADD CONSTRAINT "information_fragment_created_at_not_null" NOT NULL created_at;
ALTER TABLE information_fragment ADD CONSTRAINT "information_fragment_id_not_null" NOT NULL id;
ALTER TABLE information_fragment ADD CONSTRAINT "information_fragment_llm_run_id_not_null" NOT NULL llm_run_id;
ALTER TABLE information_fragment ADD CONSTRAINT "information_fragment_pkey" PRIMARY KEY (id);
ALTER TABLE information_fragment ADD CONSTRAINT "information_fragment_status_not_null" NOT NULL status;
ALTER TABLE information_fragment ADD CONSTRAINT "information_fragment_text_check" CHECK ((char_length(text) <= 1000));
ALTER TABLE information_fragment ADD CONSTRAINT "information_fragment_text_not_null" NOT NULL text;
ALTER TABLE knowledge_link ADD CONSTRAINT "knowledge_link_basis_ck" CHECK (((valid_from IS NULL) OR (valid_from_source IS NOT NULL)));
ALTER TABLE knowledge_link ADD CONSTRAINT "knowledge_link_confidence_check" CHECK (((confidence >= (0)::numeric) AND (confidence <= (1)::numeric)));
ALTER TABLE knowledge_link ADD CONSTRAINT "knowledge_link_confidence_not_null" NOT NULL confidence;
ALTER TABLE knowledge_link ADD CONSTRAINT "knowledge_link_created_at_not_null" NOT NULL created_at;
ALTER TABLE knowledge_link ADD CONSTRAINT "knowledge_link_id_not_null" NOT NULL id;
ALTER TABLE knowledge_link ADD CONSTRAINT "knowledge_link_interval_ck" CHECK (((valid_from IS NULL) OR (valid_to IS NULL) OR (valid_from < valid_to)));
ALTER TABLE knowledge_link ADD CONSTRAINT "knowledge_link_link_type_id_not_null" NOT NULL link_type_id;
ALTER TABLE knowledge_link ADD CONSTRAINT "knowledge_link_no_self_supersede_ck" CHECK ((supersedes_link_id IS DISTINCT FROM id));
ALTER TABLE knowledge_link ADD CONSTRAINT "knowledge_link_pkey" PRIMARY KEY (id);
ALTER TABLE knowledge_link ADD CONSTRAINT "knowledge_link_recorded_at_not_null" NOT NULL recorded_at;
ALTER TABLE knowledge_link ADD CONSTRAINT "knowledge_link_source_node_id_not_null" NOT NULL source_node_id;
ALTER TABLE knowledge_link ADD CONSTRAINT "knowledge_link_status_not_null" NOT NULL status;
ALTER TABLE knowledge_link ADD CONSTRAINT "knowledge_link_target_node_id_not_null" NOT NULL target_node_id;
ALTER TABLE knowledge_link ADD CONSTRAINT "knowledge_link_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE knowledge_node ADD CONSTRAINT "knowledge_node_canonical_name_not_null" NOT NULL canonical_name;
ALTER TABLE knowledge_node ADD CONSTRAINT "knowledge_node_created_at_not_null" NOT NULL created_at;
ALTER TABLE knowledge_node ADD CONSTRAINT "knowledge_node_id_not_null" NOT NULL id;
ALTER TABLE knowledge_node ADD CONSTRAINT "knowledge_node_merged_ck" CHECK (((status = 'merged'::node_status) = (merged_into_node_id IS NOT NULL)));
ALTER TABLE knowledge_node ADD CONSTRAINT "knowledge_node_no_self_merge_ck" CHECK ((merged_into_node_id IS DISTINCT FROM id));
ALTER TABLE knowledge_node ADD CONSTRAINT "knowledge_node_node_type_id_not_null" NOT NULL node_type_id;
ALTER TABLE knowledge_node ADD CONSTRAINT "knowledge_node_pkey" PRIMARY KEY (id);
ALTER TABLE knowledge_node ADD CONSTRAINT "knowledge_node_status_not_null" NOT NULL status;
ALTER TABLE knowledge_node ADD CONSTRAINT "knowledge_node_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE link_type ADD CONSTRAINT "link_type_allows_multiple_current_not_null" NOT NULL allows_multiple_current;
ALTER TABLE link_type ADD CONSTRAINT "link_type_description_not_null" NOT NULL description;
ALTER TABLE link_type ADD CONSTRAINT "link_type_id_not_null" NOT NULL id;
ALTER TABLE link_type ADD CONSTRAINT "link_type_inverse_name_not_null" NOT NULL inverse_name;
ALTER TABLE link_type ADD CONSTRAINT "link_type_is_temporal_not_null" NOT NULL is_temporal;
ALTER TABLE link_type ADD CONSTRAINT "link_type_label_not_null" NOT NULL label;
ALTER TABLE link_type ADD CONSTRAINT "link_type_name_key" UNIQUE (name);
ALTER TABLE link_type ADD CONSTRAINT "link_type_name_not_null" NOT NULL name;
ALTER TABLE link_type ADD CONSTRAINT "link_type_pkey" PRIMARY KEY (id);
ALTER TABLE link_type ADD CONSTRAINT "link_type_requires_valid_from_not_null" NOT NULL requires_valid_from;
ALTER TABLE link_type ADD CONSTRAINT "link_type_requires_valid_to_on_change_not_null" NOT NULL requires_valid_to_on_change;
ALTER TABLE link_type ADD CONSTRAINT "link_type_version_not_null" NOT NULL version;
ALTER TABLE link_type_rule ADD CONSTRAINT "link_type_rule_id_not_null" NOT NULL id;
ALTER TABLE link_type_rule ADD CONSTRAINT "link_type_rule_interval_ck" CHECK (((valid_from IS NULL) OR (valid_to IS NULL) OR (valid_from < valid_to)));
ALTER TABLE link_type_rule ADD CONSTRAINT "link_type_rule_link_type_id_not_null" NOT NULL link_type_id;
ALTER TABLE link_type_rule ADD CONSTRAINT "link_type_rule_pkey" PRIMARY KEY (id);
ALTER TABLE link_type_rule ADD CONSTRAINT "link_type_rule_source_node_type_id_not_null" NOT NULL source_node_type_id;
ALTER TABLE link_type_rule ADD CONSTRAINT "link_type_rule_target_node_type_id_not_null" NOT NULL target_node_type_id;
ALTER TABLE llm_run ADD CONSTRAINT "llm_run_attempts_check" CHECK ((attempts >= 1));
ALTER TABLE llm_run ADD CONSTRAINT "llm_run_attempts_not_null" NOT NULL attempts;
ALTER TABLE llm_run ADD CONSTRAINT "llm_run_finished_ck" CHECK (((status = 'running'::llm_run_status) = (finished_at IS NULL)));
ALTER TABLE llm_run ADD CONSTRAINT "llm_run_id_not_null" NOT NULL id;
ALTER TABLE llm_run ADD CONSTRAINT "llm_run_idempotency_key_key" UNIQUE (idempotency_key);
ALTER TABLE llm_run ADD CONSTRAINT "llm_run_idempotency_key_not_null" NOT NULL idempotency_key;
ALTER TABLE llm_run ADD CONSTRAINT "llm_run_input_raw_information_id_not_null" NOT NULL input_raw_information_id;
ALTER TABLE llm_run ADD CONSTRAINT "llm_run_model_not_null" NOT NULL model;
ALTER TABLE llm_run ADD CONSTRAINT "llm_run_pkey" PRIMARY KEY (id);
ALTER TABLE llm_run ADD CONSTRAINT "llm_run_prompt_version_not_null" NOT NULL prompt_version;
ALTER TABLE llm_run ADD CONSTRAINT "llm_run_started_at_not_null" NOT NULL started_at;
ALTER TABLE llm_run ADD CONSTRAINT "llm_run_status_not_null" NOT NULL status;
ALTER TABLE node_alias ADD CONSTRAINT "node_alias_alias_check" CHECK ((btrim(alias) <> ''::text));
ALTER TABLE node_alias ADD CONSTRAINT "node_alias_alias_norm_not_null" NOT NULL alias_norm;
ALTER TABLE node_alias ADD CONSTRAINT "node_alias_alias_not_null" NOT NULL alias;
ALTER TABLE node_alias ADD CONSTRAINT "node_alias_created_at_not_null" NOT NULL created_at;
ALTER TABLE node_alias ADD CONSTRAINT "node_alias_id_not_null" NOT NULL id;
ALTER TABLE node_alias ADD CONSTRAINT "node_alias_kind_not_null" NOT NULL kind;
ALTER TABLE node_alias ADD CONSTRAINT "node_alias_node_id_alias_norm_key" UNIQUE (node_id, alias_norm);
ALTER TABLE node_alias ADD CONSTRAINT "node_alias_node_id_not_null" NOT NULL node_id;
ALTER TABLE node_alias ADD CONSTRAINT "node_alias_pkey" PRIMARY KEY (id);
ALTER TABLE node_attribute ADD CONSTRAINT "node_attribute_attribute_key_id_not_null" NOT NULL attribute_key_id;
ALTER TABLE node_attribute ADD CONSTRAINT "node_attribute_basis_ck" CHECK (((valid_from IS NULL) OR (valid_from_source IS NOT NULL)));
ALTER TABLE node_attribute ADD CONSTRAINT "node_attribute_confidence_check" CHECK (((confidence >= (0)::numeric) AND (confidence <= (1)::numeric)));
ALTER TABLE node_attribute ADD CONSTRAINT "node_attribute_confidence_not_null" NOT NULL confidence;
ALTER TABLE node_attribute ADD CONSTRAINT "node_attribute_created_at_not_null" NOT NULL created_at;
ALTER TABLE node_attribute ADD CONSTRAINT "node_attribute_id_not_null" NOT NULL id;
ALTER TABLE node_attribute ADD CONSTRAINT "node_attribute_interval_ck" CHECK (((valid_from IS NULL) OR (valid_to IS NULL) OR (valid_from < valid_to)));
ALTER TABLE node_attribute ADD CONSTRAINT "node_attribute_no_self_supersede_ck" CHECK ((supersedes_attribute_id IS DISTINCT FROM id));
ALTER TABLE node_attribute ADD CONSTRAINT "node_attribute_node_id_not_null" NOT NULL node_id;
ALTER TABLE node_attribute ADD CONSTRAINT "node_attribute_pkey" PRIMARY KEY (id);
ALTER TABLE node_attribute ADD CONSTRAINT "node_attribute_recorded_at_not_null" NOT NULL recorded_at;
ALTER TABLE node_attribute ADD CONSTRAINT "node_attribute_status_not_null" NOT NULL status;
ALTER TABLE node_attribute ADD CONSTRAINT "node_attribute_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE node_attribute ADD CONSTRAINT "node_attribute_value_not_null" NOT NULL value;
ALTER TABLE node_attribute ADD CONSTRAINT "node_attribute_value_type_not_null" NOT NULL value_type;
ALTER TABLE node_type ADD CONSTRAINT "node_type_description_not_null" NOT NULL description;
ALTER TABLE node_type ADD CONSTRAINT "node_type_id_not_null" NOT NULL id;
ALTER TABLE node_type ADD CONSTRAINT "node_type_name_key" UNIQUE (name);
ALTER TABLE node_type ADD CONSTRAINT "node_type_name_not_null" NOT NULL name;
ALTER TABLE node_type ADD CONSTRAINT "node_type_pkey" PRIMARY KEY (id);
ALTER TABLE node_type ADD CONSTRAINT "node_type_version_not_null" NOT NULL version;
ALTER TABLE provenance ADD CONSTRAINT "provenance_created_at_not_null" NOT NULL created_at;
ALTER TABLE provenance ADD CONSTRAINT "provenance_fragment_id_not_null" NOT NULL fragment_id;
ALTER TABLE provenance ADD CONSTRAINT "provenance_id_not_null" NOT NULL id;
ALTER TABLE provenance ADD CONSTRAINT "provenance_pkey" PRIMARY KEY (id);
ALTER TABLE provenance ADD CONSTRAINT "provenance_target_ck" CHECK ((num_nonnulls(link_id, attribute_id) = 1));
ALTER TABLE raw_chunk ADD CONSTRAINT "raw_chunk_chunk_index_check" CHECK ((chunk_index >= 0));
ALTER TABLE raw_chunk ADD CONSTRAINT "raw_chunk_chunk_index_not_null" NOT NULL chunk_index;
ALTER TABLE raw_chunk ADD CONSTRAINT "raw_chunk_chunking_version_not_null" NOT NULL chunking_version;
ALTER TABLE raw_chunk ADD CONSTRAINT "raw_chunk_id_not_null" NOT NULL id;
ALTER TABLE raw_chunk ADD CONSTRAINT "raw_chunk_offset_end_not_null" NOT NULL offset_end;
ALTER TABLE raw_chunk ADD CONSTRAINT "raw_chunk_offset_start_check" CHECK ((offset_start >= 0));
ALTER TABLE raw_chunk ADD CONSTRAINT "raw_chunk_offset_start_not_null" NOT NULL offset_start;
ALTER TABLE raw_chunk ADD CONSTRAINT "raw_chunk_offsets_ck" CHECK ((offset_end > offset_start));
ALTER TABLE raw_chunk ADD CONSTRAINT "raw_chunk_pkey" PRIMARY KEY (id);
ALTER TABLE raw_chunk ADD CONSTRAINT "raw_chunk_raw_information_id_chunking_version_chunk_index_key" UNIQUE (raw_information_id, chunking_version, chunk_index);
ALTER TABLE raw_chunk ADD CONSTRAINT "raw_chunk_raw_information_id_not_null" NOT NULL raw_information_id;
ALTER TABLE raw_chunk ADD CONSTRAINT "raw_chunk_status_not_null" NOT NULL status;
ALTER TABLE raw_chunk ADD CONSTRAINT "raw_chunk_text_not_null" NOT NULL text;
ALTER TABLE raw_information ADD CONSTRAINT "raw_information_content_hash_check" CHECK ((content_hash ~ '^[0-9a-f]{64}$'::text));
ALTER TABLE raw_information ADD CONSTRAINT "raw_information_content_hash_key" UNIQUE (content_hash);
ALTER TABLE raw_information ADD CONSTRAINT "raw_information_content_hash_not_null" NOT NULL content_hash;
ALTER TABLE raw_information ADD CONSTRAINT "raw_information_content_not_null" NOT NULL content;
ALTER TABLE raw_information ADD CONSTRAINT "raw_information_id_not_null" NOT NULL id;
ALTER TABLE raw_information ADD CONSTRAINT "raw_information_metadata_not_null" NOT NULL metadata;
ALTER TABLE raw_information ADD CONSTRAINT "raw_information_pkey" PRIMARY KEY (id);
ALTER TABLE raw_information ADD CONSTRAINT "raw_information_received_at_not_null" NOT NULL received_at;
ALTER TABLE raw_information ADD CONSTRAINT "raw_information_source_type_not_null" NOT NULL source_type;
ALTER TABLE raw_information ADD CONSTRAINT "raw_information_status_not_null" NOT NULL status;
ALTER TABLE tool_call ADD CONSTRAINT "tool_call_arguments_not_null" NOT NULL arguments;
ALTER TABLE tool_call ADD CONSTRAINT "tool_call_created_at_not_null" NOT NULL created_at;
ALTER TABLE tool_call ADD CONSTRAINT "tool_call_id_not_null" NOT NULL id;
ALTER TABLE tool_call ADD CONSTRAINT "tool_call_llm_run_id_not_null" NOT NULL llm_run_id;
ALTER TABLE tool_call ADD CONSTRAINT "tool_call_pkey" PRIMARY KEY (id);
ALTER TABLE tool_call ADD CONSTRAINT "tool_call_tool_name_not_null" NOT NULL tool_name;
ALTER TABLE tool_call ADD CONSTRAINT "tool_call_validation_outcome_not_null" NOT NULL validation_outcome;
ALTER TABLE attribute_key ADD CONSTRAINT "attribute_key_node_type_id_fkey" FOREIGN KEY (node_type_id) REFERENCES node_type(id);
ALTER TABLE attribute_valid_value ADD CONSTRAINT "attribute_valid_value_attribute_key_id_fkey" FOREIGN KEY (attribute_key_id) REFERENCES attribute_key(id);
ALTER TABLE chat_graph_view ADD CONSTRAINT "chat_graph_view_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES chat_conversation(id) ON DELETE CASCADE;
ALTER TABLE chat_message ADD CONSTRAINT "chat_message_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES chat_conversation(id) ON DELETE CASCADE;
ALTER TABLE chat_tool_call ADD CONSTRAINT "chat_tool_call_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES chat_conversation(id) ON DELETE CASCADE;
ALTER TABLE chat_tool_call ADD CONSTRAINT "chat_tool_call_message_id_fkey" FOREIGN KEY (message_id) REFERENCES chat_message(id) ON DELETE SET NULL;
ALTER TABLE compliance_deletion ADD CONSTRAINT "compliance_deletion_raw_information_id_fkey" FOREIGN KEY (raw_information_id) REFERENCES raw_information(id);
ALTER TABLE entity_match_review ADD CONSTRAINT "entity_match_review_candidate_node_id_fkey" FOREIGN KEY (candidate_node_id) REFERENCES knowledge_node(id);
ALTER TABLE entity_match_review ADD CONSTRAINT "entity_match_review_node_id_fkey" FOREIGN KEY (node_id) REFERENCES knowledge_node(id);
ALTER TABLE fragment_source ADD CONSTRAINT "fragment_source_fragment_id_fkey" FOREIGN KEY (fragment_id) REFERENCES information_fragment(id);
ALTER TABLE fragment_source ADD CONSTRAINT "fragment_source_raw_chunk_id_fkey" FOREIGN KEY (raw_chunk_id) REFERENCES raw_chunk(id);
ALTER TABLE information_fragment ADD CONSTRAINT "information_fragment_llm_run_id_fkey" FOREIGN KEY (llm_run_id) REFERENCES llm_run(id);
ALTER TABLE knowledge_link ADD CONSTRAINT "knowledge_link_created_by_run_id_fkey" FOREIGN KEY (created_by_run_id) REFERENCES llm_run(id);
ALTER TABLE knowledge_link ADD CONSTRAINT "knowledge_link_link_type_id_fkey" FOREIGN KEY (link_type_id) REFERENCES link_type(id);
ALTER TABLE knowledge_link ADD CONSTRAINT "knowledge_link_source_node_id_fkey" FOREIGN KEY (source_node_id) REFERENCES knowledge_node(id);
ALTER TABLE knowledge_link ADD CONSTRAINT "knowledge_link_supersedes_link_id_fkey" FOREIGN KEY (supersedes_link_id) REFERENCES knowledge_link(id);
ALTER TABLE knowledge_link ADD CONSTRAINT "knowledge_link_target_node_id_fkey" FOREIGN KEY (target_node_id) REFERENCES knowledge_node(id);
ALTER TABLE knowledge_node ADD CONSTRAINT "knowledge_node_merged_into_node_id_fkey" FOREIGN KEY (merged_into_node_id) REFERENCES knowledge_node(id);
ALTER TABLE knowledge_node ADD CONSTRAINT "knowledge_node_node_type_id_fkey" FOREIGN KEY (node_type_id) REFERENCES node_type(id);
ALTER TABLE link_type_rule ADD CONSTRAINT "link_type_rule_link_type_id_fkey" FOREIGN KEY (link_type_id) REFERENCES link_type(id);
ALTER TABLE link_type_rule ADD CONSTRAINT "link_type_rule_source_node_type_id_fkey" FOREIGN KEY (source_node_type_id) REFERENCES node_type(id);
ALTER TABLE link_type_rule ADD CONSTRAINT "link_type_rule_target_node_type_id_fkey" FOREIGN KEY (target_node_type_id) REFERENCES node_type(id);
ALTER TABLE llm_run ADD CONSTRAINT "llm_run_input_raw_information_id_fkey" FOREIGN KEY (input_raw_information_id) REFERENCES raw_information(id);
ALTER TABLE node_alias ADD CONSTRAINT "node_alias_created_by_run_id_fkey" FOREIGN KEY (created_by_run_id) REFERENCES llm_run(id);
ALTER TABLE node_alias ADD CONSTRAINT "node_alias_node_id_fkey" FOREIGN KEY (node_id) REFERENCES knowledge_node(id);
ALTER TABLE node_attribute ADD CONSTRAINT "node_attribute_attribute_key_id_value_type_fkey" FOREIGN KEY (attribute_key_id, value_type) REFERENCES attribute_key(id, value_type);
ALTER TABLE node_attribute ADD CONSTRAINT "node_attribute_created_by_run_id_fkey" FOREIGN KEY (created_by_run_id) REFERENCES llm_run(id);
ALTER TABLE node_attribute ADD CONSTRAINT "node_attribute_node_id_fkey" FOREIGN KEY (node_id) REFERENCES knowledge_node(id);
ALTER TABLE node_attribute ADD CONSTRAINT "node_attribute_supersedes_attribute_id_fkey" FOREIGN KEY (supersedes_attribute_id) REFERENCES node_attribute(id);
ALTER TABLE provenance ADD CONSTRAINT "provenance_attribute_id_fkey" FOREIGN KEY (attribute_id) REFERENCES node_attribute(id);
ALTER TABLE provenance ADD CONSTRAINT "provenance_fragment_id_fkey" FOREIGN KEY (fragment_id) REFERENCES information_fragment(id);
ALTER TABLE provenance ADD CONSTRAINT "provenance_link_id_fkey" FOREIGN KEY (link_id) REFERENCES knowledge_link(id);
ALTER TABLE raw_chunk ADD CONSTRAINT "raw_chunk_raw_information_id_fkey" FOREIGN KEY (raw_information_id) REFERENCES raw_information(id);
ALTER TABLE tool_call ADD CONSTRAINT "tool_call_llm_run_id_fkey" FOREIGN KEY (llm_run_id) REFERENCES llm_run(id);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX attribute_key_node_type_idx ON public.attribute_key USING btree (node_type_id);
CREATE INDEX attribute_valid_value_key_idx ON public.attribute_valid_value USING btree (attribute_key_id);
CREATE INDEX compliance_deletion_raw_idx ON public.compliance_deletion USING btree (raw_information_id);
CREATE INDEX curation_action_target_idx ON public.curation_action USING btree (target_kind, target_id);
CREATE INDEX entity_match_review_candidate_idx ON public.entity_match_review USING btree (candidate_node_id);
CREATE INDEX fragment_source_chunk_idx ON public.fragment_source USING btree (raw_chunk_id);
CREATE INDEX idx_chat_conversation_created_at_id_desc ON public.chat_conversation USING btree (created_at DESC, id DESC);
CREATE INDEX idx_chat_message_conversation_created_at ON public.chat_message USING btree (conversation_id, created_at);
CREATE UNIQUE INDEX idx_chat_message_idempotency ON public.chat_message USING btree (conversation_id, idempotency_key) WHERE (idempotency_key IS NOT NULL);
CREATE INDEX idx_chat_tool_call_conversation ON public.chat_tool_call USING btree (conversation_id);
CREATE INDEX information_fragment_fts_idx ON public.information_fragment USING gin (text_search) WHERE (status = 'accepted'::fragment_status);
CREATE INDEX information_fragment_run_idx ON public.information_fragment USING btree (llm_run_id);
CREATE UNIQUE INDEX knowledge_link_current_dup_guard ON public.knowledge_link USING btree (source_node_id, target_node_id, link_type_id) WHERE ((valid_to IS NULL) AND (superseded_at IS NULL));
CREATE INDEX knowledge_link_disputed_idx ON public.knowledge_link USING btree (recorded_at) WHERE (status = 'disputed'::assertion_status);
CREATE INDEX knowledge_link_run_idx ON public.knowledge_link USING btree (created_by_run_id);
CREATE INDEX knowledge_link_source_idx ON public.knowledge_link USING btree (source_node_id);
CREATE INDEX knowledge_link_supersedes_idx ON public.knowledge_link USING btree (supersedes_link_id);
CREATE INDEX knowledge_link_target_idx ON public.knowledge_link USING btree (target_node_id);
CREATE INDEX knowledge_link_type_idx ON public.knowledge_link USING btree (link_type_id);
CREATE INDEX knowledge_node_merged_idx ON public.knowledge_node USING btree (merged_into_node_id) WHERE (merged_into_node_id IS NOT NULL);
CREATE INDEX knowledge_node_needs_review_idx ON public.knowledge_node USING btree (created_at) WHERE (status = 'needs_review'::node_status);
CREATE INDEX knowledge_node_type_idx ON public.knowledge_node USING btree (node_type_id);
CREATE INDEX link_type_rule_link_type_idx ON public.link_type_rule USING btree (link_type_id);
CREATE INDEX link_type_rule_source_idx ON public.link_type_rule USING btree (source_node_type_id);
CREATE INDEX link_type_rule_target_idx ON public.link_type_rule USING btree (target_node_type_id);
CREATE INDEX llm_run_input_idx ON public.llm_run USING btree (input_raw_information_id);
CREATE INDEX node_alias_fts_idx ON public.node_alias USING gin (to_tsvector('simple_unaccent_v1'::regconfig, alias));
CREATE INDEX node_alias_norm_idx ON public.node_alias USING btree (alias_norm);
CREATE INDEX node_alias_norm_trgm_idx ON public.node_alias USING gin (alias_norm gin_trgm_ops);
CREATE UNIQUE INDEX node_alias_one_canonical_uq ON public.node_alias USING btree (node_id) WHERE (kind = 'canonical'::alias_kind);
CREATE INDEX node_alias_run_idx ON public.node_alias USING btree (created_by_run_id);
CREATE UNIQUE INDEX node_attribute_current_dup_guard ON public.node_attribute USING btree (node_id, attribute_key_id, value) WHERE ((valid_to IS NULL) AND (superseded_at IS NULL));
CREATE INDEX node_attribute_disputed_idx ON public.node_attribute USING btree (recorded_at) WHERE (status = 'disputed'::assertion_status);
CREATE INDEX node_attribute_key_idx ON public.node_attribute USING btree (attribute_key_id);
CREATE INDEX node_attribute_node_idx ON public.node_attribute USING btree (node_id);
CREATE INDEX node_attribute_run_idx ON public.node_attribute USING btree (created_by_run_id);
CREATE INDEX node_attribute_supersedes_idx ON public.node_attribute USING btree (supersedes_attribute_id);
CREATE INDEX node_attribute_value_date_idx ON public.node_attribute USING btree (value_date) WHERE (value_date IS NOT NULL);
CREATE INDEX node_attribute_value_number_idx ON public.node_attribute USING btree (value_number) WHERE (value_number IS NOT NULL);
CREATE UNIQUE INDEX provenance_attr_fragment_uq ON public.provenance USING btree (attribute_id, fragment_id) WHERE (attribute_id IS NOT NULL);
CREATE INDEX provenance_attr_idx ON public.provenance USING btree (attribute_id);
CREATE INDEX provenance_fragment_idx ON public.provenance USING btree (fragment_id);
CREATE UNIQUE INDEX provenance_link_fragment_uq ON public.provenance USING btree (link_id, fragment_id) WHERE (link_id IS NOT NULL);
CREATE INDEX provenance_link_idx ON public.provenance USING btree (link_id);
CREATE INDEX raw_chunk_fts_idx ON public.raw_chunk USING gin (text_search) WHERE (superseded_at IS NULL);
CREATE INDEX tool_call_run_idx ON public.tool_call USING btree (llm_run_id);

-- ============================================================================
-- VIEWS
-- ============================================================================
CREATE OR REPLACE VIEW "knowledge_link_resolved" AS
 SELECT kl.id,
    kl.source_node_id,
    kl.target_node_id,
    kl.link_type_id,
    kl.valid_from,
    kl.valid_to,
    kl.recorded_at,
    kl.superseded_at,
    kl.status,
    kl.confidence,
    kl.valid_from_source,
    kl.created_by_run_id,
    kl.supersedes_link_id,
    kl.created_at,
    kl.updated_at,
    lt.name AS link_type,
    lt.inverse_name AS link_inverse_name,
    kl.valid_to IS NULL AND kl.superseded_at IS NULL AS is_current,
    kl.valid_to IS NULL AND kl.superseded_at IS NULL AND (kl.valid_from IS NULL OR kl.valid_from <= CURRENT_DATE) AS is_in_effect,
        CASE
            WHEN kl.status = 'active'::assertion_status AND kl.valid_to IS NOT NULL AND kl.valid_to <= CURRENT_DATE THEN 'inactive'::text
            ELSE kl.status::text
        END AS effective_status
   FROM knowledge_link kl
     JOIN link_type lt ON lt.id = kl.link_type_id;
CREATE OR REPLACE VIEW "node_attribute_resolved" AS
 SELECT na.id,
    na.node_id,
    na.attribute_key_id,
    na.value_type,
    na.value,
    na.value_date,
    na.value_number,
    na.valid_from,
    na.valid_to,
    na.recorded_at,
    na.superseded_at,
    na.status,
    na.confidence,
    na.valid_from_source,
    na.created_by_run_id,
    na.supersedes_attribute_id,
    na.created_at,
    na.updated_at,
    ak.key AS attribute_key,
    ak.is_temporal AS key_is_temporal,
    ak.allows_multiple_current AS key_allows_multiple_current,
    na.valid_to IS NULL AND na.superseded_at IS NULL AS is_current,
    na.valid_to IS NULL AND na.superseded_at IS NULL AND (na.valid_from IS NULL OR na.valid_from <= CURRENT_DATE) AS is_in_effect,
        CASE
            WHEN na.status = 'active'::assertion_status AND na.valid_to IS NOT NULL AND na.valid_to <= CURRENT_DATE THEN 'inactive'::text
            ELSE na.status::text
        END AS effective_status
   FROM node_attribute na
     JOIN attribute_key ak ON ak.id = na.attribute_key_id;

-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE TRIGGER trg_chat_conversation_set_updated_at BEFORE UPDATE ON public.chat_conversation FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_knowledge_link_updated_at BEFORE UPDATE ON public.knowledge_link FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_knowledge_node_updated_at BEFORE UPDATE ON public.knowledge_node FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_node_attribute_updated_at BEFORE UPDATE ON public.node_attribute FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON COLUMN "raw_information"."original_input" IS 'Verbatim do turno de usuario que disparou uma ingestao dirigida (chat). Null fora do chat. Coberto por compliance_delete.';
