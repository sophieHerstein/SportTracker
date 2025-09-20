import {ScrollView, StyleSheet, Text, View} from "react-native";
import {IAusdauerLineChartProps} from "../../../models/interfaces";
import {globalStyles} from "../../../utils/global-styles";
import {Rect, VictoryAxis, VictoryChart, VictoryLine, VictoryScatter} from "victory-native";
import {useMemo} from "react";
import Svg, {Defs, LinearGradient, Stop} from "react-native-svg";
import {hightlight, primary, secondary} from "../../../models/constants";

export default function AusdauerLineChart({screenwidth, items, text, dataKey}: IAusdauerLineChartProps) {

    const transformedData = useMemo(() => {
        return items.map(item => ({
            x: item.datum,
            y: item[dataKey] as number
        }));
    }, [items, dataKey]);

    function getScreenWidth() {
        const factor = Math.max(Math.round(items.length / 5), 1);
        return screenwidth * factor;
    }

    const minY = Math.min(...transformedData.map(d => d.y), 0);
    const maxY = Math.max(...transformedData.map(d => d.y), 10) + 2;

    const einheit = dataKey === "dauer" ? "min" : dataKey === "strecke" ? "km" : "km/h";

    return (
        <View style={styles.margin}>
            <Text style={globalStyles.subtitle}>{text}</Text>
            <ScrollView horizontal={true}>
                <Svg height="100%" width="100%" style={{position: "absolute"}}>
                    <Defs>
                        <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor={primary} stopOpacity="1"/>
                            <Stop offset="100%" stopColor={secondary} stopOpacity="1"/>
                        </LinearGradient>
                    </Defs>
                    <Rect width="100%" height="100%" fill="url(#grad)" rx="20" ry="20"/>
                </Svg>
                <VictoryChart
                    width={Math.max(400, getScreenWidth())}
                    height={220}
                    domain={{y: [minY, maxY]}}
                >
                    <VictoryAxis
                        style={{
                            axis: {stroke: hightlight},
                            tickLabels: {fill: hightlight}
                        }}
                    />

                    <VictoryAxis
                        dependentAxis
                        tickFormat={(tick) => `${tick} ${einheit}`}
                        style={{
                            axis: {stroke: hightlight},
                            tickLabels: {fill: hightlight, fontSize: 10},
                        }}
                    />

                    <VictoryLine
                        data={transformedData}
                        interpolation="monotoneX"
                        style={{
                            data: {stroke: hightlight, strokeWidth: 2}
                        }}
                    />
                    <VictoryScatter
                        data={transformedData}
                        size={5} // Punktgröße
                        style={{data: {fill: hightlight}}}
                    />
                </VictoryChart>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    margin: {
        marginVertical: 7.5
    }
})