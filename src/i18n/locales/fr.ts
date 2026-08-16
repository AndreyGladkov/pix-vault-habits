import type { LocaleData } from "../types";

export const fr: LocaleData = {
  strings: {
    // Commands
    "command.addHabit": "Ajouter une habitude",
    "command.openTracker": "Ouvrir le suivi des habitudes",
    "command.markToday": "Marquer comme fait aujourd'hui",

    // Notices
    "notice.habitAdded": "Habitude « {name} » ajoutée",
    "notice.addHabitFailed": "Impossible d'ajouter l'habitude",
    "notice.habitDeleted": "Habitude « {name} » supprimée",
    "notice.deleteHabitFailed": "Impossible de supprimer l'habitude",
    "notice.habitRenamed": "Habitude renommée",
    "notice.renameHabitFailed": "Impossible de renommer l'habitude",
    "notice.toggleFailed": "Impossible de mettre à jour le statut de l'habitude",
    "notice.markedDone": "Marqué comme fait aujourd'hui",
    "notice.markUndone": "Marque retirée",
    "notice.openViewFailed": "Impossible d'ouvrir le panneau du suivi",

    // Confirm dialog
    "confirm.deleteHabit": "Supprimer l'habitude « {name} » ? Toutes les données seront perdues.",

    // Habit picker modal
    "picker.title": "Choisir une habitude",
    "picker.loadError": "Erreur lors du chargement des habitudes.",
    "picker.empty": "Aucune habitude pour le moment.",

    // View
    "view.title": "Habitudes",
    "view.addButton": "Ajouter une habitude",
    "view.refreshButton": "Actualiser",
    "view.loadError": "Impossible de charger les données des habitudes.",
    "view.empty": "Aucune habitude pour le moment. Cliquez sur « Ajouter une habitude » pour commencer.",

    // Add habit modal
    "modal.add.title": "Nouvelle habitude",
    "modal.add.nameLabel": "Nom",
    "modal.add.nameDesc": "Saisissez le nom de l'habitude",
    "modal.add.placeholder": "Ex. : Lire 20 minutes",
    "modal.cancel": "Annuler",
    "modal.create": "Créer",

    // Rename habit modal
    "modal.rename.title": "Renommer l'habitude",
    "modal.rename.nameLabel": "Nom",
    "modal.save": "Enregistrer",

    // Habit block
    "habit.stats": "🔥 {streak} j · ✅ {done}",
    "habit.today": "Aujourd'hui",
    "habit.renameAria": "Renommer",
    "habit.deleteAria": "Supprimer",
    "habit.idTooltip": "ID : {id}",

    // Grid tooltip
    "grid.tooltip": "Date : {date}, Fait : {yes}",
    "grid.tooltipDone": "Oui",
    "grid.tooltipNotDone": "Non",

    // Settings
    "settings.csvPath.name": "Chemin du fichier CSV",
    "settings.csvPath.desc": "Emplacement du fichier de données des habitudes dans le coffre.",
    "settings.numDays.name": "Nombre de jours",
    "settings.numDays.desc": "Combien de jours récents afficher dans la grille (30, 90, 365).",
    "settings.numDays.30": "30 jours",
    "settings.numDays.90": "90 jours",
    "settings.numDays.365": "365 jours",
    "settings.doneColor.name": "Couleur des jours faits",
    "settings.doneColor.desc": "Couleur du carré pour un jour accompli.",
    "settings.emptyColor.name": "Couleur des jours non faits",
    "settings.emptyColor.desc": "Couleur du carré pour un jour non accompli (variable CSS ou couleur).",
    "settings.language.name": "Langue",
    "settings.language.desc": "Langue de l'interface. Définissez sur « auto » pour suivre Obsidian.",
  },
  weekdayLabels: ["Lun", "", "Mer", "", "Ven", "", "Dim"],
  monthLabels: [
    "Jan",
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Juin",
    "Juil",
    "Août",
    "Sep",
    "Oct",
    "Nov",
    "Déc",
  ],
  dateFormat: "DD.MM.YYYY",
};

