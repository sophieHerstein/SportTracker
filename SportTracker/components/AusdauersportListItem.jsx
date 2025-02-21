import { StyleSheet, Text, View } from 'react-native';
import IconButton from "./IconButton";

export default function AusdauersportListItem({item, onDelete}) {

    return (
        <View style={styles.container}>
            <View style={styles.info}>
                <Text style={styles.name}>{item.name} ({item.datum})</Text>
                <Text style={styles.details}>Strecke: {item.strecke}km ; Zeit: {item.dauer}min</Text>
                <Text style={styles.details}>Durchschnittsgeschwindigkeit: {item.strecke/(item.dauer/60)} km/h</Text>
            </View>
            <IconButton icon='delete' style={styles.delete} onPress={() => onDelete(item.id)}></IconButton>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 70,
        gap: 10,
        padding: 10,
    },
    info: {
        justifyContent: 'space-evenly',
    },
    name: {
        fontSize: 20
    },
    details: {
        fontSize: 16,
        fontWeight: 100
    }
});