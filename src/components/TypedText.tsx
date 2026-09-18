import { useEffect, useMemo, useRef, useState } from "react";
import { BUILD_TICK, createTypingSchedule, typedLengthAt } from "../lib/build-intro";

export default function TypedText({ children }: { children: string }) {
  const element = useRef<HTMLSpanElement>(null);
  const characters = useMemo(() => Array.from(children), [children]);
  const schedule = useMemo(() => createTypingSchedule(children), [children]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const offset = characters.reduce((seed, character) => seed + character.codePointAt(0)!, 0) % 130;
    const tick = (event: Event) => {
      const stage = element.current?.closest<HTMLElement>("[data-build-step]");
      if (!stage?.hasAttribute("data-build-revealed")) return;
      const elapsed = (event as CustomEvent<number>).detail;
      setCount(typedLengthAt(schedule, elapsed - Number(stage.dataset.buildStart) - offset));
    };
    document.addEventListener(BUILD_TICK, tick);
    return () => document.removeEventListener(BUILD_TICK, tick);
  }, [characters, schedule]);

  return (
    <span className="typed-text" ref={element}>
      {/* The complete copy reserves its final size and remains accessible. */}
      <span className="typed-text-reserve">{children}</span>
      <span className={`typed-text-ink ${count > 0 && count < characters.length ? "typing" : ""}`} aria-hidden="true">
        {characters.slice(0, count).join("")}
      </span>
    </span>
  );
}
