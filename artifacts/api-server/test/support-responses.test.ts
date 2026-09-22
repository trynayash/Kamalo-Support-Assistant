import assert from "node:assert/strict";
import { test } from "node:test";
import { isUnknownKamaloResponse, UNKNOWN_KAMALO_RESPONSE } from "../src/lib/support-responses";

test("unknown KAMALO response invites ticket escalation", () => {
  assert.match(UNKNOWN_KAMALO_RESPONSE, /raise a ticket/i);
  assert.match(UNKNOWN_KAMALO_RESPONSE, /team/i);
  assert.equal(isUnknownKamaloResponse(UNKNOWN_KAMALO_RESPONSE), true);
  assert.equal(isUnknownKamaloResponse("KAMALO Coins are reward units."), false);
});
