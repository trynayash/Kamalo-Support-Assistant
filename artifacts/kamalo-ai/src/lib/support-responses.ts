/** Customer-facing support lines — keep in sync with api-server/src/lib/support-responses.ts */

export const UNKNOWN_KAMALO_RESPONSE =
  "I am not able to confirm that from the KAMALO knowledge I have right now. Please raise a ticket so our team can review your query and get back to you.";

export function isUnknownKamaloResponse(content: string): boolean {
  const normalized = content.trim().toLowerCase();
  return normalized.includes("raise a ticket")
    || normalized.includes("i am not able to confirm that from the kamalo knowledge")
    || normalized.includes("i don't have confirmed information about that in the kamalo information available to me");
}
