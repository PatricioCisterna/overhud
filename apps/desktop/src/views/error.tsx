import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSetWindowSize } from "../hooks/use-set-size";
import { useAppStore } from "../store";
import { exit } from "@tauri-apps/plugin-process";
import { useTranslation } from "@/i18n";

export const ErrorView = () => {
  useSetWindowSize({ width: 400, height: 600 });
  const { discordErrors } = useAppStore();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center h-screen p-2 bg-zinc-900">
      <div className="pt-8 pb-8 font-bold text-2xl text-center">
        <p>{t("error.title")}</p>
      </div>
      <div className="w-32 h-32">
        <img src="/img/sad-face.svg" alt="sad" className="text-white fill-white w-full" />
      </div>
      {discordErrors.size > 0 ? (
        <div className="pt-8 pb-8 text-2xl text-center">
          {Array.from(discordErrors.values()).map((item, i) => (
            <p key={`error-${i}`}>{item}</p>
          ))}
        </div>
      ) : (
        <div>
          <p className="py-8">{t("error.restart")}</p>
        </div>
      )}
      <div className="pt-8 text-2xl flex flex-col gap-4 items-center justify-center">
        <Link to="/">
          <Button>{t("error.connect")}</Button>
        </Link>
        <Button
          variant="ghost"
          onClick={async () => {
            await exit();
          }}
        >
          {t("common.quitOverlayed")}
        </Button>
      </div>
    </div>
  );
};
