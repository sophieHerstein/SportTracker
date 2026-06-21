import {Alert, Pressable, StyleSheet, Text, View} from "react-native";
import IconButton from "../../../components/IconButton";
import {IKraftsportListItemProps} from "../../../models/interfaces";
import {globalStyles} from "../../../utils/global-styles";
import {primary, textColorMuted} from "../../../models/constants";

export default function KraftsportListItem({item, onDelete, onUpdate}: IKraftsportListItemProps) {
    function confirmDelete() {
        Alert.alert(
            "Training löschen?",
            `${item.gruppe} vom ${item.datum} wird dauerhaft gelöscht.`,
            [
                {text: "Abbrechen", style: "cancel"},
                {
                    text: "Löschen",
                    style: "destructive",
                    onPress: () => onDelete(item.training_id.toString()),
                },
            ]
        );
    }

    return (
        <View style={globalStyles.cards}>
            <View style={styles.header}>
                <Pressable
                    style={styles.content}
                    onPress={() =>
                        onUpdate(item.training_id.toString(), item.gruppe, item.datum_as_timestamp)
                    }
                >
                    <Text style={styles.date}>{item.datum}</Text>
                    <Text style={globalStyles.title}>{item.gruppe}</Text>
                </Pressable>
                <IconButton
                    size={23}
                    color={primary}
                    icon="delete-outline"
                    onPress={confirmDelete}
                />
            </View>
            <Pressable
                onPress={() =>
                    onUpdate(item.training_id.toString(), item.gruppe, item.datum_as_timestamp)
                }
            >
                {item.uebungen.map((uebung, index) => (
                    <View key={index} style={styles.exercise}>
                        <Text style={globalStyles.subtitle}>{uebung.name}</Text>
                        <Text style={styles.setSummary}>
                            {uebung.saetze
                                .map((satz) => `${satz.gewicht} kg × ${satz.wiederholungen}`)
                                .join("  ·  ")}
                        </Text>
                    </View>
                ))}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    content: {
        flex: 1,
    },
    date: {
        color: textColorMuted,
        fontSize: 12,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    exercise: {
        marginTop: 8,
    },
    setSummary: {
        color: textColorMuted,
        fontSize: 13,
        lineHeight: 19,
    },
});
