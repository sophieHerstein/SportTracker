import {FlatList, StyleSheet, Text, View} from 'react-native';
import AusdauersportListItem from "../components/AusdauersportListItem";
import IconButton from "../components/IconButton";
import NeuerAusdauerEintrag from "../components/NeuerAusdauerEintrag";
import { useState } from 'react';

// TODO:   DB
//         Sortierung?
//         Charts
//         Trends
//         Empfehlungen oder ähnliches oder Analysen sowas halt

const dummyData = [
    {
        id: 1,
        datum: "18.02.2025",
        name: "Laufen",
        strecke: 5,
        dauer: 30
    },
    {
        id: 2,
        datum: "19.02.2025",
        name: "Fahrrad fahren",
        strecke: 10,
        dauer: 30
    },
    {
        id: 3,
        datum: "20.02.2025",
        name: "Laufen",
        strecke: 3,
        dauer: 15
    },
    {
        id: 4,
        datum: "20.02.2025",
        name: "Laufen",
        strecke: 3,
        dauer: 15
    },
    {
        id: 5,
        datum: "20.02.2025",
        name: "Laufen",
        strecke: 3,
        dauer: 15
    },
    {
        id: 6,
        datum: "20.02.2025",
        name: "Laufen",
        strecke: 3,
        dauer: 15
    },
    {
        id: 7,
        datum: "20.02.2025",
        name: "Laufen",
        strecke: 3,
        dauer: 15
    },
    {
        id: 8,
        datum: "20.02.2025",
        name: "Laufen",
        strecke: 3,
        dauer: 15
    },
    {
        id: 9,
        datum: "20.02.2025",
        name: "Laufen",
        strecke: 3,
        dauer: 15
    },
    {
        id: 10,
        datum: "20.02.2025",
        name: "Laufen",
        strecke: 3,
        dauer: 15
    },
    {
        id: 11,
        datum: "20.02.2025",
        name: "Laufen",
        strecke: 3,
        dauer: 15
    },
    {
        id: 12,
        datum: "20.02.2025",
        name: "Laufen",
        strecke: 3,
        dauer: 15
    },
    {
        id: 13,
        datum: "20.02.2025",
        name: "Laufen",
        strecke: 3,
        dauer: 15
    },
    {
        id: 14,
        datum: "20.02.2025",
        name: "Laufen",
        strecke: 3,
        dauer: 15
    }
];

export default function AusdauersportScreen(){
    const [ausdauerData, setData] = useState(dummyData);
    const [showNewDialog, setShowNewDialog] = useState(false);

    function addEintragToList(datum, name, strecke, dauer) {
        setShowNewDialog(false);
        const newEintrag = [...ausdauerData, {datum, name, strecke, dauer, id: ausdauerData.length+1}];
        setData(newEintrag);
    }

    function removeEintragFromList(id){
        const newAusdauerData = [...ausdauerData];
        const index = newAusdauerData.indexOf(newAusdauerData.find(item => item.id === id));
        newAusdauerData.splice(index, 1);
        setData(newAusdauerData);
    }

    return (
        <View style={styles.container}>
            <IconButton
                size={36}
                color='royalblue'
                onPress={() => setShowNewDialog(true)}
                style={styles.new}
                icon='add-circle'>
            </IconButton>
            <NeuerAusdauerEintrag
                visible={showNewDialog}
                onCancel={()=> setShowNewDialog(false)}
                onSave={addEintragToList}/>
            <FlatList data={ausdauerData}
                      renderItem={({item})=> (
                          <AusdauersportListItem item={item} onDelete={(id) => removeEintragFromList(id)}/>
                      )}
                      keyExtractor={(item)=> item.id}
                      ListEmptyComponent={<Text style={styles.listEmpty}>Keine Daten geladen</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 100
    },
    listSeperators: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'lightsteelblue'
    },
    listEmpty: {
        fontSize: 32,
        paddingTop: 100,
        textAlign: 'center'
    },
    new: {
        position: 'absolute',
        top: 60,
        right: 30,
    },
});