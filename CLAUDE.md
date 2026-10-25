# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Обзор

Расширение GNOME Shell (45–50) для быстрого открытия окна ввода текста, совместимого с системным голосовым вводом **Myna** (Ubuntu Speech-to-Text, `https://github.com/canonical/myna`). Ключевая цель проекта — модальное окно расширения должно быть настоящим фокусным полем ввода (`St.Entry`), видимым для механизмов доступности и Wayland input methods, чтобы Myna направляла распознанный текст в поле. Установка и тестирование описаны в `INSTALL.md`, обзор — в `README.md` и `ARCHITECTURE.md`.

## Сборка и запуск

Сборки, линтера и тестов нет. Расширение работает как ESM-модуль внутри GNOME Shell.

Установка для локальной разработки (симлинк по UUID):
```bash
ln -s "$(pwd)" ~/.local/share/gnome-shell/extensions/myna-quick-input@quick-draft.local
gnome-extensions enable myna-quick-input@quick-draft.local
```

Перезапуск шелла после изменений:
- X11: `Alt+F2` → `r`
- Wayland: выход из сессии и повторный вход (перезапуск «на лету» недоступен)

Логи и ошибки:
```bash
journalctl -f -o cat /usr/bin/gnome-shell
```

## Архитектура

Технологии: JS (ESM) поверх GObject/St/Clutter, импорты `gi://...` и ресурсов шелла `resource:///org/gnome/shell/...` (как в `extension.js`, включая `Extension`, `Main`, `PanelMenu`, `PopupMenu`).

Файлы:
- **`extension.js`** — весь код расширения. Экспортирует `MynaQuickInputExtension` (жизненный цикл `enable()`/`disable()`); в `enable()` создаёт `PanelMenu.Button` с иконкой `audio-input-microphone-symbolic` и пунктом меню, добавляет в `Main.panel.addToStatusArea()`. Рядом в том же файле определён `MynaQuickInputModal` — `St.Widget` на `Clutter.BinLayout`: затемнённый фон (закрывает окно по клику), `St.Entry` и кнопки «Копировать» (через `St.Clipboard` + `Main.notify`), «Очистить», «Закрыть». Открытие: `Main.uiGroup.add_child(...)` + `global.stage.set_key_focus(this._entry)`.
- **`stylesheet.css`** — стили модального окна: классы `.myna-quick-modal-container`, `-bg`, `-box`, `-title`, `-entry` (с `:focus`), `-buttons`. Тёмная тема поверх всего.
- **`metadata.json`** — uuid `myna-quick-input@quick-draft.local`, `shell-version` 45–50, url репозитория.

Важный нюанс: `ARCHITECTURE.md` планирует вынести модальное окно в отдельный модуль `quickInputModal.js` (Этап 2), но на данный момент вся реализация, включая модалку, находится внутри `extension.js`. При значимых изменениях стоит обновить оба файла, чтобы документация не расходилась с кодом.

## Правила проекта

- Документация, строки в меню и названия — на русском; перевод через `gettext as _`.
- UUID расширения — `myna-quick-input@quick-draft.local` — нельзя менять без обновления INSTALL.md и пути симлинка.
- Не ломать совместимость с Myna: поле ввода должно оставаться `St.Entry` с корректным фокусом (`global.stage.set_key_focus`), открытие только через `Main.uiGroup` (стадия), а не через отдельное окно верхнего уровня.