import {StyleSheet, Text, View, useWindowDimensions} from "react-native";
import {VictoryAxis, VictoryBar, VictoryChart, VictoryLine, VictoryScatter} from "victory-native";
import {IStatisticPoint} from "../../models/interfaces";
import {
    borderColor,
    primary,
    secondary,
    secondaryBackground,
    textColorMuted,
} from "../../models/constants";

interface Props {
    title: string;
    data: IStatisticPoint[];
    unit?: string;
    type?: "line" | "bar";
    lowerIsBetter?: boolean;
    formatYAxisValue?: (value: number) => string;
}

export default function CompactChart({
    title,
    data,
    unit = "",
    type = "line",
    lowerIsBetter = false,
    formatYAxisValue,
}: Props) {
    const {width} = useWindowDimensions();
    const chartWidth = Math.max(280, width - 64);
    const safeData = data
        .filter((point) => Number.isFinite(point.value))
        .slice(-30)
        .map((point, index) => ({x: index + 1, y: point.value, axisLabel: point.label}));

    if (safeData.length === 0) return null;

    const values = safeData.map((point) => point.y);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max((max - min) * 0.15, max * 0.05, 1);
    const domainMin = type === "bar" ? 0 : Math.max(0, min - padding);
    const domainMax = max + padding;
    const tickIndexes = Array.from(
        new Set([1, Math.max(1, Math.ceil(safeData.length / 2)), safeData.length])
    );

    return (
        <View style={styles.container}>
            <View style={styles.titleRow}>
                <Text style={styles.title}>{title}</Text>
                {lowerIsBetter && <Text style={styles.hint}>niedriger ist besser</Text>}
            </View>
            <VictoryChart
                width={chartWidth}
                height={210}
                padding={{top: 18, bottom: 42, left: 52, right: 18}}
                domain={{y: [domainMin, domainMax]}}
                domainPadding={type === "bar" ? {x: 12} : undefined}
            >
                <VictoryAxis
                    tickValues={tickIndexes}
                    tickFormat={(tick) => safeData[tick - 1]?.axisLabel ?? ""}
                    style={axisStyle}
                />
                <VictoryAxis
                    dependentAxis
                    tickFormat={(tick) =>
                        formatYAxisValue
                            ? formatYAxisValue(tick)
                            : `${Number(tick.toFixed(1))}${unit ? ` ${unit}` : ""}`
                    }
                    style={axisStyle}
                />
                {type === "bar" ? (
                    <VictoryBar data={safeData} style={{data: {fill: secondary, width: 12}}} />
                ) : (
                    <>
                        <VictoryLine
                            data={safeData}
                            style={{data: {stroke: primary, strokeWidth: 3}}}
                        />
                        <VictoryScatter
                            data={safeData}
                            size={3.5}
                            style={{data: {fill: primary}}}
                        />
                    </>
                )}
            </VictoryChart>
        </View>
    );
}

const axisStyle = {
    axis: {stroke: borderColor},
    grid: {stroke: borderColor, strokeOpacity: 0.35},
    tickLabels: {fill: textColorMuted, fontSize: 11, fontWeight: "600", padding: 7},
    ticks: {stroke: borderColor},
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: secondaryBackground,
        borderRadius: 18,
        borderWidth: 1,
        borderColor,
        paddingTop: 14,
        paddingBottom: 4,
        marginBottom: 14,
        overflow: "hidden",
    },
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
    },
    title: {
        color: "#F4F7FF",
        fontSize: 16,
        fontWeight: "700",
    },
    hint: {
        color: textColorMuted,
        fontSize: 11,
    },
});
