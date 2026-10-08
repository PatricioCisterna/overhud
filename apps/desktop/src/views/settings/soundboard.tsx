import { Button } from "@/components/ui/button";
import { Event } from "@/constants";
import { useTranslation } from "@/i18n";
import { emit, listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

interface SoundboardSound {
  name: string;
  sound_id: string;
  guild_id: string;
  available: boolean;
  emoji_name: string | null;
}

export const Soundboard = () => {
  const { t } = useTranslation();
  const [sounds, setSounds] = useState<SoundboardSound[] | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string | null } | null>(null);

  useEffect(() => {
    const unlistenSounds = listen<SoundboardSound[]>(Event.SoundboardSounds, event => {
      setSounds(event.payload);
    });
    const unlistenResult = listen<{ ok: boolean; message: string | null }>(Event.SoundboardPlayResult, event => {
      setResult(event.payload);
    });

    // the socket lives in the overlay window, ask it for the list
    emit(Event.SoundboardRequest);

    return () => {
      unlistenSounds.then(f => f());
      unlistenResult.then(f => f());
    };
  }, []);

  return (
    <div className="flex flex-col gap-2 pb-4">
      <p className="text-sm text-gray-400">{t("soundboard.description")}</p>
      {result && (
        <p className={result.ok ? "text-sm text-green-400" : "text-sm text-red-400"}>
          {result.ok ? t("soundboard.played") : `${t("soundboard.failed")}: ${result.message}`}
        </p>
      )}
      <div className="overflow-auto nice-scroll h-[300px] flex flex-wrap content-start gap-2">
        {sounds === null && <p className="text-sm">{t("soundboard.loading")}</p>}
        {sounds?.map(sound => (
          <Button
            key={sound.sound_id}
            size="sm"
            variant="outline"
            disabled={!sound.available}
            onClick={() => {
              setResult(null);
              emit(Event.SoundboardPlay, { guild_id: sound.guild_id, sound_id: sound.sound_id });
            }}
          >
            {sound.emoji_name ? `${sound.emoji_name} ` : ""}
            {sound.name}
          </Button>
        ))}
      </div>
    </div>
  );
};
