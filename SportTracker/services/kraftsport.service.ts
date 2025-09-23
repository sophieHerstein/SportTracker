import {DatabaseService} from "./database.service";
import {TAGESZEIT} from "../models/constants";

export class KraftsportService {
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
            ORDER BY t.datum DESC`)
    }

    async deleteTrainingWithId(id: string) {
        return DatabaseService.runBatch(
            [
                {
                    query: `DELETE
                            FROM exercise_set
                            WHERE exercise_training_id IN (SELECT id FROM exercise_training WHERE training_id = ${id})`,
                    params: [id]
                },
                {
                    query: `DELETE
                            FROM exercise_training
                            WHERE training_id = ${id}`,
                    params: [id]
                },
                {
                    query: `DELETE
                            FROM training
                            WHERE id = ${id}`,
                    params: [id]
                },
                {
                    query: `DELETE
                            FROM exercise_training
                            WHERE training_id NOT IN (SELECT id FROM training)`
                }
            ]
        )
    }

    async getMuscleGroupData() {
        return DatabaseService.getAll(`SELECT *
                                       FROM muscle_group`)
    }

    async addMuscleGroup(name: string) {
        return DatabaseService.run(`INSERT INTO muscle_group (name)
                                    VALUES ('${name}')`)
    }

    async getEntwicklungGewichtDataForUebung(id: number) {
        return DatabaseService.getAll(`SELECT t.datum, MAX(es.weight) AS max_weight
                                       FROM exercise_set es
                                                JOIN exercise_training et ON es.exercise_training_id = et.id
                                                JOIN training t ON et.training_id = t.id
                                                JOIN exercise e ON et.exercise_id = e.id
                                       WHERE e.id = '${id}'
                                       GROUP BY t.datum
                                       ORDER BY t.datum DESC`)
    }

    async getLastSatzDataForUebung(id: number) {
        return DatabaseService.getAll(`SELECT es.id AS satz_id, es.weight, es.repetitions
                                       FROM exercise_set es
                                                JOIN exercise_training et ON es.exercise_training_id = et.id
                                                JOIN training t ON et.training_id = t.id
                                       WHERE et.exercise_id = '${id}'
                                         AND t.datum = (SELECT MAX(t2.datum)
                                                        FROM exercise_training et2
                                                                 JOIN training t2 ON et2.training_id = t2.id
                                                        WHERE et2.exercise_id = '${id}')`)
    }

    async getLastUebungDataForGruppe(gruppeId: string) {
        return DatabaseService.getAll(`
            SELECT e.id   AS exercise_id,
                   e.name AS exercise_name,
                   es.id  AS set_id,
                   es.weight,
                   es.repetitions
            FROM training t
                     JOIN exercise_training et ON et.training_id = t.id
                     JOIN exercise e ON et.exercise_id = e.id
                     JOIN exercise_set es ON es.exercise_training_id = et.id
            WHERE t.id = (SELECT t2.id
                          FROM training t2
                                   JOIN exercise_training et2 ON et2.training_id = t2.id
                                   JOIN exercise_muscle_group emg ON emg.exercise_id = et2.exercise_id
                          WHERE emg.muscle_group_id = ${gruppeId}
                          ORDER BY t2.datum DESC
                          LIMIT 1)
              AND e.id IN (SELECT exercise_id
                           FROM exercise_muscle_group
                           WHERE muscle_group_id = ${gruppeId})
            ORDER BY e.name ASC, es.id ASC;`);
    }

    async deleteUebungReferenzFromGruppe(uebungId: number, gruppe: string) {
        return DatabaseService.run(`DELETE
                                    FROM exercise_muscle_group
                                    WHERE exercise_id = ${uebungId}
                                      AND muscle_group_id = (SELECT id FROM muscle_group WHERE name = '${gruppe}')`);
    }

    async getMuscleGroupIdForName(name: string) {
        return DatabaseService.getOne(`SELECT id
                                       FROM muscle_group
                                       WHERE name = '${name}'`);
    }

    async addTraining(datum: number, muscleGroupId: number, zeit: TAGESZEIT, draft: boolean) {
        return DatabaseService.run(`INSERT INTO training (datum, muscle_group_id, tageszeit, is_draft)
                                    VALUES (${datum}, ${muscleGroupId}, '${zeit}', ${draft ? 1 : 0})`)
    }

    async getIdForUebung(name: string) {
        return DatabaseService.getOne(`SELECT id
                                       FROM exercise
                                       WHERE name = '${name}'`)
    }

    async addUebungToDatabase(name: string) {
        return DatabaseService.run(`INSERT INTO exercise (name)
                                    VALUES ('${name}')`)
    }

    async connectMuscleGroupAndUebung(muscleGroupId: number, exerciseId: number) {
        return DatabaseService.run(`INSERT OR IGNORE INTO exercise_muscle_group (muscle_group_id, exercise_id)
                                    VALUES (${muscleGroupId}, ${exerciseId})`)
    }

    async addExerciseToTraining(trainingId: string, exerciseId: number) {
        return DatabaseService.run(`INSERT INTO exercise_training (training_id, exercise_id)
                                    VALUES (${trainingId}, ${exerciseId})`)
    }

    async addSatzToDatabase(exerciseTrainingId: number, weight: number, repetitions: number) {
        return DatabaseService.run(`INSERT INTO exercise_set (exercise_training_id, weight, repetitions)
                                    VALUES (${exerciseTrainingId}, ${weight}, ${repetitions})`)
    }

    async getLastWeightForUebung(uebung: string) {
        return DatabaseService.getOne(`SELECT es.weight, COUNT(es.id) AS satz_anzahl
                                       FROM exercise_set es
                                                JOIN exercise_training et ON es.exercise_training_id = et.id
                                                JOIN exercise e ON et.exercise_id = e.id
                                       WHERE e.name = '${uebung}'
                                         AND et.training_id = (SELECT et2.training_id
                                                               FROM exercise_training et2
                                                                        JOIN training t ON et2.training_id = t.id
                                                               WHERE et2.exercise_id = (SELECT id FROM exercise WHERE name = '${uebung}')
                                                               ORDER BY t.id DESC
                                                               LIMIT 1)
                                       GROUP BY es.exercise_training_id
                                       ORDER BY es.id DESC
                                       LIMIT 1`)
    }

    async shouldExerciseAndMuscleGroupBeUnlinked(uebungId: number) {
        return DatabaseService.getOne(`WITH last_training AS (SELECT id
                                                              FROM training
                                                              WHERE muscle_group_id = (SELECT muscle_group_id
                                                                                       FROM training
                                                                                       WHERE id IN (SELECT training_id
                                                                                                    FROM exercise_training
                                                                                                    WHERE exercise_id = ${uebungId}))
                                                              ORDER BY datum DESC
                                                              LIMIT 1),
                                            previous_training AS (SELECT id
                                                                  FROM training
                                                                  WHERE muscle_group_id = (SELECT muscle_group_id
                                                                                           FROM training
                                                                                           WHERE id IN
                                                                                                 (SELECT training_id
                                                                                                  FROM exercise_training
                                                                                                  WHERE exercise_id = ${uebungId}))
                                                                    AND id < (SELECT id FROM last_training)
                                                                  ORDER BY datum DESC
                                                                  LIMIT 1),
                                            last_5_trainings AS (SELECT id
                                                                 FROM training
                                                                 WHERE muscle_group_id = (SELECT muscle_group_id
                                                                                          FROM training
                                                                                          WHERE id IN
                                                                                                (SELECT training_id
                                                                                                 FROM exercise_training
                                                                                                 WHERE exercise_id = ${uebungId}))
                                                                 ORDER BY datum DESC
                                                                 LIMIT 5),
                                            exercise_last_training AS (SELECT 1
                                                                       FROM exercise_training
                                                                       WHERE exercise_id = ${uebungId}
                                                                         AND training_id = (SELECT id FROM last_training)),
                                            exercise_previous_training AS (SELECT 1
                                                                           FROM exercise_training
                                                                           WHERE exercise_id = ${uebungId}
                                                                             AND training_id = (SELECT id FROM previous_training)),
                                            exercise_last_5_trainings AS (SELECT COUNT(*) as count
                                                                          FROM exercise_training
                                                                          WHERE exercise_id = ${uebungId}
                                                                            AND training_id IN (SELECT id FROM last_5_trainings))
                                       SELECT CASE
                                                  WHEN NOT EXISTS (SELECT 1 FROM last_training) THEN 0
                                                  WHEN EXISTS (SELECT 1 FROM exercise_last_training) AND
                                                       NOT EXISTS (SELECT 1 FROM exercise_previous_training) THEN 1
                                                  WHEN (SELECT count FROM exercise_last_5_trainings) = 0 THEN 1
                                                  ELSE 0 END AS should_unlink`)
    }

    async shouldWeightBeIncreased(uebungName: string) {
        return DatabaseService.getOne(`WITH last_weights AS (SELECT es.weight, es.repetitions, t.id AS training_id
                                                             FROM exercise_set es
                                                                      JOIN exercise_training et ON es.exercise_training_id = et.id
                                                                      JOIN training t ON et.training_id = t.id
                                                             WHERE et.exercise_id = (SELECT id FROM exercise WHERE name = '${uebungName}')
                                                             ORDER BY t.id DESC
                                                             LIMIT 6)
                                       SELECT CASE
                                                  WHEN COUNT(*) = 6 AND MIN(weight) = MAX(weight) AND AVG(repetitions) >= 12
                                                      THEN 1
                                                  ELSE 0 END AS increaseWeight
                                       FROM last_weights;`)
    }

    async getExercisesForTraining(trainingId: string) {
        return DatabaseService.getAll(`SELECT et.id as exercise_training_id,
                                              e.id  as exercise_id,
                                              e.name,
                                              es.id as set_id,
                                              es.weight,
                                              es.repetitions
                                       FROM exercise_training et
                                                JOIN exercise e ON et.exercise_id = e.id
                                                LEFT JOIN exercise_set es ON es.exercise_training_id = et.id
                                       WHERE et.training_id = ${trainingId}
                                       ORDER BY e.name ASC, es.id ASC`);
    }

    async deleteSatzFromTraining(trainingId: string) {
        return DatabaseService.run(`DELETE
                                    FROM exercise_set
                                    WHERE exercise_training_id IN
                                          (SELECT id FROM exercise_training WHERE training_id = '${trainingId}')`);
    }

    async deleteTraining(trainingId: string) {
        return DatabaseService.run(`DELETE
                                    FROM exercise_training
                                    WHERE training_id = '${trainingId}'`)
    }

    async getNoMoreIncrease(id: number) {
        return DatabaseService.getOne(`SELECT no_more_increase
                                       FROM exercise
                                       WHERE id = ${id}`)
    }

    async setNoMoreIncrease(uebungName: string, noMoreIncrease: boolean) {
        return DatabaseService.run(`UPDATE exercise
                                    SET no_more_increase = ${noMoreIncrease ? 1 : 0}
                                    WHERE name = '${uebungName}'`)
    }
}