import { Updater } from "@/components/updater";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Account } from "./account";
import { JoinHistory } from "./join-history";
import { useState } from "react";
import { usePlatformInfo } from "@/hooks/use-platform-info";
import type { Update } from "@tauri-apps/plugin-updater";
import { Configuration } from "./configuration";
import { useTranslation } from "@/i18n";
import { Soundboard } from "./soundboard";

export const SettingsView = ({ update }: { update: Update | null }) => {
  const { canary } = usePlatformInfo();
  const [currentTab, setCurrentTab] = useState("account");
  const { t } = useTranslation();
  return (
    <div className="bg-zinc-900 w-[calc(100vw)] h-full">
      <Tabs
        defaultValue="account"
        onValueChange={value => {
          setCurrentTab(value);
        }}
      >
        <TabsList className="grid w-full grid-cols-4 rounded-t-none">
          <TabsTrigger value="account">{t("settings.general")}</TabsTrigger>
          <TabsTrigger value="configuration">{t("settings.configuration")}</TabsTrigger>
          <TabsTrigger value="join-history">{t("settings.joinHistory")}</TabsTrigger>
          <TabsTrigger value="soundboard">{t("settings.soundboard")}</TabsTrigger>
        </TabsList>
        {canary && (
          <div className="h-[32px] bg-yellow-400 font-semibold text-black flex items-center justify-center">
            <a target="_blank" href="https://overlayed.dev/canary#about">
              <p>{t("settings.canary")}</p>
            </a>
          </div>
        )}
        {!canary && update?.available && <Updater update={update} />}
        <div className="p-4 pt-0">
          <TabsContent tabIndex={-1} value="account">
            <Account />
          </TabsContent>
          <TabsContent tabIndex={-1} value="configuration">
            <Configuration />
          </TabsContent>
          <TabsContent tabIndex={-1} value="soundboard">
            <Soundboard />
          </TabsContent>
          <TabsContent tabIndex={-1} forceMount value="join-history">
            <div style={{ display: currentTab === "join-history" ? "block" : "none" }}>
              <JoinHistory />
            </div>
          </TabsContent>
        </div>
        <div className="absolute bottom-0 flex items-center w-full h-10 pl-4 text-gray-400 bg-zinc-800">
          <p>
            {t("settings.foundBug")}{" "}
            <a
              className="text-blue-400"
              target="_blank"
              rel="noreferrer"
              href="https://github.com/overlayeddev/overlayed"
            >
              {t("settings.githubRepo")}
            </a>
          </p>
        </div>
      </Tabs>
    </div>
  );
};
