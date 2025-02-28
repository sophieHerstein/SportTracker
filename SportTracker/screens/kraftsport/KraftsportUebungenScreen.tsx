import React, {useEffect, useState} from "react";
import {View, FlatList, StyleSheet, Alert} from "react-native";
import BigButton from "../../components/BigButton";
import * as SQLite from "expo-sqlite";
import {
    addExerciseToTraining, addSatzToDatabase,
    addTrainig, addUebungToDatabase, connectMuscleGroupAndUebung,
    deleteUebungReferenzFromGruppe, getIdForUebung,
    getLastUebungDataForGruppe, getLastWeightForUebung,
    getMuscleGroupIdForName, shouldExerciseAndMuscleGroupBeUnlinked
} from "../../utils/database-querys";
import TextIconButton from "../../components/TextIconButton";
import KraftsportUebungListItem from "./components/KraftsportUebungListItem";
import {NativeStackScreenProps} from "@react-navigation/native-stack";
import {NavigatorParamList} from "../../Navigation";
import {EAppPaths} from "../../utils/constants";
import {IGewichtUebung, ISatz, ITrainingDatabase, IUebung} from "../../utils/interfaces";

type KraftsportUebungenScreenProps = NativeStackScreenProps<NavigatorParamList, EAppPaths.KRAFTSPORT_UEBUNGEN>;

const database = SQLite.openDatabaseSync('training.db');

