import { Routes, Route, useLocation } from "react-router-dom";
import { MainView } from "./views/main";
import { ChannelView } from "./views/channel";

import { SettingsView } from "./views/settings";
import { SoundboardView } from "./views/soundboard";
import { ErrorView } from "./views/error";
import { NavBar } from "./components/nav-bar";
import { usePin } from "./hooks/use-pin";
import { useAlign } from "./hooks/use-align";
import { useDisableWebFeatures } from "./hooks/use-disable-context-menu";
import { useUpdate } from "./hooks/use-update";
import { useAppStore } from "./store";
import { Toaster } from "./components/ui/toaster";
import { useEffect } from "react";
import { useSocket } from "./rpc/manager";
import { cn } from "./utils/tw";
import Config from "./config";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { emit, listen } from "@tauri-apps/api/event";

function App() {
  useDisableWebFeatures();
  useSocket();

  useEffect(() => {
    const styleForLog = "font-size: 20px; color: #00dffd";
    console.log(`%cOverlayed ${window.location.hash} Window`, styleForLog);
  }, []);

  useEffect(() => {
    (async () => {
      const config = await Config.getConfig();
      await invoke("set_hide_taskbar_when_pinned", {
        hideTaskbarWhenPinned: config.hideTaskbarWhenPinned,
      });

      // the tray menu lives in rust, so it has to be told the language
      await invoke("set_language", { language: config.language });

      // restore the pin from the last session; only the overlay window does it
      // so the settings window doesn't apply it twice
      if (getCurrentWindow().label === "main" && config.pin) {
        await invoke("set_pin", { value: true });
      }

      // the on/off button is remembered between sessions
      if (getCurrentWindow().label === "main" && !config.overlayEnabled) {
        await invoke("set_overlay_visible", { visible: false });
      }

      // "Show OverHud" in the tray turns it back on
      if (getCurrentWindow().label === "main") {
        await listen("overlay-shown", async () => {
          await Config.set("overlayEnabled", true);
          await emit("config_update", await Config.getConfig());
        });
      }
    })();
  }, []);

  const { update } = useUpdate();
  const { visible } = useAppStore();

  const { pin } = usePin();
  const { horizontal, setHorizontalDirection } = useAlign();
  const visibleClass = visible ? "opacity-100" : "opacity-0";
  const location = useLocation();
  const isSettingsWindow = location.pathname === "/settings";
  const isSoundboardWindow = location.pathname === "/soundboard";

  if (isSoundboardWindow) {
    return <SoundboardView />;
  }

  return (
    <div
      className={cn(
        `text-white h-screen select-none rounded-lg flex flex-col ${visibleClass}`,
        // Only show the border on the overlay (main) window when not pinned.
        pin || isSettingsWindow ? null : "border border-zinc-600"
      )}
    >
      <NavBar
        isUpdateAvailable={update?.available ?? false}
        pin={pin}
        alignDirection={horizontal}
        setAlignDirection={setHorizontalDirection}
      />
      <Toaster />
      <Routes>
        <Route path="/" element={<MainView />} />
        <Route path="/channel" element={<ChannelView alignDirection={horizontal} />} />
        <Route path="/settings" element={<SettingsView update={update} />} />
        <Route path="/error" element={<ErrorView />} />
      </Routes>
    </div>
  );
}

export default App;
