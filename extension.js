import Gio from 'gi://Gio';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

const MODIFIER_PREFIX = {
    capslock: '<Super>',
    lshift:   '<Shift>',
    lalt:     '<Alt>',
    super:    '<Super>',
};

const WINDOW_MODIFIER_PREFIX = {
    lalt:  '<Alt>',
    super: '<Super>',
};

// org.gnome.shell.keybindings keys that conflict with <Super>a and <Super>s
const SUPER_CONFLICTS = ['toggle-application-view', 'toggle-quick-settings'];

// These replace existing bindings entirely (workspace nav, may conflict with Super)
const WM_KEYS = {
    'switch-to-workspace-left':  'a',
    'switch-to-workspace-right': 's',
    'move-to-workspace-left':    'd',
    'move-to-workspace-right':   'f',
    'switch-windows':            'e',
};

// These append to existing bindings (Alt+F4 / existing minimize stays intact)
const WM_EXTRA_KEYS = {
    'close':    'q',
    'minimize': 'h',
};

export default class WorkspacerExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._savedWm = {};
        this._savedWmExtra = {};
        this._savedShell = {};
        this._capslockActive = false;

        this._applyModifier(
            this._settings.get_string('modifier-key'),
            this._settings.get_string('window-modifier-key'),
        );

        this._changedId = this._settings.connect('changed', () => {
            this._clearBindings();
            this._applyModifier(
                this._settings.get_string('modifier-key'),
                this._settings.get_string('window-modifier-key'),
            );
        });
    }

    disable() {
        if (this._changedId) {
            this._settings.disconnect(this._changedId);
            this._changedId = null;
        }
        this._clearBindings();
        this._settings = null;
    }

    _applyModifier(mod, winMod) {
        const prefix = MODIFIER_PREFIX[mod] ?? '<Super>';
        const winPrefix = WINDOW_MODIFIER_PREFIX[winMod] ?? '<Super>';
        const wm = new Gio.Settings({ schema: 'org.gnome.desktop.wm.keybindings' });

        for (const [key, letter] of Object.entries(WM_KEYS)) {
            this._savedWm[key] = wm.get_strv(key);
            wm.set_strv(key, [`${prefix}${letter}`]);
        }

        for (const [key, letter] of Object.entries(WM_EXTRA_KEYS)) {
            const existing = wm.get_strv(key);
            this._savedWmExtra[key] = existing;
            const binding = `${winPrefix}${letter}`;
            if (!existing.includes(binding))
                wm.set_strv(key, [...existing, binding]);
        }

        wm.apply();

        if (mod === 'capslock' || mod === 'super') {
            const shell = new Gio.Settings({ schema: 'org.gnome.shell.keybindings' });
            for (const key of SUPER_CONFLICTS) {
                this._savedShell[key] = shell.get_strv(key);
                shell.set_strv(key, []);
            }
            shell.apply();
        }

        if (mod === 'capslock') {
            this._addCapslock();
            this._capslockActive = true;
        }
    }

    _clearBindings() {
        const wm = new Gio.Settings({ schema: 'org.gnome.desktop.wm.keybindings' });
        for (const [key, value] of Object.entries(this._savedWm))
            wm.set_strv(key, value);
        for (const [key, value] of Object.entries(this._savedWmExtra))
            wm.set_strv(key, value);
        if (Object.keys(this._savedWm).length || Object.keys(this._savedWmExtra).length)
            wm.apply();
        this._savedWm = {};
        this._savedWmExtra = {};

        const shell = new Gio.Settings({ schema: 'org.gnome.shell.keybindings' });
        for (const [key, value] of Object.entries(this._savedShell))
            shell.set_strv(key, value);
        if (Object.keys(this._savedShell).length)
            shell.apply();
        this._savedShell = {};

        if (this._capslockActive) {
            this._removeCapslock();
            this._capslockActive = false;
        }
    }

    _addCapslock() {
        const inputs = new Gio.Settings({ schema: 'org.gnome.desktop.input-sources' });
        const arr = inputs.get_strv('xkb-options');
        if (!arr.includes('caps:super')) {
            arr.push('caps:super');
            inputs.set_strv('xkb-options', arr);
            inputs.apply();
        }
    }

    _removeCapslock() {
        const inputs = new Gio.Settings({ schema: 'org.gnome.desktop.input-sources' });
        const arr = inputs.get_strv('xkb-options').filter(s => s !== 'caps:super');
        inputs.set_strv('xkb-options', arr);
        inputs.apply();
    }
}
