import {useEffect, useMemo, useRef, useState} from "react";
import {ScrollView, StyleSheet, Text, View} from "react-native";
import {ETimeRange, textColorMuted} from "../../models/constants";
import {IStatisticOption, IStrengthExerciseStatistics} from "../../models/interfaces";
import {StatisticsService} from "../../services/statistics.service";
import {globalStyles} from "../../utils/global-styles";
import TimeFilter from "../../components/TimeFilter";
import StatisticSelector from "../../components/statistics/StatisticSelector";
import StatisticCard from "../../components/statistics/StatisticCard";
import CompactChart from "../../components/statistics/CompactChart";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyList from "../../components/EmptyList";

export default function KraftsportStatistikScreen() {
    const [options, setOptions] = useState<IStatisticOption[]>([]);
    const [exerciseId, setExerciseId] = useState<number | null>(null);
    const [timeRange, setTimeRange] = useState<ETimeRange>(ETimeRange.JAHR);
    const [statistics, setStatistics] = useState<IStrengthExerciseStatistics | null>(null);
    const [isLoading, setLoading] = useState(true);
    const requestIdRef = useRef(0);

    const statisticsService = useMemo(() => new StatisticsService(), []);

    useEffect(() => {
        void loadOptions();
    }, []);

    useEffect(() => {
        if (exerciseId !== null) void loadStatistics();
    }, [exerciseId, timeRange]);

    async function loadOptions() {
        try {
            const exerciseOptions = await statisticsService.getStrengthExerciseOptions();
            setOptions(exerciseOptions);
            if (exerciseOptions.length > 0) setExerciseId(exerciseOptions[0].id);
        } finally {
            setLoading(false);
        }
    }

    async function loadStatistics() {
        if (exerciseId === null) return;
        const requestId = ++requestIdRef.current;
        setLoading(true);
        try {
            const result = await statisticsService.getStrengthExerciseStatistics(
                exerciseId,
                getRangeDays(timeRange)
            );
            if (requestId === requestIdRef.current) setStatistics(result);
        } catch (error) {
            console.error("❌ Kraftstatistik konnte nicht geladen werden:", error);
            if (requestId === requestIdRef.current) setStatistics(null);
        } finally {
            if (requestId === requestIdRef.current) setLoading(false);
        }
    }

    function getRangeDays(range: ETimeRange): number | null {
        switch (range) {
            case ETimeRange.MONAT:
                return 30;
            case ETimeRange.DREI_MONATE:
                return 93;
            case ETimeRange.SECHS_MONATE:
                return 183;
            case ETimeRange.JAHR:
                return 365;
            default:
                return null;
        }
    }

    const e1rmTrend = statistics?.previousEstimatedOneRepMax
        ? ((statistics.currentEstimatedOneRepMax - statistics.previousEstimatedOneRepMax) /
              statistics.previousEstimatedOneRepMax) *
          100
        : null;
    const volumeTrend = statistics?.previousVolume
        ? ((statistics.currentVolume - statistics.previousVolume) / statistics.previousVolume) * 100
        : null;

    return (
        <ScrollView style={globalStyles.screenContainer} contentContainerStyle={styles.content}>
            <Text style={globalStyles.title}>Kraftentwicklung</Text>
            <Text style={styles.caption}>
                Geschätztes 1RM berücksichtigt Gewicht und Wiederholungen.
            </Text>
            <StatisticSelector
                options={options}
                value={exerciseId}
                placeholder="Übung auswählen"
                onChange={setExerciseId}
            />
            <TimeFilter
                timeRange={timeRange}
                onPressGesamt={() => setTimeRange(ETimeRange.GESAMT)}
                onPressJahr={() => setTimeRange(ETimeRange.JAHR)}
                onPress6Monate={() => setTimeRange(ETimeRange.SECHS_MONATE)}
                onPress3Monate={() => setTimeRange(ETimeRange.DREI_MONATE)}
                onPressMonat={() => setTimeRange(ETimeRange.MONAT)}
            />

            {isLoading ? (
                <LoadingSpinner />
            ) : statistics ? (
                <>
                    <View style={styles.grid}>
                        <StatisticCard
                            label="Aktuelles e1RM"
                            value={`${statistics.currentEstimatedOneRepMax} kg`}
                            trend={e1rmTrend}
                        />
                        <StatisticCard
                            label="Persönlicher Rekord"
                            value={`${statistics.personalRecordEstimatedOneRepMax} kg`}
                            detail="All-time · geschätzt"
                        />
                        <StatisticCard
                            label="Volumen"
                            value={`${statistics.currentVolume} kg`}
                            trend={volumeTrend}
                            detail="letzte Einheit"
                        />
                        <StatisticCard
                            label="Einheiten"
                            value={statistics.sessionCount.toString()}
                            detail="im Zeitraum"
                        />
                    </View>
                    <CompactChart
                        title="Geschätztes 1RM"
                        data={statistics.estimatedOneRepMaxPoints}
                        unit="kg"
                    />
                    <CompactChart
                        title="Trainingsvolumen"
                        data={statistics.volumePoints}
                        unit="kg"
                        type="bar"
                    />
                </>
            ) : (
                <EmptyList />
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingTop: 8,
        paddingBottom: 30,
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
        marginVertical: 12,
    },
});
