import {useFocusEffect} from "@react-navigation/native";
import {useCallback, useEffect, useMemo, useState} from "react";
import {ScrollView, Text, View} from "react-native";
import LoadingSpinner from "../../components/LoadingSpinner";
import {ETimeRange} from "../../models/constants";
import {globalStyles} from "../../utils/global-styles";
import {
    IBarChartProps,
    INotification,
    ITrainingsProMonatDatabaseResult,
    ITrainingsProWocheDatabaseResult
} from "../../models/interfaces";
import Notifications from "./components/Notifications";
import TrainingsBarChart from "./components/TrainingsBarChart";
import TimeFilter from "../../components/TimeFilter";
import {DatabaseSchemaService} from "../../services/database-schema.service";
import {StatisticsService} from "../../services/statistics.service";
import {NotificationsService} from "../../services/notifications.service";
import {ImportDummyDataService} from "../../services/import-dummy-data.service";

export default function StartScreen() {
    const [isLoading, setLoading] = useState<boolean>(true);
    const [kraftsportTrainingProMonatData, setKraftsportTrainingProMonatData] = useState<IBarChartProps[]>([]);
    const [kraftsportTrainingProWocheData, setKraftsportTrainingProWocheData] = useState<IBarChartProps[]>([]);
    const [ausdauerTrainingProMonatData, setAusdauerTrainingProMonatData] = useState<IBarChartProps[]>([]);
    const [ausdauerTrainingProWocheData, setAusdauerTrainingProWocheData] = useState<IBarChartProps[]>([]);
    const [notifications, setNotifications] = useState<INotification[]>([]);
    const [timeRange, setTimeRange] = useState<ETimeRange>(ETimeRange.GESAMT);

    const schemaService = useMemo(() => new DatabaseSchemaService(), []);
    const statisticsService = useMemo(() => new StatisticsService(), []);
    const notificationsService = useMemo(() => new NotificationsService(), []);
    const importDummyDataService = useMemo(() => new ImportDummyDataService(), []);

    useFocusEffect(useCallback(() => {
            setupDatabase();
            // dropDatabase();
        }, []
    ));

    // useEffect(() => {
    //     importDummyDataService.parseAndInsertTraining();
    // }, [])

    useEffect(() => {
        fetchData();
    }, [timeRange])


    async function fetchData() {
        const resultsKraftsportProMonat: ITrainingsProMonatDatabaseResult[] = await statisticsService.fetchTrainingsStatistikByTypeAndRange("kraft", "monat");
        const formattedKraftsportProMonat = resultsKraftsportProMonat
            .filter(row => shouldIncludeEntry(row.monat, "month"))
            .map(row => ({
                label: row.monat,
                value: row.trainingsanzahl
            }));
        setKraftsportTrainingProMonatData(formattedKraftsportProMonat);

        const resultsKraftsportProWoche: ITrainingsProWocheDatabaseResult[] = await statisticsService.fetchTrainingsStatistikByTypeAndRange("kraft", "woche");
        const formattedKraftsportProWoche = resultsKraftsportProWoche
            .filter(row => shouldIncludeEntry(row.woche, "week"))
            .map(row => ({
                label: row.woche,
                value: row.trainingsanzahl
            }));
        setKraftsportTrainingProWocheData(formattedKraftsportProWoche);

        const resultsAusdauerProWoche: ITrainingsProWocheDatabaseResult[] = await statisticsService.fetchTrainingsStatistikByTypeAndRange("ausdauer", "woche");
        const formattedAusdauerProWoche = resultsAusdauerProWoche
            .filter(row => shouldIncludeEntry(row.woche, "week"))
            .map(row => ({
                label: row.woche,
                value: row.trainingsanzahl
            }));
        setAusdauerTrainingProWocheData(formattedAusdauerProWoche);

        const resultsAusdauerProMonat: ITrainingsProMonatDatabaseResult[] = await statisticsService.fetchTrainingsStatistikByTypeAndRange("ausdauer", "monat");
        const formattedAusdauerProMonat = resultsAusdauerProMonat
            .filter(row => shouldIncludeEntry(row.monat, "month"))
            .map(row => ({
                label: row.monat,
                value: row.trainingsanzahl
            }));
        setAusdauerTrainingProMonatData(formattedAusdauerProMonat);

        const newNotifications = await notificationsService.generateNotifications()

        setNotifications(newNotifications);
    }

    function shouldIncludeEntry(dateStr: string, type: "month" | "week") {
        const today = new Date();

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
                twelveMonthsAgo.setFullYear(today.getFullYear() - 1);
                if (type === "month") {
                    return new Date(entryYear, entryValue - 1) >= twelveMonthsAgo;
                } else {
                    return getWeekDate(entryYear, entryValue) >= twelveMonthsAgo;
                }


            case ETimeRange.SECHS_MONATE:
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(today.getMonth() - 6);
                if (type === "month") {
                    return new Date(entryYear, entryValue - 1) >= sixMonthsAgo;
                } else {
                    return getWeekDate(entryYear, entryValue) >= sixMonthsAgo;
                }

            case ETimeRange.DREI_MONATE:
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(today.getMonth() - 3);
                if (type === "month") {
                    return new Date(entryYear, entryValue - 1) >= threeMonthsAgo;
                } else {
                    return getWeekDate(entryYear, entryValue) >= threeMonthsAgo;
                }

            case ETimeRange.MONAT:
                const oneMonthsAgo = new Date();
                oneMonthsAgo.setMonth(today.getMonth() - 1);
                if (type === "month") {
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

    async function setupDatabase() {
        setLoading(true);
        try {
            await schemaService.setUpTables();
            await schemaService.addNewColumns([
                {
                    table: 'training',
                    column: 'is_draft',
                    sql: 'ALTER TABLE training ADD COLUMN is_draft INTEGER DEFAULT 0'
                },
                {
                    table: 'training',
                    column: 'tageszeit',
                    sql: 'ALTER TABLE training ADD COLUMN tageszeit TEXT'
                },
                {
                    table: 'exercise',
                    column: 'no_more_increase',
                    sql: 'ALTER TABLE exercise ADD COLUMN no_more_increase INTEGER DEFAULT 0'
                },
                {
                    table: 'ausdauertrainingseinheit',
                    column: 'tageszeit',
                    sql: 'ALTER TABLE ausdauertrainingseinheit ADD COLUMN tageszeit TEXT'
                }
            ])
            await fetchData();
            console.log("✅ Datenbank eingerichtet");
        } catch (error) {
            console.error("❌ Fehler beim Einrichten der Datenbank:", error);
        }
        setLoading(false);
    }

    async function dropDatabase() {
        try {
            await schemaService.dropTables();

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
            {/*<View>*/}
            {/*    {notifications.length > 0 && notifications.map((notification, index) => (*/}
            {/*        <Notifications key={index} notification={notification}/>*/}
            {/*    ))*/}
            {/*    }*/}
            {/*</View>*/}
            <Text style={globalStyles.title}>Trainingsfrequenzen</Text>
            <TimeFilter
                timeRange={timeRange}
                onPressGesamt={() => setTimeRange(ETimeRange.GESAMT)}
                onPressJahr={() => setTimeRange(ETimeRange.JAHR)}
                onPress6Monate={() => setTimeRange(ETimeRange.SECHS_MONATE)}
                onPress3Monate={() => setTimeRange(ETimeRange.DREI_MONATE)}
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