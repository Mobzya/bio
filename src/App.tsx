import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowDownRight,
  ArrowUp,
  ArrowUpRight,
  Github,
  Menu,
  X,
} from "lucide-react";
import { interests, profile } from "./data";
import Manifold from "./components/Manifold";
import Experience from "./components/Experience";
import BuildIntro from "./components/BuildIntro";
import InterestVisual from "./components/InterestVisual";
import Gallery from "./components/Gallery";

const navigation = [
  { id: "experience", label: "Опыт" },
  { id: "interests", label: "Интересы" },
  { id: "moments", label: "Моменты" },
];

export default function App() {
  const [menu, setMenu] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [interest, setInterest] = useState<string | null>(null);
  const [hoveredInterest, setHoveredInterest] = useState<string | null>(null);
  useEffect(() => {
    const sections = navigation
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) setActiveSection(entry.target.id);
      },
      { rootMargin: "-15% 0px -55% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!menu) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [menu]);
  return (
    <>
      <BuildIntro />
      <a className="skip-link" href="#experience">
        Перейти к содержимому
      </a>
      <header className="header">
        <div className="container header-inner">
          <a className="brand" href="#top" aria-label="Mobzya, в начало">
            <span className="brand-mark">
              m<span>.</span>
            </span>
            <span className="mono brand-caption">
              MOBZYA<span>PERSONAL SPACE</span>
            </span>
          </a>
          <nav
            className={menu ? "navigation open" : "navigation"}
            aria-label="Разделы сайта"
          >
            {navigation.map((item, i) => (
              <a
                href={`#${item.id}`}
                key={item.id}
                className={activeSection === item.id ? "active" : ""}
                onClick={() => setMenu(false)}
              >
                <span className="mono">0{i + 1}</span>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="header-right">
            <a
              href={`https://github.com/${profile.github}`}
              className="header-github"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub Mobzya"
            >
              <Github size={17} />
              <ArrowUpRight size={13} />
            </a>
            <button
              className="icon-button menu-toggle"
              aria-label={menu ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={menu}
              onClick={() => setMenu((value) => !value)}
            >
              {menu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>
      <main>
        <section id="top" className="hero">
          <div className="hero-inner container">
            <div className="hero-copy">
              <div className="hero-eyebrow mono">
                <span className="status-dot" /> НА ПЕРЕСЕЧЕНИИ МАТЕМАТИКИ И КОДА
              </div>
              <h1>
                {profile.name}
                <span className="hero-period">.</span>
              </h1>
              <div className="hero-roles mono">
                {profile.roles.map((role, index) => (
                  <span key={role}>
                    {index > 0 && <i>/</i>}
                    {role}
                  </span>
                ))}
              </div>
              <p className="hero-statement">
                Сложные идеи.
                <br />
                <span>Осмысленные решения.</span>
              </p>
              <p className="hero-about">{profile.about}</p>
              <a href="#experience" className="hero-link">
                Познакомимся ближе <ArrowDownRight size={20} />
              </a>
            </div>
            <Manifold />
          </div>
          <div className="hero-bottom container">
            <span className="mono">
              ALWAYS LEARNING<span className="hero-bottom-cross">+</span>ALWAYS
              BUILDING
            </span>
            <span className="mono hero-pipeline">
              DATA <span>→</span> MODEL <span>→</span> INTELLIGENCE
            </span>
            <a
              href="#experience"
              className="icon-button"
              aria-label="Перейти к опыту"
              title="Дальше"
            >
              <ArrowDown size={17} />
            </a>
          </div>
        </section>
        <Experience />
        <section id="interests" className="section interests-section container">
          <div className="section-kicker">
            <span className="mono">02 / DRIVEN BY CURIOSITY</span>
            <span className="mono dim">ТРИ ТОЧКИ ПРИТЯЖЕНИЯ</span>
          </div>
          <div className="section-heading">
            <div>
              <h2>То, что движет мной</h2>
              <p>Разные языки. Одно любопытство.</p>
            </div>
            <span className="interest-equation mono">f(math, cs, ml) → me</span>
          </div>
          <div className="interest-grid">
            {interests.map((item) => (
              <button
                key={item.id}
                className={`interest-card interest-${item.id} ${interest === item.id ? "expanded" : ""} ${hoveredInterest === item.id ? "hovered" : ""}`}
                onPointerEnter={(event) => {
                  if (event.pointerType !== "touch")
                    setHoveredInterest(item.id);
                }}
                onPointerLeave={() => setHoveredInterest(null)}
                onClick={() =>
                  setInterest((current) =>
                    current === item.id ? null : item.id,
                  )
                }
                aria-expanded={interest === item.id}
                aria-label={`${item.title}: ${item.subtitle}`}
              >
                <div className="interest-top">
                  <span className="mono dim">/{item.number}</span>
                  <ArrowUpRight size={18} />
                </div>
                <div className="visual-container">
                  <InterestVisual type={item.id} />
                  <span className="interest-formula mono">{item.formula}</span>
                </div>
                <div className="interest-copy">
                  <h3>{item.title}</h3>
                  <span className="interest-subtitle">{item.subtitle}</span>
                  <p className="interest-description">{item.description}</p>
                  <div className="interest-tags mono">
                    {item.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
        <Gallery />
      </main>
      <footer className="footer container">
        <div className="footer-top">
          <div>
            <span className="mono dim">THE NEXT ITERATION</span>
            <p>
              Всё начинается
              <br />с хорошего вопроса<span>.</span>
            </p>
          </div>
          <a
            href={`https://t.me/${profile.telegram}`}
            target="_blank"
            rel="noreferrer"
            className="footer-contact"
          >
            <span>Telegram · @{profile.telegram}</span>
            <ArrowUpRight size={24} />
          </a>
        </div>
        <div className="footer-bottom">
          <span className="mono">© {new Date().getFullYear()} MOBZYA</span>
          <span className="mono dim">HUMAN BEHIND THE MODEL.</span>
          <a href="#top" className="back-to-top mono">
            НАВЕРХ <ArrowUp size={14} />
          </a>
        </div>
      </footer>
    </>
  );
}
