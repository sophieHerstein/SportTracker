import React, {useEffect, useState} from "react";
import {Alert, FlatList, KeyboardAvoidingView, Pressable, StyleSheet, Text} from "react-native";
import BigButton from "../../components/BigButton";
import * as SQLite from "expo-sqlite";
import {
    addExerciseToTraining,
    addSatzToDatabase,
    addTraining,
    addUebungToDatabase,
    connectMuscleGroupAndUebung,
    deleteSatzFromTraining,
    deleteTraining,
    deleteUebungReferenzFromGruppe,
    getExercisesForTraining,
    getIdForUebung,
    getLastUebungDataForGruppe,
    getLastWeightForUebung,
    getMuscleGroupIdForName,
    shouldExerciseAndMuscleGroupBeUnlinked,
    shouldWeightBeIncreased
} from "../../utils/database-querys";
import TextIconButton from "../../components/TextIconButton";
import KraftsportUebungListItem from "./components/KraftsportUebungListItem";
import {NativeStackScreenProps} from "@react-navigation/native-stack";
import {NavigatorParamList} from "../../Navigation";
import {EAppPaths, hightlight, textColorPrimary} from "../../utils/constants";
import {IGewichtUebung, ISatz, ITrainingDatabase, IUebung} from "../../utils/interfaces";
import {globalStyles} from "../../utils/global-styles";
import IconButton from "../../components/IconButton";


type KraftsportUebungenScreenProps = NativeStackScreenProps<NavigatorParamList, EAppPaths.KRAFTSPORT_UEBUNGEN>;

const database = SQLite.openDatabaseSync('training.db');

