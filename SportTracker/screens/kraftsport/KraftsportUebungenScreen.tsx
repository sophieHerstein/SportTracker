import React, {useEffect, useMemo, useRef, useState} from "react";
import {Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet} from "react-native";
import BigButton from "../../components/BigButton";
import TextIconButton from "../../components/TextIconButton";
import KraftsportUebungListItem from "./components/KraftsportUebungListItem";
import {NativeStackScreenProps} from "@react-navigation/native-stack";
import {NavigatorParamList} from "../../Navigation";
import {EAppPaths, highlight, textColorPrimary} from "../../models/constants";
import {IGewichtUebung, ISatz, IUebung} from "../../models/interfaces";
import {globalStyles} from "../../utils/global-styles";
import IconButton from "../../components/IconButton";
import {KraftsportService} from "../../services/kraftsport.service";
import {debounce} from "lodash";
import {getTageszeit} from "../../utils/helper";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

type KraftsportUebungenScreenProps = NativeStackScreenProps<NavigatorParamList, EAppPaths.KRAFTSPORT_UEBUNGEN>;

export default function KraftsportUebungenScreen({navigation, route}: KraftsportUebungenScreenProps) {
    const {datum, gruppe} = route.params;
    const [uebungen, setUebungen] = useState<IUebung[]>(() => []);
    const [originalUebungen, setOriginalUebungen] = useState<IUebung[]>([]);

    const isSavingRef = useRef(false);
    const trainingIdRef = useRef<string | null>(route.params.id ?? null);

    const kraftsportService = useMemo(() => new KraftsportService(), []);

    useEffect(() => {
        navigation.setOptions({
            headerLeft: () =>
                <IconButton onPress={() => showAlert()} icon='arrow-back-ios-new' color={textColorPrimary} size={24}/>,
        });
    }, [navigation, uebungen]);

    useEffect(() => {
        if (trainingIdRef.current) {
            loadTrainingForEditing(trainingIdRef.current);
        } else {
            loadTrainingForNewSession();
        }
    }, []);

    useEffect(() => {
        autoSave(uebungen, originalUebungen);
    }, [uebungen]);

    const autoSave = useRef(
        debounce(async (uebungenCopy: IUebung[], originalCopy: IUebung[]) => {

            const hasChanged = JSON.stringify(uebungenCopy) !== JSON.stringify(originalCopy);

            if (!hasChanged || !uebungenCopy.length) return;

            console.log("⚡ AutoSave läuft");

            await saveTraining(uebungenCopy, { silent: true });

            setOriginalUebungen(JSON.parse(JSON.stringify(uebungenCopy)));

        }, 1500)
    ).current;

    function normalizeName(name: string): string {
        return name.trim().toLowerCase().replace(/\s+/g, " ");
    }

    function isSimilarName(a: string, b: string): boolean {
        const na = normalizeName(a);
        const nb = normalizeName(b);

        if (na === nb) return true;

        // einfache Heuristik: einer enthält den anderen
        if (na.includes(nb) || nb.includes(na)) return true;

        // optional: minimale Levenshtein-Distanz
        const maxDistance = 4; // z. B. 2 Zeichen Abweichung erlauben
        return levenshteinDistance(na, nb) <= maxDistance;
    }

    function levenshteinDistance(a: string, b: string): number {
        const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));

        for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
        for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,     // löschen
                    matrix[i][j - 1] + 1,     // einfügen
                    matrix[i - 1][j - 1] + cost // ersetzen
                );
            }
        }

        return matrix[a.length][b.length];
    }

    function showAlert() {
        Alert.alert(
            "Training speichern?",
            "Soll das Training gespeichert werden?",
            [
                { text: "Nein", onPress: () => navigation.popToTop(), style: "destructive" },
                {
                    text: "Ja",
                    onPress: async () => {
                        await saveTraining(uebungen);
                        navigation.popToTop();
                    }
                }
            ]
        );
    }

    async function loadTrainingForNewSession() {
        try {
            // 1. Alle Übungen für diese Muskelgruppe laden
            const allExercises = await kraftsportService.getLastUebungDataForGruppe(gruppe);

            const newExercises: IUebung[] = [];

            for (const ex of allExercises) {
                // 2. Letzte Daten (unabhängig von Muskelgruppe) holen
                const lastData: IGewichtUebung | null = await kraftsportService.getLastWeightForUebung(ex.name);

                let saetze: ISatz[] = [];

                if (lastData) {
                    // 3. Vorbelegung mit letzter Satzanzahl und Gewicht
                    saetze = Array.from({ length: lastData.satz_anzahl }, (): ISatz => ({
                        id: Date.now() + Math.random(),
                        gewicht: lastData.weight,
                        wiederholungen: null
                    }));
                }

                newExercises.push({
                    id: ex.id,
                    name: ex.name,
                    saetze
                });
            }

            // 4. Option: gleich prüfen ob Gewicht gesteigert werden sollte
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

    async function saveTraining(uebungen: IUebung[], options?: { silent?: boolean }) {
        if (isSavingRef.current) return;
        isSavingRef.current = true;
        try {
            console.log("Saving...");
            const muscleGroupIdResult = await kraftsportService.getMuscleGroupIdForName(gruppe);
            const muscleGroupId = muscleGroupIdResult?.id;

            if (!muscleGroupId) {
                if (!options?.silent) {
                    Alert.alert("Fehler", "Muskelgruppe nicht gefunden!");
                }
                return;
            }

            let currentTrainingId = trainingIdRef.current;
            const isUpdate = !!currentTrainingId;


            if (isUpdate) {
                if (JSON.stringify(uebungen) === JSON.stringify(originalUebungen)) {
                    return;
                }

                // ❗️WICHTIG: Training NICHT löschen
                await kraftsportService.deleteSatzFromTraining(currentTrainingId!);
            } else {
                const tagesZeit = getTageszeit();
                const trainingInsert = await kraftsportService.addTraining(
                    datum,
                    muscleGroupId,
                    tagesZeit,
                    !!options?.silent
                );
                currentTrainingId = trainingInsert.lastInsertRowId.toString();
                trainingIdRef.current = currentTrainingId; // 👈 sofort synchron gesetzt
            }

            // 💪 hier immer mit currentTrainingId arbeiten, NICHT mit State
            for (const uebung of uebungen) {
                const existingExercise = await kraftsportService.getIdForUebung(uebung.name);
                let exerciseId = existingExercise?.id;

                if (!exerciseId) {
                    const insert = await kraftsportService.addUebungToDatabase(uebung.name);
                    exerciseId = insert.lastInsertRowId;
                }

                await kraftsportService.connectMuscleGroupAndUebung(muscleGroupId, exerciseId);

                // ✅ lokale Variable verwenden
                const trainingEntry = await kraftsportService.addExerciseToTraining(currentTrainingId!, exerciseId);
                const exerciseTrainingId = trainingEntry.lastInsertRowId;

                for (const satz of uebung.saetze) {
                    await kraftsportService.addSatzToDatabase(exerciseTrainingId, satz.gewicht ?? 0, satz.wiederholungen ?? 0);
                }
            }
        } catch (error) {
            console.error("❌ Fehler beim Speichern:", error);
        } finally {
            isSavingRef.current = false;
        }
    }


    return (
        <KeyboardAvoidingView
            style={[globalStyles.screenContainer, {paddingTop: 0}]}
            behavior={"padding"}
            keyboardVerticalOffset={100}
        >
            <TextIconButton iconName='add' color={highlight} onPress={() => addUebung()} iconSize={20}
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
                onPress={async () => {
                    await saveTraining(uebungen);
                    navigation.popToTop();
                }}
            />
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
        color: highlight,
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
