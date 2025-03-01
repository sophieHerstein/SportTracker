import {Dimensions, Text, View} from "react-native";
import {BarChart} from "react-native-chart-kit";
import {ITrainingsBarChartProps} from "../../../utils/interfaces";

export default function TrainingsBarChart({titel, data}: ITrainingsBarChartProps){
    return (
        <View>
            <Text>{titel}</Text>
            <BarChart
            data={{
                labels: data.map(d => d.label),
                datasets: [{ data: data.map(d => d.value) }]
            }}
            yAxisSuffix=" kg"
            yAxisLabel=""
            width={Dimensions.get("window").width - 20}
            height={220}
            chartConfig={{
                backgroundGradientFrom: "#ff9800",
                backgroundGradientTo: "#ff5722",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`
            }}
            showValuesOnTopOfBars
            style={{ marginVertical: 8, borderRadius: 16 }}
        />
        </View>
    )
}