import db from "../db/db";
import {IExerciseMergeCandidate, ISuspiciousExercise} from "../models/interfaces";
import {DatabaseBackupService} from "./database-backup.service";
import {DatabaseService} from "./database.service";

export class DatabaseRepairService {
    private readonly backupService = new DatabaseBackupService();

    async getExerciseMergeCandidates(): Promise<IExerciseMergeCandidate[]> {
        return DatabaseService.getAll<IExerciseMergeCandidate>(`
            SELECT shorter.id AS sourceId,
                   shorter.name AS sourceName,
                   longer.id AS targetId,
                   longer.name AS targetName,
                   (
                       SELECT COUNT(*)
                       FROM exercise_training et
                       WHERE et.exercise_id = shorter.id
                   ) AS sourceUsageCount
            FROM exercise shorter
            JOIN exercise longer
              ON shorter.id != longer.id
             AND LENGTH(TRIM(shorter.name)) >= 3
             AND LENGTH(TRIM(longer.name)) > LENGTH(TRIM(shorter.name))
             AND LOWER(TRIM(longer.name)) LIKE LOWER(TRIM(shorter.name)) || '%'
            WHERE NOT EXISTS (
                SELECT 1
                FROM exercise alternative
                WHERE alternative.id != shorter.id
                  AND LENGTH(TRIM(alternative.name)) > LENGTH(TRIM(shorter.name))
                  AND LENGTH(TRIM(alternative.name)) < LENGTH(TRIM(longer.name))
                  AND LOWER(TRIM(alternative.name)) LIKE LOWER(TRIM(shorter.name)) || '%'
            )
              AND NOT EXISTS (
                SELECT 1
                FROM ignored_exercise_merge ignored
                WHERE ignored.source_exercise_id = shorter.id
                  AND ignored.target_exercise_id = longer.id
            )
            ORDER BY shorter.name, longer.name
        `);
    }

    async ignoreExerciseMergeCandidate(sourceId: number, targetId: number): Promise<void> {
        await DatabaseService.run(
            `INSERT OR IGNORE INTO ignored_exercise_merge (
                source_exercise_id,
                target_exercise_id,
                created_at
             ) VALUES (?, ?, ?)`,
            [sourceId, targetId, Date.now()]
        );
    }

    async getSuspiciousExercises(): Promise<ISuspiciousExercise[]> {
        return DatabaseService.getAll<ISuspiciousExercise>(`
            SELECT exercise.id,
                   exercise.name,
                   COUNT(DISTINCT exercise_training.id) AS usageCount
            FROM exercise
            LEFT JOIN exercise_training
              ON exercise_training.exercise_id = exercise.id
            WHERE (
                LENGTH(TRIM(exercise.name)) < 3
                OR exercise.name != TRIM(exercise.name)
                OR exercise.name = ''
            )
              AND NOT EXISTS (
                SELECT 1
                FROM ignored_suspicious_exercise ignored
                WHERE ignored.exercise_id = exercise.id
            )
            GROUP BY exercise.id, exercise.name
            ORDER BY exercise.name, exercise.id
        `);
    }

    async ignoreSuspiciousExercise(exerciseId: number): Promise<void> {
        await DatabaseService.run(
            `INSERT OR IGNORE INTO ignored_suspicious_exercise (exercise_id, created_at)
             VALUES (?, ?)`,
            [exerciseId, Date.now()]
        );
    }

    async renameSuspiciousExercise(exerciseId: number, name: string): Promise<void> {
        const normalizedName = name.trim().replace(/\s+/g, " ");
        if (normalizedName.length < 2) {
            throw new Error("Der Übungsname muss mindestens zwei Zeichen enthalten.");
        }

        const duplicate = await DatabaseService.getOne<{id: number}>(
            `SELECT id
             FROM exercise
             WHERE id != ?
               AND LOWER(TRIM(name)) = LOWER(?)`,
            [exerciseId, normalizedName]
        );
        if (duplicate) {
            throw new Error("Eine Übung mit diesem Namen existiert bereits.");
        }

        await db.withExclusiveTransactionAsync(async (txn) => {
            await txn.runAsync("UPDATE exercise SET name = ? WHERE id = ?", [
                normalizedName,
                exerciseId,
            ]);
            await txn.runAsync("DELETE FROM ignored_suspicious_exercise WHERE exercise_id = ?", [
                exerciseId,
            ]);
        });
    }

    async deleteExerciseCompletely(exerciseId: number): Promise<string> {
        const exists = await DatabaseService.getOne<{id: number}>(
            "SELECT id FROM exercise WHERE id = ?",
            [exerciseId]
        );
        if (!exists) throw new Error("Die Übung existiert nicht mehr.");

        const backup = await this.backupService.createBackup();
        await DatabaseService.run("DELETE FROM exercise WHERE id = ?", [exerciseId]);
        return backup.fileName;
    }

