import type { LocaleData } from "../types";

export const ru: LocaleData = {
  strings: {
    // Commands
    "command.addHabit": "Добавить привычку",
    "command.openTracker": "Открыть трекер привычек",
    "command.markToday": "Отметить сегодня выполненным",

    // Notices
    "notice.habitAdded": "Привычка «{name}» добавлена",
    "notice.addHabitFailed": "Не удалось добавить привычку",
    "notice.habitDeleted": "Привычка «{name}» удалена",
    "notice.deleteHabitFailed": "Не удалось удалить привычку",
    "notice.habitRenamed": "Привычка переименована",
    "notice.renameHabitFailed": "Не удалось переименовать привычку",
    "notice.toggleFailed": "Не удалось обновить статус привычки",
    "notice.markedDone": "Отмечено выполненным на сегодня",
    "notice.markUndone": "Отметка снята",
    "notice.openViewFailed": "Не удалось открыть панель трекера",

    // Confirm dialog
    "confirm.deleteHabit": "Удалить привычку «{name}»? Все данные будут потеряны.",

    // Habit picker modal
    "picker.title": "Выберите привычку",
    "picker.loadError": "Ошибка загрузки привычек.",
    "picker.empty": "Пока нет привычек.",

    // View
    "view.title": "Привычки",
    "view.addButton": "Добавить привычку",
    "view.refreshButton": "Обновить",
    "view.loadError": "Не удалось загрузить данные привычек.",
    "view.empty": "Пока нет привычек. Нажмите «Добавить привычку», чтобы начать.",

    // Add habit modal
    "modal.add.title": "Новая привычка",
    "modal.add.nameLabel": "Название",
    "modal.add.nameDesc": "Введите название привычки",
    "modal.add.placeholder": "Например: Читать 20 минут",
    "modal.cancel": "Отмена",
    "modal.create": "Создать",

    // Rename habit modal
    "modal.rename.title": "Переименовать привычку",
    "modal.rename.nameLabel": "Название",
    "modal.save": "Сохранить",

    // Habit block
    "habit.stats": "🔥 {streak} дн. · ✅ {done}",
    "habit.today": "Сегодня",
    "habit.renameAria": "Переименовать",
    "habit.deleteAria": "Удалить",
    "habit.idTooltip": "ID: {id}",

    // Grid tooltip
    "grid.tooltip": "Дата: {date}, Выполнено: {yes}",
    "grid.tooltipDone": "Да",
    "grid.tooltipNotDone": "Нет",

    // Settings
    "settings.csvPath.name": "Путь к CSV-файлу",
    "settings.csvPath.desc": "Расположение файла данных привычек внутри хранилища.",
    "settings.numDays.name": "Количество дней",
    "settings.numDays.desc": "Сколько последних дней показывать в сетке (30, 90, 365).",
    "settings.numDays.30": "30 дней",
    "settings.numDays.90": "90 дней",
    "settings.numDays.365": "365 дней",
    "settings.doneColor.name": "Цвет выполненного",
    "settings.doneColor.desc": "Цвет квадрата для выполненного дня.",
    "settings.emptyColor.name": "Цвет невыполненного",
    "settings.emptyColor.desc": "Цвет квадрата для невыполненного дня (CSS-переменная или цвет).",
    "settings.language.name": "Язык",
    "settings.language.desc": "Язык интерфейса. Установите «auto», чтобы следовать настройкам Obsidian.",
  },
  weekdayLabels: ["Пн", "", "Ср", "", "Пт", "", "Вс"],
  monthLabels: [
    "Янв",
    "Фев",
    "Мар",
    "Апр",
    "Май",
    "Июн",
    "Июл",
    "Авг",
    "Сен",
    "Окт",
    "Ноя",
    "Дек",
  ],
  dateFormat: "DD.MM.YYYY",
};

