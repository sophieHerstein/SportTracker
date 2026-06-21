import {StyleSheet} from "react-native";
import {Dropdown} from "react-native-element-dropdown";
import {IStatisticOption} from "../../models/interfaces";
import {borderColor, highlight, surfaceElevated, textColorMuted} from "../../models/constants";

interface Props {
    options: IStatisticOption[];
    value: number | null;
    placeholder: string;
    onChange: (id: number) => void;
}

export default function StatisticSelector({options, value, placeholder, onChange}: Props) {
    return (
        <Dropdown
            style={styles.dropdown}
            containerStyle={styles.dropdownContainer}
            data={options}
            labelField="name"
            valueField="id"
            value={value}
            placeholder={placeholder}
            search={options.length > 8}
            searchPlaceholder="Suchen …"
            onChange={(item) => onChange(item.id)}
            selectedTextStyle={styles.selectedText}
            placeholderStyle={styles.placeholder}
            inputSearchStyle={styles.search}
            itemTextStyle={styles.itemText}
            activeColor={surfaceElevated}
        />
    );
}

const styles = StyleSheet.create({
    dropdown: {
        minHeight: 50,
        borderWidth: 1,
        borderColor,
        borderRadius: 14,
        paddingHorizontal: 14,
        backgroundColor: surfaceElevated,
        marginBottom: 8,
    },
    dropdownContainer: {
        backgroundColor: surfaceElevated,
        borderColor,
        borderRadius: 14,
    },
    selectedText: {
        color: highlight,
        fontWeight: "600",
    },
    placeholder: {
        color: textColorMuted,
    },
    search: {
        color: highlight,
        borderColor,
        borderRadius: 10,
    },
    itemText: {
        color: highlight,
    },
});
