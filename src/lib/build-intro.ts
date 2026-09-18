export interface BuildCommand {
  at: number;
  time: number;
  text: string;
  output: string;
  targets: string[];
  surface?: number;
}

export function createBuildTimeline(photoCount: number) {
  const commands: BuildCommand[] = [];
  let cursor = 700;
  const add = (
    text: string,
    output: string,
    targets: string[],
    interval = 850,
    surface?: number,
  ) => {
    commands.push({
      at: cursor,
      time: interval === 520 ? 260 : 440,
      text,
      output,
      targets,
      surface,
    });
    cursor += interval;
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
  add("theme.set --surface #a0a0a0", "palette / intermediate", [], 850, 160);
  add("theme.set --surface #080808", "palette / monochrome", [], 850, 8);
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
  for (let i = 1; i <= photoCount; i += 2) {
    const last = Math.min(i + 1, photoCount);
    const range = `${String(i).padStart(2, "0")}..${String(last).padStart(2, "0")}`;
    add(
      `moments.mount ${range}`,
      `${last} / ${photoCount} frames placed`,
      Array.from(
        { length: last - i + 1 },
        (_, offset) => `.gallery-group > .photo:nth-child(${i + offset})`,
      ),
      520,
    );
  }
  add("contact.write --telegram Mobzi_t", "the next iteration", [
    ".footer-top > div",
    ".footer-contact",
  ]);
  add("footer.write --signature", "human behind the model", [".footer-bottom"]);
  add("site.ready --preserve-viewport", "✓ build complete / viewport unchanged", []);

  return { commands, duration: cursor + 650 };
}
