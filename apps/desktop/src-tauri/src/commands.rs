use std::{
  ops::Deref,
  sync::{atomic::AtomicBool, Mutex},
};

use tauri::{image::Image, menu::Menu, AppHandle, Emitter, Manager, State, WebviewWindow, Wry};

use crate::{constants::*, tray::Tray, HideTaskbarWhenPinned, Language, Pinned, TrayMenu};

/// Rectangle (logical px, relative to the overlay window) that should still take
/// clicks while the overlay is pinned, e.g. the soundboard button.
pub struct InteractiveRegion(pub Mutex<Option<[f64; 4]>>);

#[tauri::command]
pub fn set_interactive_region(
  region: State<InteractiveRegion>,
  x: f64,
  y: f64,
  width: f64,
  height: f64,
) {
  if let Ok(mut r) = region.0.lock() {
    *r = Some([x, y, width, height]);
  }
}

#[tauri::command]
pub fn clear_interactive_region(region: State<InteractiveRegion>) {
  if let Ok(mut r) = region.0.lock() {
    *r = None;
  }
}

/// While pinned the overlay ignores the mouse; this watches the cursor and only
/// accepts clicks while it is over the interactive region.
pub fn watch_interactive_region(app: AppHandle) {
  std::thread::spawn(move || {
    let mut prev_pinned = false;
    let mut accepting = false;
    loop {
      std::thread::sleep(std::time::Duration::from_millis(40));

      let pinned = app
        .state::<Pinned>()
        .load(std::sync::atomic::Ordering::Relaxed);
      if pinned != prev_pinned {
        // _set_pin just reset the cursor events itself
        prev_pinned = pinned;
        accepting = !pinned;
      }
      if !pinned {
        continue;
      }

      let Some(window) = app.get_webview_window(MAIN_WINDOW_NAME) else {
        continue;
      };
      let region = app
        .state::<InteractiveRegion>()
        .0
        .lock()
        .ok()
        .and_then(|r| *r);

      let inside = match (
        region,
        window.cursor_position(),
        window.inner_position(),
        window.scale_factor(),
      ) {
        (Some([x, y, w, h]), Ok(cursor), Ok(pos), Ok(scale)) => {
          let left = pos.x as f64 + x * scale;
          let top = pos.y as f64 + y * scale;
          cursor.x >= left
            && cursor.x <= left + w * scale
            && cursor.y >= top
            && cursor.y <= top + h * scale
        }
        _ => false,
      };

      if inside != accepting {
        window.set_ignore_cursor_events(!inside);
        accepting = inside;
      }
    }
  });
}

/// Show the soundboard popup next to the button that opened it.
/// The button rect is in logical px relative to the overlay window.
#[tauri::command]
pub fn open_soundboard(app: AppHandle, x: f64, y: f64, width: f64, height: f64) {
  let (Some(main), Some(popup)) = (
    app.get_webview_window(MAIN_WINDOW_NAME),
    app.get_webview_window(SOUNDBOARD_WINDOW_NAME),
  ) else {
    return;
  };

  let scale = main.scale_factor().unwrap_or(1.0);
  let Ok(origin) = main.inner_position() else {
    return;
  };
  let Ok(size) = popup.outer_size() else {
    return;
  };
  let (popup_w, popup_h) = (size.width as f64, size.height as f64);

  let button_left = origin.x as f64 + x * scale;
  let button_right = button_left + width * scale;
  let button_top = origin.y as f64 + y * scale;
  let button_bottom = button_top + height * scale;
  let gap = 6.0 * scale;

  // keep it on the monitor the overlay is on
  let (mx, my, mw, mh) = match main.current_monitor() {
    Ok(Some(m)) => (
      m.position().x as f64,
      m.position().y as f64,
      m.size().width as f64,
      m.size().height as f64,
    ),
    _ => (0.0, 0.0, f64::MAX / 4.0, f64::MAX / 4.0),
  };

  // to the right of the button, or to its left when there's no room
  let mut left = button_right + gap;
  if left + popup_w > mx + mw {
    left = button_left - popup_w - gap;
  }
  // grow downwards from the button's top, or upwards from its bottom near the screen's bottom
  let mut top = button_top;
  if top + popup_h > my + mh {
    top = button_bottom - popup_h;
  }
  let left = left.clamp(mx, (mx + mw - popup_w).max(mx));
  let top = top.clamp(my, (my + mh - popup_h).max(my));

  popup.set_position(tauri::PhysicalPosition::new(left as i32, top as i32));
  popup.show();
  popup.set_focus();
  let _ = popup.emit(SOUNDBOARD_OPENED, ());
}

