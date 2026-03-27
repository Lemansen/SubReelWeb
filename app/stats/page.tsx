"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  BrickWall,
  Copy,
  Crown,
  Flame,
  Menu,
  MessageCircle,
  Pickaxe,
  PersonStanding,
  Skull,
  Sparkles,
  Swords,
  TimerReset,
  Trophy,
  Waves,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfileEntry } from "@/components/profile-entry";

type LiveStatus = {
  online: boolean;
  version: string;
  playersOnline: number;
  playersMax: number;
  samplePlayers: string[];
  motd: string;
  tps: string;
  updatedAt: string;
};

type WorldStats = {
  ok: boolean;
  totals: {
    playTicks: number;
    deaths: number;
    playerKills: number;
    mobKills: number;
    blocksBroken: number;
    blocksPlaced: number;
    itemsCrafted: number;
    distanceWalkedCm: number;
    distanceSwumCm: number;
    chatMessages: number;
    achievements: number;
    uniquePlayers: number;
  };
  leaderboard: Array<{
    name: string;
    online: boolean;
    playTicks: number;
    deaths: number;
    playerKills: number;
    mobKills: number;
    blocksBroken: number;
    blocksPlaced: number;
    distanceWalkedCm: number;
    distanceSwumCm: number;
  }>;
  updatedAt: string;
};

const SERVER_IP = "mc.subreel.online";

