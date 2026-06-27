# Workspacer

A GNOME Shell extension for switching workspaces and moving windows between them using a customizable modifier key.

## Features

- Switch to previous/next workspace
- Move the current window to previous/next workspace
- Cycle through windows on the current workspace
- Choose your modifier key: Super, Alt, Left Shift, or Caps Lock

## Keybindings

| Shortcut | Action |
|----------|--------|
| Mod + A | Previous workspace |
| Mod + S | Next workspace |
| Mod + D | Move window to previous workspace |
| Mod + F | Move window to next workspace |
| Mod + E | Cycle windows on current workspace |

`Mod` is the modifier key selected in extension preferences (default: Super).

## Requirements

- GNOME Shell 45–48

## Installation

Install from [extensions.gnome.org](https://extensions.gnome.org) or clone this repository and copy the extension folder to `~/.local/share/gnome-shell/extensions/`.

## Configuration

Open extension preferences to choose a modifier key:

```
gnome-extensions prefs workspacer@egoralbutov
```
