import { useEffect, useState } from "react";
import { Terminal } from "lucide-react";
import { photos } from "../data";
import { createBuildTimeline } from "../lib/build-intro";

const { commands, duration } = createBuildTimeline(photos.length);

export default function BuildIntro() {
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const items = new Map<HTMLElement, number>();
    let completed = -1;
    const reveal = (element: HTMLElement) => {
      element.dataset.buildRevealed = "true";
    };
    // API rows can arrive after their command. They inherit the current build state.
    const bind = () => {
      commands.forEach((command, index) => {
        for (const selector of command.targets) {
          document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
            if (items.has(element)) return;
            items.set(element, index);
            element.dataset.buildStep = String(index);
            if (index <= completed) reveal(element);
          });
        }
      });
    };
    const clear = () => {
      root.removeAttribute("data-building");
      root.style.removeProperty("--build-surface");
      root.style.removeProperty("--build-ink");
      for (const element of items.keys()) {
        element.removeAttribute("data-build-step");
        element.removeAttribute("data-build-revealed");
      }
    };
    bind();
    root.dataset.building = "active";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      clear();
      setFinished(true);
      return;
    }
    const observer = new MutationObserver(bind);
    const main = document.querySelector("main");
    if (main) observer.observe(main, { childList: true, subtree: true });
    let previous = performance.now();
    let elapsedTime = 0;
    let frame = 0;
    let lastUpdate = -50;
    const tick = (now: number) => {
      // Slow frames and background tabs must not collapse several build steps.
      elapsedTime = Math.min(elapsedTime + Math.min(now - previous, 80), duration);
      previous = now;
      const time = elapsedTime;
      if (time - lastUpdate >= 32 || time === duration) {
        lastUpdate = time;
        while (
          completed + 1 < commands.length &&
          time >= commands[completed + 1].at + commands[completed + 1].time
        ) {
          const command = commands[++completed];
          if (command.surface !== undefined) {
            const surface = command.surface;
            const ink = surface > 100 ? 24 : 237;
            root.style.setProperty(
              "--build-surface",
              `rgb(${surface} ${surface} ${surface})`,
            );
            root.style.setProperty("--build-ink", `rgb(${ink} ${ink} ${ink})`);
          }
          for (const [element, step] of items) {
            if (step === completed) reveal(element);
          }
        }
        setElapsed(time);
      }
      if (time < duration) frame = requestAnimationFrame(tick);
      else {
        observer.disconnect();
        clear();
        setFinished(true);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      clear();
    };
  }, []);

  if (finished) return null;
  const visible = commands.filter((command) => elapsed >= command.at).slice(-3);
  return (
    <aside
      className={`build-terminal ${elapsed >= 500 ? "visible" : ""} ${elapsed >= duration - 450 ? "leaving" : ""}`}
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
