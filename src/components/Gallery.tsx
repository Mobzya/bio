import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Expand, Moon, Palette } from "lucide-react";
import { photos } from "../data";
import Dialog from "./Dialog";

function shuffledPhotos() {
  const sequence = [...photos];
  for (let i = sequence.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
  }
  return sequence;
}

export default function Gallery() {
  const [sequence] = useState(shuffledPhotos);
  const viewport = useRef<HTMLDivElement>(null);
  const flow = useRef<HTMLDivElement>(null);
  const group = useRef<HTMLDivElement>(null);
  const position = useRef(0);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [color, setColor] = useState(true);
  const nextPhoto = (direction: number) =>
    setLightbox((current) =>
      current === null
        ? null
        : (current + direction + sequence.length) % sequence.length,
    );

  useEffect(() => {
    if (lightbox === null) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") nextPhoto(-1);
      if (event.key === "ArrowRight") nextPhoto(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox]);

  useEffect(() => {
    const element = viewport.current;
    const moving = flow.current;
    const first = group.current;
    if (!element || !moving || !first) return;
    let visible = false;
    let width = first.offsetWidth;
    let offsets: number[] = [];
    let previous = performance.now();
    let currentIndex = -1;
    let frame = 0;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const measure = () => {
      width = first.offsetWidth;
      offsets = Array.from(
        first.children,
        (child) => (child as HTMLElement).offsetLeft,
      );
      if (width > 0) position.current %= width;
    };
    const resize = new ResizeObserver(measure);
    resize.observe(first);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(element);
    measure();
    const tick = (now: number) => {
      if (
        visible &&
        !document.hidden &&
        lightbox === null &&
        !motion.matches &&
        width > 0
      ) {
        // Fixed speed; input never changes the position or the playback rate.
        position.current =
          (position.current + Math.min(now - previous, 100) * 0.018) % width;
      }
      previous = now;
      moving.style.transform = `translate3d(${-position.current}px, 0, 0)`;
      let index = 0;
      for (let i = 0; i < offsets.length; i++) {
        if (offsets[i] <= position.current) index = i;
        else break;
      }
      if (index !== currentIndex) {
        currentIndex = index;
        setActive(index);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
    };
  }, [lightbox]);

  return (
    <section id="moments" className="section gallery-section">
      <div className="container">
        <div className="section-kicker">
          <span className="mono">03 / BEYOND THE CODE</span>
          <span className="mono dim">НЕ ТОЛЬКО АЛГОРИТМЫ</span>
        </div>
        <div className="section-heading">
          <div>
            <h2>Между строк.</h2>
            <p>Моменты, в которых хочется остаться.</p>
          </div>
          <div className="gallery-tools">
            <div className="segmented" aria-label="Цвет фотографий">
              <button
                className={!color ? "selected" : ""}
                onClick={() => setColor(false)}
                aria-label="Чёрно-белые фотографии"
                aria-pressed={!color}
                title="Монохром"
              >
                <Moon size={16} />
              </button>
              <button
                className={color ? "selected" : ""}
                onClick={() => setColor(true)}
                aria-label="Цветные фотографии"
                aria-pressed={color}
                title="Цвет"
              >
                <Palette size={16} />
              </button>
            </div>
            <button
              className="icon-button outlined"
              onClick={() => setLightbox(active)}
              aria-label="Открыть текущую фотографию"
              title="Открыть фотографию"
            >
              <Expand size={18} />
            </button>
          </div>
        </div>
      </div>
      <div className={`gallery-track ${color ? "color" : ""}`} ref={viewport}>
        <div className="gallery-flow" ref={flow}>
          {[0, 1].map((copy) => (
            <div
              className="gallery-group"
              key={copy}
              ref={copy === 0 ? group : undefined}
              aria-hidden={copy === 1 ? true : undefined}
            >
              {sequence.map((photo, index) => (
                <button
                  key={photo.src}
                  className="photo"
                  tabIndex={-1}
                  style={
                    { "--photo-ratio": photo.ratio } as React.CSSProperties
                  }
                  onClick={() => setLightbox(index)}
                  aria-label={`Открыть фотографию ${index + 1}`}
                >
                  <img
                    src={photo.src}
                    alt={copy === 0 ? photo.alt : ""}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                  <span className="photo-index mono">
                    {String(index + 1).padStart(3, "0")}
                  </span>
                  <span className="photo-expand">
                    <Expand size={18} />
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="container gallery-bottom">
        <span className="mono">
          {String(active + 1).padStart(2, "0")}{" "}
          <span className="dim">/ {sequence.length} MOMENTS</span>
        </span>
        <div className="gallery-progress">
          <span
            style={{
              width: `${100 / sequence.length}%`,
              left: `${(active / sequence.length) * 100}%`,
            }}
          />
        </div>
        <span className="mono dim gallery-caption">LIFE, UNFILTERED.</span>
      </div>
      {lightbox !== null && (
        <Dialog
          title={`${String(lightbox + 1).padStart(2, "0")} / ${sequence.length}`}
          onClose={() => setLightbox(null)}
          className="lightbox"
        >
          <div className={`lightbox-stage ${color ? "color" : ""}`}>
            <img
              key={lightbox}
              src={sequence[lightbox].src}
              alt={sequence[lightbox].alt}
            />
            <button
              className="icon-button lightbox-prev"
              title="Предыдущая фотография"
              aria-label="Предыдущая фотография"
              onClick={() => nextPhoto(-1)}
            >
              <ArrowLeft size={24} />
            </button>
            <button
              className="icon-button lightbox-next"
              title="Следующая фотография"
              aria-label="Следующая фотография"
              onClick={() => nextPhoto(1)}
            >
              <ArrowRight size={24} />
            </button>
          </div>
        </Dialog>
      )}
    </section>
  );
}