/// Whether the overlay should hide itself while a fullscreen app (a game) is in front.
pub struct HideInFullscreen(pub AtomicBool);

#[tauri::command]
pub fn set_hide_in_fullscreen(state: State<HideInFullscreen>, value: bool) {
  state.0.store(value, std::sync::atomic::Ordering::Relaxed);
}

/// True when the focused window covers its whole monitor and isn't ours or the desktop.
#[cfg(target_os = "windows")]
fn fullscreen_app_in_front() -> bool {
  use windows_sys::Win32::Foundation::RECT;
  use windows_sys::Win32::Graphics::Gdi::{
    GetMonitorInfoW, MonitorFromWindow, MONITORINFO, MONITOR_DEFAULTTONEAREST,
  };
  use windows_sys::Win32::System::Threading::GetCurrentProcessId;
  use windows_sys::Win32::UI::WindowsAndMessaging::{
    GetClassNameW, GetForegroundWindow, GetWindowRect, GetWindowThreadProcessId,
  };

  unsafe {
    let hwnd = GetForegroundWindow();
    if hwnd.is_null() {
      return false;
    }

    let mut pid = 0u32;
    GetWindowThreadProcessId(hwnd, &mut pid);
    if pid == GetCurrentProcessId() {
      return false;
    }

    // the desktop also "covers the screen"
    let mut class = [0u16; 64];
    let len = GetClassNameW(hwnd, class.as_mut_ptr(), class.len() as i32);
    let class = String::from_utf16_lossy(&class[..len.max(0) as usize]);
    if class == "Progman" || class == "WorkerW" || class == "Shell_TrayWnd" {
      return false;
    }

    let mut rect: RECT = std::mem::zeroed();
    if GetWindowRect(hwnd, &mut rect) == 0 {
      return false;
    }
    let mut info: MONITORINFO = std::mem::zeroed();
    info.cbSize = std::mem::size_of::<MONITORINFO>() as u32;
    if GetMonitorInfoW(MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST), &mut info) == 0 {
      return false;
    }
    let m = info.rcMonitor;
    rect.left <= m.left && rect.top <= m.top && rect.right >= m.right && rect.bottom >= m.bottom
  }
}

/// Hide the overlay while a game is fullscreen and bring it back afterwards,
/// without stealing focus from the game.
pub fn watch_fullscreen(app: AppHandle) {
  #[cfg(target_os = "windows")]
  std::thread::spawn(move || {
    use windows_sys::Win32::UI::WindowsAndMessaging::{ShowWindow, SW_HIDE, SW_SHOWNOACTIVATE};

    let mut hidden_by_us = false;
    loop {
      std::thread::sleep(std::time::Duration::from_millis(500));

      let enabled = app
        .state::<HideInFullscreen>()
        .0
        .load(std::sync::atomic::Ordering::Relaxed);
      let should_hide = enabled && fullscreen_app_in_front();
      if should_hide == hidden_by_us {
        continue;
      }

      let Some(window) = app.get_webview_window(MAIN_WINDOW_NAME) else {
        continue;
      };
      let Ok(hwnd) = window.hwnd() else {
        continue;
      };
      unsafe {
        ShowWindow(
          hwnd.0 as _,
          if should_hide { SW_HIDE } else { SW_SHOWNOACTIVATE },
        );
      }
      hidden_by_us = should_hide;
    }
  });

  #[cfg(not(target_os = "windows"))]
  let _ = app;
}

/// Bring the discord window to the front, e.g. so its screenshare picker is visible.
/// Windows only lets us do this right after the user clicked one of our windows.
#[tauri::command]
pub fn focus_discord() -> bool {
  #[cfg(target_os = "windows")]
  unsafe {
    use windows_sys::Win32::Foundation::{BOOL, HWND, LPARAM};
    use windows_sys::Win32::UI::WindowsAndMessaging::{
      EnumWindows, GetWindowTextW, IsIconic, IsWindowVisible, SetForegroundWindow, ShowWindow,
      SW_RESTORE,
    };

    // discord's main window title is "Discord" or "<channel> - Discord"
    unsafe extern "system" fn find(hwnd: HWND, found: LPARAM) -> BOOL {
      if IsWindowVisible(hwnd) == 0 {
        return 1;
      }
      let mut buf = [0u16; 512];
      let len = GetWindowTextW(hwnd, buf.as_mut_ptr(), buf.len() as i32);
      let title = String::from_utf16_lossy(&buf[..len.max(0) as usize]);
      if title == "Discord" || title.ends_with(" - Discord") {
        *(found as *mut HWND) = hwnd;
        return 0;
      }
      1
    }

    let mut hwnd: HWND = std::ptr::null_mut();
    EnumWindows(Some(find), &mut hwnd as *mut HWND as LPARAM);
    if hwnd.is_null() {
      return false;
    }
    if IsIconic(hwnd) != 0 {
      ShowWindow(hwnd, SW_RESTORE);
    }
    return SetForegroundWindow(hwnd) != 0;
  }

  #[cfg(not(target_os = "windows"))]
  false
}

