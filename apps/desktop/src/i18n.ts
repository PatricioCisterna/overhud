import type { Language } from "@/config";
import { useConfigValue } from "@/hooks/use-config-value";

const en = {
  // nav bar
  "nav.left": "Left",
  "nav.center": "Center",
  "nav.right": "Right",
  "nav.alignTitle": "{name}-aligned. Click to toggle.",
  "nav.enablePin": "Enable pin",
  "nav.dismiss": "Dismiss",
  "nav.settings": "Settings",
  "nav.privateCall": "Private call",
  "nav.hintPinning": "Pinning hides this frame to only show the users in the call.",
  "nav.hintUnpin": "Unpin or access Settings anytime via the",
  "nav.hintSystemTray": "system tray",
  "nav.hintNearClock": "icon near the clock in your taskbar.",
  "nav.hintMenuBar": "menu bar",
  "nav.hintTopRight": "icon in the top-right of your screen.",
  "nav.hintNotificationArea": "notification area",
  "nav.hintIcon": "icon.",

  // main view
  "main.authorize": "Authorize Discord",
  "main.disclaimer": "OverHud is based on Overlayed and is not affiliated with Discord. Discord is a trademark of Discord Inc.",
  "main.step1": "Discord should have opened a popup",
  "main.step2": 'Click "Authorize" within Discord',
  "main.step3": "Join a voice channel",
  "main.step4": "Enjoy 🥳",
  "main.tryAgain": "Try Again",
  "common.quitOverlayed": "Quit OverHud",
  "common.cancel": "Cancel",

  // error view
  "error.title": "Error Connecting to Discord",
  "error.restart": "Please try restarting discord then try again",
  "error.connect": "Connect to Discord",

  // settings
  "settings.general": "General",
  "settings.configuration": "Configuration",
  "settings.joinHistory": "Join History",
  "settings.canary": "The canary build may be unstable (click to learn more)",
  "settings.foundBug": "OverHud, based on",
  "settings.githubRepo": "Overlayed (AGPL-3.0)",

  // account
  "account.openDevtools": "Open Devtools",
  "account.openConfigDir": "Open Config Dir",
  "account.pleaseLogin": "Please Login to use OverHud",
  "account.tokenExpires": "Token Expires",
  "account.pin": "Pin",
  "account.unpin": "Unpin",
  "account.logout": "Logout",
  "account.logoutConfirm": "Are you sure you want to log out of OverHud?",
  "account.confirmLogout": "Confirm Logout",
  "account.quit": "Quit",
  "account.quitConfirm": "Are you sure you want to quit the OverHud app?",

  // configuration
  "config.language": "Language",
  "config.launchOnStartup": "Launch on startup",
  "config.onlySpeaking": "Only show users who are speaking",
  "config.showUsernames": "Show usernames",
  "config.animateAvatars": "Animated avatars (while talking)",
  "config.maxUsername": "Max username length",
  "config.anchorHorizontal": "Anchor horizontal",
  "config.anchorVertical": "Anchor vertical",
  "config.left": "Left",
  "config.center": "Center",
  "config.right": "Right",
  "config.top": "Top",
  "config.bottom": "Bottom",
  "config.opacityTarget": "Opacity target",
  "config.everything": "Everything",
  "config.usernameBackground": "Username background only",
  "config.opacity": "Overlay opacity",
  "config.scale": "Scale",
  "config.hideTaskbar": "Hide taskbar when pinned",

  // join history
  "history.description": "Display join/leave events in the voice chat useful for moderation purposes",
  "history.enableNotifications": "Enable join/leave notifications",
  "history.clear": "Clear list",
  "history.copiedTitle": "User Info Copied",
  "history.copiedDescription": "{user} ({event}) copied to clipboard",
  "history.join": "join",
  "history.leave": "leave",
  "history.joined": "JOINED",
  "history.left": "LEFT",

  // soundboard
  "settings.soundboard": "Sounds",
  "soundboard.description": "Click a sound to play it in your voice channel",
  "soundboard.loading": "Loading sounds...",
  "soundboard.played": "Sound played",
  "soundboard.failed": "Discord refused to play it",
  "soundboard.open": "Sounds",
  "screenshare.toggle": "Share screen",
  "screenshare.stop": "Stop sharing",
  "soundboard.search": "Find the perfect sound",
  "soundboard.results": "Results",
  "soundboard.recent": "Recent",
  "soundboard.server": "Server",
  "soundboard.discordSounds": "Discord sounds",
  "soundboard.noResults": "No sounds match",
  "soundboard.unavailable": "Not available (needs Nitro)",
  "config.showSoundboardButton": "Show sounds button",
  "config.showScreenshareButton": "Show screen share button",
  "config.userSpacing": "Space between users",

  // updater
  "updater.updating": "Updating...",
  "updater.available": "Update Available! Click here to update",
  "updater.title": "Update OverHud",
  "updater.confirm": "Are you sure you want to update OverHud?",
  "updater.update": "Update",
};

export type TranslationKey = keyof typeof en;

