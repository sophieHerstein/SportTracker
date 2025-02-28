import { StyleSheet, Text, View } from 'react-native';
import IconButton from "../../../components/IconButton";
import {IKraftsportListItemProps} from "../../../utils/interfaces";

export default function KraftsportListItem({item, onDelete}: IKraftsportListItemProps) {
    return (
        <View style={styles.container}>
            <View style={styles.info}>
                <Text style={styles.name}>{item.gruppe} ({item.datum})</Text>
                {item.uebungen.map((uebung, index) => (
                    <View key={index}>
                        <Text style={styles.uebung}>{uebung.name}</Text>

                        {uebung.saetze.map((satz, satzIndex) => (
                            <Text key={satzIndex} style={styles.satz}>
                                Satz {satzIndex + 1}: {satz.gewicht} kg, {satz.wiederholungen} Wiederholungen
                            </Text>
                        ))}
                    </View>
                ))}
            </View>
            <IconButton size={36} color='royalblue' icon='delete' onPress={() => onDelete(item.training_id.toString())}></IconButton>
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