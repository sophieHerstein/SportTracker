import {IKraftsportUebungListItemProps} from "../../../models/interfaces";
import {Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View} from "react-native";
import SatzListItem from "./SatzListItem";
import TextIconButton from "../../../components/TextIconButton";
import {MaterialIcons} from "@expo/vector-icons";
import {
    borderColor,
    highlight,
    primary,
    surfaceElevated,
    textColorMuted,
} from "../../../models/constants";
import {globalStyles} from "../../../utils/global-styles";
import {useEffect, useMemo, useRef, useState} from "react";
import KraftsportUebungModal from "./KraftsportUebungModal";
import {KraftsportService} from "../../../services/kraftsport.service";

export default function KraftsportUebungListItem({
    uebung,
    updateSatz,
    deleteSatz,
    duplicateSatz,
    updateUebungName,
    confirmUebungName,
    addSatz,
    deleteUebung,
    moveUebung,
    canMoveUp,
    canMoveDown,
}: IKraftsportUebungListItemProps) {
    const [cardStyle, setCardStyle] = useState<any>(globalStyles.cards);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [suggestions, setSuggestions] = useState<{id: number; name: string}[]>([]);
    const [allExercises, setAllExercises] = useState<{id: number; name: string}[]>([]);
    const isSelectingSuggestionRef = useRef(false);

    const kraftsportService = useMemo(() => new KraftsportService(), []);

    useEffect(() => {
        if (!uebung.exerciseId) {
            setCardStyle(globalStyles.cards);
            return;
        }

        kraftsportService.getNoMoreIncrease(uebung.exerciseId).then((result) => {
            if (uebung.weightShouldBeIncreased && result?.no_more_increase === 0) {
                setCardStyle({...globalStyles.cards, borderColor: primary, borderWidth: 4});
            } else {
                setCardStyle(globalStyles.cards);
            }
        });
    }, [modalVisible, uebung.exerciseId]);

    useEffect(() => {
        loadExercises();
    }, []);

    async function loadExercises() {
        const result = await kraftsportService.getAllUebungen();
        setAllExercises(result);
    }

    function normalizeName(name: string): string {
        return name.trim().toLowerCase();
    }

    function getSuggestions(input: string): {id: number; name: string}[] {
        if (!input || input.length < 2) return [];

        const normalized = normalizeName(input);

        return allExercises
            .filter((exercise) => normalizeName(exercise.name).includes(normalized))
            .sort((a, b) => {
                const aStarts = normalizeName(a.name).startsWith(normalized);
                const bStarts = normalizeName(b.name).startsWith(normalized);
                return Number(bStarts) - Number(aStarts);
            })
            .slice(0, 5);
    }

    function confirmDeleteExercise() {
        Alert.alert(
            "Übung entfernen?",
            `„${uebung.name || "Diese Übung"}“ wird aus dem aktuellen Training entfernt.`,
            [
                {text: "Abbrechen", style: "cancel"},
                {
                    text: "Entfernen",
                    style: "destructive",
                    onPress: () => deleteUebung(uebung.id),
                },
            ]
        );
    }

    return (
        <View style={cardStyle}>
            <View style={styles.cardHeader}>
                <View style={styles.orderButtons}>
                    <Pressable
                        disabled={!canMoveUp}
                        style={!canMoveUp && styles.disabled}
                        onPress={() => moveUebung(uebung.id, "up")}
                    >
                        <MaterialIcons name="arrow-upward" size={24} color={highlight} />
                    </Pressable>
                    <Pressable
                        disabled={!canMoveDown}
                        style={!canMoveDown && styles.disabled}
                        onPress={() => moveUebung(uebung.id, "down")}
                    >
                        <MaterialIcons name="arrow-downward" size={24} color={highlight} />
                    </Pressable>
                </View>
                <Text style={styles.exerciseLabel}>ÜBUNG</Text>
                <Pressable onPress={confirmDeleteExercise}>
                    <MaterialIcons name="delete-outline" size={24} color={primary} />
                </Pressable>
            </View>
            <View style={styles.rowWithInfo}>
                <TextInput
                    style={[
                        globalStyles.input,
                        styles.nameInput,
                        uebung.nameConfirmed === false && styles.unconfirmedInput,
                    ]}
                    placeholderTextColor={highlight}
                    placeholder="Übungsname"
                    value={uebung.name}
                    returnKeyType="done"
                    blurOnSubmit={true}
                    onChangeText={(text) => {
                        updateUebungName(uebung.id, text);
                        setSuggestions(getSuggestions(text));
                    }}
                    onFocus={() => setSuggestions(getSuggestions(uebung.name))}
                    onEndEditing={() => {
                        if (isSelectingSuggestionRef.current) {
                            isSelectingSuggestionRef.current = false;
                            return;
                        }
                        confirmUebungName(uebung.id, uebung.name);
                        setSuggestions([]);
                    }}
                />
                <MaterialIcons
                    style={styles.infoIcon}
                    name="info-outline"
                    size={20}
                    color={textColorMuted}
                    onPress={() => setModalVisible(true)}
                />
            </View>
            {suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    {suggestions.map((suggestion) => (
                        <Pressable
                            key={suggestion.id}
                            onPressIn={() => {
                                isSelectingSuggestionRef.current = true;
                            }}
                            onPress={() => {
                                updateUebungName(uebung.id, suggestion.name);
                                confirmUebungName(uebung.id, suggestion.name, suggestion.id);
                                setSuggestions([]);
                            }}
                            style={styles.suggestionItem}
                        >
                            <Text style={styles.suggestionText}>{suggestion.name}</Text>
                        </Pressable>
                    ))}
                </View>
            )}
            <KraftsportUebungModal
                uebung={uebung}
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
            ></KraftsportUebungModal>
            <FlatList
                data={uebung.saetze}
                keyboardShouldPersistTaps="handled"
                keyExtractor={(satz) => satz.id.toString()}
                renderItem={({item: satz}) => (
                    <SatzListItem
                        satz={satz}
                        uebungId={uebung.id}
                        updateSatz={updateSatz}
                        deleteSatz={deleteSatz}
                        duplicateSatz={duplicateSatz}
                    />
                )}
            />
            <TextIconButton
                onPress={() => addSatz(uebung.id)}
                iconName="add"
                stylePressable={styles.addSatz}
                color={highlight}
                iconSize={20}
                styleText={styles.addSatzText}
                title="Satz hinzufügen"
            />
        </View>
    );
}

const styles = StyleSheet.create({
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
        color: highlight,
        fontSize: 16,
    },
    rowWithInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 2,
    },
    orderButtons: {
        flexDirection: "row",
        gap: 12,
    },
    disabled: {
        opacity: 0.25,
    },
    suggestionsContainer: {
        backgroundColor: surfaceElevated,
        borderWidth: 1,
        borderColor,
        borderRadius: 12,
        marginBottom: 10,
        overflow: "hidden",
    },
    suggestionItem: {
        paddingVertical: 11,
        paddingHorizontal: 13,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: borderColor,
    },
    suggestionText: {
        color: highlight,
        fontSize: 15,
    },
    unconfirmedInput: {
        borderColor: "#F0A23B",
    },
    exerciseLabel: {
        color: textColorMuted,
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 1,
    },
    nameInput: {
        flex: 1,
        width: undefined,
        marginRight: 8,
    },
    infoIcon: {
        padding: 10,
    },
});
