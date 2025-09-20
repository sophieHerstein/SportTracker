import {DatabaseService} from "./database.service";

export class StatisticsService {

    async fetchTrainingsStatistikByTypeAndRange(type: "kraft" | "ausdauer", range: "monat" | "woche") {
        const queryMap = {
            kraft: {
                monat: "SELECT strftime('%Y-%m', t.datum / 1000, 'unixepoch') AS monat, COUNT(*) AS trainingsanzahl FROM training t GROUP BY monat ORDER BY monat DESC",
                woche: "SELECT strftime('%Y-%W', t.datum / 1000, 'unixepoch') AS woche, COUNT(*) AS trainingsanzahl FROM training t GROUP BY woche ORDER BY woche DESC;"
            },
            ausdauer: {
                monat: "SELECT strftime('%Y-%m', a.datum / 1000, 'unixepoch') AS monat, COUNT(*) AS trainingsanzahl FROM ausdauertrainingseinheit a GROUP BY monat ORDER BY monat DESC",
                woche: "SELECT strftime('%Y-%W', a.datum / 1000, 'unixepoch') AS woche, COUNT(*) AS trainingsanzahl FROM ausdauertrainingseinheit a GROUP BY woche ORDER BY woche DESC;"
            }
        };
        return DatabaseService.getAll(queryMap[type][range])
    }

    async fetchLastKrafttraining() {
        return DatabaseService.getAll(`
            SELECT muscle_group.id AS id, muscle_group.name AS name, MAX(training.datum) AS last_training
            FROM muscle_group
            LEFT JOIN training ON muscle_group.id = training.muscle_group_id
            GROUP BY muscle_group.id;
        `)
    }

    async fetchLastAusdauertraining() {
        return DatabaseService.getOne(`SELECT MAX(datum) AS last_training FROM ausdauertrainingseinheit`)
    }

    async getProgressionData() {
        return DatabaseService.getAll(`
            SELECT et.exercise_id, e.name AS uebung, MAX(es.weight) - MIN(es.weight) AS differenz FROM exercise_set es JOIN exercise_training et ON es.exercise_training_id = et.id JOIN training t ON et.training_id = t.id JOIN exercise e ON et.exercise_id = e.id GROUP BY et.exercise_id, e.name ORDER BY differenz DESC;
        `)
    }

    async getEntwicklungGewichtData() {
        return DatabaseService.getAll(`SELECT e.name AS uebung, t.datum, MAX(es.weight) AS max_weight FROM exercise_set es JOIN exercise_training et ON es.exercise_training_id = et.id JOIN training t ON et.training_id = t.id JOIN exercise e ON et.exercise_id = e.id GROUP BY e.name, t.datum ORDER BY e.name ASC, t.datum ASC`)
    }
}