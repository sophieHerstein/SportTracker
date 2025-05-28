import {IKraftsportUebungListItemProps} from "../../../utils/interfaces";
import {FlatList, Pressable, StyleSheet, TextInput, View} from "react-native";
import SatzListItem from "./SatzListItem";
import TextIconButton from "../../../components/TextIconButton";
import {MaterialIcons} from "@expo/vector-icons";
import {hightlight, primary, secondary} from "../../../utils/constants";
import {globalStyles} from "../../../utils/global-styles";
import {useEffect, useState} from "react";
import KraftsportUebungModal from "./KraftsportUebungModal";

export default function KraftsportUebungListItem({uebung, updateSatz, deleteSatz, updateUebungName, addSatz, deleteUebung}: IKraftsportUebungListItemProps) {

    const [cardStyle, setCardStyle] = useState<any>(globalStyles.cards);
    const [modalVisible, setModalVisible] = useState<boolean>(false);

    useEffect(() => {
        if(uebung.weightShouldBeIncreased){
            setCardStyle({...globalStyles.cards, borderColor: primary, borderWidth: 4});
        }
    }, []);

    return (
        <View style={cardStyle}>
            <View style={styles.rowWithInfo}>
                <TextInput
                    style={globalStyles.input}
                    placeholderTextColor={hightlight}
                    placeholder="Übungsname"
                    value={uebung.name}
                    onChangeText={(text) => updateUebungName(uebung.id, text)}
                />
                <MaterialIcons style={{alignSelf:"flex-start"}} name='info-outline' size={16} color={hightlight} onPress={()=> setModalVisible(true)}/>
            </View>
            <KraftsportUebungModal uebung={uebung} visible={modalVisible} onCancel={()=> setModalVisible(false)}></KraftsportUebungModal>
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
        </View>
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
    rowWithInfo: {
        flexDirection: 'row',
    }
});