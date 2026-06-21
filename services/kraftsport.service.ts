import {DatabaseService} from "./database.service";
import {IKrafttrainingSaveRequest, IKrafttrainingSaveResult, RawRow} from "../models/interfaces";
import db from "../db/db";
import {prepareExercisesForSave} from "../utils/training-validation";

export class KraftsportService {
    async saveTrainingAtomically(
        request: IKrafttrainingSaveRequest
    ): Promise<IKrafttrainingSaveResult> {
        const preparedExercises = prepareExercisesForSave(
            request.exercises,
            request.requireAllExercisesValid
        );
        let savedTrainingId = request.trainingId;
        let savedExerciseCount = 0;
        let savedSetCount = 0;
        const exerciseIds: {
            clientId: number;
            exerciseId: number;
            canRenameDuringAutosave: boolean;
            createdDuringSave: boolean;
        }[] = [];

        if (preparedExercises.length === 0) {
            throw new Error("Noch keine Übung mit einem Satz und gültigem Gewicht vorhanden.");
        }

        await db.withExclusiveTransactionAsync(async (txn) => {
            const muscleGroup = await txn.getFirstAsync<{id: number}>(
                `SELECT id
                 FROM muscle_group
                 WHERE name = ? AND is_deleted = 0`,
                [request.muscleGroupName]
            );

            if (!muscleGroup) {
                throw new Error("Die ausgewählte Muskelgruppe wurde nicht gefunden.");
            }

            if (savedTrainingId === null) {
                const insert = await txn.runAsync(
                    `INSERT INTO training (datum, muscle_group_id, tageszeit)
                     VALUES (?, ?, ?)`,
                    [request.datum, muscleGroup.id, request.tageszeit]
                );
                savedTrainingId = insert.lastInsertRowId;
            } else {
                const trainingExists = await txn.getFirstAsync<{id: number}>(
                    "SELECT id FROM training WHERE id = ?",
                    [savedTrainingId]
                );
                if (!trainingExists) {
                    throw new Error("Das zu bearbeitende Training existiert nicht mehr.");
                }

                await txn.runAsync(
                    `UPDATE training
                     SET datum = ?,
                         muscle_group_id = ?,
                         tageszeit = ?
                     WHERE id = ?`,
                    [request.datum, muscleGroup.id, request.tageszeit, savedTrainingId]
                );
            }

            await txn.runAsync(
                `DELETE FROM exercise_set
                 WHERE exercise_training_id IN (
                     SELECT id FROM exercise_training WHERE training_id = ?
                 )`,
                [savedTrainingId]
            );
            await txn.runAsync("DELETE FROM exercise_training WHERE training_id = ?", [
                savedTrainingId,
            ]);

            for (let exerciseIndex = 0; exerciseIndex < preparedExercises.length; exerciseIndex++) {
                const exercise = preparedExercises[exerciseIndex];
                let existingExercise: {id: number} | null = null;
                let createdDuringSave = false;

                if (exercise.exerciseId) {
                    const currentExercise = await txn.getFirstAsync<{id: number; name: string}>(
                        "SELECT id, name FROM exercise WHERE id = ?",
                        [exercise.exerciseId]
                    );

                    if (currentExercise && exercise.canRenameDuringAutosave) {
                        const exactOtherExercise = await txn.getFirstAsync<{id: number}>(
                            `SELECT id
                             FROM exercise
                             WHERE id != ?
                               AND LOWER(TRIM(name)) = LOWER(?)`,
                            [currentExercise.id, exercise.name]
                        );

                        if (exactOtherExercise) {
                            existingExercise = exactOtherExercise;
                            exercise.canRenameDuringAutosave = false;
                            await txn.runAsync(
                                `DELETE FROM exercise_muscle_group
                                 WHERE exercise_id = ?
                                   AND NOT EXISTS (
                                     SELECT 1 FROM exercise_training WHERE exercise_id = ?
                                   )`,
                                [currentExercise.id, currentExercise.id]
                            );
                            await txn.runAsync(
                                `DELETE FROM exercise
                                 WHERE id = ?
                                   AND NOT EXISTS (
                                     SELECT 1 FROM exercise_training WHERE exercise_id = ?
                                   )`,
                                [currentExercise.id, currentExercise.id]
                            );
                        } else {
                            await txn.runAsync("UPDATE exercise SET name = ? WHERE id = ?", [
                                exercise.name,
                                currentExercise.id,
                            ]);
                            existingExercise = {id: currentExercise.id};
                        }
                    } else if (
                        currentExercise &&
                        currentExercise.name.trim().toLocaleLowerCase("de-DE") ===
                            exercise.name.toLocaleLowerCase("de-DE")
                    ) {
                        existingExercise = {id: currentExercise.id};
                    }
                }

                if (!existingExercise) {
                    existingExercise = await txn.getFirstAsync<{id: number}>(
                        `SELECT id
                         FROM exercise
                         WHERE LOWER(TRIM(name)) = LOWER(?)`,
                        [exercise.name]
                    );
                }

                if (!existingExercise) {
                    const insert = await txn.runAsync("INSERT INTO exercise (name) VALUES (?)", [
                        exercise.name,
                    ]);
                    existingExercise = {id: insert.lastInsertRowId};
                    exercise.canRenameDuringAutosave = true;
                    createdDuringSave = true;
                }

                exerciseIds.push({
                    clientId: exercise.clientId,
                    exerciseId: existingExercise.id,
                    canRenameDuringAutosave: exercise.canRenameDuringAutosave,
                    createdDuringSave,
                });

                await txn.runAsync(
                    `INSERT OR IGNORE INTO exercise_muscle_group (muscle_group_id, exercise_id)
                     VALUES (?, ?)`,
                    [muscleGroup.id, existingExercise.id]
                );

                const trainingExerciseInsert = await txn.runAsync(
                    `INSERT INTO exercise_training (training_id, exercise_id, sort_order)
                     VALUES (?, ?, ?)`,
                    [savedTrainingId, existingExercise.id, exerciseIndex]
                );

                for (const set of exercise.sets) {
                    await txn.runAsync(
                        `INSERT INTO exercise_set (exercise_training_id, weight, repetitions)
                         VALUES (?, ?, ?)`,
                        [trainingExerciseInsert.lastInsertRowId, set.weight, set.repetitions]
                    );
                    savedSetCount++;
                }

                savedExerciseCount++;
            }

            if (request.requireAllExercisesValid && savedExerciseCount === 0) {
                throw new Error("Das Training enthält keine speicherbare Übung.");
            }
        });

        if (savedTrainingId === null) {
            throw new Error("Das Training konnte nicht angelegt werden.");
        }

        return {
            trainingId: savedTrainingId,
            savedExerciseCount,
            savedSetCount,
            exerciseIds,
        };
    }