#[tauri::command]
pub fn close_soundboard(app: AppHandle) {
  if let Some(popup) = app.get_webview_window(SOUNDBOARD_WINDOW_NAME) {
    popup.hide();
  }
}

#[tauri::command]
pub fn set_language(
  language: String,
  stored: State<Language>,
  pinned: State<Pinned>,
  menu: State<TrayMenu>,
) {
  if let Ok(mut l) = stored.lock() {
    *l = language.clone();
  }

  let pinned = pinned.load(std::sync::atomic::Ordering::Relaxed);
  if let Ok(menu) = menu.lock() {
    for id in Tray::TRANSLATED_ITEMS {
      if let Some(item) = menu.get(id) {
        item
          .as_menuitem_unchecked()
          .set_text(Tray::label(&language, id, pinned));
      }
    }
  }
}

#[tauri::command]
pub fn open_settings(window: WebviewWindow, update: bool) {
  let app = window.app_handle();
  let settings_windows = app.get_webview_window(SETTINGS_WINDOW_NAME);
  if let Some(settings_windows) = settings_windows {
    settings_windows.show();
    settings_windows.set_focus();
    if update {
      // emit to the settings window to show update
      settings_windows
        .emit_to(SETTINGS_WINDOW_NAME, SHOW_UPDATE_MODAL, ())
        .unwrap();
    }
  }
}

#[tauri::command]
pub fn close_settings(window: WebviewWindow) {
  let app = window.app_handle();
  let settings_windows = app.get_webview_window(SETTINGS_WINDOW_NAME);
  if let Some(settings_windows) = settings_windows {
    settings_windows.hide();
  }
}

#[tauri::command]
pub fn get_pin(storage: State<Pinned>) -> bool {
  storage.0.load(std::sync::atomic::Ordering::Relaxed)
}

#[tauri::command]
pub fn open_devtools(window: WebviewWindow) {
  window.open_devtools();
}

#[tauri::command]
pub fn open_overlay_devtools(window: WebviewWindow) {
  let app = window.app_handle();
  if let Some(main_window) = app.get_webview_window(MAIN_WINDOW_NAME) {
    main_window.open_devtools();
  }
}

#[tauri::command]
pub fn simulate_error_screen(window: WebviewWindow) {
  let app = window.app_handle();

  if let Some(main_window) = app.get_webview_window(MAIN_WINDOW_NAME) {
    let _ = main_window.eval("window.location.hash = '#/error';");
    let _ = main_window.show();
    let _ = main_window.set_focus();
  }

  if let Some(settings_window) = app.get_webview_window(SETTINGS_WINDOW_NAME) {
    let _ = settings_window.hide();
  }
}

#[tauri::command]
pub fn toggle_pin(
  window: WebviewWindow,
  pin: State<Pinned>,
  menu: State<TrayMenu>,
  hide_taskbar: State<HideTaskbarWhenPinned>,
) {
  let app = window.app_handle();
  let value = !get_pin(app.state::<Pinned>());

  // Always target the main overlay window so pinning from other windows
  // (e.g., settings) does not affect those windows.
  if let Some(main_win) = app.get_webview_window(MAIN_WINDOW_NAME) {
    _set_pin(value, &main_win, pin, menu, hide_taskbar);
  }
}

#[tauri::command]
pub fn set_pin(
  window: WebviewWindow,
  pin: State<Pinned>,
  menu: State<TrayMenu>,
  hide_taskbar: State<HideTaskbarWhenPinned>,
  value: bool,
) {
  if let Some(main_win) = window.app_handle().get_webview_window(MAIN_WINDOW_NAME) {
    _set_pin(value, &main_win, pin, menu, hide_taskbar);
  }
}

