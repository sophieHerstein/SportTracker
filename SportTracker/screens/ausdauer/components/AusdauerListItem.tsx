import { StyleSheet, Text, View } from 'react-native';
import IconButton from "../../../components/IconButton";
import {IAusdauersportListItemProps} from "../../../utils/interfaces";
import {globalStyles} from "../../../utils/global-styles";

export default function AusdauerListItem({item, onDelete}: IAusdauersportListItemProps) {

    const roundTo = function(num: number, places: number) {
        const factor = 10 ** places;
        return Math.round(num * factor) / factor;
    };

    return (
        <View style={[globalStyles.cards, globalStyles.row]}>
            <View style={styles.info}>
                <Text style={globalStyles.title}>{item.name} ({item.datum})</Text>
                <View style={globalStyles.rowWithoutSpace}>
                    {item.strecke > 0 && <Text style={[globalStyles.text, globalStyles.light]}>Strecke: {item.strecke}km; </Text>}
                    <Text style={[globalStyles.text, globalStyles.light]}>Zeit: {item.dauer}min</Text>
                </View>
                {item.strecke > 0 && <Text style={[globalStyles.text, globalStyles.light]}>Durchschnittsgeschwindigkeit: {roundTo(item.strecke/(item.dauer/60), 2)} km/h</Text>}
            </View>
            <IconButton size={36} color='royalblue' icon='delete' onPress={() => onDelete(item.id)}></IconButton>
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
        fontSize: 20
    },
    details: {
        fontSize: 16,
        fontWeight: 100
    }
});