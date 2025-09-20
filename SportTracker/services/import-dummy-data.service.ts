import {data} from "../utils/data";
import {DatabaseService} from "./database.service";

export class ImportDummyDataService {
    async parseAndInsertTraining() {
        const muscleGroupRegex = /^(.+?) \((\d{2}.\d{2}.\d{4})\)$/;
        const exerciseRegex = /^(.+?) \((.*?)\)$/;
        const setRegex = /(\d+) - (\d+)/g;

        const lines = data.split("\n").map(line => line.trim()).filter(line => line.length > 0);
        let muscleGroupId: number | null = null;
        let trainingId: number | null = null;

        try {
            for (const line of lines) {
                let match = muscleGroupRegex.exec(line);
                if (match) {
                    const [, muscleGroup, dateStr] = match;
                    const [day, month, year] = dateStr.split(".");
                    const timestamp = new Date(`${year}-${month}-${day}`).getTime();


                    await DatabaseService.run("INSERT OR IGNORE INTO muscle_group (name) VALUES (?);", [muscleGroup]);

                    const muscleGroupResult: { id: number } | null | undefined = await DatabaseService.getOne(
                        "SELECT id FROM muscle_group WHERE name = ?;",
                        [muscleGroup]
                    );

                    if (!muscleGroupResult) {
                        console.error(`❌ Fehler: Konnte die Muskelgruppen-ID für '${muscleGroup}' nicht abrufen.`);
                        continue;
                    }

                    muscleGroupId = muscleGroupResult.id;

                    const existingTraining: { id: number } | null | undefined = await DatabaseService.getOne(
                        "SELECT id FROM training WHERE datum = ? AND muscle_group_id = ?;",
                        [timestamp, muscleGroupId]
                    );

                    if (existingTraining) {
                        console.log(`⚠️ Training für '${muscleGroup}' am ${dateStr} existiert bereits.`);
                        trainingId = existingTraining.id;
                        continue;
                    }

                    const trainingResult = await DatabaseService.run(
                        "INSERT INTO training (datum, muscle_group_id) VALUES (?, ?);",
                        [timestamp, muscleGroupId]
                    );

                    if (!trainingResult) continue;
                    trainingId = trainingResult.lastInsertRowId;
                    console.log(`✅ Neues Training für '${muscleGroup}' am ${dateStr} gespeichert.`);
                }

                match = exerciseRegex.exec(line);
                if (match) {
                    const [, exerciseName, setsStr] = match;

                    await DatabaseService.run("INSERT OR IGNORE INTO exercise (name) VALUES (?);", [exerciseName]);

                    const exerciseResult: { id: number } | null | undefined = await DatabaseService.getOne(
                        "SELECT id FROM exercise WHERE name = ?;",
                        [exerciseName]
                    );

                    if (!exerciseResult) {
                        console.error(`❌ Fehler: Konnte die Übung-ID für '${exerciseName}' nicht abrufen.`);
                        continue;
                    }

                    const exerciseId = exerciseResult.id;

                    const existingExerciseTraining: { id: number } | null | undefined = await DatabaseService.getOne(
                        "SELECT id FROM exercise_training WHERE training_id = ? AND exercise_id = ?;",
                        [trainingId, exerciseId]
                    );

                    let exerciseTrainingId = existingExerciseTraining ? existingExerciseTraining.id : null;

                    if (!exerciseTrainingId) {
                        const exerciseTrainingResult = await DatabaseService.run(
                            "INSERT INTO exercise_training (training_id, exercise_id) VALUES (?, ?);",
                            [trainingId, exerciseId]
                        );

                        if (!exerciseTrainingResult) continue;
                        exerciseTrainingId = exerciseTrainingResult.lastInsertRowId;
                        console.log(`✅ Übung '${exerciseName}' zu Training '${trainingId}' hinzugefügt.`);


                        for (const [, weight, reps] of setsStr.matchAll(setRegex)) {
                            await DatabaseService.run(
                                "INSERT INTO exercise_set (exercise_training_id, weight, repetitions) VALUES (?, ?, ?);",
                                [exerciseTrainingId, parseFloat(weight), parseInt(reps)]
                            );
                            console.log(`✅ Satz ${weight}kg x ${reps} für '${exerciseName}' hinzugefügt.`);
                        }

                    } else {
                        console.log(`⚠️ Übung '${exerciseName}' ist bereits im Training enthalten.`);
                    }

                }
            }
            console.log("✅ Training erfolgreich importiert!");
        } catch (error) {
            console.error("⚠️ Fehler beim Einfügen des Trainings:", error);
        }
    }
}