impl Deref for Pinned {
  type Target = AtomicBool;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

impl Deref for TrayMenu {
  type Target = Mutex<Menu<Wry>>;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

impl Deref for HideTaskbarWhenPinned {
  type Target = AtomicBool;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

fn apply_taskbar_visibility(app: &AppHandle, pinned: bool, hide_taskbar_when_pinned: bool) {
  let skip_taskbar = pinned && hide_taskbar_when_pinned;

  if let Some(main_window) = app.get_webview_window(MAIN_WINDOW_NAME) {
    #[cfg(target_os = "windows")]
    main_window.set_skip_taskbar(skip_taskbar).ok();
  }

  #[cfg(target_os = "macos")]
  {
    use tauri::ActivationPolicy;
    app
      .set_activation_policy(if skip_taskbar {
        ActivationPolicy::Accessory
      } else {
        ActivationPolicy::Regular
      })
      .ok();
  }
}

fn _set_pin(
  value: bool,
  window: &WebviewWindow,
  pinned: State<Pinned>,
  menu: State<TrayMenu>,
  hide_taskbar: State<HideTaskbarWhenPinned>,
) {
  // @d0nutptr cooked here
  pinned.store(value, std::sync::atomic::Ordering::Relaxed);

  // emit to the main window and also broadcast to all webviews so other
  // windows (like settings) can react to the change.
  window.emit(TRAY_TOGGLE_PIN, value).unwrap();

  // Broadcast the pin change to all webviews so other
  // windows (like settings) can react to the change.
  let app_handle = window.app_handle();
  if let Some(main_win) = app_handle.get_webview_window(MAIN_WINDOW_NAME) {
    let _ = main_win.emit(TRAY_TOGGLE_PIN, value);
  }
  if let Some(settings_win) = app_handle.get_webview_window(SETTINGS_WINDOW_NAME) {
    let _ = settings_win.emit(TRAY_TOGGLE_PIN, value);
  }

  // invert the label for the tray
  if let Some(toggle_pin_menu_item) = menu.lock().ok().and_then(|m| m.get(TRAY_TOGGLE_PIN)) {
    let language = window.app_handle().state::<Language>();
    let language = language.lock().map(|l| l.clone()).unwrap_or_default();
    toggle_pin_menu_item
      .as_menuitem_unchecked()
      .set_text(Tray::label(&language, TRAY_TOGGLE_PIN, value));
  }

  #[cfg(target_os = "macos")]
  window.with_webview(move |webview| unsafe {
    #[cfg(target_os = "macos")]
    use cocoa::appkit::NSWindow;
    let id = webview.ns_window() as cocoa::base::id;

    #[cfg(target_arch = "aarch64")]
    id.setIgnoresMouseEvents_(value);

    // convert bool into number
    #[cfg(target_arch = "x86_64")]
    {
      let value = if value { 1 } else { 0 };
      id.setHasShadow_(value);
    }
  });

  window.set_ignore_cursor_events(value);

  apply_taskbar_visibility(
    &window.app_handle(),
    value,
    hide_taskbar.load(std::sync::atomic::Ordering::Relaxed),
  );

  // update the tray icon
  update_tray_icon(window.app_handle(), value);
}

pub fn update_tray_icon(app: &AppHandle, pinned: bool) {
  let icon_bytes = if pinned {
    include_bytes!("../icons/tray/icon-pinned.ico").as_slice()
  } else {
    include_bytes!("../icons/tray/icon.ico").as_slice()
  };

  if let Some(tray) = app.tray_by_id(OVERLAYED) {
    if let Ok(icon) = Image::from_bytes(icon_bytes) {
      tray.set_icon(Some(icon));
    }
  }
}

#[tauri::command]
pub fn set_hide_taskbar_when_pinned(
  window: WebviewWindow,
  hide_taskbar_when_pinned: bool,
  pinned: State<Pinned>,
  hide_taskbar: State<HideTaskbarWhenPinned>,
) {
  hide_taskbar.store(
    hide_taskbar_when_pinned,
    std::sync::atomic::Ordering::Relaxed,
  );

  apply_taskbar_visibility(
    &window.app_handle(),
    pinned.load(std::sync::atomic::Ordering::Relaxed),
    hide_taskbar_when_pinned,
  );
}

#[tauri::command]
pub fn open_config_dir(app: tauri::AppHandle) {
  use tauri::Manager;
  use tauri_plugin_opener::OpenerExt;
  if let Ok(path) = app.path().app_config_dir() {
    let _ = std::fs::create_dir_all(&path);
    let _ = app
      .opener()
      .open_path(path.to_string_lossy().to_string(), None::<&str>);
  }
}
