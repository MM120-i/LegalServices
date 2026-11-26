import assert from "node:assert/strict";
import { test } from "node:test";
import { isEmail, validateContact } from "../src/lib/contact.ts";
import { handleContact } from "../src/lib/contact-server.ts";

const inquiry = {
  name: "Sharf Uddin Abead",
  phone: "416-555-0123",
  email: "visitor+consultation@example.ca",
  topic: "other",
  message: "A short inquiry.",
  consent: true,
};

test("names accept international scripts and common punctuation without requiring two parts", () => {
  for (const name of [
    "O’Connor",
    "Anne-Marie",
    "José",
    "李雷",
    "محمد",
    "শরফ",
    "Jose\u0301",
    "Prince",
    "J. Smith",
  ]) {
    assert.equal(validateContact({ ...inquiry, name }).ok, true, name);
  }

  for (const name of [
    "12345",
    "Test123",
    "---",
    "😀😀",
    "<script>",
    "Header\nInjection",
    "A",
    "a".repeat(101),
  ]) {
    const result = validateContact({ ...inquiry, name });
    assert.equal(result.ok, false, name);

    if (!result.ok) {
      assert.ok(result.errors.name);
    }
  }

  const normalized = validateContact({ ...inquiry, name: "  José   Smith  " });
  assert.ok(normalized.ok);
  assert.equal(normalized.value.name, "José Smith");
});

test("email syntax supports plus addressing and subdomains but rejects malformed addresses", () => {
  for (const email of ["a+b@example.ca", "first.last@sub.example.com", "o'connor@example.ca"])
    assert.equal(isEmail(email), true, email);

  for (const email of [
    "a..b@example.ca",
    ".a@example.ca",
    "a.@example.ca",
    "a@-example.ca",
    "a@example-.ca",
    "a@example..ca",
    "a@@example.ca",
    "a b@example.ca",
    "a@example.ca\r\nBcc:x@example.ca",
    "a@localhost",
    "a".repeat(65) + "@example.ca",
  ]) {
    assert.equal(isEmail(email), false, email);
  }

  assert.equal(validateContact({ ...inquiry, email: "" }).ok, true);
});

test("phone input accepts complete local and international numbers", () => {
  for (const phone of [
    "4165550123",
    "(416) 555-0123",
    "+1 (416) 555-0123",
    "1-416-555-0123",
    "+44 20 7946 0958",
    "+880 1712 345678",
  ]) {
    assert.equal(validateContact({ ...inquiry, phone }).ok, true, phone);
  }

  for (const phone of [
    "1234567",
    "0000000000",
    "1111111111",
    "416555",
    "416+5550123",
    "++14165550123",
    "(4165550123",
    "+0123456789",
    "+1234567890123456",
    "call me",
  ]) {
    const result = validateContact({ ...inquiry, phone });
    assert.equal(result.ok, false, phone);

    if (!result.ok) {
      assert.ok(result.errors.phone);
    }
  }
});

test("invalid submissions never reach the delivery provider", async () => {
  let deliveries = 0;

  for (const change of [
    { name: "1234" },
    { email: "a..b@example.ca" },
    { phone: "1234567" },
    { topic: "invented" },
    { consent: false },
    { message: "x".repeat(2001) },
  ]) {
    const response = await handleContact(
      new Request("http://localhost:3100/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...inquiry, ...change }),
      }),
      {
        config: { apiKey: "fake", to: "office@example.test", from: "sender@example.test" },
        fetcher: async () => {
          deliveries++;
          throw new Error("Must not send");
        },
      },
    );

    assert.equal(response.status, 422);
    assert.ok(Object.keys((await response.json()).errors).length > 0);
  }

  assert.equal(deliveries, 0);
});
