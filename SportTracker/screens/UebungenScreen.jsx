import React, {useEffect, useState} from "react";
import {View, Text, TextInput, Button, FlatList, Pressable, StyleSheet, Alert, ActivityIndicator} from "react-native";
import BigButton from "../components/BigButton";
import {MaterialIcons} from "@expo/vector-icons";
import * as SQLite from "expo-sqlite";

const database = SQLite.openDatabaseSync('training.db');

export default function UebungenScreen({navigation, route}) {
    const { datum, gruppe } = route.params;
    const [uebungen, setUebungen] = useState(() => []);    const [removedExercises, setRemovedExercises] = useState({});

    useEffect(() => {
        loadExistingTraining();
    }, []);

    // Prüfen, ob bereits Trainings für diese Muskelgruppe existieren
    async function loadExistingTraining(){
        try {
            const existingTrainings = await database.getAllAsync(
                `SELECT e.name, es.weight, COUNT(es.id) as sets
                 FROM training t
                          JOIN exercise_training et ON t.id = et.training_id
                          JOIN exercise e ON et.exercise_id = e.id
                          JOIN exercise_set es ON et.id = es.exercise_training_id
                 WHERE t.muscle_group_id = (SELECT id FROM muscle_group WHERE name = ?)
                   AND t.date = (SELECT MAX(date) FROM training WHERE muscle_group_id = t.muscle_group_id) -- Letztes Training
                 GROUP BY e.name, es.weight
                 ORDER BY t.date DESC;`,
                gruppe
            );

            if (existingTrainings.length > 0) {
                // Bestehende Übungen mit Gewicht & Sätze vorbelegen
                const newExercises = existingTrainings.map((ex, index) => ({
                    id: Date.now()+index, // Temporäre ID für die UI
                    name: ex.name,
                    saetze: Array.from({ length: ex.sets }, () => ({ gewicht: ex.weight, wdh: "", id: new Date().getTime() + Math.random() * 1000 })),
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

    function deleteUebung(uebungId){
        const updatedExercises = uebungen.filter((uebung) => uebung.id !== uebungId);
        setUebungen(updatedExercises);

        setRemovedExercises((prev) => {
            const newCount = (prev[name] || 0) + 1;

            if (newCount >= 5) {
                Alert.alert(
                    "Übung dauerhaft entfernen?",
                    `Diese Übung wurde bereits ${newCount} Mal entfernt. Soll sie dauerhaft aus der Muskelgruppe gelöscht werden?`,
                    [
                        { text: "Nein", style: "cancel" },
                        {
                            text: "Ja",
                            onPress: async () => {
                                try {
                                    await database.runAsync(
                                        "DELETE FROM exercise_muscle_group WHERE exercise_id = (SELECT id FROM exercise WHERE name = ?) AND muscle_group_id = (SELECT id FROM muscle_group WHERE name = ?)",
                                        name, gruppe
                                    );
                                    Alert.alert("Übung dauerhaft entfernt!");
                                } catch (error) {
                                    console.error("Fehler beim dauerhaften Löschen:", error);
                                }
                            }
                        }
                    ]
                );
            }

            return { ...prev, [name]: newCount };
        });
    }

    function updateUebungName(uebungId, newName) {
        setUebungen(
            uebungen.map((uebung) =>
                uebung.id === uebungId ? { ...uebung, name: newName } : uebung
            )
        );
    }

    function addSatz(uebungId) {
        setUebungen(
            uebungen.map((uebung) =>
                uebung.id === uebungId
                    ? {
                        ...uebung,
                        saetze: [...uebung.saetze, { id: Date.now(), wdh: "", gewicht: "" }],
                    }
                    : uebung
            )
        );
    }

    function deleteSatz(uebungId, satzId){
        setUebungen(
            uebungen.map((uebung) =>
                uebung.id === uebungId
                    ? { ...uebung, saetze: uebung.saetze.filter((satz) => satz.id !== satzId) }
                    : uebung
            )
        );
    }

    function updateSatz(uebungId, satzId, field, value) {
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

    // Training speichern
    async function saveTraining() {
        try {
            // Muskelgruppen-ID abrufen
            const muscleGroupIdResult = await database.getFirstAsync(
                "SELECT id FROM muscle_group WHERE name=?",
                gruppe
            );

            const muscleGroupId = muscleGroupIdResult?.id;

            if (!muscleGroupId) {
                Alert.alert("Fehler", "Muskelgruppe nicht gefunden!");
                return;
            }

            // Neues Training einfügen
            const trainingInsert = await database.runAsync(
                "INSERT INTO training (date, muscle_group_id) VALUES (?, ?)",
                datum, muscleGroupId
            );
            const trainingId = trainingInsert.lastInsertRowId;

            // Übungen & Sätze speichern
            for (const uebung of uebungen) {
                // Prüfen, ob die Übung bereits existiert, sonst hinzufügen
                const existingExercise = await database.getFirstAsync(
                    "SELECT id FROM exercise WHERE name = ?",
                    uebung.name
                );

                let exerciseId;
                if (existingExercise) {
                    exerciseId = existingExercise.id;
                } else {
                    const insertExercise = await database.runAsync(
                        "INSERT INTO exercise (name) VALUES (?)",
                        uebung.name
                    );
                    exerciseId = insertExercise.lastInsertRowId;
                }

                // Übung mit Muskelgruppe verknüpfen (falls nicht vorhanden)
                await database.runAsync(
                    "INSERT OR IGNORE INTO exercise_muscle_group (muscle_group_id, exercise_id) VALUES (?, ?)",
                    muscleGroupId, exerciseId
                );

                // Übung mit Training verknüpfen
                const exerciseTrainingInsert = await database.runAsync(
                    "INSERT INTO exercise_training (training_id, exercise_id) VALUES (?, ?)",
                    trainingId, exerciseId
                );
                const exerciseTrainingId = exerciseTrainingInsert.lastInsertRowId;

                // Sätze speichern
                for (const satz of uebung.saetze) {
                    await database.runAsync(
                        "INSERT INTO exercise_set (exercise_training_id, weight, repetitions) VALUES (?, ?, ?)",
                        exerciseTrainingId, satz.gewicht, satz.wdh
                    );
                }
            }

            Alert.alert("Training gespeichert!");
            navigation.goBack();
        } catch (error) {
            console.error("Fehler beim Speichern:", error);
        }
    }

    return (
        <View style={styles.container}>
            <Pressable style={styles.addUebung} onPress={() => addUebung()}>
                <MaterialIcons name='add' color='royalblue' size={20}></MaterialIcons>
                <Text style={styles.addUebungText}>Übung hinzufügen</Text>
            </Pressable>

            <FlatList
                data={uebungen || []} // Falls undefined, dann leeres Array nutzen
                keyExtractor={(item, index) => (item?.id ? item.id.toString() : index.toString())} // 🔥 Index als Fallback
                renderItem={({ item: uebung }) => (
                    <View style={styles.uebungContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Übungsname"
                            value={uebung.name}
                            onChangeText={(text) => updateUebungName(uebung.id, text)}
                        />

                        <FlatList
                            data={uebung.saetze}
                            keyExtractor={(satz) => satz.id}
                            renderItem={({ item: satz }) => (
                                <View style={styles.satzContainer}>
                                    <TextInput
                                        style={styles.satzInput}
                                        placeholder="Wdh"
                                        keyboardType="numeric"
                                        value={satz.wdh}
                                        onChangeText={(text) => updateSatz(uebung.id, satz.id, "wdh", text)}
                                    />
                                    <TextInput
                                        style={styles.satzInput}
                                        placeholder="Gewicht"
                                        keyboardType="numeric"
                                        value={satz.gewicht.toString()}
                                        onChangeText={(text) => updateSatz(uebung.id, satz.id, "gewicht", text)}
                                    />
                                    <Pressable onPress={() => deleteSatz(uebung.id, satz.id)}>
                                        <Text style={styles.deleteText}></Text>
                                        <MaterialIcons name='delete' size={24} />
                                    </Pressable>
                                </View>
                            )}
                        />
                        <Pressable style={styles.addSatz} onPress={() => addSatz(uebung.id)}>
                            <MaterialIcons name='add' color='royalblue' size={20}></MaterialIcons>
                            <Text style={styles.addSatzText}>Satz hinzufügen</Text>
                        </Pressable>
                        <Pressable style={styles.deleteUebung}  onPress={() => deleteUebung(uebung.id)}>
                            <MaterialIcons name='delete' color='red' size={20}></MaterialIcons>
                            <Text style={styles.deleteText}>Übung löschen</Text>
                        </Pressable>
                    </View>
                )}
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
