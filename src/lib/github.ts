export type GithubRepo = {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  fork: boolean;
  topics: string[];
  default_branch: string;
};
export type GithubStats = {
  login: string;
  avatar_url: string;
  html_url: string;
  followers: number;
  public_repos: number;
  created_at: string;
  stars: number;
  repos: GithubRepo[];
  languages: { name: string; bytes: number; percent: number }[];
  frameworks: { name: string; count: number }[];
  updatedAt: string;
  languageComplete: boolean;
  frameworkComplete: boolean;
};

export class GithubError extends Error {
  status: number;
  resetAt: number | null;
  constructor(status: number, resetAt: number | null) {
    super(
      status === 403 || status === 429
        ? "Лимит запросов GitHub. Попробуйте позже."
        : "GitHub временно недоступен.",
    );
    this.status = status;
    this.resetAt = resetAt;
  }
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: "application/vnd.github+json" },
    signal,
  });
  if (!response.ok)
    throw new GithubError(
      response.status,
      Number(response.headers.get("x-ratelimit-reset")) || null,
    );
  return response.json() as Promise<T>;
}

const frameworks: Record<string, string[]> = {
  PyTorch: ["torch", "pytorch"],
  NumPy: ["numpy"],
  Pandas: ["pandas"],
  Gymnasium: ["gymnasium", "gym"],
  "Stable Baselines3": ["stable-baselines3"],
  "Scikit-learn": ["scikit-learn", "sklearn"],
  TensorFlow: ["tensorflow"],
  "Next.js": ["next", "nextjs"],
  React: ["react"],
  FastAPI: ["fastapi"],
  Prisma: ["prisma", "@prisma/client"],
  Aiogram: ["aiogram"],
  Flask: ["flask"],
  Django: ["django"],
  JAX: ["jax"],
  Transformers: ["transformers"],
  Vite: ["vite"],
  Express: ["express"],
  "Tailwind CSS": ["tailwindcss"],
};

function dependencyNames(path: string, content: string): string[] {
  if (path.endsWith("package.json")) {
    const manifest = JSON.parse(content);
    return Object.keys({
      ...manifest.dependencies,
      ...manifest.devDependencies,
    }).map((x) => x.toLowerCase());
  }
  // PEP 508 requirement names end before extras, versions or environment markers.
  return content
    .split("\n")
    .map((line) =>
      line
        .trim()
        .match(/^([a-zA-Z0-9_.-]+)/)?.[1]
        ?.toLowerCase(),
    )
    .filter((x): x is string => Boolean(x));
}

async function repoFrameworks(repo: GithubRepo, signal?: AbortSignal) {
  const tree = await request<{
    tree: { path: string; type: string; size?: number; sha: string }[];
    truncated: boolean;
  }>(
    `/repos/${repo.full_name}/git/trees/${encodeURIComponent(repo.default_branch)}?recursive=1`,
    signal,
  );
  const manifests = tree.tree
    .filter(
      (item) =>
        item.type === "blob" &&
        /(^|\/)(package\.json|requirements[^/]*\.txt)$/.test(item.path) &&
        !/(node_modules|vendor|\.venv|dist|lock)/.test(item.path) &&
        (item.size ?? 0) < 100_000,
    )
    .sort((a, b) => a.path.split("/").length - b.path.split("/").length);
  const results = await Promise.allSettled(
    manifests.slice(0, 6).map(async (item) => {
      const blob = await request<{ content: string; encoding: string }>(
        `/repos/${repo.full_name}/git/blobs/${item.sha}`,
        signal,
      );
      const text = new TextDecoder().decode(
        Uint8Array.from(atob(blob.content.replace(/\s/g, "")), (c) =>
          c.charCodeAt(0),
        ),
      );
      return dependencyNames(item.path, text);
    }),
  );
  const names = new Set(
    results.flatMap((r) => (r.status === "fulfilled" ? r.value : [])),
  );
  for (const topic of repo.topics) names.add(topic.toLowerCase());
  return {
    names: Object.entries(frameworks)
      .filter(([, packages]) => packages.some((name) => names.has(name)))
      .map(([name]) => name),
    complete:
      !tree.truncated &&
      manifests.length <= 6 &&
      results.every((r) => r.status === "fulfilled"),
  };
}

export async function fetchGithubStats(
  username: string,
  signal?: AbortSignal,
): Promise<GithubStats> {
  const user = await request<
    Omit<
      GithubStats,
      | "stars"
      | "repos"
      | "languages"
      | "frameworks"
      | "updatedAt"
      | "languageComplete"
      | "frameworkComplete"
    >
  >(`/users/${encodeURIComponent(username)}`, signal);
  const repos: GithubRepo[] = [];
  for (let page = 1; ; page++) {
    const batch = await request<GithubRepo[]>(
      `/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&page=${page}`,
      signal,
    );
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  const own = repos.filter((repo) => !repo.fork);
  const languages = await Promise.allSettled(
    own.map((repo) =>
      request<Record<string, number>>(
        `/repos/${repo.full_name}/languages`,
        signal,
      ),
    ),
  );
  const frameworkResults = await Promise.allSettled(
    own.map((repo) => repoFrameworks(repo, signal)),
  );
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const bytes: Record<string, number> = {};
  for (const result of languages)
    if (result.status === "fulfilled") {
      for (const [name, count] of Object.entries(result.value))
        bytes[name] = (bytes[name] ?? 0) + count;
    }
  const counts: Record<string, number> = {};
  for (const result of frameworkResults)
    if (result.status === "fulfilled") {
      for (const name of result.value.names)
        counts[name] = (counts[name] ?? 0) + 1;
    }
  const total = Object.values(bytes).reduce((sum, count) => sum + count, 0);
  return {
    login: user.login,
    avatar_url: user.avatar_url,
    html_url: user.html_url,
    followers: user.followers,
    public_repos: user.public_repos,
    created_at: user.created_at,
    stars: own.reduce((sum, repo) => sum + repo.stargazers_count, 0),
    repos: own.map(
      ({
        name,
        full_name,
        html_url,
        description,
        stargazers_count,
        language,
        fork,
        topics,
        default_branch,
      }) => ({
        name,
        full_name,
        html_url,
        description,
        stargazers_count,
        language,
        fork,
        topics,
        default_branch,
      }),
    ),
    languages: Object.entries(bytes)
      .sort((a, b) => b[1] - a[1])
      .map(([name, bytes]) => ({
        name,
        bytes,
        percent: total ? (bytes / total) * 100 : 0,
      })),
    frameworks: Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count })),
    updatedAt: new Date().toISOString(),
    languageComplete: languages.every((r) => r.status === "fulfilled"),
    frameworkComplete: frameworkResults.every(
      (r) => r.status === "fulfilled" && r.value.complete,
    ),
  };
}
