import { useEffect, useState } from "react";
import { Terminal } from "lucide-react";

const duration = 15_000;
const commands = [
  {
    at: 700,
    time: 850,
    text: "mkdir mobzya && cd mobzya",
    output: "workspace initialized",
  },
  {
    at: 2300,
    time: 900,
    text: "identity.load --name Mobzya",
    output: "ML engineer / AI engineering / DS",
  },
  {
    at: 4100,
    time: 950,
    text: "github.connect --user Mobzya",
    output: "public profile · repositories · languages",
  },
  {
    at: 5900,
    time: 950,
    text: "theme.apply --palette monochrome",
    output: "#ffffff → #080808",
  },
  {
    at: 7800,
    time: 900,
    text: "layout.resolve --responsive",
    output: "coordinates aligned · viewport preserved",
  },
  {
    at: 9600,
    time: 1000,
    text: "moments.shuffle --color --flow slow",
    output: "68 frames · infinite sequence",
  },
  {
    at: 11600,
    time: 950,
    text: "motion.bind math cs ml",
    output: "structures alive",
  },
  {
    at: 13200,
    time: 750,
    text: "site.publish --ready",
    output: "✓ Mobzya is online.",
  },
];

export default function BuildIntro() {
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.building = "active";
    const started = performance.now();
    let frame = 0;
    let lastUpdate = -50;
    const tick = (now: number) => {
      const time = Math.min(now - started, duration);
      if (time - lastUpdate >= 32 || time === duration) {
        lastUpdate = time;
        const transition = Math.max(0, Math.min(1, (time - 5500) / 4000));
        const eased = transition * transition * (3 - 2 * transition);
        const surface = Math.round(255 - eased * 247);
        const ink = Math.round(24 + eased * 213);
        root.style.setProperty(
          "--build-surface",
          `rgb(${surface} ${surface} ${surface})`,
        );
        root.style.setProperty("--build-ink", `rgb(${ink} ${ink} ${ink})`);
        setElapsed(time);
      }
      if (time < duration) frame = requestAnimationFrame(tick);
      else {
        root.removeAttribute("data-building");
        root.style.removeProperty("--build-surface");
        root.style.removeProperty("--build-ink");
        setFinished(true);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      root.removeAttribute("data-building");
      root.style.removeProperty("--build-surface");
      root.style.removeProperty("--build-ink");
    };
  }, []);

  if (finished) return null;
  const visible = commands.filter((command) => elapsed >= command.at).slice(-3);
  return (
    <aside
      className={`build-terminal ${elapsed >= 500 ? "visible" : ""} ${elapsed >= 14550 ? "leaving" : ""}`}
      aria-label="Создание страницы"
      aria-hidden="true"
    >
      <div className="build-terminal-bar">
        <span>
          <Terminal size={12} /> mobzya / build
        </span>
        <span>
          {String(Math.floor((elapsed / duration) * 100)).padStart(2, "0")}%
        </span>
      </div>
      <div className="build-terminal-content">
        {visible.map((command) => {
          const progress = Math.min(1, (elapsed - command.at) / command.time);
          return (
            <div className="build-command" key={command.at}>
              <div>
                <span className="build-prompt">$ </span>
                {command.text.slice(
                  0,
                  Math.floor(progress * command.text.length),
                )}
                {progress < 1 && <span className="build-caret" />}
              </div>
              {progress === 1 && (
                <div className="build-output">{command.output}</div>
              )}
            </div>
          );
        })}
      </div>
      <div
        className="build-terminal-progress"
        style={{ transform: `scaleX(${elapsed / duration})` }}
      />
    </aside>
  );
}
