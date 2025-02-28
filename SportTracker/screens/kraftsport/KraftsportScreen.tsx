import { FlatList, StyleSheet, View} from 'react-native';
import IconButton from "../../components/IconButton";
import {useState, useCallback} from 'react';
import KraftsportListItem from "./components/KraftsportListItem";
import * as SQLite from "expo-sqlite";
import {useFocusEffect} from "@react-navigation/native";
import {EAppPaths} from "../../utils/constants";
import {
    createExerciseMuscleGroupTable, createExerciseSetTable,
    createExerciseTable, createExerciseTrainingTable,
    createMuscleGroupTable,
    createTrainingTable, deleteTrainingWithId, getKraftsportHomeScreenData
} from "../../utils/database-querys";
import {IKraftsportData, IKraftsportDatabaseResult, ISatz} from "../../utils/interfaces";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyList from "../../components/EmptyList";
import {NavigatorParamList} from "../../Navigation";
import {NativeStackScreenProps} from "@react-navigation/native-stack";

// TODO:   Charts
//         Trends
//         Empfehlungen oder ähnliches oder Analysen sowas halt
//         globale Stylings/einheitliches Styling
//         Bugfixes
//         Datentypen und va ids nochmal prüfen

type KraftsportScreenProps = NativeStackScreenProps<NavigatorParamList, EAppPaths.KRAFTSPORT_HOME>;

const database = SQLite.openDatabaseSync('training.db');

export default function KraftsportScreen({navigation}: KraftsportScreenProps) {
    const [kraftsportData, setData] = useState<IKraftsportData[]>([]);
    const [isLoading, setLoading] = useState<boolean>(true);

    useFocusEffect(useCallback(() => {
        setupDatabase();
        fetchTrainings();
        }, []
    ));

    async function setupDatabase(){
        try {
            await database.runAsync(createMuscleGroupTable);

            await database.runAsync(createExerciseTable);

            await database.runAsync(createExerciseMuscleGroupTable);

            await database.runAsync(createTrainingTable);

            await database.runAsync(createExerciseTrainingTable);

            await database.runAsync(createExerciseSetTable);
        } catch (error) {
            console.error("Fehler beim Einrichten der Datenbank:", error);
        }
    }

    function transformTrainingData(dataBaseData: IKraftsportDatabaseResult[]): IKraftsportData[] {
        const transformedData: Record<string, {
            id: number;
            datum: string;
            gruppe: string;
            uebungen: Record<string, ISatz[]>;
        }> = {};

        dataBaseData.forEach((entry: IKraftsportDatabaseResult) => {
            const key = `${entry.date}-${entry.muscle_group}`;

            if (!transformedData[key]) {
                transformedData[key] = {
                    id: entry.training_id,
                    datum: entry.date,
                    gruppe: entry.muscle_group,
                    uebungen: {}
                };
            }

            if (!transformedData[key].uebungen[entry.exercise]) {
                transformedData[key].uebungen[entry.exercise] = [];
            }

            transformedData[key].uebungen[entry.exercise].push({
                id: new Date().getTime() + Math.random() * 1000,
                gewicht: entry.weight,
                wiederholungen: entry.repetitions
            });
        });

        return Object.values(transformedData).map(training => ({
            training_id: training.id,
            datum: training.datum,
            gruppe: training.gruppe,
            uebungen: Object.entries(training.uebungen).map(([name, saetze]) => ({
                name,
                saetze
            }))
        })) as IKraftsportData[];
    }


    async function deleteTraining(id: string){
        try {
            await database.runAsync(deleteTrainingWithId(id));
            await fetchTrainings();
        } catch (error) {
            console.error("Fehler beim Löschen des Trainings:", error);
        }
    }

    async function fetchTrainings() {
        setLoading(true)
        try {
            const results: IKraftsportDatabaseResult[] = await database.getAllAsync(getKraftsportHomeScreenData);
            const transformedData: IKraftsportData[] = transformTrainingData(results)
            setData(transformedData);
        } catch (error) {
            console.error("Fehler beim Abrufen der Trainings:", error);
        }
        setLoading(false);
    }

    if (isLoading) {
        <LoadingSpinner/>
    }

    return (
        <View style={styles.container}>
            <IconButton
                size={36}
                color='royalblue'
                onPress={() => navigation.navigate(EAppPaths.KRAFTSPORT_GRUPPE_WAEHLEN)}
                style={styles.new}
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

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 100
    },
    new: {
        position: 'absolute',
        top: 60,
        right: 30,
    },
});