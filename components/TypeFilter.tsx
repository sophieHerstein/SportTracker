import {Pressable, ScrollView, StyleSheet, Text} from "react-native";
import {
    borderColor,
    primary,
    primaryMuted,
    surfaceElevated,
    textColorMuted,
    textColorPrimary,
} from "../models/constants";
import {ITypeFilterProps} from "../models/interfaces";

export default function TypeFilter({
    types,
    onPress,
    currentChosenType,
    compact = false,
}: ITypeFilterProps) {
    return (
        <ScrollView
            horizontal
            style={compact ? styles.compactScroll : styles.scroll}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {types.map((type) => {
                const selected = type === currentChosenType;
                return (
                    <Pressable
                        key={type}
                        onPress={() => onPress(type)}
                        style={({pressed}) => [
                            styles.chip,
                            compact && styles.compactChip,
                            selected && styles.selectedChip,
                            pressed && styles.pressed,
                        ]}
                    >
                        <Text
                            style={[
                                styles.text,
                                compact && styles.compactText,
                                selected && styles.selectedText,
                            ]}
                        >
                            {type}
                        </Text>
                    </Pressable>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flexGrow: 0,
        maxHeight: 54,
    },
    compactScroll: {
        flexGrow: 0,
        maxHeight: 48,
    },
    container: {
        gap: 8,
        paddingVertical: 8,
        paddingRight: 24,
    },
    chip: {
        minHeight: 38,
        paddingHorizontal: 15,
        borderRadius: 19,
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
    compactChip: {
        minHeight: 32,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    text: {
        color: textColorMuted,
        fontSize: 14,
        fontWeight: "600",
    },
    selectedText: {
        color: textColorPrimary,
    },
    compactText: {
        fontSize: 13,
    },
    pressed: {
        opacity: 0.7,
    },
});
