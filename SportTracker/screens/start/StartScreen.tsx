import { useFocusEffect } from "@react-navigation/native";
import * as SQLite from "expo-sqlite";
import {useCallback, useEffect, useState} from "react";
import {Button, ScrollView, Text, View} from "react-native";
import LoadingSpinner from "../../components/LoadingSpinner";
import {ENotifications, ETimeRange, hightlight, primary} from "../../utils/constants";
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
import { globalStyles } from "../../utils/global-styles";
import {
    IBarChartProps,
    INotification,
    ITrainingsProMonatDatabaseResult,
    ITrainingsProWocheDatabaseResult
} from "../../utils/interfaces";
import Notifications from "./components/Notifications";
import TrainingsBarChart from "./components/TrainingsBarChart";
import Filter from "../../components/Filter";

const database = SQLite.openDatabaseSync('training.db');

export default function StartScreen(){
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

        const resultsAusdauerProMonat: ITrainingsProMonatDatabaseResult[]  = await database.getAllAsync(getAusdauerTrainingProMonat);
        const formattedAusdauerProMonat = resultsAusdauerProMonat
            .filter(row => shouldIncludeEntry(row.monat, "month"))
            .map(row => ({
                label: row.monat,
                value: row.trainingsanzahl
            }));
        setAusdauerTrainingProMonatData(formattedAusdauerProMonat);

        const zeitFuerAusdauer: {zeit_fuer_ausdauer: number}|null = await database.getFirstAsync(keinAusdauerSeit14Tagen);
        if(!!zeitFuerAusdauer && zeitFuerAusdauer.zeit_fuer_ausdauer === 1){
            const newNotifications: INotification[] = [...notifications];
            newNotifications.push({typ: ENotifications.ZEIT_FUER_AUSDAUER});
            setNotifications(newNotifications);
        }

        const muskelGruppeTrainieren: {name: string}[] = await database.getAllAsync(muskelgruppeSollteTrainiertWerden);
        if(!!muskelGruppeTrainieren && muskelGruppeTrainieren.length > 0) {
            const newNotifications: INotification[] = [...notifications];
            muskelGruppeTrainieren.forEach((t) => {
                if(notifications.filter((n)=> n.additionalData === t.name).length === 0){
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
            const [month, year] = dateStr.split("-").map(Number);
            entryYear = year;
            entryValue = month;
        } else {
            const [week, year] = dateStr.split("-").map(Number);
            entryYear = year;
            entryValue = week;
        }

        switch (timeRange) {
            case ETimeRange.GESAMT:
                return true;

            case ETimeRange.JAHR:
                const twelveMonthsAgo = new Date();
                twelveMonthsAgo.setMonth(today.getMonth() - 11);
                return new Date(entryYear, entryValue - 1) >= twelveMonthsAgo;

            case ETimeRange.SECHS_MONATE:
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(today.getMonth() - 5);
                return new Date(entryYear, entryValue - 1) >= sixMonthsAgo;

            case ETimeRange.MONAT:
                const oneMonthsAgo = new Date();
                oneMonthsAgo.setMonth(today.getMonth());
                return new Date(entryYear, entryValue - 1) >= oneMonthsAgo;

            default:
                return true;
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
                onPressGesamt={()=> setTimeRange(ETimeRange.GESAMT)}
                onPressJahr={()=> setTimeRange(ETimeRange.JAHR)}
                onPress6Monate={()=> setTimeRange(ETimeRange.SECHS_MONATE)}
                onPressMonat={()=> setTimeRange(ETimeRange.MONAT)}/>
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