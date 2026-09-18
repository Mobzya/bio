import { writeFile } from "node:fs/promises";
import { fetchGithubStats } from "../src/lib/github.ts";

const data = await fetchGithubStats("Mobzya", AbortSignal.timeout(60_000));
await writeFile(
  new URL("../public/github-snapshot.json", import.meta.url),
  JSON.stringify(data, null, 2) + "\n",
);
console.log(
  `GitHub snapshot: ${data.public_repos} repositories, ${data.stars} stars, ${data.languages.length} languages, ${data.frameworks.length} frameworks. ${data.updatedAt}`,
);
