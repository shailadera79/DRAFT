# GFN Desktop Mouse — TizenBrew

Modified from Julianbjrk/gfn-tizen-desktop v0.3.1 (MIT license).
All original functions are kept except the unused 4K override, replaced with a virtual remote cursor.

## Install in TizenBrew
Module Manager → Add Module → GitHub → `shailadera79/DRAFT@gfn-remote-mouse`

## TV remote
- RED: toggle the on-screen virtual cursor on/off.
- D-pad: move cursor while on.
- OK/Enter: click while cursor on.
- BLUE: original diagnostics.
- GREEN: original pointer-lock keeper.
- Cursor OFF: normal D-pad and OK behavior.

Important: this is a JavaScript DOM cursor, NOT native mouse input. Some web menus may respond; GeForce NOW game mouse events may still be blocked by pointer lock and browser restrictions.

Original code and MIT license: https://github.com/Julianbjrk/gfn-tizen-desktop/tree/v0.3.1
