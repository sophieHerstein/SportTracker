import {ScrollView, Text, View} from "react-native";
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
import {useCallback, useState} from "react";
import {useFocusEffect} from "@react-navigation/native";
import * as SQLite from "expo-sqlite";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
    IBarChartProps,
    INotification,
    ITrainingsProMonatDatabaseResult,
    ITrainingsProWocheDatabaseResult
} from "../../utils/interfaces";
import TrainingsBarChart from "./components/TrainingsBarChart";
import Notifications from "./components/Notifications";
import {ENotifications} from "../../utils/constants";
import {globalStyles} from "../../utils/global-styles";

// TODO:
//         globale Stylings/einheitliches Styling

const database = SQLite.openDatabaseSync('training.db');

export default function StartScreen(){
    const [isLoading, setLoading] = useState<boolean>(true);
    const [kraftsportTrainingProMonatData, setKraftsportTrainingProMonatData] = useState<IBarChartProps[]>([]);
    const [kraftsportTrainingProWocheData, setKraftsportTrainingProWocheData] = useState<IBarChartProps[]>([]);
    const [ausdauerTrainingProMonatData, setAusdauerTrainingProMonatData] = useState<IBarChartProps[]>([]);
    const [ausdauerTrainingProWocheData, setAusdauerTrainingProWocheData] = useState<IBarChartProps[]>([]);
    const [notifications, setNotifications] = useState<INotification[]>([]);

    useFocusEffect(useCallback(() => {
        setupDatabase();
        // dropDatabase();
        fetchData()
        }, []
    ));

    async function fetchData() {
        const resultsKraftsportProMonat: ITrainingsProMonatDatabaseResult[] = await database.getAllAsync(getKraftsportTrainingProMonat);

        const formattedKraftsportProMonat: IBarChartProps[] = resultsKraftsportProMonat.map(row => ({
            label: row.monat,
            value: row.trainingsanzahl
        }));
        setKraftsportTrainingProMonatData(formattedKraftsportProMonat);

        const resultsKraftsportProWoche: ITrainingsProWocheDatabaseResult[] = await database.getAllAsync(getKraftsportTrainingProWoche);
        const formattedKraftsportProWoche: IBarChartProps[] = resultsKraftsportProWoche.map(row => ({
            label: row.woche,
            value: row.trainingsanzahl
        }));

        setKraftsportTrainingProWocheData(formattedKraftsportProWoche);

        const resultsAusdauerProWoche: ITrainingsProWocheDatabaseResult[] = await database.getAllAsync(getAusdauerTrainingProWoche);

        const formattedAusdauerProWoche: IBarChartProps[] = resultsAusdauerProWoche.map(row => ({
            label: row.woche,
            value: row.trainingsanzahl
        }));

        setAusdauerTrainingProWocheData(formattedAusdauerProWoche);

        const resultsAusdauerProMonat: ITrainingsProMonatDatabaseResult[] = await database.getAllAsync(getAusdauerTrainingProMonat);

        const formattedAusdauerProMonat: IBarChartProps[] = resultsAusdauerProMonat.map(row => ({
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
            <TrainingsBarChart titel="Kraftsport pro Woche" data={kraftsportTrainingProWocheData}/>
            <TrainingsBarChart titel="Kraftsport pro Monat" data={kraftsportTrainingProMonatData}/>
            <TrainingsBarChart titel="Ausdauer pro Woche" data={ausdauerTrainingProWocheData}/>
            <TrainingsBarChart titel="Ausdauer pro Monat" data={ausdauerTrainingProMonatData}/>
        </ScrollView>
    );
}