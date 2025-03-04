import {useFocusEffect} from "@react-navigation/native";
import * as SQLite from "expo-sqlite";
import {useCallback, useEffect, useState} from "react";
import {ScrollView, Text, View} from "react-native";
import LoadingSpinner from "../../components/LoadingSpinner";
import {ENotifications, ETimeRange} from "../../utils/constants";
import {
    createAusdauertrainingseinheitTable,
    createExerciseMuscleGroupTable,
    createExerciseSetTable,
    createExerciseTable,
    createExerciseTrainingTable,
    createMuscleGroupTable,
    createTrainingsTypTable,
    createTrainingTable,
    dropAusdauertrainingseinheitTable,
    dropExerciseMuscleGroupTable,
    dropExerciseSetTable,
    dropExerciseTable,
    dropExerciseTrainingTable,
    dropMuscleGroupTable,
    dropTrainingstypTable,
    dropTrainingTable,
    getAusdauerTrainingProMonat,
    getAusdauerTrainingProWoche,
    getKraftsportTrainingProMonat,
    getKraftsportTrainingProWoche,
    keinAusdauerSeit14Tagen,
    muskelgruppeSollteTrainiertWerden
} from "../../utils/database-querys";
import {globalStyles} from "../../utils/global-styles";
import {
    IBarChartProps,
    INotification,
    ITrainingsProMonatDatabaseResult,
    ITrainingsProWocheDatabaseResult
} from "../../utils/interfaces";
import Notifications from "./components/Notifications";
import TrainingsBarChart from "./components/TrainingsBarChart";
import Filter from "../../components/Filter";
import {data} from "../../utils/data";

const database = SQLite.openDatabaseSync('training.db');

