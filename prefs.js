import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const MODIFIER_VALUES        = ['capslock', 'lshift', 'lalt', 'super'];
const MODIFIER_LABELS        = ['CapsLock', 'LShift', 'LAlt', 'Super'];
const WIN_MODIFIER_VALUES    = ['lalt', 'super'];
const WIN_MODIFIER_LABELS    = ['LAlt', 'Super'];

export default class WorkspacerPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({ title: _('General') });
        window.add(page);

        const group = new Adw.PreferencesGroup({
            title: _('Modifier Keys'),
        });
        page.add(group);

        const row = new Adw.ComboRow({
            title: _('Workspace modifier'),
            subtitle: _('Mod + A/S/D/F/E — workspace navigation'),
            model: new Gtk.StringList({ strings: MODIFIER_LABELS }),
        });
        const current = settings.get_string('modifier-key');
        row.selected = Math.max(0, MODIFIER_VALUES.indexOf(current));
        row.connect('notify::selected', r => {
            settings.set_string('modifier-key', MODIFIER_VALUES[r.selected]);
        });
        group.add(row);

        const winRow = new Adw.ComboRow({
            title: _('Window modifier'),
            subtitle: _('Mod + Q/H — close / minimize'),
            model: new Gtk.StringList({ strings: WIN_MODIFIER_LABELS }),
        });
        const currentWin = settings.get_string('window-modifier-key');
        winRow.selected = Math.max(0, WIN_MODIFIER_VALUES.indexOf(currentWin));
        winRow.connect('notify::selected', r => {
            settings.set_string('window-modifier-key', WIN_MODIFIER_VALUES[r.selected]);
        });
        group.add(winRow);

        const infoGroup = new Adw.PreferencesGroup({ title: _('Keybindings') });
        page.add(infoGroup);

        const bindings = [
            ['Workspace Mod + A', _('Previous workspace')],
            ['Workspace Mod + S', _('Next workspace')],
            ['Workspace Mod + D', _('Move window to previous workspace')],
            ['Workspace Mod + F', _('Move window to next workspace')],
            ['Workspace Mod + E', _('Cycle windows on current workspace')],
            ['Window Mod + Q', _('Close window')],
            ['Window Mod + H', _('Minimize window')],
        ];

        for (const [key, desc] of bindings) {
            infoGroup.add(new Adw.ActionRow({ title: key, subtitle: desc }));
        }
    }
}
