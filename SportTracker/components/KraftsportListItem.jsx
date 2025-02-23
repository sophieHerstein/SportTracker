import { StyleSheet, Text, View } from 'react-native';
import IconButton from "./IconButton";

export default function KraftsportListItem({item, onDelete}) {
    return (
        <View style={styles.container}>
            <View style={styles.info}>
                <Text style={styles.name}>{item.gruppe} ({item.datum})</Text>
                {item.uebungen.map((uebung, index) => (
                    <View key={index}>
                        <Text style={styles.uebung}>{uebung.name}</Text>

                        {/* Iteriere über alle Sätze der Übung */}
                        {uebung.saetze.map((satz, satzIndex) => (
                            <Text key={satzIndex} style={styles.satz}>
                                Satz {satzIndex + 1}: {satz.gewicht} kg, {satz.widerholung} Wiederholungen
                            </Text>
                        ))}
                    </View>
                ))}
            </View>
            <IconButton size={36} color='royalblue' icon='delete' style={styles.delete} onPress={() => onDelete(item.id)}></IconButton>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: 10,
        margin: 5,
        borderRadius: 10,
        backgroundColor: 'lightskyblue'
    },
    info: {
        justifyContent: 'space-evenly',
    },
    name: {
        fontSize: 20,
    },
    satz: {
        fontSize: 12,
        fontWeight: 100
    },
    uebung: {
        fontSize: 14,
    }
});