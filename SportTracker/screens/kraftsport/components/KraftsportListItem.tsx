import { StyleSheet, Text, View } from 'react-native';
import IconButton from "../../../components/IconButton";
import {IKraftsportListItemProps} from "../../../utils/interfaces";
import {globalStyles} from "../../../utils/global-styles";
import {secondary} from "../../../utils/constants";

export default function KraftsportListItem({item, onDelete}: IKraftsportListItemProps) {
    return (
        <View style={[globalStyles.cards, styles.row]}>
            <View>
                <Text style={globalStyles.title}>{item.gruppe} ({item.datum})</Text>
                {item.uebungen.map((uebung, index) => (
                    <View key={index}>
                        <Text style={globalStyles.subtitle}>{uebung.name}</Text>

                        {uebung.saetze.map((satz, satzIndex) => (
                            <Text key={satzIndex} style={[globalStyles.text, globalStyles.light]}>
                                Satz {satzIndex + 1}: {satz.gewicht} kg, {satz.wiederholungen} Wiederholungen
                            </Text>
                        ))}
                    </View>
                ))}
            </View>
            <IconButton size={36} color={secondary} icon='delete' onPress={() => onDelete(item.training_id.toString())}></IconButton>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    }
});