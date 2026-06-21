import {useEffect, useMemo, useRef, useState} from "react";
import {ScrollView, StyleSheet, Text, View} from "react-native";
import {ETimeRange, textColorMuted} from "../../models/constants";
import {IEnduranceStatistics, IStatisticOption, IStatisticPoint} from "../../models/interfaces";
import {StatisticsService} from "../../services/statistics.service";
import {globalStyles} from "../../utils/global-styles";
import TimeFilter from "../../components/TimeFilter";
import TypeFilter from "../../components/TypeFilter";
import StatisticSelector from "../../components/statistics/StatisticSelector";
import StatisticCard from "../../components/statistics/StatisticCard";
import CompactChart from "../../components/statistics/CompactChart";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyList from "../../components/EmptyList";

type Metric = "duration" | "distance" | "pace";

export default function AusdauerStatistikScreen() {
    const [options, setOptions] = useState<IStatisticOption[]>([]);
    const [typeId, setTypeId] = useState<number | null>(null);
    const [timeRange, setTimeRange] = useState<ETimeRange>(ETimeRange.JAHR);
    const [metric, setMetric] = useState<Metric>("duration");
    const [statistics, setStatistics] = useState<IEnduranceStatistics | null>(null);
    const [isLoading, setLoading] = useState(true);
    const requestIdRef = useRef(0);

    const statisticsService = useMemo(() => new StatisticsService(), []);

    useEffect(() => {
        void loadOptions();
    }, []);

    useEffect(() => {
        if (typeId !== null) void loadStatistics();
    }, [typeId, timeRange]);

    async function loadOptions() {
        try {
            const enduranceOptions = await statisticsService.getEnduranceTypeOptions();
            setOptions(enduranceOptions);
            if (enduranceOptions.length > 0) setTypeId(enduranceOptions[0].id);
        } finally {
            setLoading(false);
        }
    }

    async function loadStatistics() {
        if (typeId === null) return;
        const requestId = ++requestIdRef.current;
        setLoading(true);
        try {
            const result = await statisticsService.getEnduranceStatistics(
                typeId,
                getRangeDays(timeRange)
            );
            if (requestId === requestIdRef.current) setStatistics(result);
        } catch (error) {
            console.error("❌ Ausdauerstatistik konnte nicht geladen werden:", error);
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

    function formatPace(pace: number | null): string {
        if (pace == null || !Number.isFinite(pace)) return "–";
        const minutes = Math.floor(pace);
        const seconds = Math.round((pace - minutes) * 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")} min/km`;
    }

    function getMetricData(): {
        title: string;
        unit: string;
        data: IStatisticPoint[];
        lowerIsBetter?: boolean;
    } {
        if (!statistics) return {title: "", unit: "", data: []};
        switch (metric) {
            case "distance":
                return {title: "Strecke pro Einheit", unit: "km", data: statistics.distancePoints};
            case "pace":
                return {
                    title: "Pace pro Einheit",
                    unit: "min/km",
                    data: statistics.pacePoints,
                    lowerIsBetter: true,
                };
            default:
                return {title: "Dauer pro Einheit", unit: "min", data: statistics.durationPoints};
        }
    }

    const chart = getMetricData();
    const metricLabels: Record<string, Metric> = {
        Dauer: "duration",
        Strecke: "distance",
        Pace: "pace",
    };

    return (
        <ScrollView style={globalStyles.screenContainer} contentContainerStyle={styles.content}>
            <Text style={globalStyles.title}>Ausdauerentwicklung</Text>
            <Text style={styles.caption}>Umfang, Pace und persönliche Bestwerte je Sportart.</Text>
            <StatisticSelector
                options={options}
                value={typeId}
                placeholder="Sportart auswählen"
                onChange={setTypeId}
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
                            label="Einheiten"
                            value={statistics.sessionCount.toString()}
                            detail="im Zeitraum"
                        />
                        <StatisticCard
                            label="Gesamtzeit"
                            value={`${statistics.totalDuration} min`}
                        />
                        <StatisticCard
                            label="Gesamtstrecke"
                            value={`${statistics.totalDistance} km`}
                        />
                        <StatisticCard label="Ø Pace" value={formatPace(statistics.averagePace)} />
                        <StatisticCard
                            label="Ø Geschwindigkeit"
                            value={
                                statistics.averageSpeed != null
                                    ? `${statistics.averageSpeed} km/h`
                                    : "–"
                            }
                        />
                        <StatisticCard
                            label="Längste Einheit"
                            value={`${statistics.longestDuration} min`}
                            detail={`${statistics.longestDistance} km max.`}
                        />
                    </View>

                    <TypeFilter
                        compact
                        types={["Dauer", "Strecke", "Pace"]}
                        currentChosenType={
                            Object.entries(metricLabels).find(
                                ([, value]) => value === metric
                            )?.[0] ?? "Dauer"
                        }
                        onPress={(label) => setMetric(metricLabels[label])}
                    />
                    <CompactChart
                        title={chart.title}
                        data={chart.data}
                        unit={chart.unit}
                        lowerIsBetter={chart.lowerIsBetter}
                        formatYAxisValue={metric === "pace" ? formatPace : undefined}
                    />
                    <CompactChart
                        title="Wochenumfang"
                        data={statistics.weeklyDurationPoints}
                        unit="min"
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