export default function StatsPage() {
  const [lang, setLang] = useState<"RU" | "EN">("RU");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liveStatus, setLiveStatus] = useState<LiveStatus | null>(null);
  const [worldStats, setWorldStats] = useState<WorldStats | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [statusResponse, worldResponse] = await Promise.all([
          fetch("/api/server-status", { cache: "no-store" }),
          fetch("/api/world-stats", { cache: "no-store" }),
        ]);

        const statusData = (await statusResponse.json()) as Partial<LiveStatus>;
        const worldData = (await worldResponse.json()) as Partial<WorldStats>;

        if (!cancelled) {
          setLiveStatus({
            online: Boolean(statusData.online),
            version: statusData.version ?? "1.21.11",
            playersOnline: statusData.playersOnline ?? 0,
            playersMax: statusData.playersMax ?? 0,
            samplePlayers: statusData.samplePlayers ?? [],
            motd: statusData.motd ?? "",
            tps: statusData.tps ?? "--",
            updatedAt: statusData.updatedAt ?? new Date().toISOString(),
          });

          setWorldStats({
            ok: Boolean(worldData.ok),
            totals: {
              playTicks: worldData.totals?.playTicks ?? 0,
              deaths: worldData.totals?.deaths ?? 0,
              playerKills: worldData.totals?.playerKills ?? 0,
              mobKills: worldData.totals?.mobKills ?? 0,
              blocksBroken: worldData.totals?.blocksBroken ?? 0,
              blocksPlaced: worldData.totals?.blocksPlaced ?? 0,
              itemsCrafted: worldData.totals?.itemsCrafted ?? 0,
              distanceWalkedCm: worldData.totals?.distanceWalkedCm ?? 0,
              distanceSwumCm: worldData.totals?.distanceSwumCm ?? 0,
              chatMessages: worldData.totals?.chatMessages ?? 0,
              achievements: worldData.totals?.achievements ?? 0,
              uniquePlayers: worldData.totals?.uniquePlayers ?? 0,
            },
            leaderboard: worldData.leaderboard ?? [],
            updatedAt: worldData.updatedAt ?? new Date().toISOString(),
          });
        }
      } catch {
        if (!cancelled) {
          setLiveStatus({
            online: false,
            version: "1.21.11",
            playersOnline: 0,
            playersMax: 0,
            samplePlayers: [],
            motd: "",
            tps: "--",
            updatedAt: new Date().toISOString(),
          });

          setWorldStats({
            ok: false,
            totals: {
              playTicks: 0,
              deaths: 0,
              playerKills: 0,
              mobKills: 0,
              blocksBroken: 0,
              blocksPlaced: 0,
              itemsCrafted: 0,
              distanceWalkedCm: 0,
              distanceSwumCm: 0,
              chatMessages: 0,
              achievements: 0,
              uniquePlayers: 0,
            },
            leaderboard: [],
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    load();
    const interval = setInterval(load, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const totals = worldStats?.totals;
  const leaderboard = worldStats?.leaderboard ?? [];
  const playersOnlineLabel = liveStatus
    ? `${liveStatus.playersOnline} / ${liveStatus.playersMax || "?"}`
    : "-- / --";
  const updatedLabel = liveStatus?.updatedAt
    ? new Date(liveStatus.updatedAt).toLocaleTimeString(lang === "RU" ? "ru-RU" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  const worldCards = [
    {
      label: "Всего наиграно",
      value: formatPlayTime(totals?.playTicks ?? 0),
      icon: <TimerReset size={18} />,
    },
    {
      label: "Смертей",
      value: formatNumber(totals?.deaths ?? 0),
      icon: <Skull size={18} />,
    },
    {
      label: "Убийств игроков",
      value: formatNumber(totals?.playerKills ?? 0),
      icon: <Swords size={18} />,
    },
    {
      label: "Убийств мобов",
      value: formatNumber(totals?.mobKills ?? 0),
      icon: <Flame size={18} />,
    },
    {
      label: "Блоков сломано",
      value: formatNumber(totals?.blocksBroken ?? 0),
      icon: <Pickaxe size={18} />,
    },
    {
      label: "Блоков поставлено",
      value: formatNumber(totals?.blocksPlaced ?? 0),
      icon: <BrickWall size={18} />,
    },
    {
      label: "Предметов скрафчено",
      value: formatNumber(totals?.itemsCrafted ?? 0),
      icon: <Sparkles size={18} />,
    },
    {
      label: "Пройдено пешком",
      value: formatDistanceKm(totals?.distanceWalkedCm ?? 0),
      icon: <PersonStanding size={18} />,
    },
    {
      label: "Проплыто",
      value: formatDistanceKm(totals?.distanceSwumCm ?? 0),
      icon: <Waves size={18} />,
    },
    {
      label: "Сообщений в чате",
      value: formatNumber(totals?.chatMessages ?? 0),
      icon: <MessageCircle size={18} />,
    },
    {
      label: "Достижений",
      value: formatNumber(totals?.achievements ?? 0),
      icon: <Trophy size={18} />,
    },
  ];

  function copyToClipboard() {
    navigator.clipboard.writeText(SERVER_IP);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] transition-colors">
      <nav className="border-b border-[var(--color-border-sharp)] sticky top-0 bg-[var(--color-bg)]/70 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 min-h-16 py-3 md:py-0 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 relative">
          <div className="flex items-center gap-3 md:gap-6 w-auto md:w-1/3 min-w-0">
            <Link href="/" className="text-xl font-black tracking-tighter uppercase text-[var(--color-accent-blue)]">
              Subreel
            </Link>
          </div>

          <div className="hidden md:flex order-3 md:order-none w-full md:w-auto md:absolute md:left-1/2 md:-translate-x-1/2 items-center justify-center gap-3 md:gap-8 overflow-x-auto">
            {[
              { name: "Главная", path: "/" },
              { name: "Лаунчер", path: "/launcher" },
              { name: "Сервер", path: "/server" },
              { name: "Статистика", path: "/stats" },
            ].map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] transition-all relative py-2 ${
                    isActive ? "text-[var(--color-accent-blue)]" : "text-[var(--color-text-gray)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {item.name}
                  {isActive ? <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-accent-blue)] rounded-full" /> : null}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center justify-end w-auto md:w-1/3 gap-3 ml-auto">
            <div className="flex items-center gap-1 bg-[var(--color-panel-bg)] p-1 rounded-xl border border-[var(--color-border-sharp)] shadow-sm">
              <Link
                href="/wiki"
                className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg hover:bg-[var(--color-panel-hover)] text-[10px] md:text-sm font-bold uppercase transition-colors group"
              >
                <BookOpen size={14} className="text-[var(--color-text-gray)] group-hover:text-[var(--color-accent-blue)] transition-colors" />
                <span className="hidden sm:block text-[var(--color-text-gray)] group-hover:text-[var(--color-text)] transition-colors">
                  Вики
                </span>
              </Link>

              <div className="w-px h-4 bg-[var(--color-border-sharp)] mx-0.5" />

              <button
                onClick={() => setLang(lang === "RU" ? "EN" : "RU")}
                className="px-2 md:px-3 py-1.5 rounded-lg hover:bg-[var(--color-panel-hover)] text-[10px] md:text-sm font-bold uppercase text-[var(--color-text-gray)] hover:text-[var(--color-text)] transition-colors"
              >
                {lang}
              </button>

              <ThemeToggle className="p-1.5 md:p-2 rounded-lg hover:bg-[var(--color-panel-hover)] text-[var(--color-text-gray)] hover:text-[var(--color-text)] transition-colors" />
            </div>
            <ProfileEntry profileLabel="Профиль" loginLabel="Войти" pendingLabel="Профиль" />
          </div>

          <div className="md:hidden ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] text-[var(--color-text)]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {mobileMenuOpen ? (
            <div className="md:hidden order-4 w-full rounded-[1.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-3 shadow-lg">
              <div className="grid gap-2">
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text)]">
                  Главная
                </Link>
                <Link href="/launcher" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text)]">
                  Лаунчер
                </Link>
                <Link href="/server" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text)]">
                  Сервер
                </Link>
                <Link href="/stats" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-black uppercase tracking-[0.16em] text-[var(--color-accent-blue)]">
                  Статистика
                </Link>
                <Link href="/wiki" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text)]">
                  Вики
                </Link>
                <ProfileEntry profileLabel="Профиль" loginLabel="Войти" pendingLabel="Профиль" mobile onNavigate={() => setMobileMenuOpen(false)} />
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-3 py-2">
                <button
                  onClick={() => setLang(lang === "RU" ? "EN" : "RU")}
                  className="text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text-gray)]"
                >
                  {lang}
                </button>
                <ThemeToggle className="p-2 rounded-lg hover:bg-[var(--color-panel-hover)] text-[var(--color-text-gray)] hover:text-[var(--color-text)] transition-colors" />
              </div>
            </div>
          ) : null}
        </div>
      </nav>

      <main className="grow px-4 md:px-6 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          <section className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[linear-gradient(135deg,rgba(16,22,35,0.96),rgba(18,19,28,0.96))] p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent-blue)]/20 bg-[var(--color-accent-blue)]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--color-accent-blue)]">
                  <Activity size={12} />
                  Live Statistics
                </div>
                <h1 className="mt-4 text-4xl md:text-5xl font-[1000] tracking-[-0.05em] text-[var(--color-text)]">
                  Статистика мира
                </h1>
                <p className="mt-3 text-sm md:text-base leading-relaxed text-[var(--color-text-gray)]">
                  Суммарные данные сервера, живая сводка статуса и рейтинг игроков по наигранному времени.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <StatusPill label="Статус" value={liveStatus?.online ? "Онлайн" : "Офлайн"} accent={liveStatus?.online ? "emerald" : "red"} />
                <StatusPill label="Игроки" value={playersOnlineLabel} accent="blue" />
                <StatusPill label="TPS" value={liveStatus?.tps ?? "--"} accent="violet" />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-[var(--color-text)] transition-colors hover:bg-[var(--color-panel-hover)]"
              >
                <Copy size={16} />
                {copied ? "IP скопирован" : "Скопировать IP"}
              </button>
              <Link
                href="/server"
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-accent-blue)] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-blue-600"
              >
                <Activity size={16} />
                Страница сервера
              </Link>
              <div className="inline-flex items-center rounded-2xl border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-text-gray)]">
                Обновлено: {updatedLabel}
              </div>
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-5">
              <h2 className="text-2xl md:text-3xl font-[1000] tracking-[-0.04em] text-[var(--color-text)]">
                Статистика мира
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-gray)]">
                Суммарные данные всех игроков.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4">
              {worldCards.map((card) => (
                <WorldStatCard key={card.label} icon={card.icon} value={card.value} label={card.label} />
              ))}
            </div>
          </section>

          <section className="mt-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-[1000] tracking-[-0.04em] text-[var(--color-text)]">
                  Игроки сервера
                </h2>
                <p className="mt-2 text-sm text-[var(--color-text-gray)]">
                  Топ игроков по наигранному времени и общей активности.
                </p>
              </div>
              <div className="text-sm text-[var(--color-text-gray)]">
                {leaderboard.length > 0 ? `1-${leaderboard.length} из ${formatNumber(totals?.uniquePlayers ?? 0)}` : "Нет данных"}
              </div>
            </div>

            <div className="mt-6 rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-4 md:p-6">
              {leaderboard.length > 0 ? (
                <div className="grid gap-4 xl:grid-cols-3">
                  {leaderboard.map((player, index) => (
                    <PlayerCard key={player.name} player={player} rank={index + 1} />
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-5 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]">
                    <Crown size={24} />
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-gray)]">
                    Лидерборд появится автоматически, когда сайт получит данные из нового stats endpoint плагина.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatusPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "emerald" | "red" | "blue" | "violet";
}) {
  const accentMap = {
    emerald: "text-emerald-300 border-emerald-500/20 bg-emerald-500/10",
    red: "text-red-300 border-red-500/20 bg-red-500/10",
    blue: "text-blue-300 border-blue-500/20 bg-blue-500/10",
    violet: "text-violet-300 border-violet-500/20 bg-violet-500/10",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${accentMap[accent]}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">{label}</div>
      <div className="mt-1 text-lg font-[1000] tracking-[-0.03em]">{value}</div>
    </div>
  );
}

