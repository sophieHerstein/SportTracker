import {Alert, StyleSheet, Text, View} from "react-native";
import IconButton from "../../../components/IconButton";
import {IAusdauersportListItemProps} from "../../../models/interfaces";
import {globalStyles} from "../../../utils/global-styles";
import {primary, textColorMuted} from "../../../models/constants";

export default function AusdauerListItem({item, onDelete, onUpdate}: IAusdauersportListItemProps) {
    const roundTo = function (num: number, places: number) {
        const factor = 10 ** places;
        return Math.round(num * factor) / factor;
    };

    function confirmDelete() {
        Alert.alert("Eintrag löschen?", `${item.name} vom ${item.datum} wird dauerhaft gelöscht.`, [
            {text: "Abbrechen", style: "cancel"},
            {text: "Löschen", style: "destructive", onPress: () => onDelete(item.id)},
        ]);
    }

    return (
        <View style={[globalStyles.cards, globalStyles.row]}>
            <View style={styles.info}>
                <Text style={styles.date}>{item.datum}</Text>
                <Text style={globalStyles.title}>{item.name}</Text>
                <Text style={styles.metrics}>
                    {item.dauer} min
                    {item.strecke > 0 ? `  ·  ${item.strecke} km` : ""}
                    {item.strecke > 0
                        ? `  ·  ${roundTo(item.strecke / (item.dauer / 60), 2)} km/h`
                        : ""}
                </Text>
            </View>
            <View style={styles.actions}>
                <IconButton
                    size={22}
                    color={textColorMuted}
                    icon="edit"
                    onPress={() => onUpdate(item)}
                />
                <IconButton
                    size={23}
                    color={primary}
                    icon="delete-outline"
                    onPress={confirmDelete}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: 10,
        margin: 5,
        borderRadius: 10,
        backgroundColor: "lightskyblue",
    },
    info: {
        flex: 1,
        paddingRight: 8,
    },
    actions: {
        flexDirection: "row",
        alignItems: "center",
    },
    date: {
        color: textColorMuted,
        fontSize: 12,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    metrics: {
        color: textColorMuted,
        fontSize: 13,
        lineHeight: 19,
    },
});