export default function KraftsportUebungenScreen({navigation, route}: KraftsportUebungenScreenProps) {
    const { datum, gruppe } = route.params;
    const [uebungen, setUebungen] = useState<IUebung[]>(() => []);

    useEffect(() => {
        loadExistingTraining();
    }, []);

    async function loadExistingTraining(){
        try {
            const existingTrainings: ITrainingDatabase[] = await database.getAllAsync(getLastUebungDataForGruppe(gruppe));
            if (existingTrainings.length > 0) {
                const newExercises: IUebung[] = existingTrainings.map((ex, index) => ({
                    id: ex.id,
                    name: ex.name,
                    saetze: Array.from({ length: ex.last_sets },
                        (): ISatz => ({
                            gewicht: ex.last_weight,
                            wiederholungen: 0,
                            id: new Date().getTime() + Math.random() * 1000  // Temporäre ID für die UI
                        })),
                }));

                setUebungen(newExercises);
            }
        } catch (error) {
            console.error("Fehler beim Laden der Trainingsdaten:", error);
        }
    }

    function addUebung() {
        setUebungen([...uebungen, { id: Date.now(), name: "", saetze: [] }]);
    }

    function deleteUebung(uebungId: number) {
        const updatedExercises = uebungen.filter((uebung) => uebung.id !== uebungId);
        setUebungen(updatedExercises);

        const result: {should_unlink: number}|null = database.getFirstSync(shouldExerciseAndMuscleGroupBeUnlinked(uebungId));

        if(result?.should_unlink === 1){
            Alert.alert(
                "Übung aus Gruppe entfernen?",
                "Soll die Übung dauerhaft aus diser Muskelgruppe entfernt werden?",
                [{text: "Nein"},{text: "Ja", style: "destructive", onPress:()=> deleteUebungFromMuscleGroup(uebungId)}]
            )
        }
    }

    async function deleteUebungFromMuscleGroup(uebungId: number) {
        await database.runAsync(deleteUebungReferenzFromGruppe(uebungId, gruppe));
    }

    function updateUebungName(uebungId: number, newName: string) {
        const uebungData: IGewichtUebung|null = database.getFirstSync(getLastWeightForUebung(newName))
        if(!!uebungData){
            setUebungen(
                uebungen.map((uebung) =>
                    uebung.id === uebungId
                        ? {
                            ...uebung,
                            name: newName,
                            saetze: Array.from({ length: uebungData.satz_anzahl },
                                (): ISatz => ({
                                    gewicht: uebungData.weight,
                                    wiederholungen: 0,
                                    id: new Date().getTime() + Math.random() * 1000  // Temporäre ID für die UI
                                })),
                        }
                        : uebung
                )
            );
        } else {
            setUebungen(
                uebungen.map((uebung) =>
                    uebung.id === uebungId ? { ...uebung, name: newName } : uebung
                )
            );
        }
    }

    function addSatz(uebungId: number) {
        let gewicht = 0;
        const saetzeFromUebung = uebungen.filter((uebung) => uebung.id === uebungId)[0].saetze;
        if(saetzeFromUebung && saetzeFromUebung.length >= 1){
            gewicht = saetzeFromUebung[saetzeFromUebung.length-1].gewicht;
        }
        setUebungen(
            uebungen.map((uebung) =>
                uebung.id === uebungId
                    ? {
                        ...uebung,
                        saetze: [...uebung.saetze, { id: Date.now(), wiederholungen: 0, gewicht: gewicht }],
                    }
                    : uebung
            )
        );
    }

    function deleteSatz(uebungId: number, satzId: number){
        setUebungen(
            uebungen.map((uebung) =>
                uebung.id === uebungId
                    ? { ...uebung, saetze: uebung.saetze.filter((satz) => satz.id !== satzId) }
                    : uebung
            )
        );
    }

    function updateSatz(uebungId: number, satzId: number, field: string, value: string) {
        setUebungen(
            uebungen.map((uebung) =>
                uebung.id === uebungId
                    ? {
                        ...uebung,
                        saetze: uebung.saetze.map((satz) =>
                            satz.id === satzId ? { ...satz, [field]: value } : satz
                        ),
                    }
                    : uebung
            )
        );
    }

    async function saveTraining() {
        try {
            const muscleGroupIdResult: { id: number }|null = await database.getFirstAsync(getMuscleGroupIdForName(gruppe));

            const muscleGroupId = muscleGroupIdResult?.id;

            if (!muscleGroupId) {
                Alert.alert("Fehler", "Muskelgruppe nicht gefunden!");
                return;
            }

            const trainingInsert = await database.runAsync(addTrainig(datum, muscleGroupId));
            const trainingId = trainingInsert.lastInsertRowId;

            for (const uebung of uebungen) {
                const existingExercise: { id: number }|null = await database.getFirstAsync(getIdForUebung(uebung.name));

                let exerciseId;
                if (existingExercise) {
                    exerciseId = existingExercise.id;
                } else {
                    const insertExercise = await database.runAsync(addUebungToDatabase(uebung.name));
                    exerciseId = insertExercise.lastInsertRowId;
                }

                await database.runAsync(connectMuscleGroupAndUebung(muscleGroupId, exerciseId));

                const exerciseTrainingInsert = await database.runAsync(addExerciseToTraining(trainingId, exerciseId));
                const exerciseTrainingId = exerciseTrainingInsert.lastInsertRowId;
                for (const satz of uebung.saetze) {
                    await database.runAsync(addSatzToDatabase(exerciseTrainingId, satz.gewicht, satz.wiederholungen));
                }
            }
            navigation.popToTop();
        } catch (error) {
            console.error("Fehler beim Speichern:", error);
        }
    }

    return (
        <View style={styles.container}>
            <TextIconButton iconName='add' color='royalblue' onPress={() => addUebung()} iconSize={20} stylePressable={styles.addUebung} styleText={styles.addUebungText} title="Übung hinzufügen"/>
            <FlatList
                data={uebungen || []}
                keyExtractor={(item, index) => (item?.id ? item.id.toString() : index.toString())}
                renderItem={({ item: uebung }) =>
                    <KraftsportUebungListItem
                        uebung={uebung}
                        updateSatz={updateSatz}
                        deleteSatz={deleteSatz}
                        updateUebungName={updateUebungName}
                        addSatz={addSatz}
                        deleteUebung={deleteUebung}/>
            }
            />
            <BigButton style={styles.fertigButton} title='Fertig' onPress={()=> saveTraining()}></BigButton>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "white",
    },
    uebungContainer: {
        backgroundColor: "lightskyblue",
        padding: 10,
        borderRadius: 8,
        marginVertical: 10,
    },
    addUebung: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    addUebungText: {
        color: 'royalblue',
        fontSize: 20,
    },
    input: {
        borderBottomWidth: 0.5,
        borderBottomColor: "grey",
        fontSize: 20,
        padding: 5,
        marginBottom: 10,
    },
    satzContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginVertical: 5,
    },
    satzInput: {
        padding: 5,
        width: 80,
        borderBottomWidth: 0.5,
        borderBottomColor: "grey",
    },
    deleteText: {
        color: "red",
        fontWeight: "bold",
        marginLeft: 10,
    },
    fertigButton: {
        alignItems: "center",
    },
    addSatz: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        marginBottom: 15,
    },
    deleteUebung: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "flex-start",
    },
    addSatzText: {
        color: 'royalblue',
        fontSize: 16,
    }
});
