import {StyleSheet, Text, TextInput, View} from "react-native";
import {ISatzListItemProps} from "../../../models/interfaces";
import IconButton from "../../../components/IconButton";
import {globalStyles} from "../../../utils/global-styles";
import {highlight} from "../../../models/constants";

export default function SatzListItem({satz, uebungId, updateSatz, deleteSatz}: ISatzListItemProps) {
    return (
        <View style={globalStyles.row}>
            <View style={globalStyles.row}>
                <TextInput
                    style={[globalStyles.input, styles.input]}
                    placeholderTextColor={highlight}
                    placeholder="Gewicht"
                    keyboardType="numeric"
                    value={satz.gewicht ? satz.gewicht.toString() : ''}
                    onChangeText={(text) => updateSatz(uebungId, satz.id, "gewicht", text)}
                />
                <Text style={globalStyles.text}>kg</Text>
            </View>
            <Text style={globalStyles.text}>X</Text>
            <TextInput
                style={[globalStyles.input, styles.input]}
                placeholderTextColor={highlight}
                placeholder="Wdh"
                keyboardType="numeric"
                value={satz.wiederholungen ? satz.wiederholungen.toString() : ''}
                onChangeText={(text) => updateSatz(uebungId, satz.id, "wiederholungen", text)}
            />
            <IconButton onPress={() => deleteSatz(uebungId, satz.id)} icon='delete' color='red' size={24}/>
        </View>
    )
}


const styles = StyleSheet.create({
    input: {
        width: 75,
        height: 35,
        fontSize: 16
    }
});