    async fetchKraftsportData() {
        return DatabaseService.getAll(`
            SELECT t.id    AS training_id,
                   t.datum,
                   mg.name AS muscle_group,
                   e.name  AS exercise,
                   es.id   AS exercise_set_id,
                   es.weight,
                   es.repetitions
            FROM training t
                     JOIN muscle_group mg ON t.muscle_group_id = mg.id
                     JOIN exercise_training et ON t.id = et.training_id
                     JOIN exercise e ON et.exercise_id = e.id
                     JOIN exercise_set es ON et.id = es.exercise_training_id
            ORDER BY t.datum DESC, t.id DESC, et.sort_order ASC, es.id ASC`);
    }

    async deleteTrainingWithId(id: string) {
        return DatabaseService.runBatch([
            {
                query: `DELETE
                            FROM exercise_set
                            WHERE exercise_training_id IN (SELECT id FROM exercise_training WHERE training_id = ?)`,
                params: [id],
            },
            {
                query: `DELETE
                            FROM exercise_training
                            WHERE training_id = ?`,
                params: [id],
            },
            {
                query: `DELETE
                            FROM training
                            WHERE id = ?`,
                params: [id],
            },
            {
                query: `DELETE
                            FROM exercise_training
                            WHERE training_id NOT IN (SELECT id FROM training)`,
            },
        ]);
    }

