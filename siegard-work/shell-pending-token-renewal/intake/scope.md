# Scope

The ask, verbatim: "siga com a implementação do analyse acima".

Make the shell's pending curation total obey the rules the analysis committed in a410913:

- rules/application-shell/an-expired-token-is-renewed-by-the-pending-read: a 401 on the pending curation read asks the identity provider once for a fresh access token with the session cookie and asks the read once more with it.
- rules/application-shell/a-failed-renewal-on-the-pending-read-ends-the-session: a failed renewal clears the stored token and replaces the page with the sign-in address and the reason session_expired.

The health read is unchanged: it carries no bearer.

Target: frontend. The pending curation read lives in frontend/src/shell/api/use-shell-status.ts.
