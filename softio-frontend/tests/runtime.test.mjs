import assert from "node:assert/strict";
import test from "node:test";

test("the login route serves the application shell", async () => {
  const baseUrl = process.env.SOFTIO_BASE_URL || "http://127.0.0.1:5175";
  const response = await fetch(new URL("/login", baseUrl));
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /id="root"/);
  assert.match(html, /\/src\/main\.tsx/);
});
