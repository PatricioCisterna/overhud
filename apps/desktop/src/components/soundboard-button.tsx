import type { DirectionLR } from "@/config";
import { Event } from "@/constants";
import { useTranslation } from "@/i18n";
import { cn } from "@/utils/tw";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { MonitorUp, MonitorX, MoreHorizontal } from "lucide-react";
import { useAppStore } from "@/store";
import { useEffect, useRef } from "react";

const rectOf = (el: HTMLElement) => {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, width: r.width, height: r.height };
};

// same width as an avatar with its border (w-8 + 2px each side) so they line up under the avatars
const buttonClass =
  "flex items-center justify-center w-9 h-6 rounded-full cursor-pointer text-zinc-300 hover:text-white hover:bg-zinc-700";

/**
 * The buttons under the last user: "..." opens the soundboard popup and the one below
 * toggles screen sharing. Their area is reported to rust so it can still be clicked
 * while the overlay is pinned.
 */
export const SoundboardButton = ({
  alignDirection,
  opacity,
  spacing,
  scale,
  showSoundboard,
  showScreenshare,
}: {
  alignDirection: DirectionLR;
  opacity: number;
  spacing: number;
  scale: number;
  showSoundboard: boolean;
  showScreenshare: boolean;
}) => {
  const { t } = useTranslation();
  const areaRef = useRef<HTMLDivElement>(null);
  const soundboardRef = useRef<HTMLButtonElement>(null);
  const { screensharing } = useAppStore();

  useEffect(() => {
    let last = "";
    const report = () => {
      if (!areaRef.current) return;
      const rect = rectOf(areaRef.current);
      const key = JSON.stringify(rect);
      if (key === last) return;
      last = key;
      invoke("set_interactive_region", rect);
    };

    // the list moves when people join/leave, so keep it in sync
    report();
    const interval = setInterval(report, 300);
    window.addEventListener("resize", report);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", report);
      invoke("clear_interactive_region");
    };
  }, []);

  const background = { backgroundColor: `rgba(40, 40, 40, ${opacity / 100})` };

  return (
    <div
      className={cn("flex px-2", {
        "justify-start": alignDirection === "left",
        "justify-center w-full": alignDirection === "center",
        "justify-end": alignDirection === "right",
      })}
      style={{
        paddingTop: spacing,
        paddingBottom: spacing,
        // scale like the users above so the buttons stay lined up with the avatars
        transform: scale !== 100 ? `scale(${scale / 100})` : undefined,
        transformOrigin:
          alignDirection === "left" ? "left center" : alignDirection === "right" ? "right center" : "center center",
      }}
    >
      <div ref={areaRef} className="flex flex-col gap-1">
        {showSoundboard && (
          <button
            ref={soundboardRef}
            title={t("soundboard.open")}
            className={buttonClass}
            style={background}
            onClick={() => {
              if (!soundboardRef.current) return;
              invoke("open_soundboard", rectOf(soundboardRef.current));
            }}
          >
            <MoreHorizontal size={18} />
          </button>
        )}
        {showScreenshare && (
          <button
            title={screensharing ? t("screenshare.stop") : t("screenshare.toggle")}
            className={cn(buttonClass, screensharing && "text-green-400 hover:text-green-300 hover:bg-green-900")}
            // discord-like green while you are live
            style={screensharing ? { backgroundColor: "rgba(35, 165, 90, 0.25)" } : background}
            onClick={async () => {
              await emit(Event.ScreenshareToggle);
              // starting opens discord's screenshare picker in its own window, usually behind the game;
              // stopping needs no picker, so leave the game focused
              if (!screensharing) setTimeout(() => invoke("focus_discord"), 150);
            }}
          >
            {screensharing ? <MonitorX size={16} /> : <MonitorUp size={16} />}
          </button>
        )}
      </div>
    </div>
  );
};
