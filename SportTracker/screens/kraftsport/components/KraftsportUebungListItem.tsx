import {IKraftsportUebungListItemProps} from "../../../models/interfaces";
import {FlatList, Pressable, StyleSheet, Text, TextInput, View} from "react-native";
import SatzListItem from "./SatzListItem";
import TextIconButton from "../../../components/TextIconButton";
import {MaterialIcons} from "@expo/vector-icons";
import {highlight, primary} from "../../../models/constants";
import {globalStyles} from "../../../utils/global-styles";
import {useEffect, useMemo, useState} from "react";
import KraftsportUebungModal from "./KraftsportUebungModal";
import {KraftsportService} from "../../../services/kraftsport.service";
import BigButton from "../../../components/BigButton";

export default function KraftsportUebungListItem({
                                                     uebung,
                                                     updateSatz,
                                                     deleteSatz,
                                                     updateUebungName,
                                                     addSatz,
                                                     deleteUebung
                                                 }: IKraftsportUebungListItemProps) {

    const [cardStyle, setCardStyle] = useState<any>(globalStyles.cards);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [allExercises, setAllExercises] = useState<string[]>([]);

    const kraftsportService = useMemo(() => new KraftsportService(), []);

    useEffect(() => {
        kraftsportService.getNoMoreIncrease(uebung.id).then(
            (result) => {
                if (uebung.weightShouldBeIncreased && result?.no_more_increase === 0) {
                    setCardStyle({...globalStyles.cards, borderColor: primary, borderWidth: 4});
                } else {
                    setCardStyle(globalStyles.cards);
                }
            })
    }, [modalVisible]);

    useEffect(() => {
        loadExercises();
    }, []);

    async function loadExercises() {
        const result = await kraftsportService.getAllUebungen();
        setAllExercises(result.map(e => e.name));
    }

    function normalizeName(name: string): string {
        return name.trim().toLowerCase();
    }

    function getSuggestions(input: string): string[] {
        if (!input || input.length < 2) return [];

        const normalized = normalizeName(input);

        return allExercises
            .filter(name => normalizeName(name).includes(normalized))
            .sort((a, b) => {
                const aStarts = normalizeName(a).startsWith(normalized);
                const bStarts = normalizeName(b).startsWith(normalized);
                return Number(bStarts) - Number(aStarts);
            })
            .slice(0, 5);
    }

    return (
        <View style={cardStyle}>
            <View style={styles.rowWithInfo}>
                <TextInput
                    style={globalStyles.input}
                    placeholderTextColor={highlight}
                    placeholder="Übungsname"
                    value={uebung.name}
                    onChangeText={(text) => {
                        updateUebungName(uebung.id, text);
                        setSuggestions(getSuggestions(text));
                    }}
                />
                <MaterialIcons style={{alignSelf: "flex-start"}} name='info-outline' size={16} color={highlight}
                               onPress={() => setModalVisible(true)}/>
            </View>
            {suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    {suggestions.map((s, index) => (
                        <Pressable
                            key={index}
                            onPress={() => {
                                updateUebungName(uebung.id, s);
                                setSuggestions([]);
                            }}
                            style={styles.suggestionItem}
                        >
                            <Text>{s}</Text>
                        </Pressable>
                    ))}
                </View>
            )}
            <KraftsportUebungModal uebung={uebung} visible={modalVisible}
                                   onCancel={() => setModalVisible(false)}></KraftsportUebungModal>
            <FlatList
                data={uebung.saetze}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({item: satz}) =>
                    <SatzListItem
                        satz={satz}
                        uebungId={uebung.id}
                        updateSatz={updateSatz}
                        deleteSatz={deleteSatz}/>}
            />
            <TextIconButton
                onPress={() => addSatz(uebung.id)}
                iconName='add'
                stylePressable={styles.addSatz}
                color={highlight}
                iconSize={20}
                styleText={styles.addSatzText}
                title='Satz hinzufügen'/>
            <TextIconButton
                onPress={() => deleteUebung(uebung.id)}
                iconName='delete'
                stylePressable={styles.deleteUebung}
                color='red'
                iconSize={20}
                styleText={styles.deleteText}
                title='Übung löschen'/>
        </View>
    )
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
        flexDirection: 'row',
    },
    suggestionsContainer: {
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        marginTop: 5,
        overflow: "hidden",
    },
    suggestionItem: {
        paddingVertical: 8,
        paddingHorizontal: 10,
    }
});