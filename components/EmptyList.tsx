import {StyleSheet, Text} from "react-native";
import {globalStyles} from "../utils/global-styles";

export default function EmptyList() {
    return (
        <Text style={[globalStyles.title, globalStyles.centerText, styles.paddingVertical]}>Keine Daten vorhanden</Text>
    )
}

const styles = StyleSheet.create({
    paddingVertical: {
        paddingVertical: 200
    }
})
