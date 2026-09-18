import { strict as assert } from "node:assert";
import { test } from "node:test";
import { createBuildTimeline, createTypingSchedule, typedLengthAt } from "../src/lib/build-intro.ts";

test("commands keep their sequence, with overlapping visual settlement and a final pause", () => {
  const { commands, duration } = createBuildTimeline(68, () => 0.5);
  assert.ok(duration > 35_000 && duration < 45_000);
  commands.forEach((command, index) => {
    assert.ok(command.targets.length <= 2);
    if (index + 1 < commands.length) {
      assert.ok(command.at + command.time < commands[index + 1].at);
      assert.ok(command.at + command.time + 1650 > commands[index + 1].at);
    }
  });
  const final = commands.at(-1)!;
  assert.equal(final.text, "site.ready --preserve-viewport");
  assert.ok(final.at + final.time < duration - 1000);
  const fast = createBuildTimeline(68, () => 0);
  const slow = createBuildTimeline(68, () => 1);
  assert.ok(slow.duration > fast.duration);
});

test("the whole carousel mounts in one stage, independent of its photo count", () => {
  for (const count of [0, 1, 3, 68, 69]) {
    const { commands, duration } = createBuildTimeline(count, () => 0.5);
    const gallery = commands.filter((command) => command.text.startsWith("moments.mount"));
    assert.equal(gallery.length, 1);
    assert.deepEqual(gallery[0].targets, [".gallery-track"]);
    assert.ok(gallery[0].output.startsWith(`${count} frames`));
    assert.equal(duration, createBuildTimeline(68, () => 0.5).duration);
    assert.ok(commands.flatMap((command) => command.targets).every((target) => !target.includes(".photo")));
  }
});

test("palette transitions precede the gallery and the final command reveals no content", () => {
  const { commands } = createBuildTimeline(68);
  const palette = commands.filter((command) => command.surface !== undefined);
  assert.deepEqual(palette.map((command) => command.surface), [160, 8]);
  assert.ok(palette.every((command) => command.targets.length === 0));
  const gallery = commands.find((command) => command.text.startsWith("moments.mount"))!;
  assert.ok(palette.at(-1)!.at < gallery.at);
  assert.equal(commands.at(-1)!.targets.length, 0);
  const targets = commands.flatMap((command) => command.targets);
  assert.equal(new Set(targets).size, targets.length);
});

test("typing advances character by character, pauses after punctuation and handles Unicode", () => {
  const text = "A. B\u{1F680}";
  const schedule = createTypingSchedule(text);
  assert.equal(schedule.length, Array.from(text).length);
  assert.equal(typedLengthAt(schedule, -1), 0);
  schedule.forEach((at, index) => {
    assert.equal(typedLengthAt(schedule, at - 0.001), index);
    assert.equal(typedLengthAt(schedule, at), index + 1);
  });
  assert.ok(schedule[2] - schedule[1] > 95);
  assert.equal(typedLengthAt(schedule, 4000), Array.from(text).length);
  assert.ok(createTypingSchedule("x".repeat(1000)).at(-1)! <= 3000);
  assert.equal(typedLengthAt([], 100), 0);
});
