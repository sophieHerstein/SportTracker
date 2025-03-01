import {Dimensions, ScrollView, Text, View} from "react-native";
import {useEffect, useState} from "react";
import * as SQLite from "expo-sqlite";
import {BarChart, LineChart} from "react-native-chart-kit";
import {
    IBarChartProps,
    IEntwicklungGewicht,
    IEntwicklungGewichtData,
    IEntwicklungGewichtDatabaseResult,
    IProgressionsAnalyseDatabaseResult
} from "../../utils/interfaces";
import TrainingsBarChart from "../start/components/TrainingsBarChart";
import {getEntwicklungGewichtData, getProgressionsData} from "../../utils/database-querys";
import KraftsportLineChart from "./components/KraftsportLineChart";

const database = SQLite.openDatabaseSync('training.db');

export default function  KraftsportStatistikScreen(){
    const [entwicklungGewichtData, setEntwicklungGewichtData] = useState<IEntwicklungGewicht[]>([]);
    const [progressionsData, setProgressionsData] = useState<IBarChartProps[]>([]);

    useEffect(() => {
        async function fetchData() {
            const entwicklungGewichtResults: IEntwicklungGewichtDatabaseResult[] = await database.getAllAsync(getEntwicklungGewichtData);
            entwicklungGewichtResults.sort((r1, r2) => r1.datum - r2.datum );

            // Daten nach Übung gruppieren
            const groupedData: Record<string, { datum: string; gewicht: number }[]> = {};

            entwicklungGewichtResults.forEach(row => {
                const datum = new Date(row.datum).toLocaleDateString("de-DE");
                const gewicht = row.max_weight;

                if (!groupedData[row.uebung]) {
                    groupedData[row.uebung] = [];
                }

                groupedData[row.uebung].push({ datum, gewicht });
            });

            // Umwandlung in gewünschtes Array-Format
            const formattedData: IEntwicklungGewicht[] = Object.keys(groupedData).map(name => ({
                name,
                data: groupedData[name]
            }));

            setEntwicklungGewichtData(formattedData);

            const progressionsData: IProgressionsAnalyseDatabaseResult[] = await database.getAllAsync(getProgressionsData);

            const formattedProgressionsData: IBarChartProps[] = progressionsData.map((pd)=>{
                return {
                    label: pd.uebung,
                    value: pd.differenz
                }
            })

            setProgressionsData(formattedProgressionsData);
        }

        fetchData();
    }, []);

    return (
        <View>
        <KraftsportLineChart data={entwicklungGewichtData} />
        <TrainingsBarChart titel="Fortschritt pro Übung" data={progressionsData}/>
        </View>
    );
}