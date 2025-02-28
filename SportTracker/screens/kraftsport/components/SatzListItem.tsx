import {StyleSheet, TextInput, View, Text} from "react-native";
import {ISatzListItemProps} from "../../../utils/interfaces";
import IconButton from "../../../components/IconButton";

export default function SatzListItem({satz, uebungId, updateSatz, deleteSatz}: ISatzListItemProps){
    return (
        <View style={styles.satzContainer}>
           <View style={styles.gewicht}>
               <TextInput
                   style={styles.satzInput}
                   placeholder="Gewicht"
                   keyboardType="numeric"
                   value={satz.gewicht.toString()}
                   onChangeText={(text) => updateSatz(uebungId, satz.id, "gewicht", text)}
               />
               <Text>kg</Text>
           </View>
            <TextInput
                style={styles.satzInput}
                placeholder="Wdh"
                keyboardType="numeric"
                value={satz.wiederholungen.toString()}
                onChangeText={(text) => updateSatz(uebungId, satz.id, "wiederholungen", text)}
            />
            <IconButton onPress={() => deleteSatz(uebungId, satz.id)} icon='delete' color='red' size={24}/>
        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "white",
    },
    uebungContainer: {
        backgroundColor: "lightskyblue",
        padding: 10,
        borderRadius: 8,
        marginVertical: 10,
    },
    gewicht: {
        flexDirection: "row",
        alignItems: "center",
    },
    addUebung: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    addUebungText: {
        color: 'royalblue',
        fontSize: 20,
    },
    input: {
        borderBottomWidth: 0.5,
        borderBottomColor: "grey",
        fontSize: 20,
        padding: 5,
        marginBottom: 10,
    },
    satzContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginVertical: 5,
    },
    satzInput: {
        padding: 5,
        width: 80,
        borderBottomWidth: 0.5,
        borderBottomColor: "grey",
    },
    deleteText: {
        color: "red",
        fontWeight: "bold",
        marginLeft: 10,
    },
    fertigButton: {
        alignItems: "center",
    },
    addSatz: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        marginBottom: 15,
    },
    deleteUebung: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "flex-start",
    },
    addSatzText: {
        color: 'royalblue',
        fontSize: 16,
    }
});