function WorldStatCard({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-[1.55rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] px-5 py-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]">
        {icon}
      </div>
      <div className="mt-5 text-3xl font-[1000] tracking-[-0.04em] text-[var(--color-text)]">
        {value}
      </div>
      <div className="mt-2 text-sm text-[var(--color-text-gray)]">{label}</div>
    </div>
  );
}

function PlayerCard({
  player,
  rank,
}: {
  player: WorldStats["leaderboard"][number];
  rank: number;
}) {
  const rankAccent =
    rank === 1
      ? "border-yellow-400/80 shadow-[0_0_0_1px_rgba(250,204,21,0.18)]"
      : rank === 2
        ? "border-zinc-300/80"
        : rank === 3
          ? "border-orange-300/80"
          : "border-[var(--color-border-sharp)]";

  return (
    <div className={`rounded-[1.55rem] border bg-[rgba(13,14,20,0.92)] px-4 py-4 ${rankAccent}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent-blue)] text-sm font-black uppercase text-white shadow-[0_10px_24px_-14px_rgba(59,130,246,0.9)]">
            {player.name.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-[1000] tracking-[-0.03em] text-[var(--color-text)]">
              {player.name}
            </div>
            <div className={`text-sm ${player.online ? "text-emerald-400" : "text-[var(--color-text-gray)]"}`}>
              {player.online ? "В сети" : "Не в сети"}
            </div>
          </div>
        </div>
        <div className="text-sm font-black uppercase tracking-[0.18em] text-[var(--color-text-gray)]">
          №{rank}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-sm text-[var(--color-text-gray)]">Наиграно</div>
          <div className="mt-1 text-4xl font-[1000] tracking-[-0.04em] text-[var(--color-text)]">
            {formatPlayTime(player.playTicks)}
          </div>
        </div>
        <div className="grid gap-2 text-sm text-[var(--color-text-gray)]">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-3 py-2">
            <span>Убийств игроков</span>
            <span className="font-black text-[var(--color-text)]">{formatNumber(player.playerKills)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-3 py-2">
            <span>Смертей</span>
            <span className="font-black text-[var(--color-text)]">{formatNumber(player.deaths)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-3 py-2">
            <span>Убийств мобов</span>
            <span className="font-black text-[var(--color-text)]">{formatNumber(player.mobKills)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(value));
}

function formatPlayTime(playTicks: number) {
  const totalMinutes = Math.floor(playTicks / 20 / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes} мин`;
  }

  return `${formatNumber(hours)} ч ${minutes} мин`;
}

function formatDistanceKm(distanceCm: number) {
  const kilometers = distanceCm / 100000;
  return `${kilometers.toFixed(kilometers >= 100 ? 0 : 1)} км`;
}
