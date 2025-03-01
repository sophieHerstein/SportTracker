import {StyleSheet, Text, View} from "react-native";
import {ITrainingsBarChartProps} from "../../../utils/interfaces";
import {globalStyles} from "../../../utils/global-styles";
import {Rect, VictoryAxis, VictoryBar, VictoryChart, VictoryLabel} from "victory-native";
import Svg, {Defs, LinearGradient, Stop} from "react-native-svg";
import {hightlight, primary, secondary, textColorSecondary} from "../../../utils/constants";
import {useCallback, useState} from "react";
import {useFocusEffect} from "@react-navigation/native";

//TODO: Filter, Scrollview, nur bestimmte Anzhal an Daten??? Wirds sonst zu unübersichtlich

export default function TrainingsBarChart({titel, data}: ITrainingsBarChartProps){
    const [mappendData, setMappedData] = useState<{x: string, y: number}[]>([]);

    useFocusEffect(useCallback(() => {
        const dataMapping = data
            .map(d => ({
                x: d.label,
                y: Number(d.value) || 0 // Falls `NaN`, wird 0 gesetzt
            }))
            .filter(d => !isNaN(d.y)); // Entfernt ungültige Einträge

        setMappedData(dataMapping);
    }, [data]));

    const minY = Math.min(...data.map(d => d.value), 0); // Mindestens 0
    const maxY = Math.max(...data.map(d => d.value), 10) + 2; // Dynamisch anpassen

    const stepSize = Math.ceil((maxY - minY) / 5); // Maximal 5 Schritte für gute Lesbarkeit
    const tickValues = Array.from({ length: 6 }, (_, i) => minY + i * stepSize);

    const barWidth = Math.max(10, Math.min(40, 300 / data.length)); // Skaliert automatisch

    return (
        <View style={styles.container}>
            {titel ? <Text style={[globalStyles.subtitle, globalStyles.centerText]}>{titel}</Text>: null}
            <View>
                <Svg height="100%" width="100%" style={{ position: "absolute" }}>
                    <Defs>
                        <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor={primary} stopOpacity="1" />
                            <Stop offset="100%" stopColor={secondary} stopOpacity="1" />
                        </LinearGradient>
                    </Defs>
                    <Rect width="100%" height="100%" fill="url(#grad)" rx="20" ry="20" />
                </Svg>

                <VictoryChart domain={{ y: [minY, maxY] }} domainPadding={{ x: 50 }}>
                    <VictoryAxis
                        style={{
                            axis: { stroke: hightlight },
                            tickLabels: { fill: hightlight}
                        }}
                    />

                    <VictoryAxis
                        dependentAxis
                        tickValues={tickValues}
                        style={{
                            axis: { stroke: hightlight },
                            tickLabels: { fill: hightlight },
                        }}
                    />

                    <VictoryBar
                        data={mappendData}
                        labels={({ datum }) => datum.y}
                        labelComponent={
                            <VictoryLabel
                                dy={-10}
                                style={{ fill: hightlight}}
                            />
                        }
                        style={{
                            data: { fill: textColorSecondary, width: barWidth}
                        }}
                    />
                </VictoryChart>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 15,
    }
})