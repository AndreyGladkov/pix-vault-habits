# Pix Vault Habits Plugin for Obsidian

A plugin that lets you create habits and track your progress directly in Obsidian — just like you would in a notebook.

**Project structure:**
```
pix-vault-habits/
├── src/
│   ├── main.ts          # Plugin: commands, view, settings, handlers
│   ├── view.ts          # HabitTrackerView — GitHub-style grid
│   ├── habitManager.ts  # Read/write CSV via Vault API
│   ├── modal.ts         # AddHabitModal
│   ├── csv.ts           # CSV parsing/serialization, IDs, dates
│   ├── i18n/            # Localization (en, ru, fr, de)
│   │   ├── index.ts     # t(), setLocale(), date formatting, day/month labels
│   │   ├── types.ts     # Locale / LocaleData types
│   │   └── locales/     # en.ts, ru.ts, fr.ts, de.ts
│   └── ui/              # UI components (grid, habit block, modals)
├── styles.css           # Grid and interface styles
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
├── versions.json
└── version-bump.mjs
```

## Implemented Features

- **CSV storage**: the `pixVaultHabits/habits.csv` file is created automatically on first launch in the visible `pixVaultHabits` folder at the root of your vault. Row format: `<ID>,<Name>,<Date>,<Status 1|0>,<Created date>`. When writing to an existing date, the status is updated without creating duplicates. The CSV parser supports commas, quotes, and line breaks in habit names (RFC-4180).
- **Commands (Ctrl+P)**: `Add new habit`, `Open habit tracker`, `Mark today as done` (with habit selection via picker).
- **GitHub-style grid**: for each habit — a header, statistics (streak 🔥 + total ✅), month labels, week columns (Mon–Sun), 12×12 px squares.
- **Interaction**: clicking a square toggles the status (works for both today and past days), today is highlighted with an outline, tooltip shows "Date: DD.MM.YYYY, Completed: Yes/No", horizontal scrolling, "Today", "Rename", and "Delete" buttons.
- **Settings**: CSV path, number of days (30/90/365), completed color, uncompleted color.
- **Themes**: colors adapt through Obsidian CSS variables (light/dark).

## How to Use

Copy the `pix-vault-habits` folder into your Obsidian plugins directory (`.obsidian/plugins/`) and enable the plugin in the settings. To rebuild after making changes, run `npm run build` in the project directory.

To start dev mode with auto-rebuild: `npm run dev`.

# Плагин **Pix Vault Habits** для Obsidian.

Позовляет создавать привычки и отмечать прогресс по ним прямо в Obsidian. Так как бы вы это делали в блокноте.

**Структура проекта:**
```
pix-vault-habits/
├── src/
│   ├── main.ts          # Плагин: команды, view, настройки, обработчики
│   ├── view.ts          # HabitTrackerView — сетка GitHub-style
│   ├── habitManager.ts  # Чтение/запись CSV через Vault API
│   ├── modal.ts         # AddHabitModal
│   ├── csv.ts           # Парсинг/сериализация CSV, ID, даты
│   ├── i18n/            # Локализация (en, ru, fr, de)
│   │   ├── index.ts     # t(), setLocale(), формат дат, подписи дней/месяцев
│   │   ├── types.ts     # Типы Locale / LocaleData
│   │   └── locales/     # en.ts, ru.ts, fr.ts, de.ts
│   └── ui/              # Компоненты интерфейса (сетка, блок привычки, модалки)
├── styles.css           # Стили сетки и интерфейса
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
├── versions.json
└── version-bump.mjs
```

## Реализованные функции

- **Хранение в CSV**: файл `pixVaultHabits/habits.csv` создаётся автоматически при первом запуске в видимой папке `pixVaultHabits` в корне хранилища. Формат строки `<ID>,<Название>,<Дата>,<Статус 1|0>,<Дата создания>`. При записи за существующую дату статус обновляется, дубликаты не создаются. CSV-парсер поддерживает запятые, кавычки и переносы строк в названиях (RFC-4180).
- **Команды (Ctrl+P)**: `Add new habit`, `Open habit tracker`, `Mark today as done` (с выбором привычки через пикер).
- **Сетка GitHub-style**: для каждой привычки — заголовок, статистика (streak 🔥 + всего ✅), подписи месяцев, колонки недель (Пн–Вс), квадраты 12×12 px.
- **Взаимодействие**: клик по квадрату переключает статус (и сегодня, и прошлые дни), сегодня подсвечен рамкой, tooltip «Дата: ДД.ММ.ГГГГ, Выполнено: Да/Нет», горизонтальный скролл, кнопки «Сегодня», «Переименовать», «Удалить».
- **Настройки**: путь к CSV, количество дней (30/90/365), цвет выполненного, цвет невыполненного.
- **Темы**: цвета адаптируются через CSS-переменные Obsidian (светлая/тёмная).

## Как использовать

Скопируйте папку `pix-vault-habits` в каталог плагинов Obsidian (`.obsidian/plugins/`) и включите плагин в настройках. Для пересборки после изменений выполните `npm run build` в каталоге проекта.

Для запуска dev-режима с автопересборкой: `npm run dev`.