export default function KraftsportUebungenScreen({navigation, route}: KraftsportUebungenScreenProps) {
    const { datum, gruppe } = route.params;
    const [uebungen, setUebungen] = useState<IUebung[]>(() => []);
    const [originalUebungen, setOriginalUebungen] = useState<IUebung[]>([]);

    useEffect(() => {
        navigation.setOptions({
            headerLeft: () =>
                <IconButton onPress={()=> saveTraining()} icon='arrow-back-ios-new' color={textColorPrimary} size={24}/>
        });
    }, [navigation, uebungen]);

    useEffect(() => {
        loadExistingTraining();
    }, []);

    async function loadExistingTraining(){
        if(!route.params.id){
            try {
                const existingTrainings: ITrainingDatabase[] = await database.getAllAsync(getLastUebungDataForGruppe(gruppe));

                if (existingTrainings.length > 0) {
                    const newExercises: IUebung[] = existingTrainings.map((ex) => ({
                        id: ex.id,
                        name: ex.name,
                        saetze: Array.from({ length: ex.last_sets },
                            (): ISatz => ({
                                gewicht: ex.last_weight,
                                wiederholungen: null,
                                id: new Date().getTime() + Math.random() * 1000  // Temporäre ID für die UI
                            })),
                    }));

                    const exercises = [...newExercises]

                    newExercises.forEach((exercise) => {
                        const shouldBeUpdated: {increaseWeight: number}|null = database.getFirstSync(shouldWeightBeIncreased(exercise.name));
                        if(shouldBeUpdated){
                            exercises.filter((e) => e.name === exercise.name)[0].weightShouldBeIncreased = shouldBeUpdated.increaseWeight === 1;
                        } else {
                            exercises.filter((e) => e.name === exercise.name)[0].weightShouldBeIncreased = false;
                        }
                    })
                    setUebungen(exercises);
                }
            } catch (error) {
                console.error("❌ Fehler beim Laden der Trainingsdaten:", error);
            }
        } else {
            try {
                const trainingId = route.params.id;
                const result: any[] = await database.getAllAsync(getExercisesForTraining(trainingId));

                const exercisesMap: Record<number, IUebung> = {};

                for (const row of result) {
                    if (!exercisesMap[row.exercise_id] && row.repetitions) {
                        exercisesMap[row.exercise_id] = {
                            id: row.exercise_id,
                            name: row.name,
                            saetze: [],
                        };
                    }
                    if (row.set_id) {
                        exercisesMap[row.exercise_id].saetze.push({
                            id: row.set_id,
                            gewicht: row.weight,
                            wiederholungen: row.repetitions,
                        });
                    }
                }

                const exercises = Object.values(exercisesMap);
                setUebungen(exercises);
                setOriginalUebungen(JSON.parse(JSON.stringify(exercises))); // Tiefe Kopie!
            } catch (error) {
                console.error("❌ Fehler beim Laden des bestehenden Trainings:", error);
            }
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
                "Soll die Übung dauerhaft aus dieser Muskelgruppe entfernt werden?",
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
                                    wiederholungen: null,
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
        let gewicht = null;
        const saetzeFromUebung = uebungen.filter((uebung) => uebung.id === uebungId)[0].saetze;
        if(saetzeFromUebung && saetzeFromUebung.length >= 1){
            gewicht = saetzeFromUebung[saetzeFromUebung.length-1].gewicht;
        }
        setUebungen(
            uebungen.map((uebung) =>
                uebung.id === uebungId
                    ? {
                        ...uebung,
                        saetze: [...uebung.saetze, { id: Date.now(), wiederholungen: null, gewicht: gewicht }],
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
            const muscleGroupIdResult: { id: number } | null = await database.getFirstAsync(getMuscleGroupIdForName(gruppe));
            const muscleGroupId = muscleGroupIdResult?.id;

            if (!muscleGroupId) {
                Alert.alert("Fehler", "Muskelgruppe nicht gefunden!");
                return;
            }

            const isUpdate = !!route.params.id;
            let trainingId = route.params.id;

            if (isUpdate) {
                if (JSON.stringify(uebungen) === JSON.stringify(originalUebungen)) {
                    console.log('Keine Änderungen festgestellt, überspringe Speichern.');
                    navigation.popToTop();
                    return;
                }
                // Erst Sätze löschen
                await database.runAsync(deleteSatzFromTraining(trainingId!));

                // Dann Übungen löschen
                await database.runAsync(deleteTraining(trainingId!));
            } else {
                const trainingInsert = await database.runAsync(addTraining(datum, muscleGroupId));
                trainingId = trainingInsert.lastInsertRowId.toString();
            }

            for (const uebung of uebungen) {
                const validSets = uebung.saetze.filter(s => s.wiederholungen && s.wiederholungen > 0);

                if (validSets.length === 0) {
                    continue;
                }


                const existingExercise: { id: number } | null = await database.getFirstAsync(getIdForUebung(uebung.name));

                let exerciseId;
                if (existingExercise) {
                    exerciseId = existingExercise.id;
                } else {
                    const insertExercise = await database.runAsync(addUebungToDatabase(uebung.name));
                    exerciseId = insertExercise.lastInsertRowId;
                }

                await database.runAsync(connectMuscleGroupAndUebung(muscleGroupId, exerciseId));

                const exerciseTrainingInsert = await database.runAsync(addExerciseToTraining(trainingId!, exerciseId));
                const exerciseTrainingId = exerciseTrainingInsert.lastInsertRowId;

                for (const satz of uebung.saetze) {
                    await database.runAsync(addSatzToDatabase(exerciseTrainingId, satz.gewicht ?? 0, satz.wiederholungen ?? 0));
                }
            }
            navigation.popToTop();
        } catch (error) {
            console.error("❌ Fehler beim Speichern:", error);
        }
    }

    return (
        <KeyboardAvoidingView behavior={"height"}  style={globalStyles.screenContainer}>
            <TextIconButton iconName='add' color={hightlight} onPress={() => addUebung()} iconSize={20} stylePressable={styles.addUebung} styleText={styles.addUebungText} title="Übung hinzufügen"/>
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
            <BigButton
                title='Fertig'
                onPress={()=> saveTraining()}/>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    addUebung: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    addUebungText: {
        color: hightlight,
        fontSize: 20,
    },
    deleteText: {
        color: "red",
        fontWeight: "bold",
        marginLeft: 10,
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
