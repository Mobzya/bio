import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Boxes,
  Code2,
  GitFork,
  Github,
  RefreshCw,
  Star,
  Users,
} from "lucide-react";
import { fetchGithubStats, type GithubStats } from "../lib/github";
import { profile } from "../data";
import Dialog from "./Dialog";
import TypedText from "./TypedText";

export default function Experience() {
  const [data, setData] = useState<GithubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const [kaggle, setKaggle] = useState(() => {
    try {
      return localStorage.getItem("mobzya.kaggle") || profile.kaggleUrl;
    } catch {
      return profile.kaggleUrl;
    }
  });
  const [settings, setSettings] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const refresh = useCallback(async () => {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const timeout = window.setTimeout(() => abort.abort(), 30_000);
    setLoading(true);
    setError("");
    try {
      const result = await fetchGithubStats(profile.github, abort.signal);
      if (abort.signal.aborted) return;
      setData(result);
      setLive(true);
      try {
        localStorage.setItem("mobzya.github", JSON.stringify(result));
      } catch {
        /* Cache is optional. */
      }
    } catch (err) {
      if (controller.current !== abort) return;
      setLive(false);
      setError(
        err instanceof Error && err.name !== "AbortError"
          ? err.message
          : "Не удалось обновить данные GitHub.",
      );
    } finally {
      clearTimeout(timeout);
      if (controller.current === abort) setLoading(false);
    }
  }, []);
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      let cached: GithubStats | null = null;
      let browserCached = false;
      try {
        const item = JSON.parse(
          localStorage.getItem("mobzya.github") ?? "null",
        );
        if (
          item?.login === profile.github &&
          Array.isArray(item.languages) &&
          Array.isArray(item.frameworks)
        ) {
          cached = item;
          browserCached = true;
        }
      } catch {
        /* Fall back to the published snapshot. */
      }
      if (!cached) {
        try {
          const response = await fetch("/github-snapshot.json");
          if (response.ok) {
            const snapshot: GithubStats = await response.json();
            if (snapshot.login === profile.github) cached = snapshot;
          }
        } catch {
          /* Live data may still be available. */
        }
      }
      if (!mounted) return;
      if (cached) setData(cached);
      if (
        cached &&
        browserCached &&
        Date.now() - new Date(cached.updatedAt).getTime() < 3_600_000
      ) {
        setLoading(false);
        setLive(false);
      } else await refresh();
    };
    void init();
    return () => {
      mounted = false;
      controller.current?.abort();
    };
  }, [refresh]);
  const sourceLabel = loading
    ? "ОБНОВЛЕНИЕ"
    : live
      ? "GITHUB / LIVE"
      : data
        ? `СНИМОК / ${new Date(data.updatedAt).toLocaleDateString("ru-RU")}`
        : "GITHUB / OFFLINE";
  return (
    <section id="experience" className="section experience-section container">
      <div className="section-kicker">
        <span className="mono">01 / BUILT, NOT JUST LEARNED</span>
        <span className="mono dim">ОТ ТЕОРИИ К ПРАКТИКЕ</span>
      </div>
      <div className="section-heading">
        <div>
          <h2><TypedText>Мой опыт</TypedText></h2>
          <p><TypedText>Код говорит больше, чем резюме.</TypedText></p>
        </div>
        <div className="social-links">
          <a
            className="button secondary"
            href={`https://github.com/${profile.github}`}
            target="_blank"
            rel="noreferrer"
          >
            <Github size={16} /> GitHub <ArrowUpRight size={14} />
          </a>
          {kaggle && /^https:\/\/(www\.)?kaggle\.com\//i.test(kaggle) ? (
            <a
              className="button secondary"
              href={kaggle}
              target="_blank"
              rel="noreferrer"
            >
              <span className="kaggle-symbol">k</span> Kaggle{" "}
              <ArrowUpRight size={14} />
            </a>
          ) : (
            <button
              className="button secondary"
              onClick={() => setSettings(true)}
            >
              <span className="kaggle-symbol">k</span> Kaggle <PlusSmall />
            </button>
          )}
        </div>
      </div>
      <div className="github-profile">
        <a
          href={data?.html_url || `https://github.com/${profile.github}`}
          target="_blank"
          rel="noreferrer"
          className="profile-identity"
        >
          <img
            src={
              data?.avatar_url ||
              "https://avatars.githubusercontent.com/u/215311593?v=4"
            }
            width="42"
            height="42"
            alt="Аватар Mobzya на GitHub"
          />
          <div>
            <strong><TypedText>{`@${profile.github}`}</TypedText></strong>
            <span>
              Building in public<span className="identity-divider">/</span>
              {data ? `с ${new Date(data.created_at).getFullYear()}` : "GitHub"}
            </span>
          </div>
        </a>
        <div
          className="source-status"
          title={
            error ||
            (data
              ? `Данные обновлены ${new Date(data.updatedAt).toLocaleString("ru-RU")}`
              : "")
          }
        >
          <span className="status-dot" />
          <span className="mono">{sourceLabel}</span>
          <button
            className={`icon-button ${loading ? "refreshing" : ""}`}
            title="Обновить статистику GitHub"
            aria-label="Обновить статистику GitHub"
            onClick={() => void refresh()}
            disabled={loading}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
      {error && (
        <p className="api-notice" role="status">
          {error} {data && "Показаны последние сохранённые данные."}
        </p>
      )}
      <div className="stats-row">
        {[
          {
            icon: <Code2 size={16} />,
            value: data?.public_repos,
            name: "Репозитории",
          },
          {
            icon: <Star size={16} />,
            value: data?.stars,
            name: "Звёзды проектов",
          },
          {
            icon: <Users size={16} />,
            value: data?.followers,
            name: "Подписчики",
          },
          {
            icon: <GitFork size={16} />,
            value: data?.languages.length,
            name: "Языки в коде",
          },
        ].map((stat) => (
          <div className="stat" key={stat.name}>
            <span className="stat-label">
              {stat.icon}
              <TypedText>{stat.name}</TypedText>
            </span>
            <strong className={stat.value === undefined ? "skeleton-text" : ""}>
              <TypedText>{String(stat.value ?? "—")}</TypedText>
            </strong>
          </div>
        ))}
      </div>
      <div className="stack-layout">
        <div className="languages-block">
          <div className="block-heading">
            <h3><TypedText>Языки</TypedText></h3>
            <span className="mono dim">СОСТАВ КОДА</span>
          </div>
          <div className="language-stack">
            {(data?.languages || []).map((language, index) => (
              <span
                key={language.name}
                title={`${language.name}: ${language.percent.toFixed(1)}%`}
                style={{
                  width: `${language.percent}%`,
                  backgroundColor: [
                    "#ededed",
                    "#aaa",
                    "#666",
                    "#444",
                    "#303030",
                  ][Math.min(index, 4)],
                }}
              />
            ))}
            {!data && <span className="skeleton-bar" />}
          </div>
          <div className="language-list">
            {data?.languages.slice(0, 6).map((language, index) => (
              <div key={language.name}>
                <span>
                  <i
                    style={{
                      backgroundColor: [
                        "#ededed",
                        "#aaa",
                        "#666",
                        "#444",
                        "#303030",
                      ][Math.min(index, 4)],
                    }}
                  />
                  <TypedText>{language.name}</TypedText>
                </span>
                <span className="mono">
                  {language.percent.toFixed(1)}
                  <span className="dim">%</span>
                </span>
              </div>
            ))}
            {!data && (
              <div className="loading-placeholder mono">Загрузка данных…</div>
            )}
            {data && data.languages.length === 0 && (
              <p className="dim">Публичных данных о языках пока нет.</p>
            )}
          </div>
          <span className="data-note">
            {data?.languageComplete === false
              ? "Частичные данные GitHub"
              : "По объёму кода в собственных публичных репозиториях"}
          </span>
        </div>
        <div className="frameworks-block">
          <div className="block-heading">
            <h3><TypedText>Инструменты и фреймворки</TypedText></h3>
            <span className="mono dim">STACK</span>
          </div>
          <div className="framework-list">
            {data?.frameworks.slice(0, 6).map((framework) => (
              <div key={framework.name}>
                <span>
                  <Boxes size={15} />
                  <TypedText>{framework.name}</TypedText>
                </span>
                <span className="framework-meter" aria-hidden="true">
                  {Array.from({ length: data.repos.length }, (_, i) => (
                    <i
                      key={i}
                      className={i < framework.count ? "filled" : ""}
                    />
                  ))}
                </span>
                <span className="mono dim">
                  {framework.count}{" "}
                  {framework.count === 1
                    ? "проект"
                    : framework.count < 5
                      ? "проекта"
                      : "проектов"}
                </span>
              </div>
            ))}
            {!data && (
              <div className="loading-placeholder mono">Загрузка стека…</div>
            )}
            {data && data.frameworks.length === 0 && (
              <p className="dim">В открытых зависимостях пока не найдены.</p>
            )}
          </div>
          <span className="data-note">
            {data?.frameworkComplete === false
              ? "Частичный анализ зависимостей и тем проектов"
              : "По зависимостям и темам публичных проектов"}
          </span>
        </div>
      </div>
      <div className="repo-list">
        {data?.repos.slice(0, 3).map((repo, index) => (
          <a
            href={repo.html_url}
            key={repo.full_name}
            target="_blank"
            rel="noreferrer"
          >
            <span className="mono repo-number">0{index + 1}</span>
            <div>
              <h4><TypedText>{repo.name}</TypedText></h4>
              <p>{repo.description || "Открытый проект / Mobzya"}</p>
            </div>
            <span className="mono repo-language">{repo.language}</span>
            <ArrowUpRight size={18} />
          </a>
        ))}
      </div>
      {settings && (
        <Dialog title="Профиль Kaggle" onClose={() => setSettings(false)}>
          <form
            className="editor-form"
            onSubmit={(event) => {
              event.preventDefault();
              const value = String(
                new FormData(event.currentTarget).get("kaggle"),
              ).trim();
              if (
                !/^https:\/\/(www\.)?kaggle\.com\/[a-zA-Z0-9_-]+\/?$/.test(
                  value,
                )
              ) {
                setSettingsError(
                  "Укажите ссылку на профиль: https://www.kaggle.com/username",
                );
                return;
              }
              try {
                localStorage.setItem("mobzya.kaggle", value);
              } catch {
                /* Link remains available for this session. */
              }
              setKaggle(value);
              setSettings(false);
            }}
          >
            <label>
              Ссылка на профиль
              <input
                name="kaggle"
                type="url"
                required
                defaultValue={kaggle}
                placeholder="https://www.kaggle.com/username"
              />
            </label>
            <p className="form-note">
              Ссылка сохраняется в этом браузере. Для публикации она задаётся в
              профиле сайта.
            </p>
            {settingsError && (
              <p role="alert" className="form-error">
                {settingsError}
              </p>
            )}
            <div className="form-actions">
              <button className="button primary" type="submit">
                Сохранить <ArrowUpRight size={16} />
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </section>
  );
}
function PlusSmall() {
  return (
    <span aria-hidden="true" className="mono">
      +
    </span>
  );
}
