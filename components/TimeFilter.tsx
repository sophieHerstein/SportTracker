import {Pressable, ScrollView, StyleSheet, Text} from "react-native";
import {
    borderColor,
    ETimeRange,
    primary,
    primaryMuted,
    surfaceElevated,
    textColorMuted,
    textColorPrimary,
} from "../models/constants";
import {ITimeFilterProps} from "../models/interfaces";

export default function TimeFilter({
    timeRange,
    onPressGesamt,
    onPressJahr,
    onPress6Monate,
    onPress3Monate,
    onPressMonat,
}: ITimeFilterProps) {
    const options = [
        {value: ETimeRange.GESAMT, label: "Gesamt", onPress: onPressGesamt},
        {value: ETimeRange.JAHR, label: "Jahr", onPress: onPressJahr},
        {value: ETimeRange.SECHS_MONATE, label: "6 Monate", onPress: onPress6Monate},
        {value: ETimeRange.DREI_MONATE, label: "3 Monate", onPress: onPress3Monate},
        {value: ETimeRange.MONAT, label: "Monat", onPress: onPressMonat},
    ];

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {options.map((option) => {
                const selected = timeRange === option.value;
                return (
                    <Pressable
                        key={option.value}
                        onPress={option.onPress}
                        style={({pressed}) => [
                            styles.chip,
                            selected && styles.selectedChip,
                            pressed && styles.pressed,
                        ]}
                    >
                        <Text style={[styles.text, selected && styles.selectedText]}>
                            {option.label}
                        </Text>
                    </Pressable>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 8,
        paddingVertical: 8,
        paddingRight: 24,
    },
    chip: {
        minHeight: 36,
        paddingHorizontal: 14,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: surfaceElevated,
        borderWidth: 1,
        borderColor,
    },
    selectedChip: {
        backgroundColor: primaryMuted,
        borderColor: primary,
    },
    text: {
        color: textColorMuted,
        fontSize: 13,
        fontWeight: "600",
    },
    selectedText: {
        color: textColorPrimary,
    },
    pressed: {
        opacity: 0.7,
    },
});