    async discardNewTraining(trainingId: number, createdExerciseIds: number[]): Promise<void> {
        await db.withExclusiveTransactionAsync(async (txn) => {
            await txn.runAsync("DELETE FROM training WHERE id = ?", [trainingId]);

            for (const exerciseId of createdExerciseIds) {
                const stillUsed = await txn.getFirstAsync<{count: number}>(
                    "SELECT COUNT(*) AS count FROM exercise_training WHERE exercise_id = ?",
                    [exerciseId]
                );
                if ((stillUsed?.count ?? 0) > 0) continue;

                await txn.runAsync("DELETE FROM exercise_muscle_group WHERE exercise_id = ?", [
                    exerciseId,
                ]);
                await txn.runAsync("DELETE FROM exercise WHERE id = ?", [exerciseId]);
            }
        });
    }

    async deleteUnusedExercises(exerciseIds: number[]): Promise<void> {
        await db.withExclusiveTransactionAsync(async (txn) => {
            for (const exerciseId of exerciseIds) {
                const stillUsed = await txn.getFirstAsync<{count: number}>(
                    "SELECT COUNT(*) AS count FROM exercise_training WHERE exercise_id = ?",
                    [exerciseId]
                );
                if ((stillUsed?.count ?? 0) > 0) continue;
                await txn.runAsync("DELETE FROM exercise_muscle_group WHERE exercise_id = ?", [
                    exerciseId,
                ]);
                await txn.runAsync("DELETE FROM exercise WHERE id = ?", [exerciseId]);
            }
        });
    }

    async getMuscleGroupData() {
        return DatabaseService.getAll(`SELECT *
                                       FROM muscle_group
                                       WHERE is_deleted = 0`);
    }

    async addMuscleGroup(name: string) {
        return DatabaseService.run("INSERT INTO muscle_group (name) VALUES (?)", [
            name.trim().replace(/\s+/g, " "),
        ]);
    }

    async getEntwicklungGewichtDataForUebung(id: number, cutoffTimestamp = 0) {
        return DatabaseService.getAll(
            `SELECT t.datum, MAX(es.weight) AS max_weight
             FROM exercise_set es
             JOIN exercise_training et ON es.exercise_training_id = et.id
             JOIN training t ON et.training_id = t.id
             WHERE et.exercise_id = ?
               AND t.datum >= ?
             GROUP BY t.id, t.datum
             ORDER BY t.datum ASC, t.id ASC
             LIMIT 30`,
            [id, cutoffTimestamp]
        );
    }

    async getLastSatzDataForUebung(id: number) {
        return DatabaseService.getAll(
            `SELECT es.id AS satz_id, es.weight, es.repetitions
                                       FROM exercise_set es
                                                JOIN exercise_training et ON es.exercise_training_id = et.id
                                                JOIN training t ON et.training_id = t.id
                                       WHERE et.exercise_id = ?
                                         AND et.training_id = (
                                           SELECT et2.training_id
                                           FROM exercise_training et2
                                                    JOIN exercise_set es2 ON es2.exercise_training_id = et2.id
                                                    JOIN training t2 ON et2.training_id = t2.id
                                           WHERE et2.exercise_id = ?
                                           ORDER BY t2.datum DESC, t2.id DESC
                                           LIMIT 1
                                           );`,
            [id, id]
        );
    }

