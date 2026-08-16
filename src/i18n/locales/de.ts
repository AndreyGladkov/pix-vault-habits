import type { LocaleData } from "../types";

export const de: LocaleData = {
  strings: {
    // Commands
    "command.addHabit": "Neue Gewohnheit hinzufügen",
    "command.openTracker": "Gewohnheits-Tracker öffnen",
    "command.markToday": "Heute als erledigt markieren",

    // Notices
    "notice.habitAdded": "Gewohnheit „{name}“ hinzugefügt",
    "notice.addHabitFailed": "Gewohnheit konnte nicht hinzugefügt werden",
    "notice.habitDeleted": "Gewohnheit „{name}“ gelöscht",
    "notice.deleteHabitFailed": "Gewohnheit konnte nicht gelöscht werden",
    "notice.habitRenamed": "Gewohnheit umbenannt",
    "notice.renameHabitFailed": "Gewohnheit konnte nicht umbenannt werden",
    "notice.toggleFailed": "Status der Gewohnheit konnte nicht aktualisiert werden",
    "notice.markedDone": "Für heute als erledigt markiert",
    "notice.markUndone": "Markierung entfernt",
    "notice.openViewFailed": "Tracker-Panel konnte nicht geöffnet werden",

    // Confirm dialog
    "confirm.deleteHabit": "Gewohnheit „{name}“ löschen? Alle Daten gehen verloren.",

    // Habit picker modal
    "picker.title": "Gewohnheit wählen",
    "picker.loadError": "Fehler beim Laden der Gewohnheiten.",
    "picker.empty": "Noch keine Gewohnheiten.",

    // View
    "view.title": "Gewohnheiten",
    "view.addButton": "Gewohnheit hinzufügen",
    "view.refreshButton": "Aktualisieren",
    "view.loadError": "Gewohnheitsdaten konnten nicht geladen werden.",
    "view.empty": "Noch keine Gewohnheiten. Klicken Sie auf „Gewohnheit hinzufügen“, um zu beginnen.",

    // Add habit modal
    "modal.add.title": "Neue Gewohnheit",
    "modal.add.nameLabel": "Name",
    "modal.add.nameDesc": "Geben Sie den Namen der Gewohnheit ein",
    "modal.add.placeholder": "z. B. 20 Minuten lesen",
    "modal.cancel": "Abbrechen",
    "modal.create": "Erstellen",

    // Rename habit modal
    "modal.rename.title": "Gewohnheit umbenennen",
    "modal.rename.nameLabel": "Name",
    "modal.save": "Speichern",

    // Habit block
    "habit.stats": "🔥 {streak} T. · ✅ {done}",
    "habit.today": "Heute",
    "habit.renameAria": "Umbenennen",
    "habit.deleteAria": "Löschen",
    "habit.idTooltip": "ID: {id}",

    // Grid tooltip
    "grid.tooltip": "Datum: {date}, Erledigt: {yes}",
    "grid.tooltipDone": "Ja",
    "grid.tooltipNotDone": "Nein",

    // Settings
    "settings.csvPath.name": "CSV-Dateipfad",
    "settings.csvPath.desc": "Speicherort der Gewohnheitsdatendatei im Tresor.",
    "settings.numDays.name": "Anzahl der Tage",
    "settings.numDays.desc": "Wie viele letzte Tage im Raster angezeigt werden sollen (30, 90, 365).",
    "settings.numDays.30": "30 Tage",
    "settings.numDays.90": "90 Tage",
    "settings.numDays.365": "365 Tage",
    "settings.doneColor.name": "Farbe für erledigt",
    "settings.doneColor.desc": "Farbe des Quadrats für einen erledigten Tag.",
    "settings.emptyColor.name": "Farbe für nicht erledigt",
    "settings.emptyColor.desc": "Farbe des Quadrats für einen nicht erledigten Tag (CSS-Variable oder Farbe).",
    "settings.language.name": "Sprache",
    "settings.language.desc": "Oberflächensprache. Auf „auto“ setzen, um Obsidian zu folgen.",
  },
  weekdayLabels: ["Mo", "", "Mi", "", "Fr", "", "So"],
  monthLabels: [
    "Jan",
    "Feb",
    "Mär",
    "Apr",
    "Mai",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Okt",
    "Nov",
    "Dez",
  ],
  dateFormat: "DD.MM.YYYY",
};

