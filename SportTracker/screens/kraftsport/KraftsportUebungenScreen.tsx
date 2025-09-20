import React, {useEffect, useMemo, useState} from "react";
import {Alert, FlatList, KeyboardAvoidingView, StyleSheet} from "react-native";
import BigButton from "../../components/BigButton";
import TextIconButton from "../../components/TextIconButton";
import KraftsportUebungListItem from "./components/KraftsportUebungListItem";
import {NativeStackScreenProps} from "@react-navigation/native-stack";
import {NavigatorParamList} from "../../Navigation";
import {EAppPaths, hightlight, textColorPrimary} from "../../models/constants";
import {IGewichtUebung, ISatz, ITrainingDatabase, IUebung} from "../../models/interfaces";
import {globalStyles} from "../../utils/global-styles";
import IconButton from "../../components/IconButton";
import {KraftsportService} from "../../services/kraftsport.service";

type KraftsportUebungenScreenProps = NativeStackScreenProps<NavigatorParamList, EAppPaths.KRAFTSPORT_UEBUNGEN>;

export default function KraftsportUebungenScreen({navigation, route}: KraftsportUebungenScreenProps) {
    const {datum, gruppe} = route.params;
    const [uebungen, setUebungen] = useState<IUebung[]>(() => []);
    const [originalUebungen, setOriginalUebungen] = useState<IUebung[]>([]);

    const kraftsportService = useMemo(() => new KraftsportService(), []);

    useEffect(() => {
        navigation.setOptions({
            headerLeft: () =>
                <IconButton onPress={() => showAlert()} icon='arrow-back-ios-new' color={textColorPrimary} size={24}/>
        });
    }, [navigation, uebungen]);

    useEffect(() => {
        if (route.params.id) {
            loadTrainingForEditing(route.params.id);
        } else {
            loadTrainingForNewSession();
        }
    }, []);

    function showAlert() {
        Alert.alert(
            "Training speichern?",
            "Soll das Training gespeichert werden?",
            [{text: "Nein", onPress: () => navigation.popToTop(), style: "destructive"}, {
                text: "Ja",
                onPress: () => saveTraining()
            }]
        )
    }

    async function loadTrainingForNewSession() {
        try {
            const muscleGroupIdResult = await kraftsportService.getMuscleGroupIdForName(gruppe);
            const muscleGroupId = muscleGroupIdResult?.id;

            if (!muscleGroupId) {
                Alert.alert("Fehler", "Muskelgruppe nicht gefunden!");
                return;
            }

            const existingTrainings = await kraftsportService.getLastUebungDataForGruppe(muscleGroupId);

            if (existingTrainings.length === 0) {
                setUebungen([]);
                setOriginalUebungen([]);
                return;
            }

            const newExercises: IUebung[] = []

            existingTrainings.forEach((training) => {
                if(newExercises.some((e)=> e.id === training.exercise_id)){
                    const existingExercise = newExercises.find((e)=> e.id === training.exercise_id);
                    if(existingExercise){
                        existingExercise.saetze.push({
                            id: training.set_id,
                            gewicht: training.weight,
                            wiederholungen: null
                        })
                    }
                } else {
                    newExercises.push({
                        id: training.exercise_id,
                        name: training.exercise_name,
                        saetze: [{
                            id: training.set_id,
                            gewicht: training.weight,
                            wiederholungen: null
                        }],
                    })
                }
            })

            const enrichedExercises = await Promise.all(
                newExercises.map(async (exercise) => {
                    const result = await kraftsportService.shouldWeightBeIncreased(exercise.name);
                    return {
                        ...exercise,
                        weightShouldBeIncreased: result?.increaseWeight === 1,
                    };
                })
            );

            setUebungen(enrichedExercises);
            setOriginalUebungen(JSON.parse(JSON.stringify(enrichedExercises)));
        } catch (error) {
            console.error("❌ Fehler beim Initialisieren des Trainings:", error);
        }
    }

    async function loadTrainingForEditing(trainingId: string) {
        try {
            const result = await kraftsportService.getExercisesForTraining(trainingId);

            const exercisesMap: Record<number, IUebung> = {};

            for (const row of result) {
                if (!exercisesMap[row.exercise_id]) {
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

            const exercises = Object.values(exercisesMap)
                .filter((uebung) => uebung.name.toLowerCase() !== gruppe.toLowerCase());

            setUebungen(exercises);
            setOriginalUebungen(JSON.parse(JSON.stringify(exercises)));
        } catch (error) {
            console.error("❌ Fehler beim Laden des bestehenden Trainings:", error);
        }
    }

    function addUebung() {
        setUebungen([...uebungen, {id: Date.now(), name: "", saetze: []}]);
    }

    async function deleteUebung(uebungId: number) {
        const updatedExercises = uebungen.filter((uebung) => uebung.id !== uebungId);
        setUebungen(updatedExercises);

        const result: {
            should_unlink: number
        } | null = await kraftsportService.shouldExerciseAndMuscleGroupBeUnlinked(uebungId);

        if (result?.should_unlink === 1) {
            Alert.alert(
                "Übung aus Gruppe entfernen?",
                "Soll die Übung dauerhaft aus dieser Muskelgruppe entfernt werden?",
                [{text: "Nein"}, {
                    text: "Ja",
                    style: "destructive",
                    onPress: () => deleteUebungFromMuscleGroup(uebungId)
                }]
            )
        }
    }

    async function deleteUebungFromMuscleGroup(uebungId: number) {
        await kraftsportService.deleteUebungReferenzFromGruppe(uebungId, gruppe);
    }

    async function updateUebungName(uebungId: number, newName: string) {
        const uebungData: IGewichtUebung | null = await kraftsportService.getLastWeightForUebung(newName)
        if (!!uebungData) {
            setUebungen(
                uebungen.map((uebung) =>
                    uebung.id === uebungId
                        ? {
                            ...uebung,
                            name: newName,
                            saetze: Array.from({length: uebungData.satz_anzahl},
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
                    uebung.id === uebungId ? {...uebung, name: newName} : uebung
                )
            );
        }
    }

    function addSatz(uebungId: number) {
        let gewicht = null;
        const saetzeFromUebung = uebungen.filter((uebung) => uebung.id === uebungId)[0].saetze;
        if (saetzeFromUebung && saetzeFromUebung.length >= 1) {
            gewicht = saetzeFromUebung[saetzeFromUebung.length - 1].gewicht;
        }
        setUebungen(
            uebungen.map((uebung) =>
                uebung.id === uebungId
                    ? {
                        ...uebung,
                        saetze: [...uebung.saetze, {id: Date.now(), wiederholungen: null, gewicht: gewicht}],
                    }
                    : uebung
            )
        );
    }

    function deleteSatz(uebungId: number, satzId: number) {
        setUebungen(
            uebungen.map((uebung) =>
                uebung.id === uebungId
                    ? {...uebung, saetze: uebung.saetze.filter((satz) => satz.id !== satzId)}
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
                            satz.id === satzId ? {...satz, [field]: value} : satz
                        ),
                    }
                    : uebung
            )
        );
    }

    async function saveTraining() {
        try {
            const muscleGroupIdResult: { id: number } | null = await kraftsportService.getMuscleGroupIdForName(gruppe);
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
                await kraftsportService.deleteSatzFromTraining(trainingId!);

                // Dann Übungen löschen
                await kraftsportService.deleteTraining(trainingId!);
            } else {
                const trainingInsert = await kraftsportService.addTraining(datum, muscleGroupId);
                trainingId = trainingInsert.lastInsertRowId.toString();
            }

            for (const uebung of uebungen) {
                const existingExercise: { id: number } | null = await kraftsportService.getIdForUebung(uebung.name);

                let exerciseId;
                if (existingExercise) {
                    exerciseId = existingExercise.id;
                } else {
                    const insertExercise = await kraftsportService.addUebungToDatabase(uebung.name);
                    exerciseId = insertExercise.lastInsertRowId;
                }

                await kraftsportService.connectMuscleGroupAndUebung(muscleGroupId, exerciseId);

                const exerciseTrainingInsert = await kraftsportService.addExerciseToTraining(trainingId!, exerciseId);
                const exerciseTrainingId = exerciseTrainingInsert.lastInsertRowId;

                for (const satz of uebung.saetze) {
                    await kraftsportService.addSatzToDatabase(exerciseTrainingId, satz.gewicht ?? 0, satz.wiederholungen ?? 0);
                }
            }
            navigation.popToTop();
        } catch (error) {
            console.error("❌ Fehler beim Speichern:", error);
        }
    }

    return (
        <KeyboardAvoidingView behavior={"height"} style={globalStyles.screenContainer}>
            <TextIconButton iconName='add' color={hightlight} onPress={() => addUebung()} iconSize={20}
                            stylePressable={styles.addUebung} styleText={styles.addUebungText}
                            title="Übung hinzufügen"/>
            <FlatList
                data={uebungen || []}
                keyExtractor={(item, index) => (item?.id ? item.id.toString() : index.toString())}
                renderItem={({item: uebung}) =>
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
                onPress={() => saveTraining()}/>
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