    async getLastUebungDataForGruppe(gruppe: string) {
        return DatabaseService.getAll(
            `SELECT e.id,
                                              e.name,
                                              MAX(t.datum) AS                last_training_date,
                                              (SELECT es.weight
                                               FROM exercise_set es
                                                        JOIN exercise_training et2 ON es.exercise_training_id = et2.id
                                               WHERE et2.exercise_id = e.id
                                               ORDER BY et2.training_id DESC LIMIT 1) AS last_weight, (SELECT COUNT(*) FROM exercise_set es JOIN exercise_training et2 ON es.exercise_training_id = et2.id WHERE et2.exercise_id = e.id AND et2.training_id = (SELECT id FROM training WHERE datum = (SELECT MAX(datum) FROM training t JOIN exercise_training et3 ON t.id = et3.training_id WHERE et3.exercise_id = e.id))) AS last_sets
                                       FROM exercise e JOIN exercise_training et
                                       ON e.id = et.exercise_id JOIN training t ON et.training_id = t.id
                                       WHERE e.id IN (SELECT exercise_id FROM exercise_muscle_group WHERE muscle_group_id = (SELECT id FROM muscle_group WHERE name = ?))
                                       GROUP BY e.id, e.name
                                       ORDER BY (
                                           SELECT et_order.sort_order
                                           FROM exercise_training et_order
                                           JOIN training t_order ON t_order.id = et_order.training_id
                                           WHERE et_order.exercise_id = e.id
                                           ORDER BY t_order.datum DESC, t_order.id DESC
                                           LIMIT 1
                                       ) ASC, e.name ASC`,
            [gruppe]
        );
    }

    async deleteUebungReferenzFromGruppe(uebungId: number, gruppe: string) {
        return DatabaseService.run(
            `DELETE
                                    FROM exercise_muscle_group
                                    WHERE exercise_id = ?
                                      AND muscle_group_id = (SELECT id FROM muscle_group WHERE name = ?)`,
            [uebungId, gruppe]
        );
    }

    async getExcerciseTrainingsIdsForExerciseId(uebungId: number) {
        return DatabaseService.getAll("SELECT id FROM exercise_training WHERE exercise_id = ?", [
            uebungId,
        ]);
    }

    async getExcerciseSetIdsForExcerciseTrainingsId(exerciseTrainingId: number) {
        return DatabaseService.getAll(
            "SELECT id FROM exercise_set WHERE exercise_training_id = ?",
            [exerciseTrainingId]
        );
    }

    async deleteExerciseTrainingForId(id: number) {
        return DatabaseService.run("DELETE FROM exercise_training WHERE id = ?", [id]);
    }

    async deleteExerciseForId(id: number) {
        return DatabaseService.run("DELETE FROM exercise WHERE id = ?", [id]);
    }

    async getMuscleGroupIdForName(name: string) {
        return DatabaseService.getOne("SELECT id FROM muscle_group WHERE name = ?", [name]);
    }

    async getIdForUebung(name: string) {
        return DatabaseService.getOne(
            `SELECT id
             FROM exercise
             WHERE LOWER(TRIM(name)) = LOWER(?)`,
            [name.trim()]
        );
    }

    async addUebungToDatabase(name: string) {
        return DatabaseService.run("INSERT INTO exercise (name) VALUES (?)", [name]);
    }

    async connectMuscleGroupAndUebung(muscleGroupId: number, exerciseId: number) {
        return DatabaseService.run(
            `INSERT OR IGNORE INTO exercise_muscle_group (muscle_group_id, exercise_id)
             VALUES (?, ?)`,
            [muscleGroupId, exerciseId]
        );
    }

    async addExerciseToTraining(trainingId: string, exerciseId: number) {
        return DatabaseService.run(
            "INSERT INTO exercise_training (training_id, exercise_id) VALUES (?, ?)",
            [trainingId, exerciseId]
        );
    }

    async addSatzToDatabase(exerciseTrainingId: number, weight: number, repetitions: number) {
        return DatabaseService.run(
            `INSERT INTO exercise_set (exercise_training_id, weight, repetitions)
             VALUES (?, ?, ?)`,
            [exerciseTrainingId, weight, repetitions]
        );
    }

    async getLastWeightForUebung(uebungId: string | number) {
        return DatabaseService.getOne(
            `SELECT
                                           COUNT(es.id) AS satz_anzahl,
                                           MAX(es.weight) AS weight
                                       FROM exercise_set es
                                       WHERE es.exercise_training_id = (
                                           SELECT et.id
                                           FROM exercise_training et
                                                    JOIN exercise_set es2 ON es2.exercise_training_id = et.id
                                                    JOIN exercise e ON et.exercise_id = e.id
                                           WHERE e.id = ?
                                           ORDER BY et.id DESC
                                           LIMIT 1
                                           );`,
            [uebungId]
        );
    }

