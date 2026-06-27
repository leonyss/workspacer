import Clutter from 'gi://Clutter';
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
        this._capturedId = null;

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
            this._syncMouseButtons();
        });

        this._enableMiddleClickMinimize();
        this._syncMouseButtons();
    }

    disable() {
        if (this._changedId) {
            this._settings.disconnect(this._changedId);
            this._changedId = null;
        }
        this._clearBindings();
        this._disableMiddleClickMinimize();
        this._detachMouseButtons();
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

    _enableMiddleClickMinimize() {
        const wmPrefs = new Gio.Settings({ schema: 'org.gnome.desktop.wm.preferences' });
        this._savedMiddleClick = wmPrefs.get_string('action-middle-click-titlebar');
        wmPrefs.set_string('action-middle-click-titlebar', 'minimize');
        wmPrefs.apply();
        this._wmPrefs = wmPrefs;
    }

    _disableMiddleClickMinimize() {
        if (this._wmPrefs) {
            this._wmPrefs.set_string('action-middle-click-titlebar', this._savedMiddleClick ?? 'none');
            this._wmPrefs.apply();
            this._wmPrefs = null;
            this._savedMiddleClick = null;
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

    _syncMouseButtons() {
        const enabled = this._settings.get_boolean('mouse-side-buttons');
        if (enabled && this._capturedId === null) {
            this._capturedId = global.stage.connect(
                'captured-event',
                this._onCapturedEvent.bind(this),
            );
        } else if (!enabled && this._capturedId !== null) {
            global.stage.disconnect(this._capturedId);
            this._capturedId = null;
        }
    }

    _detachMouseButtons() {
        if (this._capturedId !== null) {
            global.stage.disconnect(this._capturedId);
            this._capturedId = null;
        }
    }

    _onCapturedEvent(_actor, event) {
        if (event.type() !== Clutter.EventType.BUTTON_PRESS)
            return Clutter.EVENT_PROPAGATE;

        const button = event.get_button();
        if (button !== 8 && button !== 9)
            return Clutter.EVENT_PROPAGATE;

        const wm = global.workspace_manager;
        const current = wm.get_active_workspace_index();
        const total = wm.n_workspaces;

        const target = button === 8
            ? Math.max(0, current - 1)
            : Math.min(total - 1, current + 1);

        if (target !== current)
            wm.get_workspace_by_index(target).activate(global.get_current_time());

        return Clutter.EVENT_STOP;
    }
}
