import { Event } from "@/constants";
import { useTranslation } from "@/i18n";
import type { SoundboardGuild } from "@/rpc/manager";
import { cn } from "@/utils/tw";
import { SiDiscord } from "@icons-pack/react-simple-icons";
import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import { ChevronDown, Clock, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface Sound {
  name: string;
  sound_id: string;
  guild_id?: string | null;
  available: boolean;
  emoji_id: string | null;
  emoji_name: string | null;
}

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  sounds: Sound[];
}

const RECENT_KEY = "overlayed:soundboard:recent";
const MAX_RECENT = 6;
const DEFAULT_GROUP = "discord-default";

// discord's built-in sounds (quack, airhorn...) don't belong to a real server
const groupOf = (sound: Sound) =>
  sound.guild_id && /^\d{15,}$/.test(sound.guild_id) && Number(sound.sound_id) > 1000 ? sound.guild_id : DEFAULT_GROUP;

const loadRecent = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
};

const GuildIcon = ({ guild, size }: { guild?: SoundboardGuild; size: number }) => {
  if (guild?.icon_url) {
    return <img src={guild.icon_url} alt="" className="rounded-xl" style={{ width: size, height: size }} />;
  }
  const initials = (guild?.name ?? "?")
    .split(/\s+/)
    .map(word => word[0])
    .join("")
    .slice(0, 3);
  return (
    <div
      className="rounded-xl bg-zinc-700 flex items-center justify-center text-xs font-semibold"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
};

const Emoji = ({ sound }: { sound: Sound }) => {
  if (sound.emoji_id) {
    return <img src={`https://cdn.discordapp.com/emojis/${sound.emoji_id}.webp?size=32`} alt="" className="w-5 h-5" />;
  }
  if (sound.emoji_name) return <span className="text-lg leading-none">{sound.emoji_name}</span>;
  return null;
};

export const SoundboardView = () => {
  const { t } = useTranslation();
  const [sounds, setSounds] = useState<Sound[] | null>(null);
  const [guilds, setGuilds] = useState<Record<string, SoundboardGuild>>({});
  const [currentGuildId, setCurrentGuildId] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>(loadRecent);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const unlisten = [
      listen<Sound[]>(Event.SoundboardSounds, event => setSounds(event.payload)),
      listen<{ guilds: Record<string, SoundboardGuild>; currentGuildId: string | null }>(
        Event.SoundboardGuilds,
        event => {
          setGuilds(event.payload.guilds);
          setCurrentGuildId(event.payload.currentGuildId);
        }
      ),
      listen<{ ok: boolean; message: string | null }>(Event.SoundboardPlayResult, event => {
        setError(event.payload.ok ? null : event.payload.message);
      }),
      // rust tells us every time the popup is shown
      listen(Event.SoundboardOpened, () => {
        setSearch("");
        setError(null);
        emit(Event.SoundboardRequest);
        searchRef.current?.focus();
      }),
    ];

    emit(Event.SoundboardRequest);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") invoke("close_soundboard");
    };
    window.addEventListener("keydown", onKey);

    return () => {
      unlisten.forEach(u => u.then(f => f()));
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const play = (sound: Sound) => {
    if (!sound.available) return;
    setError(null);
    // discord's built-in sounds may come without a server id
    emit(Event.SoundboardPlay, {
      sound_id: sound.sound_id,
      ...(sound.guild_id ? { guild_id: sound.guild_id } : {}),
    });

    const next = [sound.sound_id, ...recent.filter(id => id !== sound.sound_id)].slice(0, MAX_RECENT);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // recents are a nicety, ignore storage failures
    }
  };

  const sections = useMemo<Section[]>(() => {
    if (!sounds) return [];

    const query = search.trim().toLowerCase();
    if (query) {
      return [
        {
          id: "results",
          title: t("soundboard.results"),
          icon: <Search size={16} />,
          sounds: sounds.filter(s => s.name.toLowerCase().includes(query)),
        },
      ];
    }

    const byGroup = new Map<string, Sound[]>();
    for (const sound of sounds) {
      const group = groupOf(sound);
      byGroup.set(group, [...(byGroup.get(group) ?? []), sound]);
    }

    // the server you're in goes first, discord's own sounds go last
    const groupIds = [...byGroup.keys()]
      .filter(id => id !== DEFAULT_GROUP)
      .sort((a, b) => (a === currentGuildId ? -1 : b === currentGuildId ? 1 : 0));

    const result: Section[] = [];

    const recentSounds = recent
      .map(id => sounds.find(s => s.sound_id === id))
      .filter((s): s is Sound => !!s);
    if (recentSounds.length) {
      result.push({ id: "recent", title: t("soundboard.recent"), icon: <Clock size={16} />, sounds: recentSounds });
    }

    for (const id of groupIds) {
      result.push({
        id,
        title: guilds[id]?.name ?? t("soundboard.server"),
        icon: <GuildIcon guild={guilds[id]} size={16} />,
        sounds: byGroup.get(id) ?? [],
      });
    }

    if (byGroup.has(DEFAULT_GROUP)) {
      result.push({
        id: DEFAULT_GROUP,
        title: t("soundboard.discordSounds"),
        icon: <SiDiscord size={16} />,
        sounds: byGroup.get(DEFAULT_GROUP) ?? [],
      });
    }

    return result;
  }, [sounds, guilds, currentGuildId, recent, search, t]);

  return (
    <div className="h-screen flex flex-col gap-3 p-3 rounded-lg bg-zinc-950 border border-zinc-700 text-white">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 h-11 rounded-lg border border-zinc-700 focus-within:border-indigo-500 bg-zinc-900">
          <Search size={18} className="text-zinc-400" />
          <input
            ref={searchRef}
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("soundboard.search")}
            className="flex-1 bg-transparent outline-none text-base placeholder:text-zinc-500"
          />
        </div>
        <button
          className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
          onClick={() => invoke("close_soundboard")}
        >
          <X size={20} />
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{`${t("soundboard.failed")}: ${error}`}</p>}

      <div className="flex-1 flex gap-3 min-h-0">
        {/* server rail */}
        {!search && (
          <div className="flex flex-col items-center gap-2 overflow-auto nice-scroll pr-1">
            {sections.map(section => (
              <button
                key={section.id}
                title={section.title}
                className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                onClick={() => sectionRefs.current[section.id]?.scrollIntoView({ behavior: "smooth" })}
              >
                {section.id === "recent" ? (
                  <Clock size={20} />
                ) : section.id === DEFAULT_GROUP ? (
                  <SiDiscord size={20} />
                ) : (
                  <GuildIcon guild={guilds[section.id]} size={40} />
                )}
              </button>
            ))}
          </div>
        )}

        {/* sounds */}
        <div className="flex-1 overflow-auto nice-scroll pr-1">
          {sounds === null && <p className="text-sm text-zinc-400">{t("soundboard.loading")}</p>}
          {sounds !== null && sections.every(s => s.sounds.length === 0) && (
            <p className="text-sm text-zinc-400">{t("soundboard.noResults")}</p>
          )}
          {sections.map(section => (
            <div
              key={section.id}
              ref={el => {
                sectionRefs.current[section.id] = el;
              }}
              className="mb-3"
            >
              <button
                className="flex items-center gap-2 mb-2 text-sm font-semibold text-zinc-300 hover:text-white cursor-pointer"
                onClick={() => setCollapsed(c => ({ ...c, [section.id]: !c[section.id] }))}
              >
                {section.icon}
                <span className="truncate">{section.title}</span>
                <ChevronDown
                  size={16}
                  className={cn("transition-transform", collapsed[section.id] ? "-rotate-90" : undefined)}
                />
              </button>
              {!collapsed[section.id] && (
                <div className="grid grid-cols-3 gap-2">
                  {section.sounds.map(sound => (
                    <button
                      key={`${section.id}-${sound.sound_id}`}
                      title={sound.available ? sound.name : t("soundboard.unavailable")}
                      disabled={!sound.available}
                      onClick={() => play(sound)}
                      className={cn(
                        "h-11 px-2 rounded-lg bg-zinc-900 flex items-center justify-center gap-2 text-sm font-medium",
                        sound.available ? "hover:bg-zinc-800 cursor-pointer" : "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <Emoji sound={sound} />
                      <span className="truncate">{sound.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
