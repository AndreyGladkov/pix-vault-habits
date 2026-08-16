import type { LocaleData } from "../types";

export const en: LocaleData = {
  strings: {
    // Commands
    "command.addHabit": "Add new habit",
    "command.openTracker": "Open habit tracker",
    "command.markToday": "Mark today as done",

    // Notices
    "notice.habitAdded": "Habit \"{name}\" added",
    "notice.addHabitFailed": "Failed to add habit",
    "notice.habitDeleted": "Habit \"{name}\" deleted",
    "notice.deleteHabitFailed": "Failed to delete habit",
    "notice.habitRenamed": "Habit renamed",
    "notice.renameHabitFailed": "Failed to rename habit",
    "notice.toggleFailed": "Failed to update habit status",
    "notice.markedDone": "Marked as done for today",
    "notice.markUndone": "Mark removed",
    "notice.openViewFailed": "Failed to open the tracker panel",

    // Confirm dialog
    "confirm.deleteHabit": "Delete habit \"{name}\"? All data will be lost.",

    // Habit picker modal
    "picker.title": "Choose a habit",
    "picker.loadError": "Error loading habits.",
    "picker.empty": "No habits yet.",

    // View
    "view.title": "Habits",
    "view.addButton": "Add habit",
    "view.refreshButton": "Refresh",
    "view.loadError": "Failed to load habit data.",
    "view.empty": "No habits yet. Click \"Add habit\" to get started.",

    // Add habit modal
    "modal.add.title": "New habit",
    "modal.add.nameLabel": "Name",
    "modal.add.nameDesc": "Enter the habit name",
    "modal.add.placeholder": "e.g. Read for 20 minutes",
    "modal.cancel": "Cancel",
    "modal.create": "Create",

    // Rename habit modal
    "modal.rename.title": "Rename habit",
    "modal.rename.nameLabel": "Name",
    "modal.save": "Save",

    // Habit block
    "habit.stats": "🔥 {streak} days · ✅ {done}",
    "habit.today": "Today",
    "habit.renameAria": "Rename",
    "habit.deleteAria": "Delete",
    "habit.idTooltip": "ID: {id}",

    // Grid tooltip
    "grid.tooltip": "Date: {date}, Done: {yes}",
    "grid.tooltipDone": "Yes",
    "grid.tooltipNotDone": "No",

    // Settings
    "settings.csvPath.name": "CSV file path",
    "settings.csvPath.desc": "Location of the habit data file inside the vault.",
    "settings.numDays.name": "Number of days",
    "settings.numDays.desc": "How many recent days to show in the grid (30, 90, 365).",
    "settings.numDays.30": "30 days",
    "settings.numDays.90": "90 days",
    "settings.numDays.365": "365 days",
    "settings.doneColor.name": "Done color",
    "settings.doneColor.desc": "Color of the square for a completed day.",
    "settings.emptyColor.name": "Not-done color",
    "settings.emptyColor.desc": "Color of the square for an uncompleted day (CSS variable or color).",
    "settings.language.name": "Language",
    "settings.language.desc": "Interface language. Set to \"auto\" to follow Obsidian.",
  },
  weekdayLabels: ["Mon", "", "Wed", "", "Fri", "", "Sun"],
  monthLabels: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  dateFormat: "DD.MM.YYYY",
};

