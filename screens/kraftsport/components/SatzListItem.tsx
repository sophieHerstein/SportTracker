import {StyleSheet, Text, TextInput, View} from "react-native";
import {ISatzListItemProps} from "../../../models/interfaces";
import IconButton from "../../../components/IconButton";
import {globalStyles} from "../../../utils/global-styles";
import {
    borderColor,
    highlight,
    primary,
    surfaceElevated,
    textColorMuted,
} from "../../../models/constants";

export default function SatzListItem({
    satz,
    uebungId,
    updateSatz,
    deleteSatz,
    duplicateSatz,
}: ISatzListItemProps) {
    return (
        <View style={styles.row}>
            <View style={styles.inputGroup}>
                <TextInput
                    style={[globalStyles.input, styles.input]}
                    placeholderTextColor={highlight}
                    placeholder="Gewicht"
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                    value={satz.gewicht === null ? "" : satz.gewicht.toString()}
                    onChangeText={(text) => updateSatz(uebungId, satz.id, "gewicht", text)}
                />
                <Text style={styles.unit}>kg</Text>
            </View>
            <Text style={styles.multiply}>×</Text>
            <TextInput
                style={[globalStyles.input, styles.input]}
                placeholderTextColor={highlight}
                placeholder="Wdh"
                keyboardType="number-pad"
                selectTextOnFocus
                value={
                    satz.wiederholungen === null || satz.wiederholungen === 0
                        ? ""
                        : satz.wiederholungen.toString()
                }
                onChangeText={(text) => updateSatz(uebungId, satz.id, "wiederholungen", text)}
            />
            <IconButton
                onPress={() => duplicateSatz(uebungId, satz.id)}
                icon="content-copy"
                color={textColorMuted}
                size={20}
            />
            <IconButton
                onPress={() => deleteSatz(uebungId, satz.id)}
                icon="close"
                color={primary}
                size={21}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    input: {
        width: 74,
        height: 42,
        fontSize: 16,
        marginVertical: 0,
        textAlign: "center",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: surfaceElevated,
        borderRadius: 13,
        borderWidth: 1,
        borderColor,
        paddingHorizontal: 6,
        paddingVertical: 6,
        marginBottom: 8,
    },
    inputGroup: {
        flexDirection: "row",
        alignItems: "center",
    },
    unit: {
        color: textColorMuted,
        fontSize: 12,
        marginLeft: -2,
    },
    multiply: {
        color: textColorMuted,
        fontSize: 18,
        fontWeight: "700",
    },
});
