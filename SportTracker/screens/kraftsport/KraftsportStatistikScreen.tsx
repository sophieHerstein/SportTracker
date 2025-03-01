import {Text, View} from "react-native";
import {useEffect, useState} from "react";
import * as SQLite from "expo-sqlite";
import {
    IBarChartProps,
    IEntwicklungGewicht,
    IEntwicklungGewichtDatabaseResult,
    IProgressionsAnalyseDatabaseResult
} from "../../utils/interfaces";
import TrainingsBarChart from "../start/components/TrainingsBarChart";
import {getEntwicklungGewichtData, getProgressionsData} from "../../utils/database-querys";
import KraftsportLineChart from "./components/KraftsportLineChart";
import {globalStyles} from "../../utils/global-styles";

const database = SQLite.openDatabaseSync('training.db');

export default function  KraftsportStatistikScreen(){
    const [entwicklungGewichtData, setEntwicklungGewichtData] = useState<IEntwicklungGewicht[]>([]);
    const [progressionsData, setProgressionsData] = useState<IBarChartProps[]>([]);

    useEffect(() => {
        async function fetchData() {
            const entwicklungGewichtResults: IEntwicklungGewichtDatabaseResult[] = await database.getAllAsync(getEntwicklungGewichtData);
            entwicklungGewichtResults.sort((r1, r2) => r1.datum - r2.datum );

            const groupedData: Record<string, { datum: string; gewicht: number }[]> = {};

            entwicklungGewichtResults.forEach(row => {
                const datum = new Date(row.datum).toLocaleDateString("de-DE");
                const gewicht = row.max_weight;

                if (!groupedData[row.uebung]) {
                    groupedData[row.uebung] = [];
                }

                groupedData[row.uebung].push({ datum, gewicht });
            });

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
        <View style={globalStyles.screenContainer}>
            <Text style={globalStyles.title}>Entwicklung Gewicht</Text>
            <KraftsportLineChart data={entwicklungGewichtData} />
            <Text style={globalStyles.title}>Fortschritt pro Übung</Text>
            <TrainingsBarChart data={progressionsData}/>
        </View>
    );
}