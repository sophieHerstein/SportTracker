import {IKraftsportUebungListItemProps} from "../../../utils/interfaces";
import {FlatList, Pressable, StyleSheet, TextInput, View} from "react-native";
import SatzListItem from "./SatzListItem";
import TextIconButton from "../../../components/TextIconButton";
import {MaterialIcons} from "@expo/vector-icons";
import {hightlight, secondary} from "../../../utils/constants";
import {globalStyles} from "../../../utils/global-styles";

export default function KraftsportUebungListItem({uebung, updateSatz, deleteSatz, updateUebungName, addSatz, deleteUebung}: IKraftsportUebungListItemProps) {
    return (
        //TODO: als Modal -> Diagram mit Entwicklung und letzter Ausführung -> also die entsprechenden Wiederholungen
        <Pressable onPress={()=> console.log('clicked')} style={globalStyles.cards}>
            <View style={styles.row}>
                <TextInput
                    style={globalStyles.input}
                    placeholderTextColor={hightlight}
                    placeholder="Übungsname"
                    value={uebung.name}
                    onChangeText={(text) => updateUebungName(uebung.id, text)}
                />
                {uebung.weightShouldBeIncreased ? (
                    <MaterialIcons name='auto-graph' size={36} color={hightlight}/>
                ) : null}
            </View>
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
                color={hightlight}
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
        </Pressable>
    )
}

const styles = StyleSheet.create({
    deleteText: {
        color: "red",
        fontWeight: "bold",
        marginLeft: 10,
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
        color: hightlight,
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: "center",
    }
});