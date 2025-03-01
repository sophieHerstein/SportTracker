import { FlatList, StyleSheet, View} from 'react-native';
import IconButton from "../../components/IconButton";
import {useState, useCallback} from 'react';
import KraftsportListItem from "./components/KraftsportListItem";
import * as SQLite from "expo-sqlite";
import {useFocusEffect} from "@react-navigation/native";
import {EAppPaths, primary, secondary} from "../../utils/constants";
import {
    deleteTrainingWithId1,
    deleteTrainingWithId2,
    deleteTrainingWithId3, deleteTrainingWithId4,
    getKraftsportHomeScreenData
} from "../../utils/database-querys";
import {IKraftsportData, IKraftsportDatabaseResult, ISatz} from "../../utils/interfaces";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyList from "../../components/EmptyList";
import {NavigatorParamList} from "../../Navigation";
import {NativeStackScreenProps} from "@react-navigation/native-stack";
import {globalStyles} from "../../utils/global-styles";

type KraftsportScreenProps = NativeStackScreenProps<NavigatorParamList, EAppPaths.KRAFTSPORT_HOME>;

const database = SQLite.openDatabaseSync('training.db');

export default function KraftsportScreen({navigation}: KraftsportScreenProps) {
    const [kraftsportData, setData] = useState<IKraftsportData[]>([]);
    const [isLoading, setLoading] = useState<boolean>(true);

    useFocusEffect(useCallback(() => {
        fetchTrainings();
        }, []
    ));

    function transformTrainingData(dataBaseData: IKraftsportDatabaseResult[]): IKraftsportData[] {
        const transformedData: Record<string, {
            id: number;
            datum: number;
            gruppe: string;
            uebungen: Record<string, ISatz[]>;
        }> = {};

        dataBaseData.forEach((entry: IKraftsportDatabaseResult) => {
            const key = `${entry.training_id}`;

            if (!transformedData[key]) {
                transformedData[key] = {
                    id: entry.training_id,
                    datum: entry.datum,
                    gruppe: entry.muscle_group,
                    uebungen: {}
                };
            }

            if (!transformedData[key].uebungen[entry.exercise]) {
                transformedData[key].uebungen[entry.exercise] = [];
            }

            transformedData[key].uebungen[entry.exercise].push({
                id: entry.exercise_set_id,
                gewicht: entry.weight,
                wiederholungen: entry.repetitions
            });
        });

        return Object.values(transformedData).map(training => ({
            training_id: training.id,
            datum: new Date(training.datum).toLocaleDateString('de-DE', {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }),
            datum_as_timestamp: training.datum,
            gruppe: training.gruppe,
            uebungen: Object.entries(training.uebungen).map(([name, saetze]) => ({
                name,
                saetze
            }))
        })) as IKraftsportData[];
    }


    async function deleteTraining(id: string){
        try {
            await database.runAsync(deleteTrainingWithId1(id));
            await database.runAsync(deleteTrainingWithId2(id));
            await database.runAsync(deleteTrainingWithId3(id));
            await database.runAsync(deleteTrainingWithId4());
            await fetchTrainings();
        } catch (error) {
            console.error("❌ Fehler beim Löschen des Trainings:", error);
        }
    }

    async function fetchTrainings() {
        setLoading(true);
        try {
            const results: IKraftsportDatabaseResult[] = await database.getAllAsync(getKraftsportHomeScreenData);

            if (results.length > 0) {
                const transformedData: IKraftsportData[] = transformTrainingData(results);
                transformedData.sort((a, b) => b.datum_as_timestamp - a.datum_as_timestamp);
                setData(transformedData);
            }
        } catch (error) {
            console.error("❌ Fehler beim Abrufen der Trainings:", error);
        }
        setLoading(false);
    }

    if (isLoading) {
        return <LoadingSpinner/>
    }

    return (
        <View style={globalStyles.screenContainer}>
            <IconButton
                size={36}
                color={secondary}
                onPress={() => navigation.navigate(EAppPaths.KRAFTSPORT_STATISTIK)}
                style={globalStyles.topLeft}
                icon='bar-chart'>
            </IconButton>
            <IconButton
                size={36}
                color={primary}
                onPress={() => navigation.navigate(EAppPaths.KRAFTSPORT_GRUPPE_WAEHLEN)}
                style={globalStyles.topRight}
                icon='add-circle'>
            </IconButton>
            <FlatList data={kraftsportData}
                      renderItem={({item})=> (
                          <KraftsportListItem item={item} onDelete={(id: string) => deleteTraining(id)}/>
                      )}
                      keyExtractor={(item)=> item.training_id.toString()}
                      ListEmptyComponent={EmptyList}
            />
        </View>
    );
}