    async shouldExerciseAndMuscleGroupBeUnlinked(uebungId: number) {
        return DatabaseService.getOne(
            `WITH last_training AS (SELECT id
                                                              FROM training
                                                              WHERE muscle_group_id = (SELECT muscle_group_id
                                                                                       FROM training
                                                                                       WHERE id IN (SELECT training_id
                                                                                                    FROM exercise_training
                                                                                                    WHERE exercise_id = ?))
                                                              ORDER BY datum DESC
                                           LIMIT 1)
                                          , previous_training AS (
                                       SELECT id
                                       FROM training
                                       WHERE muscle_group_id = (SELECT muscle_group_id
                                           FROM training
                                           WHERE id IN
                                           (SELECT training_id
                                           FROM exercise_training
                                           WHERE exercise_id = ?))
                                         AND id
                                           < (SELECT id FROM last_training)
                                       ORDER BY datum DESC
                                           LIMIT 1),
                                           last_5_trainings AS (
                                       SELECT id
                                       FROM training
                                       WHERE muscle_group_id = (SELECT muscle_group_id
                                           FROM training
                                           WHERE id IN
                                           (SELECT training_id
                                           FROM exercise_training
                                           WHERE exercise_id = ?))
                                       ORDER BY datum DESC
                                           LIMIT 5),
                                           exercise_last_training AS (
                                       SELECT 1
                                       FROM exercise_training
                                       WHERE exercise_id = ?
                                         AND training_id = (SELECT id FROM last_training))
                                           , exercise_previous_training AS (
                                       SELECT 1
                                       FROM exercise_training
                                       WHERE exercise_id = ?
                                         AND training_id = (SELECT id FROM previous_training))
                                           , exercise_last_5_trainings AS (
                                       SELECT COUNT (*) as count
                                       FROM exercise_training
                                       WHERE exercise_id = ?
                                         AND training_id IN (SELECT id FROM last_5_trainings))
        SELECT CASE
                   WHEN NOT EXISTS (SELECT 1 FROM last_training) THEN 0
                   WHEN EXISTS (SELECT 1 FROM exercise_last_training) AND
                        NOT EXISTS (SELECT 1 FROM exercise_previous_training) THEN 1
                   WHEN (SELECT count FROM exercise_last_5_trainings) = 0 THEN 1
                   ELSE 0 END AS should_unlink`,
            [uebungId, uebungId, uebungId, uebungId, uebungId, uebungId]
        );
    }

    async shouldWeightBeIncreased(uebungName: string) {
        return DatabaseService.getOne(
            `WITH last_weights AS (SELECT es.weight, es.repetitions, t.id AS training_id
                                                             FROM exercise_set es
                                                                      JOIN exercise_training et ON es.exercise_training_id = et.id
                                                                      JOIN training t ON et.training_id = t.id
                                                             WHERE et.exercise_id = (SELECT id FROM exercise WHERE name = ?)
                                                             ORDER BY t.id DESC
                                           LIMIT 6)
        SELECT CASE
                   WHEN COUNT(*) = 6 AND MIN(weight) = MAX(weight) AND AVG(repetitions) >= 12
                       THEN 1
                   ELSE 0 END AS increaseWeight
        FROM last_weights;`,
            [uebungName]
        );
    }

    async getExercisesForTraining(trainingId: string) {
        return DatabaseService.getAll(
            `SELECT et.id as exercise_training_id,
                                              e.id  as exercise_id,
                                              e.name,
                                              es.id as set_id,
                                              es.weight,
                                              es.repetitions
                                       FROM exercise_training et
                                                JOIN exercise e ON et.exercise_id = e.id
                                                LEFT JOIN exercise_set es ON es.exercise_training_id = et.id
                                       WHERE et.training_id = ?
                                       ORDER BY et.sort_order ASC, et.id ASC, es.id ASC`,
            [trainingId]
        );
    }

