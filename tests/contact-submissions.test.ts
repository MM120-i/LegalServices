import assert from "node:assert/strict";
import { test } from "node:test";

import { handleContact } from "../src/lib/contact-server.ts";

const config = {
  apiKey: "mock-key-no-real-email",
  from: "sender@example.test",
  to: "client@example.test",
};

const scenarios = [
  {
    name: "traffic inquiry with acknowledgement",
    topic: "traffic-tickets",
    email: "visitor@example.test",
  },
  { name: "housing inquiry without email", topic: "landlord-tenant", email: "" },
  {
    name: "notary inquiry with acknowledgement",
    topic: "notary",
    email: "notary-visitor@example.test",
  },
];

for (const [index, scenario] of scenarios.entries()) {
  test(`mocked accepted submission: ${scenario.name}`, async () => {
    const submissionId = `12345678-1234-1234-1234-${String(index + 1).padStart(12, "0")}`;

    const inquiry = {
      name: "Fictional QA Visitor",
      phone: "416-555-0123",
      message: "Fictional QA scenario only.",
      consent: true,
      topic: scenario.topic,
      email: scenario.email,
      submissionId,
    };

    const requests: { key: string | null; payload: Record<string, unknown>[] }[] = [];

    const fetcher: typeof fetch = async (_url, options) => {
      const payload = JSON.parse(String(options?.body));
      const key = new Headers(options?.headers).get("Idempotency-Key");

      requests.push({ key, payload });

      return Response.json({
        data: payload.map((_: unknown, index: number) => ({ id: `mock-${index}` })),
      });
    };

    // Identical browser retries must retain the same provider idempotency key.
    for (let attempt = 0; attempt < 2; attempt++) {
      const request = new Request("http://localhost:3100/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(inquiry),
      });

      const response = await handleContact(request, { config, fetcher, limit: () => true });

      assert.equal(response.status, 200);
      assert.equal((await response.json()).ok, true);
    }

    assert.equal(requests[0].key, `lexora-inquiry/${submissionId}`);
    assert.equal(requests[1].key, requests[0].key);
    assert.equal(requests[0].payload.length, scenario.email ? 2 : 1);
    assert.ok(String(requests[0].payload[0].subject).includes("Fictional QA Visitor"));

    if (scenario.email) {
      const acknowledgement = requests[0].payload[1];

      assert.deepEqual(acknowledgement.to, [scenario.email]);
      assert.ok(!String(acknowledgement.text).includes(inquiry.message));
      assert.match(String(acknowledgement.text), /does not mean.*accepted/s);
    }
  });
}
