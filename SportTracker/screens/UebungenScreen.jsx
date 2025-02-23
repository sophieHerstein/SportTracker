import React, { useState } from "react";
import { View, Text, TextInput, Button, FlatList, Pressable, StyleSheet } from "react-native";
import BigButton from "../components/BigButton";
import {MaterialIcons} from "@expo/vector-icons";

export default function UebungenScreen({navigation, route}) {
    const [uebungen, setUebungen] = useState([]);

    const addUebung = () => {
        setUebungen([...uebungen, { id: Date.now(), name: "", saetze: [] }]);
    };

    const deleteUebung = (uebungId) => {
        setUebungen(uebungen.filter((uebung) => uebung.id !== uebungId));
    };

    const updateUebungName = (uebungId, newName) => {
        setUebungen(
            uebungen.map((uebung) =>
                uebung.id === uebungId ? { ...uebung, name: newName } : uebung
            )
        );
    };

    const addSatz = (uebungId) => {
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
    };

    const deleteSatz = (uebungId, satzId) => {
        setUebungen(
            uebungen.map((uebung) =>
                uebung.id === uebungId
                    ? { ...uebung, saetze: uebung.saetze.filter((satz) => satz.id !== satzId) }
                    : uebung
            )
        );
    };

    const updateSatz = (uebungId, satzId, field, value) => {
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
    };

    function speichernUndZurueck(){
        const fullData = {
            id: Date.now().toString(),
            datum: route.params.datum,
            gruppe: route.params.gruppe,
            uebungen
        }
        navigation.navigate("kraftsportScreen", { gespeicherteUebungen: fullData });
    }

    return (
        <View style={styles.container}>
            <Pressable style={styles.addUebung} onPress={() => addUebung()}>
                <MaterialIcons name='add' color='royalblue' size={20}></MaterialIcons>
                <Text style={styles.addUebungText}>Übung hinzufügen</Text>
            </Pressable>

            <FlatList
                data={uebungen}
                keyExtractor={(uebung) => uebung.id.toString()}
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
                            keyExtractor={(satz) => satz.id.toString()}
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
                                        value={satz.gewicht}
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
            <BigButton style={styles.fertigButton} title='Fertig' onPress={()=> speichernUndZurueck()}></BigButton>
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
