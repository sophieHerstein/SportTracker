import {ScrollView, StyleSheet, Text, View} from "react-native";
import {ITrainingsBarChartProps} from "../../../models/interfaces";
import {globalStyles} from "../../../utils/global-styles";
import {Rect, VictoryAxis, VictoryBar, VictoryChart, VictoryLabel} from "victory-native";
import Svg, {Defs, LinearGradient, Stop} from "react-native-svg";
import {highlight, primary, secondary, textColorSecondary} from "../../../models/constants";
import {useCallback, useState} from "react";
import {useFocusEffect} from "@react-navigation/native";

export default function TrainingsBarChart({titel, data}: ITrainingsBarChartProps) {
    const [mappendData, setMappedData] = useState<{ x: string, y: number }[]>([]);

    useFocusEffect(useCallback(() => {
        const dataMapping = data
            .map(d => {
                return {
                    x: d.label,
                    y: Number(d.value) || 0
                }
            })
            .filter(d => !isNaN(d.y));

        setMappedData(dataMapping);
    }, [data]));

    const minY = Math.min(...data.map(d => d.value), 0); // Mindestens 0
    const maxY = Math.max(...data.map(d => d.value), 10) + 2; // Dynamisch anpassen

    const stepSize = Math.ceil((maxY - minY) / 5); // Maximal 5 Schritte für gute Lesbarkeit
    const tickValues = Array.from({length: 6}, (_, i) => minY + i * stepSize);

    return (
        <View style={styles.container}>
            {titel ? <Text style={[globalStyles.subtitle, globalStyles.centerText]}>{titel}</Text> : null}
            <ScrollView horizontal={true}>
                <VictoryChart width={Math.max(400, mappendData.length * 100)} height={220} domain={{y: [minY, maxY]}}
                              domainPadding={{x: 50}}>
                    <Svg height="100%" width={Math.max(400, mappendData.length * 100)} style={{position: "absolute"}}>
                        <Defs>
                            <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <Stop offset="0%" stopColor={primary} stopOpacity="1"/>
                                <Stop offset="100%" stopColor={secondary} stopOpacity="1"/>
                            </LinearGradient>
                        </Defs>
                        <Rect width={Math.max(400, mappendData.length * 100)} height="100%" fill="url(#grad)" rx="20"
                              ry="20"/>
                    </Svg>
                    <VictoryAxis
                        style={{
                            axis: {stroke: highlight},
                            tickLabels: {fill: highlight}
                        }}
                    />

                    <VictoryAxis
                        dependentAxis
                        tickValues={tickValues}
                        style={{
                            axis: {stroke: highlight},
                            tickLabels: {fill: highlight},
                        }}
                    />

                    <VictoryBar
                        data={mappendData}
                        labels={({datum}) => datum.y}
                        labelComponent={
                            <VictoryLabel
                                dy={-10}
                                style={{fill: highlight}}
                            />
                        }
                        style={{
                            data: {fill: textColorSecondary, width: 40}
                        }}
                    />
                </VictoryChart>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 15,
    }
})