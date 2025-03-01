import {ScrollView, Text, View} from "react-native";
import {LineChart} from "react-native-chart-kit";
import {IAusdauerLineChartProps} from "../../../utils/interfaces";

//TODO: Farben und so auch übergeben?

export default function AusdauerLineChart({screenwidth, items, text, dataKey}: IAusdauerLineChartProps) {

    function transformDataForLineChart(){
        return {
            labels: items.map(item => item.datum),
            datasets: [
                {
                    data: items.map(item => item[dataKey] as number),
                    color: (opacity = 1) => (dataKey === "dauer" ? `rgba(255, 99, 132, ${opacity})` : `rgba(54, 162, 235, ${opacity})`),
                    strokeWidth: 2
                }
            ]
        }
    }

    function getScreenWidth(){
        const factor = Math.round(items.length / 5) > 0 ? Math.round(items.length / 5) : 1;
        return screenwidth * factor;
    }

    return (
        <View>
            <Text style={{ textAlign: "center", fontSize: 18, marginTop: 20 }}>{text}</Text>
            <ScrollView horizontal={true}>
                <LineChart
                    data={transformDataForLineChart()}
                    width={getScreenWidth()}
                    height={220}
                    yAxisLabel="Min "
                    chartConfig={{
                        backgroundGradientFrom: "#ffffff",
                        backgroundGradientTo: "#eeeeee",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
                        // labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        propsForDots: {
                            r: "6",
                            strokeWidth: "2",
                            stroke: "#ff6384"
                        }
                    }}
                    bezier
                />
            </ScrollView>
        </View>
    )
}