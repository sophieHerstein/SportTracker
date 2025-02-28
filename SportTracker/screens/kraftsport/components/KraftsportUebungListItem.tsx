import {IKraftsportUebungListItemProps} from "../../../utils/interfaces";
import {FlatList, StyleSheet, TextInput, View} from "react-native";
import SatzListItem from "./SatzListItem";
import TextIconButton from "../../../components/TextIconButton";

export default function KraftsportUebungListItem({uebung, updateSatz, deleteSatz, updateUebungName, addSatz, deleteUebung}: IKraftsportUebungListItemProps) {
    return (
        <View style={styles.uebungContainer}>
            <TextInput
                style={styles.input}
                placeholder="Übungsname"
                value={uebung.name}
                onChangeText={(text) => updateUebungName(uebung.id, text)}
            />
            <FlatList
                data={uebung.saetze}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item: satz }) =>
                    <SatzListItem
                        satz={satz}
                        uebungId={uebung.id}
                        updateSatz={updateSatz}
                        deleteSatz={deleteSatz}/>}
            />
            <TextIconButton
                onPress={() => addSatz(uebung.id)}
                iconName='add'
                stylePressable={styles.addSatz}
                color='royalblue'
                iconSize={20}
                styleText={styles.addSatzText}
                title='Satz hinzufügen'/>
            <TextIconButton
                onPress={() => deleteUebung(uebung.id)}
                iconName='delete'
                stylePressable={styles.deleteUebung}
                color='red'
                iconSize={20}
                styleText={styles.deleteText}
                title='Übung löschen'/>
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