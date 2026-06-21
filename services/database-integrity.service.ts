import {DatabaseService} from "./database.service";
import {IDatabaseIntegrityIssue, IDatabaseIntegrityReport} from "../models/interfaces";

type CountResult = {count: number};
type IntegrityResult = {integrity_check: string};

export class DatabaseIntegrityService {
    private async getCount(query: string): Promise<number> {
        const result = await DatabaseService.getOne<CountResult>(query);
        return result?.count ?? 0;
    }

    async createReport(): Promise<IDatabaseIntegrityReport> {
        const [
            integrityRows,
            foreignKeyRows,
            duplicateExerciseTrainings,
            orphanExerciseSets,
            orphanExerciseTrainings,
            orphanExerciseMuscleGroups,
            trainingsWithoutExercises,
            exerciseTrainingsWithoutSets,
            suspiciousExerciseNames,
            possiblePartialExerciseNames,
            schemaVersion,
        ] = await Promise.all([
            DatabaseService.getAll<IntegrityResult>("PRAGMA integrity_check"),
            DatabaseService.getAll("PRAGMA foreign_key_check"),
            this.getCount(`
                SELECT COUNT(*) AS count
                FROM (
                    SELECT training_id, exercise_id
                    FROM exercise_training
                    GROUP BY training_id, exercise_id
                    HAVING COUNT(*) > 1
                )
            `),
            this.getCount(`
                SELECT COUNT(*) AS count
                FROM exercise_set es
                LEFT JOIN exercise_training et ON et.id = es.exercise_training_id
                WHERE et.id IS NULL
            `),
            this.getCount(`
                SELECT COUNT(*) AS count
                FROM exercise_training et
                LEFT JOIN training t ON t.id = et.training_id
                LEFT JOIN exercise e ON e.id = et.exercise_id
                WHERE t.id IS NULL OR e.id IS NULL
            `),
            this.getCount(`
                SELECT COUNT(*) AS count
                FROM exercise_muscle_group emg
                LEFT JOIN muscle_group mg ON mg.id = emg.muscle_group_id
                LEFT JOIN exercise e ON e.id = emg.exercise_id
                WHERE mg.id IS NULL OR e.id IS NULL
            `),
            this.getCount(`
                SELECT COUNT(*) AS count
                FROM training t
                LEFT JOIN exercise_training et ON et.training_id = t.id
                WHERE et.id IS NULL
            `),
            this.getCount(`
                SELECT COUNT(*) AS count
                FROM exercise_training et
                LEFT JOIN exercise_set es ON es.exercise_training_id = et.id
                WHERE es.id IS NULL
            `),
            this.getCount(`
                SELECT COUNT(*) AS count
                FROM exercise
                WHERE (
                    LENGTH(TRIM(name)) < 3
                    OR name != TRIM(name)
                    OR name = ''
                )
                  AND NOT EXISTS (
                    SELECT 1
                    FROM ignored_suspicious_exercise ignored
                    WHERE ignored.exercise_id = exercise.id
                )
            `),
            this.getCount(`
                SELECT COUNT(DISTINCT shorter.id) AS count
                FROM exercise shorter
                JOIN exercise longer
                  ON shorter.id != longer.id
                 AND LENGTH(TRIM(shorter.name)) >= 3
                 AND LENGTH(TRIM(longer.name)) > LENGTH(TRIM(shorter.name))
                 AND LOWER(TRIM(longer.name)) LIKE LOWER(TRIM(shorter.name)) || '%'
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM ignored_exercise_merge ignored
                    WHERE ignored.source_exercise_id = shorter.id
                      AND ignored.target_exercise_id = longer.id
                )
            `),
            DatabaseService.getUserVersion(),
        ]);

        const integrityMessages = integrityRows.map((row) => row.integrity_check);
        const integrityCheckPassed =
            integrityMessages.length === 1 && integrityMessages[0].toLowerCase() === "ok";

        const issues: IDatabaseIntegrityIssue[] = [
            {
                key: "foreign-keys",
                title: "Fremdschlüsselverletzungen",
                description: "Datensätze verweisen auf nicht mehr vorhandene Eltern-Datensätze.",
                count: foreignKeyRows.length,
                severity: "critical",
            },
            {
                key: "duplicate-exercise-trainings",
                title: "Doppelte Übungen in Trainings",
                description: "Dieselbe Übung ist mehrfach mit demselben Training verknüpft.",
                count: duplicateExerciseTrainings,
                severity: "critical",
            },
            {
                key: "orphan-sets",
                title: "Verwaiste Sätze",
                description: "Sätze besitzen keine gültige Trainingsübung mehr.",
                count: orphanExerciseSets,
                severity: "critical",
            },
            {
                key: "orphan-exercise-trainings",
                title: "Verwaiste Trainingsübungen",
                description:
                    "Übungszuordnungen besitzen kein gültiges Training oder keine gültige Übung.",
                count: orphanExerciseTrainings,
                severity: "critical",
            },
            {
                key: "orphan-muscle-group-links",
                title: "Verwaiste Gruppenzuordnungen",
                description:
                    "Übungen sind mit nicht mehr vorhandenen Übungen oder Muskelgruppen verknüpft.",
                count: orphanExerciseMuscleGroups,
                severity: "critical",
            },
            {
                key: "trainings-without-exercises",
                title: "Trainings ohne Übungen",
                description: "Angelegte Trainings enthalten keine Übungszuordnung.",
                count: trainingsWithoutExercises,
                severity: "warning",
            },
            {
                key: "exercise-trainings-without-sets",
                title: "Übungen ohne Sätze",
                description: "Trainingsübungen enthalten keine gespeicherten Sätze.",
                count: exerciseTrainingsWithoutSets,
                severity: "warning",
            },
            {
                key: "suspicious-exercise-names",
                title: "Auffällige Übungsnamen",
                description: "Sehr kurze, leere oder nicht sauber getrimmte Übungsnamen.",
                count: suspiciousExerciseNames,
                severity: "warning",
            },
            {
                key: "possible-partial-exercise-names",
                title: "Mögliche Teilwort-Übungen",
                description: "Kürzere Übungsnamen sind zugleich der Anfang eines längeren Namens.",
                count: possiblePartialExerciseNames,
                severity: "warning",
            },
        ];

        return {
            createdAt: Date.now(),
            integrityCheckPassed,
            integrityMessages,
            foreignKeyViolationCount: foreignKeyRows.length,
            schemaVersion,
            issues,
        };
    }
}