    async mergeExercises(sourceId: number, targetId: number): Promise<string> {
        if (sourceId === targetId) {
            throw new Error("Quell- und Zielübung dürfen nicht identisch sein.");
        }

        const [source, target] = await Promise.all([
            DatabaseService.getOne<{id: number; name: string}>(
                "SELECT id, name FROM exercise WHERE id = ?",
                [sourceId]
            ),
            DatabaseService.getOne<{id: number; name: string}>(
                "SELECT id, name FROM exercise WHERE id = ?",
                [targetId]
            ),
        ]);

        if (!source || !target) {
            throw new Error("Eine der Übungen existiert nicht mehr.");
        }

        const backup = await this.backupService.createBackup();

        await db.withExclusiveTransactionAsync(async (txn) => {
            const sourceTrainings = await txn.getAllAsync<{id: number; training_id: number}>(
                `
                SELECT id, training_id
                FROM exercise_training
                WHERE exercise_id = ?
            `,
                [sourceId]
            );

            for (const sourceTraining of sourceTrainings) {
                const targetTraining = await txn.getFirstAsync<{id: number}>(
                    `
                    SELECT id
                    FROM exercise_training
                    WHERE training_id = ? AND exercise_id = ?
                `,
                    [sourceTraining.training_id, targetId]
                );

                if (targetTraining) {
                    await txn.runAsync(
                        `UPDATE exercise_set
                         SET exercise_training_id = ?
                         WHERE exercise_training_id = ?`,
                        [targetTraining.id, sourceTraining.id]
                    );
                    await txn.runAsync("DELETE FROM exercise_training WHERE id = ?", [
                        sourceTraining.id,
                    ]);
                } else {
                    await txn.runAsync(
                        "UPDATE exercise_training SET exercise_id = ? WHERE id = ?",
                        [targetId, sourceTraining.id]
                    );
                }
            }

            await txn.runAsync(
                `
                INSERT OR IGNORE INTO exercise_muscle_group (muscle_group_id, exercise_id)
                SELECT muscle_group_id, ?
                FROM exercise_muscle_group
                WHERE exercise_id = ?
            `,
                [targetId, sourceId]
            );

            await txn.runAsync("DELETE FROM exercise_muscle_group WHERE exercise_id = ?", [
                sourceId,
            ]);
            await txn.runAsync("DELETE FROM exercise WHERE id = ?", [sourceId]);
        });

        return backup.fileName;
    }

    async repairSafeIntegrityIssues(): Promise<string> {
        const backup = await this.backupService.createBackup();

        await db.withExclusiveTransactionAsync(async (txn) => {
            await txn.execAsync(`
                DELETE FROM exercise_set
                WHERE NOT EXISTS (
                    SELECT 1 FROM exercise_training et
                    WHERE et.id = exercise_set.exercise_training_id
                );

                DELETE FROM exercise_training
                WHERE NOT EXISTS (
                    SELECT 1 FROM training t
                    WHERE t.id = exercise_training.training_id
                )
                   OR NOT EXISTS (
                    SELECT 1 FROM exercise e
                    WHERE e.id = exercise_training.exercise_id
                );

                DELETE FROM exercise_muscle_group
                WHERE NOT EXISTS (
                    SELECT 1 FROM muscle_group mg
                    WHERE mg.id = exercise_muscle_group.muscle_group_id
                )
                   OR NOT EXISTS (
                    SELECT 1 FROM exercise e
                    WHERE e.id = exercise_muscle_group.exercise_id
                );

                UPDATE exercise_set
                SET exercise_training_id = (
                    SELECT MIN(canonical.id)
                    FROM exercise_training canonical
                    WHERE canonical.training_id = (
                        SELECT duplicate.training_id
                        FROM exercise_training duplicate
                        WHERE duplicate.id = exercise_set.exercise_training_id
                    )
                      AND canonical.exercise_id = (
                        SELECT duplicate.exercise_id
                        FROM exercise_training duplicate
                        WHERE duplicate.id = exercise_set.exercise_training_id
                    )
                )
                WHERE exercise_training_id IN (
                    SELECT duplicate.id
                    FROM exercise_training duplicate
                    WHERE duplicate.id != (
                        SELECT MIN(canonical.id)
                        FROM exercise_training canonical
                        WHERE canonical.training_id = duplicate.training_id
                          AND canonical.exercise_id = duplicate.exercise_id
                    )
                );

                DELETE FROM exercise_training
                WHERE id NOT IN (
                    SELECT MIN(id)
                    FROM exercise_training
                    GROUP BY training_id, exercise_id
                );

                DELETE FROM exercise_training
                WHERE NOT EXISTS (
                    SELECT 1 FROM exercise_set es
                    WHERE es.exercise_training_id = exercise_training.id
                );

                DELETE FROM training
                WHERE NOT EXISTS (
                    SELECT 1 FROM muscle_group mg
                    WHERE mg.id = training.muscle_group_id
                )
                   OR NOT EXISTS (
                    SELECT 1 FROM exercise_training et
                    WHERE et.training_id = training.id
                );

                DELETE FROM ausdauertrainingseinheit
                WHERE trainingstyp_id IS NOT NULL
                  AND NOT EXISTS (
                    SELECT 1 FROM trainingstyp tt
                    WHERE tt.id = ausdauertrainingseinheit.trainingstyp_id
                );

                UPDATE exercise
                SET name = TRIM(name)
                WHERE name != TRIM(name)
                  AND LENGTH(TRIM(name)) >= 2
                  AND NOT EXISTS (
                    SELECT 1 FROM exercise other
                    WHERE other.id != exercise.id
                      AND LOWER(TRIM(other.name)) = LOWER(TRIM(exercise.name))
                );
            `);
        });

        const remainingViolations = await db.getAllAsync("PRAGMA foreign_key_check");
        if (remainingViolations.length > 0) {
            throw new Error(
                "Die automatische Bereinigung konnte nicht alle Beziehungen reparieren."
            );
        }

        return backup.fileName;
    }
}
