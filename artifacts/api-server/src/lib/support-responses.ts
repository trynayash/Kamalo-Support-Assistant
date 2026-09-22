/** Shared Stage-1 customer-facing lines used by API and UI matching. */

/** Honest unknown for KAMALO topics not covered by approved knowledge. Shows Raise-a-ticket UI. */
export const UNKNOWN_KAMALO_RESPONSE =
  "I am not able to confirm that from the KAMALO knowledge I have right now. Please raise a ticket so our team can review your query and get back to you.";

/** Truly non-KAMALO questions. */
export const OUT_OF_SCOPE_RESPONSE = "Sorry, please email info@kamalo.app.";

export function isUnknownKamaloResponse(content: string): boolean {
  const normalized = content.trim().toLowerCase();
  return normalized.includes("raise a ticket")
    || normalized.includes("i am not able to confirm that from the kamalo knowledge")
    || normalized.includes("i don't have confirmed information about that in the kamalo information available to me");
}
