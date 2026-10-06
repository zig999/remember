# Retire task/close-testable-remainders/prompt-version-known

Named by the human, in their own words: "Pode fazer 1 e 2", answering the recommendation "Retirar a tarefa prompt-version-known do plano".

The human chose to keep the contract ("Manter o contrato"): contracts/knowledge-base/ingestion already states that a refused prompt version answers SYSTEM_INTERNAL_ERROR carrying the failed run, so the run is recorded in status failed and the delivered code conforms.
The task's only criterion came from the auditor's remainder in siegard-reconcile/aliases-fuzzy-context-3.md ("expect no LLM run to be recorded with that version"), which contradicts that contract, so no test can close it.
The task had no delivery record.
