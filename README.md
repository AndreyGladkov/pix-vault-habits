# Pix Vault Habits Plugin for Obsidian

A plugin that lets you create habits and track your progress directly in Obsidian — just like you would in a notebook.

**Project structure:**
```
pix-vault-habits/
├── src/
│   ├── main.ts          # Plugin: commands, settings, handlers
│   ├── view.tsx         # HabitTrackerView — mounts the React UI
│   ├── store.ts         # UI state for useSyncExternalStore
│   ├── habitManager.ts  # Read/write CSV via Vault API
│   ├── habitData.ts     # Habit model, CSV rows ↔ habits
│   ├── categories.ts    # Category list and tabs
│   ├── calendar.ts      # Weeks/months layout of the grid
│   ├── csv.ts           # CSV parsing/serialization, IDs, dates
│   ├── i18n/            # Localization (en, ru, fr, de)
│   │   ├── index.ts     # t(), setLocale(), date formatting, day/month labels
│   │   ├── types.ts     # Locale / LocaleData types
│   │   └── locales/     # en.ts, ru.ts, fr.ts, de.ts
│   └── ui/              # React 18 components (grid, habit card, modals)
├── styles.css           # Grid and interface styles
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
├── versions.json
└── version-bump.mjs
```

## Implemented Features

- **CSV storage**: the `pixVaultHabits/habits.csv` file is created automatically on first launch in the visible `pixVaultHabits` folder at the root of your vault. Row format: `<ID>,<Name>,<Date>,<Status 1|0>,<Created date>,<Category>` (files without the category column are still read). When writing to an existing date, the status is updated without creating duplicates. The CSV parser supports commas, quotes, and line breaks in habit names (RFC-4180).
- **Commands (Ctrl+P)**: `Add new habit`, `Open habit tracker`, `Mark today as done` (with habit selection via picker).
- **GitHub-style grid**: for each habit — a header, statistics (streak 🔥 + total ✅), month labels, week columns (Mon–Sun), 12×12 px squares.
- **Interaction**: clicking a square toggles the status (works for both today and past days), today is highlighted with an outline, tooltip shows "Date: DD.MM.YYYY, Completed: Yes/No", horizontal scrolling, "Today", "Rename", and "Delete" buttons.
- **Categories**: habits are grouped into tabs ("All", each category, "Uncategorized"). Tabs scroll horizontally when they do not fit. Add a category with "+", rename the active one with "✎", delete it with "×" (its habits stay, uncategorized), move a habit with the category dropdown on its card. A habit added while a category tab is open goes into that category.

  > **Update on every device.** Categories are stored in a new sixth CSV column, available since 1.2.0. Versions up to 1.1.5 do not know about it and drop it on any change (marking a day, adding, renaming or deleting a habit), so every habit becomes uncategorized. If your vault is synced across several devices, update the plugin on all of them before assigning categories.
- **Settings**: CSV path, number of days (30/90/365), completed color, uncompleted color.
- **Themes**: colors adapt through Obsidian CSS variables (light/dark).

## How to Use

Copy the `pix-vault-habits` folder into your Obsidian plugins directory (`.obsidian/plugins/`) and enable the plugin in the settings. To rebuild after making changes, run `npm run build` in the project directory.

To start dev mode with auto-rebuild: `npm run dev`. Run tests with `npm test`, or lint, type checks and tests together with `npm run check`.

# Плагин **Pix Vault Habits** для Obsidian.

Позовляет создавать привычки и отмечать прогресс по ним прямо в Obsidian. Так как бы вы это делали в блокноте.

**Структура проекта:**
```
pix-vault-habits/
├── src/
│   ├── main.ts          # Плагин: команды, настройки, обработчики
│   ├── view.tsx         # HabitTrackerView — монтирует React-интерфейс
│   ├── store.ts         # Состояние UI для useSyncExternalStore
│   ├── habitManager.ts  # Чтение/запись CSV через Vault API
│   ├── habitData.ts     # Модель привычек, строки CSV ↔ привычки
│   ├── categories.ts    # Список категорий и табы
│   ├── calendar.ts      # Раскладка сетки по неделям и месяцам
│   ├── csv.ts           # Парсинг/сериализация CSV, ID, даты
│   ├── i18n/            # Локализация (en, ru, fr, de)
│   │   ├── index.ts     # t(), setLocale(), формат дат, подписи дней/месяцев
│   │   ├── types.ts     # Типы Locale / LocaleData
│   │   └── locales/     # en.ts, ru.ts, fr.ts, de.ts
│   └── ui/              # React 18 компоненты (сетка, карточка привычки, модалки)
├── styles.css           # Стили сетки и интерфейса
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
├── versions.json
└── version-bump.mjs
```

## Реализованные функции

- **Хранение в CSV**: файл `pixVaultHabits/habits.csv` создаётся автоматически при первом запуске в видимой папке `pixVaultHabits` в корне хранилища. Формат строки `<ID>,<Название>,<Дата>,<Статус 1|0>,<Дата создания>,<Категория>` (файлы без колонки категории тоже читаются). При записи за существующую дату статус обновляется, дубликаты не создаются. CSV-парсер поддерживает запятые, кавычки и переносы строк в названиях (RFC-4180).
- **Команды (Ctrl+P)**: `Add new habit`, `Open habit tracker`, `Mark today as done` (с выбором привычки через пикер).
- **Сетка GitHub-style**: для каждой привычки — заголовок, статистика (streak 🔥 + всего ✅), подписи месяцев, колонки недель (Пн–Вс), квадраты 12×12 px.
- **Взаимодействие**: клик по квадрату переключает статус (и сегодня, и прошлые дни), сегодня подсвечен рамкой, tooltip «Дата: ДД.ММ.ГГГГ, Выполнено: Да/Нет», горизонтальный скролл, кнопки «Сегодня», «Переименовать», «Удалить».
- **Категории**: привычки сгруппированы по табам («Все», каждая категория, «Без категории»). Если табы не помещаются, они прокручиваются по горизонтали. Категория добавляется кнопкой «+», активная переименовывается «✎» и удаляется «×» (привычки остаются без категории), привычка переносится выпадающим списком категории в её карточке. Привычка, добавленная на табе категории, попадает в эту категорию.

  > **Обновите плагин на всех устройствах.** Категории хранятся в новой, шестой колонке CSV (начиная с версии 1.2.0). Версии до 1.1.5 включительно о ней не знают и при любом изменении (отметка дня, добавление, переименование или удаление привычки) перезаписывают файл без неё — все привычки остаются без категории. Если хранилище синхронизируется между несколькими устройствами, обновите плагин на каждом из них, прежде чем раскладывать привычки по категориям.
- **Настройки**: путь к CSV, количество дней (30/90/365), цвет выполненного, цвет невыполненного.
- **Темы**: цвета адаптируются через CSS-переменные Obsidian (светлая/тёмная).

## Как использовать

Скопируйте папку `pix-vault-habits` в каталог плагинов Obsidian (`.obsidian/plugins/`) и включите плагин в настройках. Для пересборки после изменений выполните `npm run build` в каталоге проекта.

Для запуска dev-режима с автопересборкой: `npm run dev`. Тесты: `npm test`, линтер, проверка типов и тесты вместе: `npm run check`.
