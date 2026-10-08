import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import Config, { type Language } from "@/config";
import { useConfigValue } from "@/hooks/use-config-value";
import { useTranslation } from "@/i18n";
import { emit } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { useEffect, useState } from "react";

export const Configuration = () => {
  const { t, language } = useTranslation();
  const [launchOnStartup, setLaunchOnStartup] = useState(false);

  useEffect(() => {
    isEnabled().then(setLaunchOnStartup);
  }, []);

  const { value: showOnlyTalkingUsers } = useConfigValue("showOnlyTalkingUsers");
  const { value: opacity } = useConfigValue("opacity");
  const { value: opacityTarget } = useConfigValue("opacityTarget");
  const { value: vertical } = useConfigValue("vertical");
  const { value: horizontal } = useConfigValue("horizontal");
  const { value: maxUsernameLength } = useConfigValue("maxUsernameLength");
  const { value: userScale } = useConfigValue("userScale");
  const { value: hideTaskbarWhenPinned } = useConfigValue("hideTaskbarWhenPinned");
  const { value: showUsernames } = useConfigValue("showUsernames");
  const { value: showSoundboardButton } = useConfigValue("showSoundboardButton");
  const { value: animateAvatars } = useConfigValue("animateAvatars");
  const { value: showScreenshareButton } = useConfigValue("showScreenshareButton");
  const { value: userSpacing } = useConfigValue("userSpacing");
  const { value: hideInFullscreen } = useConfigValue("hideInFullscreen");

  return (
    // the settings window has a fixed height, so the list scrolls instead of being cut off
    <div className="flex flex-col gap-2 max-h-[372px] overflow-auto nice-scroll pr-1">
      <div className="flex items-center justify-between mt-2 h-8 mx-2">
        <label
          htmlFor="language"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t("config.language")}
        </label>
        <select
          id="language"
          value={language}
          onChange={async event => {
            const newLanguage = event.target.value as Language;
            await Config.set("language", newLanguage);
            await invoke("set_language", { language: newLanguage });

            await emit("config_update", await Config.getConfig());
          }}
          className="w-40 p-1 rounded border bg-zinc-800 text-white outline-none focus:ring-0 cursor-pointer"
        >
          <option value="es" className="bg-zinc-800 text-white">
            Español
          </option>
          <option value="en" className="bg-zinc-800 text-white">
            English
          </option>
        </select>
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label
          htmlFor="launchOnStartup"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t("config.launchOnStartup")}
        </label>
        <Switch
          id="launchOnStartup"
          checked={launchOnStartup}
          onCheckedChange={async () => {
            if (launchOnStartup) {
              await disable();
            } else {
              await enable();
            }

            setLaunchOnStartup(await isEnabled());
          }}
        />
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label
          htmlFor="hideInFullscreen"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t("config.hideInFullscreen")}
        </label>
        <Switch
          id="hideInFullscreen"
          checked={hideInFullscreen}
          onCheckedChange={async () => {
            const newBool = !hideInFullscreen;
            await Config.set("hideInFullscreen", newBool);
            await invoke("set_hide_in_fullscreen", { value: newBool });

            await emit("config_update", await Config.getConfig());
          }}
        />
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label
          htmlFor="notification"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t("config.onlySpeaking")}
        </label>
        <Switch
          id="notification"
          checked={showOnlyTalkingUsers}
          onCheckedChange={async () => {
            const newBool = !showOnlyTalkingUsers;
            await Config.set("showOnlyTalkingUsers", newBool);

            await emit("config_update", await Config.getConfig());
          }}
        />
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label
          htmlFor="showUsernames"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t("config.showUsernames")}
        </label>
        <Switch
          id="showUsernames"
          checked={showUsernames}
          onCheckedChange={async () => {
            await Config.set("showUsernames", !showUsernames);

            await emit("config_update", await Config.getConfig());
          }}
        />
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label
          htmlFor="animateAvatars"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t("config.animateAvatars")}
        </label>
        <Switch
          id="animateAvatars"
          checked={animateAvatars}
          onCheckedChange={async () => {
            await Config.set("animateAvatars", !animateAvatars);

            await emit("config_update", await Config.getConfig());
          }}
        />
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label
          htmlFor="showSoundboardButton"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t("config.showSoundboardButton")}
        </label>
        <Switch
          id="showSoundboardButton"
          checked={showSoundboardButton}
          onCheckedChange={async () => {
            await Config.set("showSoundboardButton", !showSoundboardButton);

            await emit("config_update", await Config.getConfig());
          }}
        />
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label
          htmlFor="showScreenshareButton"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t("config.showScreenshareButton")}
        </label>
        <Switch
          id="showScreenshareButton"
          checked={showScreenshareButton}
          onCheckedChange={async () => {
            await Config.set("showScreenshareButton", !showScreenshareButton);

            await emit("config_update", await Config.getConfig());
          }}
        />
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label
          htmlFor="userSpacing"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t("config.userSpacing")}
        </label>
        <div className="flex items-center gap-4 w-1/2">
          <div className="flex-1">
            <Slider
              value={[userSpacing]}
              min={0}
              max={16}
              step={1}
              onValueChange={async (val: number[]) => {
                const newVal = val[0] ?? userSpacing;
                await Config.set("userSpacing", Number(newVal));
                await emit("config_update", await Config.getConfig());
              }}
            />
          </div>
          <div className="w-10 text-right">
            <span className="text-sm">{userSpacing} px</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label
          htmlFor="maxUsernameLength"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t("config.maxUsername")}
        </label>
        <div className="flex items-center gap-4 w-1/2">
          <div className="flex-1">
            <Slider
              value={[maxUsernameLength]}
              min={4}
              max={60}
              step={1}
              onValueChange={async (val: number[]) => {
                const newVal = val[0] ?? maxUsernameLength;
                await Config.set("maxUsernameLength", Number(newVal));
                await emit("config_update", await Config.getConfig());
              }}
            />
          </div>
          <div className="w-10 text-right">
            <span className="text-sm">{maxUsernameLength}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label
          htmlFor="horizontal"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t("config.anchorHorizontal")}
        </label>
        <select
          id="horizontal"
          value={horizontal}
          onChange={async event => {
            const newTarget = event.target.value as "left" | "center" | "right";
            await Config.set("horizontal", newTarget);

            await emit("config_update", await Config.getConfig());
          }}
          className="w-40 p-1 rounded border bg-zinc-800 text-white outline-none focus:ring-0 cursor-pointer"
        >
          <option value="left" className="bg-zinc-800 text-white">
            {t("config.left")}
          </option>
          <option value="center" className="bg-zinc-800 text-white">
            {t("config.center")}
          </option>
          <option value="right" className="bg-zinc-800 text-white">
            {t("config.right")}
          </option>
        </select>
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label
          htmlFor="vertical"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t("config.anchorVertical")}
        </label>
        <select
          id="vertical"
          value={vertical}
          onChange={async event => {
            const newTarget = event.target.value as "top" | "bottom";
            await Config.set("vertical", newTarget);

            await emit("config_update", await Config.getConfig());
          }}
          className="w-40 p-1 rounded border bg-zinc-800 text-white outline-none focus:ring-0 cursor-pointer"
        >
          <option value="top" className="bg-zinc-800 text-white">
            {t("config.top")}
          </option>
          <option value="bottom" className="bg-zinc-800 text-white">
            {t("config.bottom")}
          </option>
        </select>
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label
          htmlFor="opacityTarget"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t("config.opacityTarget")}
        </label>
        <select
          id="opacityTarget"
          value={opacityTarget}
          onChange={async event => {
            const newTarget = event.target.value as "all" | "username-box";
            await Config.set("opacityTarget", newTarget);

            await emit("config_update", await Config.getConfig());
          }}
          className="p-1 rounded border bg-zinc-800 text-white outline-none focus:ring-0 cursor-pointer"
        >
          <option value="all" className="bg-zinc-800 text-white">
            {t("config.everything")}
          </option>
          <option value="username-box" className="bg-zinc-800 text-white">
            {t("config.usernameBackground")}
          </option>
        </select>
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label
          htmlFor="opacity"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t("config.opacity")}
        </label>
        <div className="flex items-center gap-4 w-1/2">
          <div className="flex-1">
            <Slider
              value={[opacity]}
              min={1}
              max={100}
              step={1}
              onValueChange={async (val: number[]) => {
                const newVal = val[0] ?? opacity;
                await Config.set("opacity", Number(newVal));
                await emit("config_update", await Config.getConfig());
              }}
            />
          </div>
          <div className="w-10 text-right">
            <span className="text-sm">{opacity} %</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label
          htmlFor="userScale"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t("config.scale")}
        </label>
        <div className="flex items-center gap-4 w-1/2">
          <div className="flex-1">
            <Slider
              value={[userScale]}
              min={50}
              max={200}
              step={5}
              onValueChange={async (val: number[]) => {
                const newVal = val[0] ?? userScale;
                await Config.set("userScale", Number(newVal));
                await emit("config_update", await Config.getConfig());
              }}
            />
          </div>
          <div className="w-16 text-right">
            <span className="text-sm">{userScale} %</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label
          htmlFor="hideTaskbar"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t("config.hideTaskbar")}
        </label>
        <Switch
          id="hideTaskbar"
          checked={hideTaskbarWhenPinned}
          onCheckedChange={async () => {
            const newBool = !hideTaskbarWhenPinned;
            await Config.set("hideTaskbarWhenPinned", newBool);

            await invoke("set_hide_taskbar_when_pinned", {
              hideTaskbarWhenPinned: newBool,
            });

            await emit("config_update", await Config.getConfig());
          }}
        />
      </div>
    </div>
  );
};
