import {Text, View} from "react-native";
import {VictoryAxis, VictoryChart, VictoryScatter, VictoryTheme} from "victory-native";
import {IAusdauerScatterPlotProps} from "../../../utils/interfaces";

export default function AusdauerScatterPlot({screenwidth, items}: IAusdauerScatterPlotProps){

    function transformDataForScatterChart() {
        return items.map(item => {
            const geschwindigkeit = item.strecke / (item.dauer / 60); // km/h
            return {
                x: item.dauer,
                y: item.strecke,
                size: geschwindigkeit / 2 // Bubble-Größe skaliert (damit sie nicht zu groß wird)
            };
        });
    }

    function getUniqueTicks(values: number[], step = 10) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const ticks = [];

        for (let i = min; i <= max; i += step) {
            ticks.push(Math.round(i)); // Rundet sauber auf ganze Werte
        }

        return ticks;
    }

    const scatterData = transformDataForScatterChart();
    const xTicks = getUniqueTicks(items.map(d => d.dauer), 5);
    const yTicks = getUniqueTicks(items.map(d => d.strecke), 2);

    return (
        <View>
            <Text style={{ textAlign: "center", fontSize: 18, marginTop: 20 }}>Scatter Chart: Dauer vs. Strecke</Text>

            <VictoryChart
                theme={VictoryTheme.material}
                width={screenwidth}
                domainPadding={20}
                style={{
                    background: { fill: "#ffffff" },
                }}
            >
                <VictoryAxis
                    label="Dauer (Minuten)"
                    tickValues={xTicks}
                    tickFormat={(t) => `${t} min`}
                    style={{
                        axis: { stroke: "#aaa" },
                        tickLabels: { fontSize: 12, fill: "#333" }
                    }}
                />
                <VictoryAxis
                    dependentAxis
                    label="Strecke (km)"
                    tickValues={yTicks}
                    tickFormat={(t) => `${t} km`}
                    style={{
                        axis: { stroke: "#aaa" },
                        tickLabels: { fontSize: 12, fill: "#333" }
                    }}
                />

                <VictoryScatter
                    data={scatterData}
                    size={({ datum }) => datum.size}
                    style={{ data: { fill: "#36a2eb" } }}
                />
            </VictoryChart>
        </View>
    )
}