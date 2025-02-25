import {Dimensions, ScrollView, StyleSheet, Text, View} from 'react-native';
import {LineChart} from "react-native-chart-kit";
import {VictoryAxis, VictoryChart, VictoryLine, VictoryScatter, VictoryTheme} from "victory-native";

const screenWidth = Dimensions.get("window").width;

export default function StatistikListItem({item}) {

    function transformDataForLineChart(rawData, key){
        return {
            labels: rawData.map(item => item.datum), // X-Achse: Datum
            datasets: [
                {
                    data: rawData.map(item => item[key]), // Y-Achse: Strecke oder Dauer
                    color: (opacity = 1) => (key === "dauer" ? `rgba(255, 99, 132, ${opacity})` : `rgba(54, 162, 235, ${opacity})`),
                    strokeWidth: 2
                }
            ]
        }
    }

    function transformDataForScatterChart(rawData) {
        return rawData.map(item => {
            const geschwindigkeit = item.strecke / (item.dauer / 60); // km/h
            return {
                x: item.dauer,
                y: item.strecke,
                size: geschwindigkeit / 2 // Bubble-Größe skaliert (damit sie nicht zu groß wird)
            };
        });
    }

    function getScreenWidth(){
        const factor = Math.round(item.length / 5) > 0 ? Math.round(item.length / 5) : 1;
        return screenWidth * factor;
    }

    function getUniqueTicks(values, step = 10) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const ticks = [];

        for (let i = min; i <= max; i += step) {
            ticks.push(Math.round(i)); // Rundet sauber auf ganze Werte
        }

        return ticks;
    }

    const scatterData = transformDataForScatterChart(item);

    const xTicks = getUniqueTicks(item.map(d => d.dauer), 5); // Schrittweite: 10
    const yTicks = getUniqueTicks(item.map(d => d.strecke), 2); // Schrittweite: 5

    return (
        <View>
            <Text>{item[0].name}</Text>
            {/* Liniendiagramm für Dauer */}
            <Text style={{ textAlign: "center", fontSize: 18, marginTop: 20 }}>Dauer (Minuten)</Text>
            <ScrollView horizontal>
                <LineChart
                    data={transformDataForLineChart(item, "dauer")}
                    width={getScreenWidth()}
                    height={220}
                    yAxisLabel="Min "
                    chartConfig={{
                        backgroundGradientFrom: "#ffffff",
                        backgroundGradientTo: "#eeeeee",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        propsForDots: {
                            r: "6",
                            strokeWidth: "2",
                            stroke: "#ff6384"
                        }
                    }}
                    bezier
                />
            </ScrollView>
            {/* Liniendiagramm für Strecke */}
            <Text style={{ textAlign: "center", fontSize: 18, marginTop: 20 }}>Strecke (km)</Text>
            <ScrollView horizontal>
                <LineChart
                    data={transformDataForLineChart(item, "strecke")}
                    width={getScreenWidth()}
                    height={220}
                    yAxisLabel="km "
                    chartConfig={{
                        backgroundGradientFrom: "#ffffff",
                        backgroundGradientTo: "#eeeeee",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        propsForDots: {
                            r: "6",
                            strokeWidth: "2",
                            stroke: "#36a2eb"
                        }
                    }}
                    bezier
                />
            </ScrollView>
            <View>
                <Text style={{ textAlign: "center", fontSize: 18, marginTop: 20 }}>Scatter Chart: Dauer vs. Strecke</Text>

                <VictoryChart
                    theme={VictoryTheme.material} // Einheitliches Design
                    width={screenWidth}
                    domainPadding={20} // Mehr Abstand an den Rändern
                    style={{
                        background: { fill: "#ffffff" }, // Hintergrundfarbe wie bei `react-native-chart-kit`
                    }}
                >
                    {/* X-Achse (Dauer) */}
                    <VictoryAxis
                        label="Dauer (Minuten)"
                        tickValues={xTicks} // Nur bestimmte Werte anzeigen
                        tickFormat={(t) => `${t} min`}
                        style={{
                            axis: { stroke: "#aaa" }, // Achsenfarbe
                            tickLabels: { fontSize: 12, fill: "#333" } // Label-Styling
                        }}
                    />

                    {/* Y-Achse (Strecke) */}
                    <VictoryAxis
                        dependentAxis
                        label="Strecke (km)"
                        tickValues={yTicks} // Nur bestimmte Werte anzeigen
                        tickFormat={(t) => `${t} km`}
                        style={{
                            axis: { stroke: "#aaa" },
                            tickLabels: { fontSize: 12, fill: "#333" }
                        }}
                    />

                    {/* Scatter Punkte */}
                    <VictoryScatter
                        data={scatterData}
                        size={({ datum }) => datum.size}
                        style={{ data: { fill: "#36a2eb" } }} // Gleiche blaue Farbe wie `react-native-chart-kit`
                    />
                    {/*<VictoryLine data={transformDataForScatterChart(item)} style={{ data: { stroke: "gray" } }} />*/}
                </VictoryChart>
            </View>
        </View>

    );
}

const styles = StyleSheet.create({

});