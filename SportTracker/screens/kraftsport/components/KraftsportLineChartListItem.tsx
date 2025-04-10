import {ScrollView, Text, View} from "react-native";
import {IKraftsportLineChartListItemProps} from "../../../utils/interfaces";
import {globalStyles} from "../../../utils/global-styles";
import Svg, {Defs, LinearGradient, Stop} from "react-native-svg";
import {hightlight, primary, secondary} from "../../../utils/constants";
import {Rect, VictoryAxis, VictoryChart, VictoryLine, VictoryScatter} from "victory-native";
import {useEffect, useState} from "react";

export default function KraftsportLineChartListItem({uebung}: IKraftsportLineChartListItemProps){
    const [maxYValue, setMaxYValue] = useState<number>(0);
        useEffect(() => {
            if (uebung.data.length > 0) {
                setMaxYValue(Math.max(...uebung.data.map(d => d.y)));
            }
        }, []);

    return (
        <View style={{ marginRight: 20, marginBottom: 20 }}>
        <Text style={[globalStyles.subtitle, globalStyles.centerText]}>{uebung.name}</Text>
        <ScrollView horizontal={true}>
            <VictoryChart width={Math.max(400, uebung.data.length * 75)} height={220} domain={{ y: [0, Math.max(8, maxYValue) + 2] }}>
                <Svg height="100%" width={Math.max(400, uebung.data.length * 75)} style={{ position: "absolute" }}>
                    <Defs>
                        <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor={primary} stopOpacity="1" />
                            <Stop offset="100%" stopColor={secondary} stopOpacity="1" />
                        </LinearGradient>
                    </Defs>
                    <Rect width="100%" height="100%" fill="url(#grad)" rx="20" ry="20" />
                </Svg>
                <VictoryAxis
                    style={{
                        axis: { stroke: hightlight },
                        tickLabels: { fill: hightlight }
                    }}
                />

                <VictoryAxis
                    dependentAxis
                    style={{
                        axis: { stroke: hightlight },
                        tickLabels: { fill: hightlight }
                    }}
                />

                <VictoryLine
                    data={uebung.data}
                    interpolation="monotoneX"
                    style={{
                        data: { stroke: hightlight, strokeWidth: 2 }
                    }}
                />

                <VictoryScatter
                    data={uebung.data}
                    size={5}
                    style={{ data: { fill: hightlight } }}
                />
            </VictoryChart>
        </ScrollView>
        </View>)
}