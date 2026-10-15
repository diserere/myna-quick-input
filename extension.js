import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

export default class MynaQuickInputExtension extends Extension {
    enable() {
        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);

        let icon = new St.Icon({
            icon_name: 'audio-input-microphone-symbolic',
            style_class: 'system-status-icon',
        });
        this._indicator.add_child(icon);

        let openItem = new PopupMenu.PopupMenuItem(_('Открыть окно голосового ввода'));
        openItem.connect('activate', () => {
            this._openQuickInputModal();
        });
        this._indicator.menu.addMenuItem(openItem);

        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
        if (this._modalWindow) {
            this._modalWindow.destroy();
            this._modalWindow = null;
        }
    }

    _openQuickInputModal() {
        if (this._modalWindow) {
            this._modalWindow.destroy();
        }
        this._modalWindow = new MynaQuickInputModal();
        this._modalWindow.open();
    }
}

const MynaQuickInputModal = GObject.registerClass(
class MynaQuickInputModal extends St.Widget {
    _init() {
        super._init({
            style_class: 'myna-quick-modal-container',
            reactive: true,
            can_focus: true,
            track_hover: true,
        });

        this.layout_manager = new Clutter.BinLayout();

        let bg = new St.Widget({
            style_class: 'myna-quick-modal-bg',
            reactive: true,
        });
        bg.connect('button-release-event', () => {
            this.destroy();
        });
        this.add_child(bg);

        let dialogBox = new St.BoxLayout({
            style_class: 'myna-quick-modal-box',
            vertical: true,
            reactive: true,
        });
        this.add_child(dialogBox);

        let titleLabel = new St.Label({
            style_class: 'myna-quick-modal-title',
            text: _('Myna Голосовой ввод - Быстрый текст'),
        });
        dialogBox.add_child(titleLabel);

        this._entry = new St.Entry({
            style_class: 'myna-quick-modal-entry',
            hint_text: _('Надиктовывайте текст через Myna здесь...'),
            track_hover: true,
            can_focus: true,
        });
        dialogBox.add_child(this._entry);

        let btnBox = new St.BoxLayout({
            style_class: 'myna-quick-modal-buttons',
            horizontal: true,
        });
        dialogBox.add_child(btnBox);

        let copyBtn = new St.Button({
            style_class: 'button',
            label: _('Копировать'),
            can_focus: true,
        });
        copyBtn.connect('clicked', () => {
            let text = this._entry.get_text();
            St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, text);
            Main.notify('Myna Quick Input', 'Текст скопирован в буфер обмена');
        });
        btnBox.add_child(copyBtn);

        let clearBtn = new St.Button({
            style_class: 'button',
            label: _('Очистить'),
            can_focus: true,
        });
        clearBtn.connect('clicked', () => {
            this._entry.set_text('');
        });
        btnBox.add_child(clearBtn);

        let closeBtn = new St.Button({
            style_class: 'button',
            label: _('Закрыть'),
            can_focus: true,
        });
        closeBtn.connect('clicked', () => {
            this.destroy();
        });
        btnBox.add_child(closeBtn);
    }

    open() {
        Main.uiGroup.add_child(this);
        global.stage.set_key_focus(this._entry);
    }

    destroy() {
        super.destroy();
    }
});
