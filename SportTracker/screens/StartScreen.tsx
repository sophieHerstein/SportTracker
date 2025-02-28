import {Text} from "react-native";
import {
    createAusdauertrainingseinheitTable,
    createExerciseMuscleGroupTable,
    createExerciseSetTable,
    createExerciseTable,
    createExerciseTrainingTable,
    createMuscleGroupTable,
    createTrainingsTypTable,
    createTrainingTable, dropAusdauertrainingseinheitTable,
    dropExerciseMuscleGroupTable,
    dropExerciseSetTable, dropExerciseTable,
    dropExerciseTrainingTable,
    dropMuscleGroupTable, dropTrainingstypTable,
    dropTrainingTable
} from "../utils/database-querys";
import {useCallback, useState} from "react";
import {useFocusEffect} from "@react-navigation/native";
import * as SQLite from "expo-sqlite";
import LoadingSpinner from "../components/LoadingSpinner";

// TODO:   Charts/Trends für Kraftsport - s. ChatGPT
//         Notifications auf den jeweiligen Startscreens im Sinne von wird mal wieder Zeit da und dafür
//         oder vielleicht auch auf den HomeScreen mit noch weiteren Infos, Notifications etc? - erstmal sammeln -> Aussehen später s. letzter punkt
//         globale Stylings/einheitliches Styling


const database = SQLite.openDatabaseSync('training.db');

export default function StartScreen(){
    const [isLoading, setLoading] = useState<boolean>(true);

    useFocusEffect(useCallback(() => {
            setupDatabase();
            // dropDatabase();
        }, []
    ));

    async function setupDatabase() {
        setLoading(true);
        try {
            await database.runAsync(createMuscleGroupTable);
            await database.runAsync(createExerciseTable);
            await database.runAsync(createExerciseMuscleGroupTable);
            await database.runAsync(createTrainingTable);
            await database.runAsync(createExerciseTrainingTable);
            await database.runAsync(createExerciseSetTable);
            await database.runAsync(createTrainingsTypTable);
            await database.runAsync(createAusdauertrainingseinheitTable);

        } catch (error) {
            console.error("❌ Fehler beim Einrichten der Datenbank:", error);
        }
        setLoading(false);
    }

    async function dropDatabase(){
        try {
            await database.runAsync(dropExerciseSetTable);
            await database.runAsync(dropTrainingTable);
            await database.runAsync(dropExerciseTrainingTable);
            await database.runAsync(dropExerciseMuscleGroupTable);
            await database.runAsync(dropExerciseTable);
            await database.runAsync(dropMuscleGroupTable);
            await database.runAsync(dropTrainingstypTable);
            await database.runAsync(dropAusdauertrainingseinheitTable);

        } catch (error) {
            console.error("Fehler beim Einrichten der Datenbank:", error);
        }
    }

    if (isLoading) {
        <LoadingSpinner/>
    }

    return (<Text>HOME</Text>)
}