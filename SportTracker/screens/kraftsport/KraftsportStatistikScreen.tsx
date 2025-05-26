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
import EmptyList from "../../components/EmptyList";
import {ETimeRange} from "../../utils/constants";
import Filter from "../../components/Filter";

const database = SQLite.openDatabaseSync('training.db');

export default function  KraftsportStatistikScreen(){
    const [entwicklungGewichtData, setEntwicklungGewichtData] = useState<IEntwicklungGewicht[]>([]);
    const [progressionsData, setProgressionsData] = useState<IBarChartProps[]>([]);
    const [timeRange, setTimeRange] = useState<ETimeRange>(ETimeRange.GESAMT);

    useEffect(() => {
        async function fetchData() {
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

    useEffect(() => {
        async function fetchData() {
            const entwicklungGewichtResults: IEntwicklungGewichtDatabaseResult[] = await database.getAllAsync(getEntwicklungGewichtData);
            entwicklungGewichtResults.sort((r1, r2) => r1.datum - r2.datum );

            let filteredResults = [...entwicklungGewichtResults]

            if(timeRange !== ETimeRange.GESAMT){
                let timeRangeInNumbers: number;
                switch (timeRange){
                    case ETimeRange.JAHR:
                        timeRangeInNumbers = 365
                        break;
                    case ETimeRange.SECHS_MONATE:
                        timeRangeInNumbers = 183
                        break;
                    case ETimeRange.DREI_MONATE:
                        timeRangeInNumbers = 93
                        break;
                    case ETimeRange.MONAT:
                        timeRangeInNumbers = 30
                        break;
                }
                filteredResults = entwicklungGewichtResults.filter(row =>
                    new Date(row.datum) >= new Date(new Date().setDate(new Date().getDate() - timeRangeInNumbers))
                );
            }

            const groupedData: Record<string, { datum: string; gewicht: number }[]> = {};

            filteredResults.forEach(row => {
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
        }

        fetchData();
    }, [timeRange]);

    return (
        <View style={globalStyles.screenContainer}>
            { entwicklungGewichtData.length > 0 || progressionsData.length > 0 ?
                <View>
                    {progressionsData.length > 0 &&
                    <View>
                        <Text style={globalStyles.title}>Fortschritt pro Übung</Text>
                        <TrainingsBarChart data={progressionsData}/>
                    </View>
                    }
                    <View>
                        <Text style={globalStyles.title}>Entwicklung Gewicht</Text>
                        <Filter
                            timeRange={timeRange}
                            onPressGesamt={()=> setTimeRange(ETimeRange.GESAMT)}
                            onPressJahr={()=> setTimeRange(ETimeRange.JAHR)}
                            onPress6Monate={()=> setTimeRange(ETimeRange.SECHS_MONATE)}
                            onPress3Monate={()=> setTimeRange(ETimeRange.DREI_MONATE)}
                            onPressMonat={()=> setTimeRange(ETimeRange.MONAT)}/>
                        {entwicklungGewichtData.length > 0 &&
                            <KraftsportLineChart data={entwicklungGewichtData} />
                        }
                        {entwicklungGewichtData.length > 0 &&
                            <Text>Keine Trainings in dem Zeitraum</Text>
                        }
                    </View>
                </View>
                :
                <EmptyList/>
            }
        </View>
    );
}