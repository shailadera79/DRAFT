# Browser Tizen — TizenBrew module

Experimental browser-style TizenBrew module for Samsung TVs (including older models).

## Install

TizenBrew → Module Manager → Add Module → GitHub → **`shailadera79/DRAFT@browser-tizen`**.

Start **Browser Tizen** from the TizenBrew dashboard.

## Remote controls

| Button | Action |
|---|---|
| Red | Toggle on-screen virtual mouse ON/OFF |
| D-pad while mouse is ON | Move cursor |
| OK while mouse is ON | Left click (synthetic DOM click) |
| Green | Toggle scrolling mode ON/OFF |
| D-pad Up / Down while scroll mode is ON | Scroll page up / down |
| Blue | Show/hide address bar with Back, Forward, Reload, Home, Go |
| Yellow | Go to home launcher |
| Back | Close browser toolbar or go back |

When neither mouse nor scroll mode is on, the D-pad and OK work as normal site navigation.

On the home page, use the address field for a URL or a Google search, or use one of the quick links.

## Browser identity

The module reports Windows 10 desktop Chrome 95 (`navigator.userAgent`, `platform`, `userAgentData`) and desktop pointer media queries. This **does not upgrade** the TV's real Chromium/WebKit engine. Websites that require missing JavaScript/WebRTC/codecs/DRM cannot be made compatible just by changing the user agent.

## Limitations

- TizenBrew injects the module into navigated pages; if injection stops on a particular page or site, the toolbar and remote mappings can disappear there.
- Some websites block automation, untrusted synthetic mouse events, media playback, popups, or cross-site navigation.
- TV browser security settings, network permissions, login flows, and app limitations still apply.
- Red cursor uses DOM mouse events, **not** a true native mouse.
- Green activates scroll mode; use **Up/Down** for both scrolling directions (one Green key cannot independently mean Up and Down).
- Designed to avoid third-party scripts, trackers, and credential collection. No server-side proxy.

Source is an independently written proof of concept; TV hardware testing is still required.
