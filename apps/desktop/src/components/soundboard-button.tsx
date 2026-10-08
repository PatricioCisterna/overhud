import type { DirectionLR } from "@/config";
import { useTranslation } from "@/i18n";
import { cn } from "@/utils/tw";
import { invoke } from "@tauri-apps/api/core";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef } from "react";

const rectOf = (el: HTMLElement) => {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, width: r.width, height: r.height };
};

/**
 * The "..." under the last user that opens the soundboard popup.
 * It reports its position to rust so it can still be clicked while the overlay is pinned.
 */
export const SoundboardButton = ({ alignDirection, opacity }: { alignDirection: DirectionLR; opacity: number }) => {
  const { t } = useTranslation();
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let last = "";
    const report = () => {
      if (!ref.current) return;
      const rect = rectOf(ref.current);
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

  return (
    <div
      className={cn("flex px-2 py-1", {
        "justify-start": alignDirection === "left",
        "justify-center w-full": alignDirection === "center",
        "justify-end": alignDirection === "right",
      })}
    >
      <button
        ref={ref}
        title={t("soundboard.open")}
        className="flex items-center justify-center w-9 h-6 rounded-full cursor-pointer text-zinc-300 hover:text-white hover:bg-zinc-700"
        style={{ backgroundColor: `rgba(40, 40, 40, ${opacity / 100})` }}
        onClick={() => {
          if (!ref.current) return;
          invoke("open_soundboard", rectOf(ref.current));
        }}
      >
        <MoreHorizontal size={18} />
      </button>
    </div>
  );
};