    async deleteSatzFromTraining(trainingId: string) {
        return DatabaseService.run(
            `DELETE
                                    FROM exercise_set
                                    WHERE exercise_training_id IN
                                          (SELECT id FROM exercise_training WHERE training_id = ?)`,
            [trainingId]
        );
    }

    async getNoMoreIncrease(id: number) {
        return DatabaseService.getOne("SELECT no_more_increase FROM exercise WHERE id = ?", [id]);
    }

    async setNoMoreIncrease(uebungName: string, noMoreIncrease: boolean) {
        return DatabaseService.run(
            `UPDATE exercise
             SET no_more_increase = ?
             WHERE name = ?`,
            [noMoreIncrease ? 1 : 0, uebungName]
        );
    }

    async getMuscleGroupsWithExercises() {
        const result = await DatabaseService.getAll<RawRow>(`
            SELECT mg.id                                     AS muscle_group_id,
                   mg.name                                   AS muscle_group_name,
                   GROUP_CONCAT(e.id || ':' || e.name, '||') AS exercises
            FROM muscle_group mg
                     LEFT JOIN exercise_muscle_group emg
                               ON mg.id = emg.muscle_group_id
                     LEFT JOIN exercise e
                               ON e.id = emg.exercise_id
            WHERE mg.is_deleted = 0
            GROUP BY mg.id, mg.name
            ORDER BY mg.name;
        `);

        return result.map((row) => ({
            id: row.muscle_group_id,
            name: row.muscle_group_name,
            exercises: row.exercises
                ? row.exercises.split("||").map((ex) => {
                      const [id, name] = ex.split(":");
                      return {
                          id: Number(id),
                          name,
                      };
                  })
                : [],
        }));
    }

    async updateMuscleGroup(id: number, name: string) {
        return DatabaseService.run(
            `UPDATE muscle_group
             SET name = ?
             WHERE id = ?`,
            [name, id]
        );
    }

    async updateExercise(id: number, name: string) {
        return DatabaseService.run(
            `UPDATE exercise
             SET name = ?
             WHERE id = ?`,
            [name, id]
        );
    }

    async updateMuscleGroupConfiguration(
        groupId: number,
        groupName: string,
        exercises: {id: number; name: string}[]
    ): Promise<void> {
        const normalizedGroupName = groupName.trim().replace(/\s+/g, " ");
        if (!normalizedGroupName) throw new Error("Der Gruppenname darf nicht leer sein.");

        await db.withExclusiveTransactionAsync(async (txn) => {
            await txn.runAsync("UPDATE muscle_group SET name = ? WHERE id = ?", [
                normalizedGroupName,
                groupId,
            ]);

            const retainedExerciseIds = exercises.map((exercise) => exercise.id);
            if (retainedExerciseIds.length === 0) {
                await txn.runAsync("DELETE FROM exercise_muscle_group WHERE muscle_group_id = ?", [
                    groupId,
                ]);
            } else {
                const placeholders = retainedExerciseIds.map(() => "?").join(", ");
                await txn.runAsync(
                    `DELETE FROM exercise_muscle_group
                     WHERE muscle_group_id = ?
                       AND exercise_id NOT IN (${placeholders})`,
                    [groupId, ...retainedExerciseIds]
                );
            }

            for (const exercise of exercises) {
                const normalizedName = exercise.name.trim().replace(/\s+/g, " ");
                if (normalizedName.length < 2) {
                    throw new Error("Übungsnamen müssen mindestens zwei Zeichen enthalten.");
                }
                await txn.runAsync("UPDATE exercise SET name = ? WHERE id = ?", [
                    normalizedName,
                    exercise.id,
                ]);
            }
        });
    }

    async deleteMuscleGroup(id: number) {
        return DatabaseService.run(
            `UPDATE muscle_group
             SET is_deleted = 1
             WHERE id = ?`,
            [id]
        );
    }

    async getAllUebungen(): Promise<{id: number; name: string}[]> {
        return await DatabaseService.getAll(`
        SELECT id, name FROM exercise ORDER BY name
    `);
    }
}
