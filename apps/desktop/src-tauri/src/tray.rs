use std::sync::Mutex;

use tauri::{
  menu::{Menu, MenuBuilder, MenuEvent},
  tray::TrayIconBuilder,
  AppHandle, LogicalSize, Manager, Wry,
};

use anyhow::Result;
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

use crate::{
  commands, toggle_pin, HideTaskbarWhenPinned, Pinned, TrayMenu, MAIN_WINDOW_NAME, OVERLAYED,
  SETTINGS_WINDOW_NAME, TRAY_OPEN_DEVTOOLS_MAIN, TRAY_OPEN_DEVTOOLS_SETTINGS, TRAY_QUIT,
  TRAY_RELOAD, TRAY_SETTINGS, TRAY_SHOW_APP, TRAY_TOGGLE_PIN,
};

pub struct Tray;

impl Tray {
  /// Label for a tray menu item in the given language ("en" or "es").
  pub fn label(language: &str, id: &str, pinned: bool) -> &'static str {
    let es = language == "es";
    match id {
      TRAY_TOGGLE_PIN => match (es, pinned) {
        (true, true) => "Soltar",
        (true, false) => "Fijar",
        (false, true) => "Unpin",
        (false, false) => "Pin",
      },
      TRAY_SHOW_APP if es => "Mostrar OverHud",
      TRAY_SHOW_APP => "Show OverHud",
      TRAY_RELOAD if es => "Recargar",
      TRAY_RELOAD => "Reload App",
      TRAY_OPEN_DEVTOOLS_MAIN if es => "Abrir DevTools (ventana principal)",
      TRAY_OPEN_DEVTOOLS_MAIN => "Open Devtools (main window)",
      TRAY_OPEN_DEVTOOLS_SETTINGS if es => "Abrir DevTools (ventana de ajustes)",
      TRAY_OPEN_DEVTOOLS_SETTINGS => "Open Devtools (settings window)",
      TRAY_SETTINGS if es => "Ajustes",
      TRAY_SETTINGS => "Settings",
      TRAY_QUIT if es => "Salir",
      TRAY_QUIT => "Quit",
      _ => "",
    }
  }

  /// Every tray item that has a translated label.
  pub const TRANSLATED_ITEMS: [&'static str; 7] = [
    TRAY_TOGGLE_PIN,
    TRAY_SHOW_APP,
    TRAY_RELOAD,
    TRAY_OPEN_DEVTOOLS_MAIN,
    TRAY_OPEN_DEVTOOLS_SETTINGS,
    TRAY_SETTINGS,
    TRAY_QUIT,
  ];

  pub fn create_tray_menu(app_handle: &AppHandle) -> Result<Menu<Wry>, tauri::Error> {
    let version = app_handle.package_info().version.to_string();
    // the real language arrives from the frontend via set_language once it loads
    let l = |id| Tray::label("en", id, false);
    MenuBuilder::new(app_handle)
      .text(TRAY_TOGGLE_PIN, l(TRAY_TOGGLE_PIN))
      .text(TRAY_SHOW_APP, l(TRAY_SHOW_APP))
      .text(TRAY_RELOAD, l(TRAY_RELOAD))
      .text(TRAY_SETTINGS, l(TRAY_SETTINGS))
      .separator()
      .text(OVERLAYED, format!("OverHud v{version}"))
      .text(TRAY_QUIT, l(TRAY_QUIT))
      .build()
  }

  pub fn update_tray(app_handle: &AppHandle) -> Result<()> {
    let menu = Tray::create_tray_menu(app_handle)?;
    let _ = TrayIconBuilder::with_id(OVERLAYED)
      .menu(&menu)
      .on_menu_event(Self::handle_menu_events)
      .build(app_handle)?;
    app_handle.manage(TrayMenu(Mutex::new(menu)));
    commands::update_tray_icon(app_handle, false);
    Ok(())
  }

  pub fn handle_menu_events(app: &AppHandle, event: MenuEvent) {
    match event.id().as_ref() {
      TRAY_TOGGLE_PIN => {
        let window = app.get_webview_window(MAIN_WINDOW_NAME).unwrap();

        toggle_pin(
          window,
          app.state::<Pinned>(),
          app.state::<TrayMenu>(),
          app.state::<HideTaskbarWhenPinned>(),
        )
      }
      TRAY_SHOW_APP => {
        let window = app.get_webview_window(MAIN_WINDOW_NAME).unwrap();
        window.show().unwrap();

        // center and resize the window
        window.center();
        window.set_size(LogicalSize::new(400, 700)).unwrap();

        window.set_focus().unwrap();
      }
      TRAY_RELOAD => {
        let window = app.get_webview_window(MAIN_WINDOW_NAME).unwrap();
        window.eval("window.location.reload();").unwrap();
      }
      TRAY_SETTINGS => {
        // find the settings window and show it
        let settings_window = app.get_webview_window(SETTINGS_WINDOW_NAME).unwrap();
        settings_window.show().unwrap();
        settings_window.set_focus().unwrap();
      }
      TRAY_OPEN_DEVTOOLS_MAIN => {
        let window = app.get_webview_window(MAIN_WINDOW_NAME).unwrap();
        window.open_devtools();
        window.show().unwrap();
      }
      TRAY_OPEN_DEVTOOLS_SETTINGS => {
        let window = app.get_webview_window(SETTINGS_WINDOW_NAME).unwrap();
        window.open_devtools();
        window.show().unwrap();
      }
      TRAY_QUIT => {
        // NOTE: we only save position and size so that StateFlags::FULLSCREEN is not saved, as
        // nspanels do not support it
        app.save_window_state(StateFlags::POSITION | StateFlags::SIZE);
        std::process::exit(0)
      }
      _ => {}
    }
  }
}
