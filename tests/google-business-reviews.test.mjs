import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const moduleUrl = (text) =>
  `data:text/javascript;base64,${Buffer.from(text).toString("base64")}`;
const source = ts.transpileModule(
  readFileSync(new URL("../src/lib/google-business-reviews.server.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } },
).outputText;
const { googleBusinessReviewsApi } = await import(moduleUrl(source));

const envKeys = [
  "GOOGLE_BUSINESS_CLIENT_ID",
  "GOOGLE_BUSINESS_CLIENT_SECRET",
  "GOOGLE_BUSINESS_REFRESH_TOKEN",
  "GOOGLE_BUSINESS_ACCOUNT_ID",
  "GOOGLE_BUSINESS_LOCATION_ID",
];
const previous = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
const nativeFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = nativeFetch;
  for (const [key, value] of Object.entries(previous))
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
});

test("unconfigured Google review feed stays optional", async () => {
  for (const key of envKeys) delete process.env[key];
  const response = await googleBusinessReviewsApi(
    new Request("https://sperinservices.co.uk/api/google-reviews"),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { configured: false, reviews: [] });
});

test("Google review feed refreshes OAuth and returns public review fields", async () => {
  Object.assign(process.env, {
    GOOGLE_BUSINESS_CLIENT_ID: "client-id",
    GOOGLE_BUSINESS_CLIENT_SECRET: "client-secret",
    GOOGLE_BUSINESS_REFRESH_TOKEN: "refresh-token",
    GOOGLE_BUSINESS_ACCOUNT_ID: "123",
    GOOGLE_BUSINESS_LOCATION_ID: "456",
  });

  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push([String(url), init]);
    if (String(url) === "https://oauth2.googleapis.com/token")
      return new Response(JSON.stringify({ access_token: "access-token" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    assert.match(
      String(url),
      /^https:\/\/mybusiness\.googleapis\.com\/v4\/accounts\/123\/locations\/456\/reviews/,
    );
    assert.equal(init.headers.Authorization, "Bearer access-token");
    return new Response(
      JSON.stringify({
        averageRating: 4.9,
        totalReviewCount: 12,
        reviews: [
          {
            reviewId: "google-review-1",
            reviewer: { displayName: "Jane Customer" },
            starRating: "FIVE",
            comment: "Excellent work.",
            createTime: "2026-09-30T12:00:00Z",
            updateTime: "2026-09-30T12:00:00Z",
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const response = await googleBusinessReviewsApi(
    new Request("https://sperinservices.co.uk/api/google-reviews"),
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.configured, true);
  assert.equal(data.averageRating, 4.9);
  assert.equal(data.totalReviewCount, 12);
  assert.deepEqual(data.reviews[0], {
    id: "google-review-1",
    reviewer: "Jane Customer",
    rating: 5,
    text: "Excellent work.",
    created_at: "2026-09-30T12:00:00Z",
    updated_at: "2026-09-30T12:00:00Z",
    source: "google",
  });
  assert.equal(calls.length, 2);
});
