import {StyleSheet, Text, View, useWindowDimensions} from "react-native";
import {IKraftsportLineChartListItemProps} from "../../../models/interfaces";
import {globalStyles} from "../../../utils/global-styles";
import {VictoryAxis, VictoryChart, VictoryLine, VictoryScatter} from "victory-native";
import {borderColor, primary, textColorMuted} from "../../../models/constants";

export default function KraftsportLineChartListItem({
    uebung,
    isNotListElement,
}: IKraftsportLineChartListItemProps) {
    const {width} = useWindowDimensions();
    const data = uebung.data
        .filter((point) => Number.isFinite(point.y))
        .slice(-30)
        .map((point, index) => ({x: index + 1, y: point.y, label: point.x}));

    if (data.length === 0) {
        return <Text style={styles.empty}>Noch keine Daten im Zeitraum.</Text>;
    }

    const values = data.map((point) => point.y);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max((max - min) * 0.15, 2);
    const tickIndexes = Array.from(new Set([1, Math.ceil(data.length / 2), data.length]));

    return (
        <View style={styles.container}>
            {!isNotListElement && <Text style={globalStyles.subtitle}>{uebung.name}</Text>}
            <VictoryChart
                width={Math.max(280, width - 48)}
                height={210}
                padding={{top: 18, bottom: 42, left: 50, right: 18}}
                domain={{y: [Math.max(0, min - padding), max + padding]}}
            >
                <VictoryAxis
                    tickValues={tickIndexes}
                    tickFormat={(tick) => data[tick - 1]?.label ?? ""}
                    style={axisStyle}
                />
                <VictoryAxis dependentAxis style={axisStyle} />
                <VictoryLine data={data} style={{data: {stroke: primary, strokeWidth: 3}}} />
                <VictoryScatter data={data} size={3.5} style={{data: {fill: primary}}} />
            </VictoryChart>
        </View>
    );
}

const axisStyle = {
    axis: {stroke: borderColor},
    grid: {stroke: borderColor, strokeOpacity: 0.35},
    tickLabels: {fill: textColorMuted, fontSize: 9, padding: 5},
    ticks: {stroke: borderColor},
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
        overflow: "hidden",
    },
    empty: {
        color: textColorMuted,
        textAlign: "center",
        marginVertical: 24,
    },
});
