import type {IUebung} from "../models/interfaces";

export interface IPreparedSet {
    weight: number;
    repetitions: number;
}

export interface IPreparedExercise {
    clientId: number;
    exerciseId?: number;
    canRenameDuringAutosave: boolean;
    name: string;
    sets: IPreparedSet[];
}

export function parseTrainingNumber(value: number | string | null): number | null {
    if (value === null || value === "") return null;
    const parsed = typeof value === "number" ? value : Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
}

export function prepareExercisesForSave(
    exercises: IUebung[],
    strict: boolean
): IPreparedExercise[] {
    const prepared: IPreparedExercise[] = [];
    const usedNames = new Set<string>();

    exercises.forEach((exercise, exerciseIndex) => {
        const name = exercise.name.trim().replace(/\s+/g, " ");
        const normalizedName = name.toLocaleLowerCase("de-DE");

        if (exercise.nameConfirmed === false) {
            if (strict) {
                throw new Error(`Bitte den Namen von Übung ${exerciseIndex + 1} bestätigen.`);
            }
            return;
        }

        if (name.length < 2) {
            if (strict) {
                throw new Error(`Übung ${exerciseIndex + 1} hat keinen gültigen Namen.`);
            }
            return;
        }

        if (usedNames.has(normalizedName)) {
            if (strict) {
                throw new Error(`Die Übung „${name}“ ist mehrfach im Training vorhanden.`);
            }
            return;
        }

        const sets: IPreparedSet[] = [];
        for (let setIndex = 0; setIndex < exercise.saetze.length; setIndex++) {
            const set = exercise.saetze[setIndex];
            const weight = parseTrainingNumber(set.gewicht);
            const repetitions = parseTrainingNumber(set.wiederholungen);

            if (strict) {
                const isValid =
                    weight !== null &&
                    weight >= 0 &&
                    repetitions !== null &&
                    repetitions > 0 &&
                    Number.isInteger(repetitions);

                if (!isValid) {
                    throw new Error(
                        `Bitte Satz ${setIndex + 1} bei „${name}“ vollständig und gültig ausfüllen.`
                    );
                }

                sets.push({weight, repetitions});
                continue;
            }

            if (weight === null || weight < 0) continue;

            const autosaveRepetitions =
                repetitions !== null && repetitions >= 0 && Number.isInteger(repetitions)
                    ? repetitions
                    : 0;
            sets.push({weight, repetitions: autosaveRepetitions});
        }

        if (sets.length === 0) {
            if (strict) {
                throw new Error(`Die Übung „${name}“ enthält keinen Satz.`);
            }
            return;
        }

        usedNames.add(normalizedName);
        prepared.push({
            clientId: exercise.id,
            exerciseId: exercise.exerciseId,
            canRenameDuringAutosave: exercise.canRenameDuringAutosave === true,
            name,
            sets,
        });
    });

    if (strict && prepared.length === 0) {
        throw new Error("Das Training enthält keine vollständig ausgefüllte Übung.");
    }

    return prepared;
}
