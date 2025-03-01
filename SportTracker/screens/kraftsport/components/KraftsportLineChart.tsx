import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { IKraftsportLineChartProps, IEntwicklungGewichtData } from "../../../utils/interfaces";
import { globalStyles } from "../../../utils/global-styles";
import { hightlight, primary, secondary } from "../../../utils/constants";
import { Rect, VictoryAxis, VictoryChart, VictoryLine, VictoryScatter } from "victory-native";
import Svg, { Defs, LinearGradient, Stop } from "react-native-svg";
import { useMemo } from "react";

export default function KraftsportLineChart({ data }: IKraftsportLineChartProps) {

    // ✅ Fix: Daten umwandeln & NaN-Werte filtern
    const transformedData = useMemo(() => {
        return data.map(uebung => ({
            name: uebung.name,
            data: uebung.data
                .map((item: IEntwicklungGewichtData) => ({
                    x: item.datum,
                    y: Number(item.gewicht) || 0 // Falls `NaN`, setze 0
                }))
                .filter(d => !isNaN(d.y) && d.y !== null && d.y !== undefined) // Entfernt ungültige Werte
        }));
    }, [data]);

    return (
        <View style={styles.paddingBottom}>
            {transformedData.length > 0 ? (
                <ScrollView horizontal={true}>
                    {transformedData.map((uebung, index) => (
                        <View key={index} style={{ marginRight: 20 }}>
                            <Text style={[globalStyles.subtitle, globalStyles.centerText]}>{uebung.name}</Text>
                            <Svg height="100%" width="100%" style={{ position: "absolute" }}>
                                <Defs>
                                    <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <Stop offset="0%" stopColor={primary} stopOpacity="1" />
                                        <Stop offset="100%" stopColor={secondary} stopOpacity="1" />
                                    </LinearGradient>
                                </Defs>
                                <Rect width="100%" height="100%" fill="url(#grad)" rx="20" ry="20" />
                            </Svg>

                            {/* VictoryChart für jede Übung */}
                            <VictoryChart width={Math.max(400, uebung.data.length * 50)} height={220}>
                                {/* X-Achse */}
                                <VictoryAxis
                                    style={{
                                        axis: { stroke: hightlight },
                                        tickLabels: { fill: hightlight }
                                    }}
                                />

                                {/* Y-Achse */}
                                <VictoryAxis
                                    dependentAxis
                                    style={{
                                        axis: { stroke: hightlight },
                                        tickLabels: { fill: hightlight }
                                    }}
                                />

                                {/* ✅ Linie für die Übung */}
                                <VictoryLine
                                    data={uebung.data}
                                    interpolation="monotoneX"
                                    style={{
                                        data: { stroke: hightlight, strokeWidth: 2 }
                                    }}
                                />

                                {/* ✅ Punkte für die Übung */}
                                <VictoryScatter
                                    data={uebung.data}
                                    size={5}
                                    style={{ data: { fill: hightlight } }}
                                />
                            </VictoryChart>
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <Text style={[globalStyles.subtitle, globalStyles.centerText]}>Keine Daten verfügbar</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    paddingBottom: {
        paddingBottom: 15
    }
});