const es: Record<TranslationKey, string> = {
  "nav.left": "Izquierda",
  "nav.center": "Centro",
  "nav.right": "Derecha",
  "nav.alignTitle": "Alineado: {name}. Clic para cambiar.",
  "nav.enablePin": "Fijar",
  "nav.dismiss": "Cerrar",
  "nav.settings": "Ajustes",
  "nav.privateCall": "Llamada privada",
  "nav.hintPinning": "Al fijarlo se oculta este marco y solo se ven los usuarios de la llamada.",
  "nav.hintUnpin": "Para soltarlo o abrir los Ajustes, usa el icono de la",
  "nav.hintSystemTray": "bandeja del sistema",
  "nav.hintNearClock": "junto al reloj de la barra de tareas.",
  "nav.hintMenuBar": "barra de menús",
  "nav.hintTopRight": "arriba a la derecha de la pantalla.",
  "nav.hintNotificationArea": "área de notificaciones",
  "nav.hintIcon": ".",

  "main.authorize": "Autorizar Discord",
  "main.disclaimer": "OverHud está basado en Overlayed y no está afiliado a Discord. Discord es una marca de Discord Inc.",
  "main.step1": "Discord debería haber abierto una ventana",
  "main.step2": 'Pulsa "Autorizar" en Discord',
  "main.step3": "Entra a un canal de voz",
  "main.step4": "Disfruta 🥳",
  "main.tryAgain": "Reintentar",
  "common.quitOverlayed": "Salir de OverHud",
  "common.cancel": "Cancelar",

  "error.title": "Error al conectar con Discord",
  "error.restart": "Reinicia Discord y vuelve a intentarlo",
  "error.connect": "Conectar con Discord",

  "settings.general": "General",
  "settings.configuration": "Configuración",
  "settings.joinHistory": "Historial",
  "settings.canary": "La versión canary puede ser inestable (clic para saber más)",
  "settings.foundBug": "OverHud, basado en",
  "settings.githubRepo": "Overlayed (AGPL-3.0)",

  "account.openDevtools": "Abrir DevTools",
  "account.openConfigDir": "Abrir carpeta de config",
  "account.pleaseLogin": "Inicia sesión para usar OverHud",
  "account.tokenExpires": "La sesión caduca",
  "account.pin": "Fijar",
  "account.unpin": "Soltar",
  "account.logout": "Salir",
  "account.logoutConfirm": "¿Seguro que quieres cerrar sesión en OverHud?",
  "account.confirmLogout": "Cerrar sesión",
  "account.quit": "Cerrar",
  "account.quitConfirm": "¿Seguro que quieres cerrar OverHud?",

  "config.language": "Idioma",
  "config.launchOnStartup": "Abrir al iniciar Windows",
  "config.onlySpeaking": "Mostrar solo a quien está hablando",
  "config.showUsernames": "Mostrar nombres",
  "config.animateAvatars": "Avatares animados (al hablar)",
  "config.maxUsername": "Largo máximo del nombre",
  "config.anchorHorizontal": "Anclaje horizontal",
  "config.anchorVertical": "Anclaje vertical",
  "config.left": "Izquierda",
  "config.center": "Centro",
  "config.right": "Derecha",
  "config.top": "Arriba",
  "config.bottom": "Abajo",
  "config.opacityTarget": "Aplicar opacidad a",
  "config.everything": "Todo",
  "config.usernameBackground": "Solo el fondo del nombre",
  "config.opacity": "Opacidad",
  "config.scale": "Tamaño",
  "config.hideTaskbar": "Ocultar de la barra de tareas al fijar",

  "history.description": "Muestra quién entra y sale del canal de voz, útil para moderar",
  "history.enableNotifications": "Avisar cuando alguien entra o sale",
  "history.clear": "Vaciar lista",
  "history.copiedTitle": "Usuario copiado",
  "history.copiedDescription": "{user} ({event}) copiado al portapapeles",
  "history.join": "entró",
  "history.leave": "salió",
  "history.joined": "ENTRÓ",
  "history.left": "SALIÓ",

  "settings.soundboard": "Sonidos",
  "soundboard.description": "Pulsa un sonido para reproducirlo en tu canal de voz",
  "soundboard.loading": "Cargando sonidos...",
  "soundboard.played": "Sonido reproducido",
  "soundboard.failed": "Discord no dejó reproducirlo",
  "soundboard.open": "Sonidos",
  "screenshare.toggle": "Transmitir pantalla",
  "screenshare.stop": "Dejar de transmitir",
  "soundboard.search": "Encuentra el sonido perfecto",
  "soundboard.results": "Resultados",
  "soundboard.recent": "Recientes",
  "soundboard.server": "Servidor",
  "soundboard.discordSounds": "Sonidos de Discord",
  "soundboard.noResults": "Ningún sonido coincide",
  "soundboard.unavailable": "No disponible (requiere Nitro)",
  "config.showSoundboardButton": "Mostrar botón de sonidos",
  "config.showScreenshareButton": "Mostrar botón de transmitir",
  "config.userSpacing": "Espacio entre usuarios",

  "updater.updating": "Actualizando...",
  "updater.available": "¡Hay una actualización! Clic aquí para actualizar",
  "updater.title": "Actualizar OverHud",
  "updater.confirm": "¿Seguro que quieres actualizar OverHud?",
  "updater.update": "Actualizar",
};

const translations: Record<Language, Record<TranslationKey, string>> = { en, es };

export const translate = (language: Language, key: TranslationKey, vars?: Record<string, string>) => {
  let text = translations[language]?.[key] ?? en[key];
  for (const [name, value] of Object.entries(vars ?? {})) {
    text = text.replace(`{${name}}`, value);
  }
  return text;
};

export const useTranslation = () => {
  const { value: language } = useConfigValue("language");
  const t = (key: TranslationKey, vars?: Record<string, string>) => translate(language, key, vars);
  return { t, language };
};
