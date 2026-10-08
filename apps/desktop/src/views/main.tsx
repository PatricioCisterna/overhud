import { useAppStore } from "../store";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { exit } from "@tauri-apps/plugin-process";
import { useTranslation } from "@/i18n";

export const MainView = () => {
  const { resetErrors } = useAppStore();
  const { t } = useTranslation();

  useEffect(() => {
    resetErrors();
  }, []);

  return (
    <div className="h-screen p-2 bg-zinc-900">
      <div className="pt-1 mb-3 font-bold text-2xl text-center">
        <p className="mb-2">{t("main.authorize")}</p>
        <p className="text-sm text-center text-zinc-400">{t("main.disclaimer")}</p>
        <ul className="flex flex-col pl-10 gap-4 p-4 mt-6 text-xl text-left">
          <li>
            <p className="leading-8">{t("main.step1")}</p>
          </li>
          <li>
            <p className="leading-8">{t("main.step2")}</p>
          </li>
          <li>
            <p className="leading-8">{t("main.step3")}</p>
          </li>
          <li>
            <p className="leading-8">{t("main.step4")}</p>
          </li>
        </ul>

        <div className="pt-8 text-2xl flex flex-col gap-4 items-center justify-center">
          <Button
            onClick={() => {
              // TODO: this is a hack, it should be handled better
              window.location.reload();
            }}
          >
            {t("main.tryAgain")}
          </Button>

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
    </div>
  );
};
