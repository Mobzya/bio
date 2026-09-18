import { strict as assert } from "node:assert";
import { test } from "node:test";
import { createBuildTimeline } from "../src/lib/build-intro.ts";

test("each command reveals at most two fragments after typing completes", () => {
  const { commands, duration } = createBuildTimeline(68);
  assert.ok(duration > 40_000 && duration < 50_000);
  commands.forEach((command, index) => {
    assert.ok(command.targets.length <= 2);
    if (index + 1 < commands.length) {
      const settlement = command.text.startsWith("moments.mount") ? 220 : 280;
      assert.ok(
        command.at + command.time + settlement < commands[index + 1].at,
      );
    }
  });
  const final = commands.at(-1)!;
  assert.equal(final.text, "site.ready --preserve-viewport");
  assert.ok(final.at + final.time < duration - 450);
});

test("all photos mount exactly once in pairs, sharing their step with the loop copy", () => {
  for (const count of [0, 1, 3, 68, 69]) {
    const { commands } = createBuildTimeline(count);
    const targets = commands
      .filter((command) => command.text.startsWith("moments.mount"))
      .flatMap((command) => command.targets);
    assert.equal(targets.length, count);
    assert.equal(new Set(targets).size, count);
    assert.deepEqual(
      targets,
      Array.from(
        { length: count },
        (_, index) => `.gallery-group > .photo:nth-child(${index + 1})`,
      ),
    );
  }
});

test("palette changes are discrete steps before the gallery, with no bulk reveal at the end", () => {
  const { commands } = createBuildTimeline(68);
  const palette = commands.filter((command) => command.surface !== undefined);
  assert.deepEqual(palette.map((command) => command.surface), [160, 8]);
  assert.ok(palette.every((command) => command.targets.length === 0));
  const photos = commands.find((command) => command.text.startsWith("moments.mount"))!;
  assert.ok(palette.at(-1)!.at < photos.at);
  assert.equal(commands.at(-1)!.targets.length, 0);
  const targets = commands.flatMap((command) => command.targets);
  assert.equal(new Set(targets).size, targets.length);
});
