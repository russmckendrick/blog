// Detects a fal/OpenAI content-policy refusal in a thrown error so callers can react (e.g. retry
// with a different or smaller input set). Kept dependency-free so both the orchestrators and the
// image backends can import it without creating an import cycle.
export function isContentPolicyViolation(error) {
  return Boolean(error?.body?.detail?.some?.(detail => detail.type === 'content_policy_violation'))
}
