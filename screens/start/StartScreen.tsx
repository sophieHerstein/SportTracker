import {useFocusEffect} from "@react-navigation/native";
import {useCallback, useMemo, useState} from "react";
import {ScrollView, StyleSheet, Text, View} from "react-native";
import LoadingSpinner from "../../components/LoadingSpinner";
import {globalStyles} from "../../utils/global-styles";
import {IDashboardStatistics, IStatisticPoint} from "../../models/interfaces";
import {StatisticsService} from "../../services/statistics.service";
import StatisticCard from "../../components/statistics/StatisticCard";
import CompactChart from "../../components/statistics/CompactChart";
import {textColorMuted} from "../../models/constants";

export default function StartScreen() {
    const [isLoading, setLoading] = useState(true);
    const [summary, setSummary] = useState<IDashboardStatistics | null>(null);
    const [frequency, setFrequency] = useState<IStatisticPoint[]>([]);

    const statisticsService = useMemo(() => new StatisticsService(), []);

    useFocusEffect(
        useCallback(() => {
            void loadDashboard();
        }, [])
    );

    async function loadDashboard() {
        setLoading(true);
        try {
            const [dashboardSummary, weeklyFrequency] = await Promise.all([
                statisticsService.getDashboardStatistics(),
                statisticsService.getWeeklyTrainingFrequency(12),
            ]);
            setSummary(dashboardSummary);
            setFrequency(weeklyFrequency);
        } catch (error) {
            console.error("❌ Fehler beim Laden der Startstatistik:", error);
        } finally {
            setLoading(false);
        }
    }

    if (isLoading) return <LoadingSpinner />;

    return (
        <ScrollView style={globalStyles.screenContainer} contentContainerStyle={styles.content}>
            <Text style={globalStyles.title}>Dein Überblick</Text>
            <Text style={styles.caption}>Kompakt und ohne Chart-Lawine.</Text>

            {summary && (
                <View style={styles.grid}>
                    <StatisticCard
                        label="Kraft · 7 Tage"
                        value={summary.strengthLast7Days.toString()}
                        detail="Trainings"
                    />
                    <StatisticCard
                        label="Ausdauer · 7 Tage"
                        value={summary.enduranceLast7Days.toString()}
                        detail="Einheiten"
                    />
                    <StatisticCard
                        label="Gesamt · 30 Tage"
                        value={summary.totalLast30Days.toString()}
                        detail="Einheiten"
                    />
                    <StatisticCard
                        label="Aktive Wochen"
                        value={`${summary.activeWeeksLast8}/8`}
                        detail="letzte 8 Wochen"
                    />
                    <StatisticCard
                        label="Ausdauerzeit"
                        value={`${summary.totalDurationLast30Days}`}
                        detail="Minuten · 30 Tage"
                    />
                </View>
            )}

            <CompactChart title="Trainings pro Woche" data={frequency} type="bar" />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingTop: 28,
        paddingBottom: 30,
        paddingHorizontal: 8,
    },
    caption: {
        color: textColorMuted,
        marginTop: -8,
        marginBottom: 14,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 16,
    },
});