export default function StartScreen() {
    const [isLoading, setLoading] = useState<boolean>(true);
    const [kraftsportTrainingProMonatData, setKraftsportTrainingProMonatData] = useState<IBarChartProps[]>([]);
    const [kraftsportTrainingProWocheData, setKraftsportTrainingProWocheData] = useState<IBarChartProps[]>([]);
    const [ausdauerTrainingProMonatData, setAusdauerTrainingProMonatData] = useState<IBarChartProps[]>([]);
    const [ausdauerTrainingProWocheData, setAusdauerTrainingProWocheData] = useState<IBarChartProps[]>([]);
    const [notifications, setNotifications] = useState<INotification[]>([]);
    const [timeRange, setTimeRange] = useState<ETimeRange>(ETimeRange.GESAMT);

    useFocusEffect(useCallback(() => {
            setupDatabase();
            // dropDatabase();
        }, []
    ));

    // useEffect(() => {
    //     parseAndInsertTraining(data);
    // }, [])

    useEffect(() => {
        fetchData();
    }, [timeRange])


    async function fetchData() {
        const resultsKraftsportProMonat: ITrainingsProMonatDatabaseResult[] = await database.getAllAsync(getKraftsportTrainingProMonat);
        const formattedKraftsportProMonat = resultsKraftsportProMonat
            .filter(row => shouldIncludeEntry(row.monat, "month"))
            .map(row => ({
                label: row.monat,
                value: row.trainingsanzahl
            }));
        setKraftsportTrainingProMonatData(formattedKraftsportProMonat);

        const resultsKraftsportProWoche: ITrainingsProWocheDatabaseResult[] = await database.getAllAsync(getKraftsportTrainingProWoche);
        const formattedKraftsportProWoche = resultsKraftsportProWoche
            .filter(row => shouldIncludeEntry(row.woche, "week"))
            .map(row => ({
                label: row.woche,
                value: row.trainingsanzahl
            }));
        setKraftsportTrainingProWocheData(formattedKraftsportProWoche);

        const resultsAusdauerProWoche: ITrainingsProWocheDatabaseResult[] = await database.getAllAsync(getAusdauerTrainingProWoche);
        const formattedAusdauerProWoche = resultsAusdauerProWoche
            .filter(row => shouldIncludeEntry(row.woche, "week"))
            .map(row => ({
                label: row.woche,
                value: row.trainingsanzahl
            }));
        setAusdauerTrainingProWocheData(formattedAusdauerProWoche);

        const resultsAusdauerProMonat: ITrainingsProMonatDatabaseResult[] = await database.getAllAsync(getAusdauerTrainingProMonat);
        const formattedAusdauerProMonat = resultsAusdauerProMonat
            .filter(row => shouldIncludeEntry(row.monat, "month"))
            .map(row => ({
                label: row.monat,
                value: row.trainingsanzahl
            }));
        setAusdauerTrainingProMonatData(formattedAusdauerProMonat);

        const zeitFuerAusdauer: {
            zeit_fuer_ausdauer: number
        } | null = await database.getFirstAsync(keinAusdauerSeit14Tagen);
        if (!!zeitFuerAusdauer && zeitFuerAusdauer.zeit_fuer_ausdauer === 1) {
            const newNotifications: INotification[] = [...notifications];
            newNotifications.push({typ: ENotifications.ZEIT_FUER_AUSDAUER});
            setNotifications(newNotifications);
        }

        const muskelGruppeTrainieren: {last_training: number, name: string}[] = await database.getAllAsync(muskelgruppeSollteTrainiertWerden);
        console.log(muskelGruppeTrainieren);
        if (!!muskelGruppeTrainieren && muskelGruppeTrainieren.length > 0) {
            const newNotifications: INotification[] = [...notifications];
            muskelGruppeTrainieren.forEach((t) => {
                if (notifications.filter((n) => n.additionalData === t.name).length === 0) {
                    newNotifications.push({typ: ENotifications.MUSKELGRUPPE_TRAINIEREN, additionalData: t.name})
                }
            })
            setNotifications(newNotifications);
        }
    }

    function shouldIncludeEntry(dateStr: string, type: "month" | "week") {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1; // Monate: 1-12

        let entryYear, entryValue;

        if (type === "month") {
            const [year, month] = dateStr.split("-").map(Number);
            entryYear = year;
            entryValue = month;
        } else {
            const [year, week] = dateStr.split("-").map(Number);
            entryYear = year;
            entryValue = week;
        }

        switch (timeRange) {
            case ETimeRange.GESAMT:
                return true;

            case ETimeRange.JAHR:
                const twelveMonthsAgo = new Date();
                twelveMonthsAgo.setMonth(today.getMonth());
                twelveMonthsAgo.setFullYear(today.getFullYear()-1);
                if(type === "month") {
                    return new Date(entryYear, entryValue-1) >= twelveMonthsAgo;
                } else {
                    return getWeekDate(entryYear, entryValue) >= twelveMonthsAgo;
                }


            case ETimeRange.SECHS_MONATE:
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(today.getMonth() - 6);
                if(type === "month") {
                    return new Date(entryYear, entryValue - 1) >= sixMonthsAgo;
                } else {
                    return getWeekDate(entryYear, entryValue) >= sixMonthsAgo;

                }


            case ETimeRange.MONAT:
                const oneMonthsAgo = new Date();
                oneMonthsAgo.setMonth(today.getMonth()-1);
                if(type === "month") {
                    return new Date(entryYear, entryValue - 2) >= oneMonthsAgo;
                } else {
                    return getWeekDate(entryYear, entryValue) >= oneMonthsAgo;
                }


            default:
                return true;
        }
    }

    function getWeekDate(year: number, week: number): Date {
        const firstThursday = new Date(year, 0, 4); // 4. Januar liegt immer in der ersten KW
        const startOfWeek = new Date(firstThursday.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
        startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7)); // Montag der Woche
        return startOfWeek;
    }

    async function checkTrainingExists(timestamp: number, muscleGroupId: number): Promise<boolean> {
        const result = await database.getFirstAsync(
            "SELECT id FROM training WHERE datum = ? AND muscle_group_id = ?;",
            [timestamp, muscleGroupId]
        );
        return result !== null;
    }

    async function checkExerciseInTraining(trainingId: number, exerciseId: number): Promise<boolean> {
        const result = await database.getFirstAsync(
            "SELECT id FROM exercise_training WHERE training_id = ? AND exercise_id = ?;",
            [trainingId, exerciseId]
        );
        return result !== null;
    }

    async function parseAndInsertTraining(text: string) {
        const muscleGroupRegex = /^(.+?) \((\d{2}.\d{2}.\d{4})\)$/;
        const exerciseRegex = /^(.+?) \((.*?)\)$/;
        const setRegex = /(\d+) - (\d+)/g;

        const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
        let muscleGroupId: number | null = null;
        let trainingId: number | null = null;

        try {
            for (const line of lines) {
                let match = muscleGroupRegex.exec(line);
                if (match) {
                    const [, muscleGroup, dateStr] = match;
                    const [day, month, year] = dateStr.split(".");
                    const timestamp = new Date(`${year}-${month}-${day}`).getTime();


                    await database.runAsync("INSERT OR IGNORE INTO muscle_group (name) VALUES (?);", [muscleGroup]);

                    const muscleGroupResult: { id: number } | null = await database.getFirstAsync(
                        "SELECT id FROM muscle_group WHERE name = ?;",
                        [muscleGroup]
                    );

                    if (!muscleGroupResult) {
                        console.error(`❌ Fehler: Konnte die Muskelgruppen-ID für '${muscleGroup}' nicht abrufen.`);
                        continue;
                    }

                    muscleGroupId = muscleGroupResult.id;

                    const existingTraining: { id: number } | null = await database.getFirstAsync(
                        "SELECT id FROM training WHERE datum = ? AND muscle_group_id = ?;",
                        [timestamp, muscleGroupId]
                    );

                    if (existingTraining) {
                        console.log(`⚠️ Training für '${muscleGroup}' am ${dateStr} existiert bereits.`);
                        trainingId = existingTraining.id;
                        continue;
                    }

                    const trainingResult = await database.runAsync(
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

                    await database.runAsync("INSERT OR IGNORE INTO exercise (name) VALUES (?);", [exerciseName]);

                    const exerciseResult: { id: number } | null = await database.getFirstAsync(
                        "SELECT id FROM exercise WHERE name = ?;",
                        [exerciseName]
                    );

                    if (!exerciseResult) {
                        console.error(`❌ Fehler: Konnte die Übung-ID für '${exerciseName}' nicht abrufen.`);
                        continue;
                    }

                    const exerciseId = exerciseResult.id;

                    const existingExerciseTraining: { id: number } | null = await database.getFirstAsync(
                        "SELECT id FROM exercise_training WHERE training_id = ? AND exercise_id = ?;",
                        [trainingId, exerciseId]
                    );

                    let exerciseTrainingId = existingExerciseTraining ? existingExerciseTraining.id : null;

                    if (!exerciseTrainingId) {
                        const exerciseTrainingResult = await database.runAsync(
                            "INSERT INTO exercise_training (training_id, exercise_id) VALUES (?, ?);",
                            [trainingId, exerciseId]
                        );

                        if (!exerciseTrainingResult) continue;
                        exerciseTrainingId = exerciseTrainingResult.lastInsertRowId;
                        console.log(`✅ Übung '${exerciseName}' zu Training '${trainingId}' hinzugefügt.`);


                        for (const [, weight, reps] of setsStr.matchAll(setRegex)) {
                            await database.runAsync(
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

            await fetchData();
            console.log("✅ Datenbank eingerichtet");
        } catch (error) {
            console.error("❌ Fehler beim Einrichten der Datenbank:", error);
        }
        setLoading(false);
    }

    async function dropDatabase() {
        try {
            await database.runAsync(dropExerciseSetTable);
            await database.runAsync(dropTrainingTable);
            await database.runAsync(dropExerciseTrainingTable);
            await database.runAsync(dropExerciseMuscleGroupTable);
            await database.runAsync(dropExerciseTable);
            await database.runAsync(dropMuscleGroupTable);
            await database.runAsync(dropTrainingstypTable);
            await database.runAsync(dropAusdauertrainingseinheitTable);

            console.log("✅ Datenbank resettet");
        } catch (error) {
            console.error("❌ Fehler beim Einrichten der Datenbank:", error);
        }
    }

    if (isLoading) {
        return <LoadingSpinner/>
    }

    return (
        <ScrollView style={globalStyles.screenContainer}>
            <View>
                {notifications.length > 0 && notifications.map((notification, index) => (
                    <Notifications key={index} notification={notification}/>
                ))
                }
            </View>
            <Text style={globalStyles.title}>Trainingsfrequenzen</Text>
            <Filter
                timeRange={timeRange}
                onPressGesamt={() => setTimeRange(ETimeRange.GESAMT)}
                onPressJahr={() => setTimeRange(ETimeRange.JAHR)}
                onPress6Monate={() => setTimeRange(ETimeRange.SECHS_MONATE)}
                onPressMonat={() => setTimeRange(ETimeRange.MONAT)}/>
            {kraftsportTrainingProWocheData.length > 0 &&
                <TrainingsBarChart titel="Kraftsport pro Woche" data={kraftsportTrainingProWocheData}/>
            }
            {kraftsportTrainingProMonatData.length > 0 &&
                <TrainingsBarChart titel="Kraftsport pro Monat" data={kraftsportTrainingProMonatData}/>
            }
            {ausdauerTrainingProWocheData.length > 0 &&
                <TrainingsBarChart titel="Ausdauer pro Woche" data={ausdauerTrainingProWocheData}/>
            }
            {ausdauerTrainingProMonatData.length > 0 &&
                <TrainingsBarChart titel="Ausdauer pro Monat" data={ausdauerTrainingProMonatData}/>
            }
        </ScrollView>
    );
}