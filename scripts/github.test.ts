import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  fetchGithubStats,
  GithubError,
  type GithubRepo,
} from "../src/lib/github.ts";

const user = {
  login: "test",
  avatar_url: "https://example.com/avatar",
  html_url: "https://github.com/test",
  followers: 7,
  public_repos: 101,
  created_at: "2025-01-01T00:00:00Z",
};
const repo = (name: string, fork = false): GithubRepo => ({
  name,
  full_name: `test/${name}`,
  html_url: `https://github.com/test/${name}`,
  description: null,
  stargazers_count: fork ? 100 : 3,
  language: null,
  fork,
  topics: [],
  default_branch: "main",
});
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status });
const blob = (content: string) => ({
  content: Buffer.from(content).toString("base64"),
  encoding: "base64",
});

test("paginates repositories, excludes forks, sums language bytes and deduplicates dependencies per project", async (t) => {
  const requests: string[] = [];
  t.mock.method(globalThis, "fetch", async (input: string) => {
    const url = new URL(input);
    requests.push(url.pathname + url.search);
    if (url.pathname === "/users/test") return json(user);
    if (url.pathname === "/users/test/repos") {
      return json(
        url.searchParams.get("page") === "1"
          ? [
              repo("python"),
              ...Array.from({ length: 99 }, (_, i) => repo(`fork-${i}`, true)),
            ]
          : [repo("web")],
      );
    }
    if (url.pathname.endsWith("/languages"))
      return json(
        url.pathname.includes("/python/")
          ? { Python: 300 }
          : { TypeScript: 100 },
      );
    if (url.pathname.includes("/git/trees/"))
      return json({
        truncated: false,
        tree: url.pathname.includes("/python/")
          ? [
              { path: "requirements.txt", type: "blob", sha: "py" },
              { path: "requirements-dev.txt", type: "blob", sha: "py-dev" },
            ]
          : [{ path: "package.json", type: "blob", sha: "web" }],
      });
    if (url.pathname.endsWith("/git/blobs/py"))
      return json(blob("# comment\ntorch[cuda]>=2.0\nnumpy==2.0\n"));
    if (url.pathname.endsWith("/git/blobs/py-dev"))
      return json(blob("torch==2.0\n"));
    if (url.pathname.endsWith("/git/blobs/web"))
      return json(
        blob(
          JSON.stringify({
            dependencies: { react: "19", next: "16" },
            devDependencies: { react: "19" },
          }),
        ),
      );
    throw new Error(`Unexpected request: ${input}`);
  });
  const result = await fetchGithubStats("test");
  assert.equal(result.repos.length, 2);
  assert.equal(result.stars, 6);
  assert.equal(result.followers, 7);
  assert.deepEqual(
    result.languages.map(({ name, percent }) => ({ name, percent })),
    [
      { name: "Python", percent: 75 },
      { name: "TypeScript", percent: 25 },
    ],
  );
  assert.equal(result.frameworks.find((x) => x.name === "PyTorch")?.count, 1);
  assert.equal(result.frameworks.find((x) => x.name === "React")?.count, 1);
  assert.equal(result.frameworks.find((x) => x.name === "Next.js")?.count, 1);
  assert.equal(result.languageComplete, true);
  assert.equal(result.frameworkComplete, true);
  assert.ok(requests.some((path) => path.includes("page=2")));
  assert.ok(requests.every((path) => !path.includes("/repos/test/fork-")));
});

test("marks unavailable language and manifest data as partial", async (t) => {
  t.mock.method(globalThis, "fetch", async (input: string) => {
    const path = new URL(input).pathname;
    if (path === "/users/test") return json(user);
    if (path === "/users/test/repos") return json([repo("python")]);
    if (path.endsWith("/languages")) return json({}, 500);
    if (path.includes("/git/trees/"))
      return json({
        truncated: true,
        tree: [{ path: "requirements.txt", type: "blob", sha: "py" }],
      });
    return json({}, 403);
  });
  const result = await fetchGithubStats("test");
  assert.equal(result.stars, 3);
  assert.deepEqual(result.languages, []);
  assert.equal(result.languageComplete, false);
  assert.equal(result.frameworkComplete, false);
});

test("propagates rate limits instead of returning invented profile statistics", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response("{}", {
        status: 403,
        headers: { "x-ratelimit-reset": "1800000000" },
      }),
  );
  await assert.rejects(
    fetchGithubStats("test"),
    (error) =>
      error instanceof GithubError &&
      error.status === 403 &&
      error.resetAt === 1800000000,
  );
});
