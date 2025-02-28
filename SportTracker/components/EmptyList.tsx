import {StyleSheet, Text} from "react-native";

export default function EmptyList() {
    return (
        <Text style={styles.listEmpty}>Keine Daten geladen</Text>
    )
}

const styles = StyleSheet.create({
    listEmpty: {
        fontSize: 32,
        paddingTop: 100,
        textAlign: 'center'
    }
});