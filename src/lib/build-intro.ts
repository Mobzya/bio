export interface BuildCommand {
  at: number;
  time: number;
  text: string;
  output: string;
  targets: string[];
  surface?: number;
}

export const BUILD_TICK = "mobzya:build-tick";

export function createTypingSchedule(text: string) {
  let cursor = 0;
  const schedule = Array.from(text, (character, index) => {
    cursor += 22 + ((character.codePointAt(0)! + index * 7) % 19);
    const at = cursor;
    if (/[.,:;!?]/.test(character)) cursor += 95;
    else if (/\s/.test(character)) cursor += 18;
    return at;
  });
  const scale = Math.min(1, 3000 / Math.max(cursor, 1));
  return schedule.map((at) => at * scale);
}

export function typedLengthAt(schedule: number[], elapsed: number) {
  let count = 0;
  while (count < schedule.length && elapsed >= schedule[count]) count++;
  return count;
}

export function createBuildTimeline(photoCount: number, random = Math.random) {
  const commands: BuildCommand[] = [];
  let cursor = 700;
  const add = (
    text: string,
    output: string,
    targets: string[],
    interval = 1000,
    surface?: number,
  ) => {
    const time = 460 + Math.round(random() * 180);
    commands.push({
      at: cursor,
      time,
      text,
      output,
      targets,
      surface,
    });
    cursor += Math.max(time + 160, interval + Math.round(random() * 300));
  };

  add("workspace.init Mobzya", "identity / navigation", [".header", ".brand"]);
  add("navigation.mount --links", "three coordinates", [
    ".navigation",
    ".header-right",
  ]);
  add("identity.write --name", "Mobzya", [".hero-eyebrow", ".hero h1"]);
  add("identity.roles --ml --ai", "ML engineer / AI engineering", [
    ".hero-roles > span:nth-child(1)",
    ".hero-roles > span:nth-child(2)",
  ]);
  add("identity.roles --ds", "Data science", [
    ".hero-roles > span:nth-child(3)",
    ".hero-statement",
  ]);
  add("biography.write --intro", "ideas / systems", [
    ".hero-about",
    ".hero-link",
  ]);
  add("geometry.compile --latent-space", "points / topology", [
    ".manifold",
    ".hero-bottom",
  ]);
  add("theme.set --surface #a0a0a0", "palette / intermediate", [], 1000, 160);
  add("theme.set --surface #080808", "palette / monochrome", [], 1000, 8);
  add("experience.write --heading", "theory / practice", [
    "#experience .section-kicker",
    "#experience .section-heading > div:first-child",
  ]);
  add("github.connect Mobzya", "profile / platforms", [
    ".profile-identity",
    ".social-links",
  ]);
  add("github.metrics --repos --stars", "repositories / stars", [
    ".stats-row > :nth-child(1)",
    ".stats-row > :nth-child(2)",
  ]);
  add("github.metrics --followers --languages", "followers / languages", [
    ".stats-row > :nth-child(3)",
    ".stats-row > :nth-child(4)",
  ]);
  add("github.source --status", "public API / cached snapshot", [
    ".source-status",
    ".api-notice",
  ]);
  add("stack.write --headings", "languages / frameworks", [
    ".languages-block .block-heading",
    ".frameworks-block .block-heading",
  ]);
  add("languages.measure --bytes", "code composition", [
    ".language-stack",
    ".languages-block .data-note",
  ]);
  for (let i = 1; i <= 6; i += 2) {
    add(`languages.write ${i}..${i + 1}`, "public language rows", [
      `.language-list > :nth-child(${i})`,
      `.language-list > :nth-child(${i + 1})`,
    ]);
  }
  for (let i = 1; i <= 6; i += 2) {
    add(`frameworks.write ${i}..${i + 1}`, "public dependency rows", [
      `.framework-list > :nth-child(${i})`,
      `.framework-list > :nth-child(${i + 1})`,
    ]);
  }
  add("repositories.mount 1..2", "open-source projects", [
    ".repo-list > :nth-child(1)",
    ".repo-list > :nth-child(2)",
  ]);
  add("repositories.mount 3 --source", "project / dependency source", [
    ".repo-list > :nth-child(3)",
    ".frameworks-block .data-note",
  ]);
  add("interests.write --heading", "driven by curiosity", [
    "#interests .section-kicker",
    "#interests .section-heading",
  ]);
  for (const id of ["math", "cs", "ml"]) {
    add(`structures.mount --${id}`, "geometry / motion attached", [
      `.interest-${id}`,
    ]);
  }
  add("moments.write --heading", "beyond the code", [
    "#moments .section-kicker",
    "#moments .section-heading > div:first-child",
  ]);
  add("moments.prepare --color --shuffle", `${photoCount} frames / fixed speed`, [
    ".gallery-tools",
    ".gallery-bottom",
  ]);
  add("moments.mount --carousel", `${photoCount} frames / one continuous strip`, [
    ".gallery-track",
  ], 1500);
  add("contact.write --telegram Mobzi_t", "the next iteration", [
    ".footer-top > div",
    ".footer-contact",
  ]);
  add("footer.write --signature", "human behind the model", [".footer-bottom"]);
  add("site.ready --preserve-viewport", "✓ build complete / viewport unchanged", []);

  return { commands, duration: cursor + 1800 };
}
