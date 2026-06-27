# Workspacer

A GNOME Shell extension for switching workspaces and moving windows between them using a customizable modifier key. Supports mouse side buttons for workspace navigation.

## Features

- Switch to previous/next workspace
- Move the current window to previous/next workspace
- Cycle through windows on the current workspace
- Choose your modifier key: Super, Alt, Left Shift, or Caps Lock
- **Mouse side buttons** (buttons 8/9) for workspace switching — toggle in preferences

## Keybindings

| Shortcut | Action |
|----------|--------|
| Mod + A | Previous workspace |
| Mod + S | Next workspace |
| Mod + D | Move window to previous workspace |
| Mod + F | Move window to next workspace |
| Mod + E | Cycle windows on current workspace |
| WinMod + H | Minimize window |
| WinMod + Q | Close window |
| Middle click on titlebar | Minimize window |
| Mouse button 8 | Previous workspace (when enabled) |
| Mouse button 9 | Next workspace (when enabled) |

`Mod` is the modifier key for workspace switching (default: Super).  
`WinMod` is the modifier key for window actions (default: Super), configurable separately in preferences.

## Requirements

- GNOME Shell 45–48

## Installation

Install from [extensions.gnome.org](https://extensions.gnome.org) or clone this repository and copy the extension folder to `~/.local/share/gnome-shell/extensions/`.

## Configuration

Open extension preferences to choose a modifier key:

```
gnome-extensions prefs workspacer@egoralbutov
```

Mouse side button workspace switching is **disabled by default**. Enable it in preferences under **Mouse → Side buttons switch workspaces**. Note: when enabled, mouse buttons 8 and 9 are intercepted globally and will no longer act as browser Back/Forward.
