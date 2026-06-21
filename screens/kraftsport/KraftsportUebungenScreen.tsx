import React, {useEffect, useMemo, useRef, useState} from "react";
import {
    Alert,
    AppState,
    FlatList,
    KeyboardAvoidingView,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import TextIconButton from "../../components/TextIconButton";
import KraftsportUebungListItem from "./components/KraftsportUebungListItem";
import {NativeStackScreenProps} from "@react-navigation/native-stack";
import {NavigatorParamList} from "../../Navigation";
import {
    borderColor,
    EAppPaths,
    primary,
    success,
    textColorMuted,
    textColorPrimary,
    warning,
} from "../../models/constants";
import {ISatz, IUebung} from "../../models/interfaces";
import {globalStyles} from "../../utils/global-styles";
import IconButton from "../../components/IconButton";
import {KraftsportService} from "../../services/kraftsport.service";
import {debounce} from "lodash";
import {getTageszeit} from "../../utils/helper";

type KraftsportUebungenScreenProps = NativeStackScreenProps<
    NavigatorParamList,
    EAppPaths.KRAFTSPORT_UEBUNGEN
>;
type SaveStatus = "saved" | "unsaved" | "saving" | "error";

export default function KraftsportUebungenScreen({
    navigation,
    route,
}: KraftsportUebungenScreenProps) {
    const {datum, gruppe} = route.params;
    const [uebungen, setUebungen] = useState<IUebung[]>(() => []);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
    const [saveError, setSaveError] = useState<string | null>(null);

    const flatListRef = useRef<FlatList>(null);
    const trainingIdRef = useRef<string | null>(route.params.id ?? null);
    const latestExercisesRef = useRef<IUebung[]>([]);
    const savedSnapshotRef = useRef<string>("");
    const isInitializedRef = useRef(false);
    const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
    const isFinishingRef = useRef(false);
    const isDiscardingRef = useRef(false);
    const initialExercisesRef = useRef<IUebung[]>([]);
    const originalTrainingIdRef = useRef<string | null>(route.params.id ?? null);
    const createdExerciseIdsRef = useRef<Set<number>>(new Set());

    const kraftsportService = useMemo(() => new KraftsportService(), []);

    useEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <IconButton
                    onPress={() => showAlert()}
                    icon="arrow-back-ios-new"
                    color={textColorPrimary}
                    size={24}
                />
            ),
        });
    }, [navigation, uebungen]);

    useEffect(() => {
        if (trainingIdRef.current) {
            loadTrainingForEditing(trainingIdRef.current);
        } else {
            loadTrainingForNewSession();
        }
    }, []);

    const autoSave = useRef(
        debounce((exercises: IUebung[]) => {
            void enqueueSave(exercises, true);
        }, 1500)
    ).current;

    useEffect(() => {
        latestExercisesRef.current = cloneExercises(uebungen);
        if (!isInitializedRef.current || isDiscardingRef.current) return;

        const snapshot = serializeExercises(uebungen);
        if (snapshot === savedSnapshotRef.current) return;

        setSaveStatus("unsaved");
        setSaveError(null);
        if (uebungen.some((exercise) => exercise.exerciseId && exercise.nameConfirmed === false)) {
            autoSave.cancel();
            return;
        }
        autoSave(cloneExercises(uebungen));
    }, [uebungen]);

    useEffect(() => {
        return () => autoSave.cancel();
    }, []);

    useEffect(() => {
        const subscription = AppState.addEventListener("change", (nextState) => {
            if (nextState === "active" || !isInitializedRef.current || isDiscardingRef.current)
                return;
            if (serializeExercises(latestExercisesRef.current) === savedSnapshotRef.current) return;

            autoSave.cancel();
            const recoverableSnapshot = confirmValidExerciseNames(latestExercisesRef.current);
            latestExercisesRef.current = recoverableSnapshot;
            setUebungen(recoverableSnapshot);
            void enqueueSave(recoverableSnapshot, true);
        });

        return () => subscription.remove();
    }, []);

    function cloneExercises(exercises: IUebung[]): IUebung[] {
        return JSON.parse(JSON.stringify(exercises));
    }

    function serializeExercises(exercises: IUebung[]): string {
        return JSON.stringify(exercises);
    }

    function confirmValidExerciseNames(exercises: IUebung[]): IUebung[] {
        return cloneExercises(exercises).map((exercise) => ({
            ...exercise,
            name: exercise.name.trim().replace(/\s+/g, " "),
            nameConfirmed: exercise.name.trim().length >= 2,
        }));
    }

    function initializeExercises(exercises: IUebung[]) {
        const cloned = cloneExercises(exercises);
        latestExercisesRef.current = cloned;
        savedSnapshotRef.current = serializeExercises(cloned);
        initialExercisesRef.current = cloneExercises(cloned);
        isInitializedRef.current = true;
        setUebungen(exercises);
        setSaveStatus("saved");
    }

    function getErrorMessage(error: unknown): string {
        return error instanceof Error ? error.message : "Unbekannter Speicherfehler";
    }

    function enqueueSave(exercises: IUebung[], silent: boolean): Promise<boolean> {
        const snapshot = cloneExercises(exercises);
        let saveSucceeded = false;

        const operation = saveQueueRef.current
            .catch(() => undefined)
            .then(async () => {
                setSaveStatus("saving");
                setSaveError(null);

                const result = await kraftsportService.saveTrainingAtomically({
                    trainingId: trainingIdRef.current ? Number(trainingIdRef.current) : null,
                    datum,
                    muscleGroupName: gruppe,
                    tageszeit: getTageszeit(),
                    requireAllExercisesValid: !silent,
                    exercises: snapshot,
                });

                trainingIdRef.current = result.trainingId.toString();
                const idMapping = new Map(result.exerciseIds.map((item) => [item.clientId, item]));
                result.exerciseIds.forEach((item) => {
                    if (item.createdDuringSave) {
                        createdExerciseIdsRef.current.add(item.exerciseId);
                    }
                });
                const applyIdMapping = (exercisesToMap: IUebung[]) =>
                    exercisesToMap.map((exercise) => {
                        const mapping = idMapping.get(exercise.id);
                        return mapping
                            ? {
                                  ...exercise,
                                  exerciseId: mapping.exerciseId,
                                  canRenameDuringAutosave: mapping.canRenameDuringAutosave,
                              }
                            : exercise;
                    });

                setUebungen((current) => applyIdMapping(current));
                latestExercisesRef.current = applyIdMapping(latestExercisesRef.current);
                savedSnapshotRef.current = serializeExercises(applyIdMapping(snapshot));
                saveSucceeded = true;

                if (result.savedExerciseCount < snapshot.length) {
                    setSaveStatus("unsaved");
                } else {
                    setSaveStatus("saved");
                }
            })
            .catch((error) => {
                const message = getErrorMessage(error);
                setSaveError(message);
                setSaveStatus(silent ? "unsaved" : "error");
                console.error("❌ Fehler beim Speichern:", error);
                if (!silent) {
                    Alert.alert("Training nicht gespeichert", message);
                }
            });

        saveQueueRef.current = operation.then(() => undefined);
        return operation.then(() => saveSucceeded);
    }

    async function finishTraining(): Promise<boolean> {
        if (isFinishingRef.current) return false;
        isFinishingRef.current = true;
        autoSave.cancel();

        try {
            await saveQueueRef.current;
            const finalSnapshot = confirmValidExerciseNames(latestExercisesRef.current);
            latestExercisesRef.current = finalSnapshot;
            setUebungen(finalSnapshot);
            return await enqueueSave(finalSnapshot, false);
        } finally {
            isFinishingRef.current = false;
        }
    }

    async function discardTraining(): Promise<void> {
        if (isDiscardingRef.current) return;
        isDiscardingRef.current = true;
        autoSave.cancel();

        try {
            await saveQueueRef.current;
            const currentTrainingId = trainingIdRef.current;

            if (originalTrainingIdRef.current) {
                const originalExercises = cloneExercises(initialExercisesRef.current).map(
                    (exercise) => ({
                        ...exercise,
                        canRenameDuringAutosave: true,
                        nameConfirmed: true,
                    })
                );
                await kraftsportService.saveTrainingAtomically({
                    trainingId: Number(originalTrainingIdRef.current),
                    datum,
                    muscleGroupName: gruppe,
                    tageszeit: getTageszeit(),
                    requireAllExercisesValid: false,
                    exercises: originalExercises,
                });
                await kraftsportService.deleteUnusedExercises(
                    Array.from(createdExerciseIdsRef.current)
                );
            } else if (currentTrainingId) {
                await kraftsportService.discardNewTraining(
                    Number(currentTrainingId),
                    Array.from(createdExerciseIdsRef.current)
                );
            }

            navigation.popToTop();
        } catch (error) {
            isDiscardingRef.current = false;
            Alert.alert("Training konnte nicht verworfen werden", getErrorMessage(error));
        }
    }

    function confirmDiscardTraining() {
        Alert.alert(
            "Training abbrechen?",
            originalTrainingIdRef.current
                ? "Alle Änderungen seit dem Öffnen werden verworfen und der vorherige Stand wiederhergestellt."
                : "Der durch Autosave gespeicherte Zwischenstand wird vollständig gelöscht.",
            [
                {text: "Weiter trainieren", style: "cancel"},
                {
                    text: "Training verwerfen",
                    style: "destructive",
                    onPress: () => void discardTraining(),
                },
            ]
        );
    }

    function showAlert() {
        Alert.alert(
            "Training schließen?",
            "Der aktuelle Stand wird vor dem Schließen vollständig gespeichert.",
            [
                {
                    text: "Weiter trainieren",
                    style: "cancel",
                },
                {
                    text: "Training verwerfen",
                    style: "destructive",
                    onPress: confirmDiscardTraining,
                },
                {
                    text: "Speichern & schließen",
                    onPress: async () => {
                        const saved = await finishTraining();
                        if (saved) navigation.popToTop();
                    },
                },
            ]
        );
    }

    async function loadTrainingForNewSession() {
        try {
            // 1. Alle Übungen für diese Muskelgruppe laden
            const allExercises = await kraftsportService.getLastUebungDataForGruppe(gruppe);

            const newExercises: IUebung[] = [];

            for (const ex of allExercises) {
                const lastSets = await kraftsportService.getLastSatzDataForUebung(ex.id);
                const saetze: ISatz[] = lastSets.map((set, index) => ({
                    id: Date.now() + index + Math.random(),
                    gewicht: set.weight,
                    wiederholungen: null,
                }));

                newExercises.push({
                    id: ex.id,
                    exerciseId: ex.id,
                    nameConfirmed: true,
                    name: ex.name,
                    saetze,
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

            initializeExercises(enrichedExercises);
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
                        exerciseId: row.exercise_id,
                        nameConfirmed: true,
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

            const exercises = Object.values(exercisesMap).filter(
                (uebung) => uebung.name.toLowerCase() !== gruppe.toLowerCase()
            );

            initializeExercises(exercises);
        } catch (error) {
            console.error("❌ Fehler beim Laden des bestehenden Trainings:", error);
        }
    }

    function addUebung() {
        setUebungen([
            ...uebungen,
            {
                id: Date.now(),
                name: "",
                saetze: [],
                canRenameDuringAutosave: true,
                nameConfirmed: false,
            },
        ]);
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({animated: true});
        }, 100);
    }

    async function deleteUebung(uebungId: number) {
        const exerciseToDelete = uebungen.find((uebung) => uebung.id === uebungId);
        const updatedExercises = uebungen.filter((uebung) => uebung.id !== uebungId);
        setUebungen(updatedExercises);

        if (!exerciseToDelete?.exerciseId) return;

        const result: {
            should_unlink: number;
        } | null = await kraftsportService.shouldExerciseAndMuscleGroupBeUnlinked(
            exerciseToDelete.exerciseId
        );

        if (result?.should_unlink === 1) {
            Alert.alert(
                "Übung aus Gruppe entfernen?",
                "Soll die Übung dauerhaft aus dieser Muskelgruppe entfernt werden?",
                [
                    {text: "Nein"},
                    {
                        text: "Ja",
                        style: "destructive",
                        onPress: () => deleteUebungFromMuscleGroup(exerciseToDelete.exerciseId!),
                    },
                ]
            );
        }
    }

    async function deleteUebungFromMuscleGroup(uebungId: number) {
        await kraftsportService.deleteUebungReferenzFromGruppe(uebungId, gruppe);
    }

    function updateUebungName(uebungId: number, newName: string) {
        setUebungen((prev) =>
            prev.map((uebung) =>
                uebung.id === uebungId
                    ? {
                          ...uebung,
                          name: newName,
                          nameConfirmed: false,
                      }
                    : uebung
            )
        );
    }

    async function confirmUebungName(
        uebungId: number,
        newName: string,
        selectedExerciseId?: number
    ) {
        const trimmedName = newName.trim();
        if (trimmedName.length < 2) {
            setSaveStatus("unsaved");
            return;
        }

        const existingExercise = selectedExerciseId
            ? {id: selectedExerciseId}
            : await kraftsportService.getIdForUebung(trimmedName);

        const duplicate = latestExercisesRef.current.some(
            (exercise) =>
                exercise.id !== uebungId &&
                ((existingExercise?.id && exercise.exerciseId === existingExercise.id) ||
                    exercise.name.trim().toLocaleLowerCase("de-DE") ===
                        trimmedName.toLocaleLowerCase("de-DE"))
        );

        if (duplicate) {
            Alert.alert("Übung bereits vorhanden", "Diese Übung ist schon Teil des Trainings.");
            return;
        }

        let previousSets: ISatz[] | null = null;
        if (existingExercise?.id) {
            const lastSets = await kraftsportService.getLastSatzDataForUebung(existingExercise.id);
            previousSets = lastSets.map((set, index) => ({
                id: Date.now() + index + Math.random(),
                gewicht: set.weight,
                wiederholungen: null,
            }));
        }

        setUebungen((prev) =>
            prev.map((uebung) => {
                if (uebung.id !== uebungId) return uebung;
                if (
                    uebung.name.trim().toLocaleLowerCase("de-DE") !==
                    trimmedName.toLocaleLowerCase("de-DE")
                )
                    return uebung;

                return {
                    ...uebung,
                    exerciseId: uebung.canRenameDuringAutosave
                        ? uebung.exerciseId
                        : existingExercise.id,
                    canRenameDuringAutosave: uebung.canRenameDuringAutosave ?? false,
                    name: trimmedName,
                    nameConfirmed: true,
                    saetze:
                        uebung.saetze.length === 0 && previousSets?.length
                            ? previousSets
                            : uebung.saetze,
                };
            })
        );
    }

    function addSatz(uebungId: number) {
        let gewicht = null;
        const saetzeFromUebung = uebungen.filter((uebung) => uebung.id === uebungId)[0].saetze;
        if (saetzeFromUebung && saetzeFromUebung.length >= 1) {
            gewicht = saetzeFromUebung[saetzeFromUebung.length - 1].gewicht;
        }
        const updated = uebungen.map((uebung) =>
            uebung.id === uebungId
                ? {
                      ...uebung,
                      saetze: [
                          ...uebung.saetze,
                          {id: Date.now(), wiederholungen: null, gewicht: gewicht},
                      ],
                  }
                : uebung
        );
        setUebungen(updated);
    }

    function moveUebung(uebungId: number, direction: "up" | "down") {
        setUebungen((current) => {
            const currentIndex = current.findIndex((exercise) => exercise.id === uebungId);
            if (currentIndex < 0) return current;

            const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
            if (targetIndex < 0 || targetIndex >= current.length) return current;

            const reordered = [...current];
            [reordered[currentIndex], reordered[targetIndex]] = [
                reordered[targetIndex],
                reordered[currentIndex],
            ];
            return reordered;
        });
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

    function duplicateSatz(uebungId: number, satzId: number) {
        setUebungen((current) =>
            current.map((exercise) => {
                if (exercise.id !== uebungId) return exercise;
                const setIndex = exercise.saetze.findIndex((set) => set.id === satzId);
                if (setIndex < 0) return exercise;

                const sourceSet = exercise.saetze[setIndex];
                const duplicatedSet: ISatz = {
                    ...sourceSet,
                    id: Date.now() + Math.random(),
                };
                const sets = [...exercise.saetze];
                sets.splice(setIndex + 1, 0, duplicatedSet);
                return {...exercise, saetze: sets};
            })
        );
    }

    function updateSatz(uebungId: number, satzId: number, field: string, value: string) {
        const updated = uebungen.map((uebung) =>
            uebung.id === uebungId
                ? {
                      ...uebung,
                      saetze: uebung.saetze.map((satz) =>
                          satz.id === satzId ? {...satz, [field]: value} : satz
                      ),
                  }
                : uebung
        );

        setUebungen(updated);
    }

    return (
        <KeyboardAvoidingView
            style={[globalStyles.screenContainer, {paddingTop: 0}]}
            behavior={"padding"}
            keyboardVerticalOffset={100}
        >
            <View style={styles.toolbar}>
                <TextIconButton
                    iconName="add"
                    color={primary}
                    onPress={() => addUebung()}
                    iconSize={21}
                    stylePressable={styles.addUebung}
                    styleText={styles.addUebungText}
                    title="Übung hinzufügen"
                />
                <View
                    style={[
                        styles.statusPill,
                        saveStatus === "saved" && styles.statusSaved,
                        saveStatus === "unsaved" && styles.statusUnsaved,
                        saveStatus === "error" && styles.statusError,
                    ]}
                >
                    <Text style={styles.saveStatus}>
                        {saveStatus === "saving" && "Speichert …"}
                        {saveStatus === "saved" && "Gespeichert"}
                        {saveStatus === "unsaved" && "Offene Eingabe"}
                        {saveStatus === "error" && "Fehler"}
                    </Text>
                </View>
            </View>
            {saveStatus === "error" && <Text style={styles.errorMessage}>{saveError}</Text>}
            <FlatList
                ref={flatListRef}
                data={uebungen || []}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.list}
                keyExtractor={(item, index) => (item?.id ? item.id.toString() : index.toString())}
                renderItem={({item: uebung, index}) => (
                    <KraftsportUebungListItem
                        uebung={uebung}
                        updateSatz={updateSatz}
                        deleteSatz={deleteSatz}
                        duplicateSatz={duplicateSatz}
                        updateUebungName={updateUebungName}
                        confirmUebungName={confirmUebungName}
                        addSatz={addSatz}
                        deleteUebung={deleteUebung}
                        moveUebung={moveUebung}
                        canMoveUp={index > 0}
                        canMoveDown={index < uebungen.length - 1}
                    />
                )}
            />
            <View style={styles.footerActions}>
                <Pressable
                    style={[globalStyles.buttonSecondary, styles.footerButton]}
                    onPress={confirmDiscardTraining}
                >
                    <Text style={globalStyles.buttonText}>Abbrechen</Text>
                </Pressable>
                <Pressable
                    style={[globalStyles.buttonPrimary, styles.footerButton]}
                    onPress={async () => {
                        const saved = await finishTraining();
                        if (saved) navigation.popToTop();
                    }}
                >
                    <Text style={globalStyles.buttonText}>Fertig</Text>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    addUebung: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        minHeight: 44,
    },
    addUebungText: {
        color: primary,
        fontSize: 15,
        fontWeight: "700",
    },
    toolbar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 54,
    },
    statusPill: {
        paddingHorizontal: 11,
        paddingVertical: 6,
        borderRadius: 14,
        borderWidth: 1,
        borderColor,
    },
    statusSaved: {
        borderColor: success,
    },
    statusUnsaved: {
        borderColor: warning,
    },
    statusError: {
        borderColor: primary,
    },
    saveStatus: {
        color: textColorMuted,
        fontSize: 12,
        fontWeight: "700",
    },
    errorMessage: {
        color: primary,
        fontSize: 13,
        marginBottom: 8,
    },
    list: {
        paddingTop: 4,
        paddingBottom: 16,
    },
    footerActions: {
        flexDirection: "row",
        gap: 10,
        paddingTop: 4,
        paddingBottom: 4,
    },
    footerButton: {
        flex: 1,
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
        color: "royalblue",
        fontSize: 16,
    },
});
