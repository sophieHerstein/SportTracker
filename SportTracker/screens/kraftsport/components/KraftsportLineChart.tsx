import {Dimensions, ScrollView, Text, View} from "react-native";
import {LineChart} from "react-native-chart-kit";
import {IEntwicklungGewichtData, IKraftsportLineChartProps} from "../../../utils/interfaces";

export default function KraftsportLineChart({data}: IKraftsportLineChartProps){

    function getScreenWidth(items: IEntwicklungGewichtData[], screenwidth: number){
        const factor = Math.round(items.length / 5) > 0 ? Math.round(items.length / 5) : 1;
        return screenwidth * factor;
    }

    return (
        <ScrollView horizontal={true}>
            {data.map((uebung, index) => (
                <View key={index}>
                    <Text style={{ fontSize: 18, textAlign: "center", marginBottom: 10 }}>
                        {uebung.name}
                    </Text>
                    <LineChart
                        data={{
                            labels: uebung.data.map(d => d.datum),
                            datasets: [{ data: uebung.data.map(d => d.gewicht) }]
                    }}
                        width={getScreenWidth(uebung.data, Dimensions.get("window").width - 20)}
                        height={220}
                        chartConfig={{
                            backgroundColor: "#1cc910",
                            backgroundGradientFrom: "#eff3ff",
                            backgroundGradientTo: "#efefef",
                            decimalPlaces: 1,
                            color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`
                    }}
                        bezier
                        style={{ marginVertical: 8, borderRadius: 16 }}
                    />
                </View>
            ))}
        </ScrollView>
    )
}