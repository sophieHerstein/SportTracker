import {FlatList, StyleSheet, Text, View} from 'react-native';
import IconButton from "../components/IconButton";
import { useState } from 'react';
import NeuerKraftsportEintrag from "../components/NeuerKraftsportEintrag";
import KraftsportListItem from "../components/KraftsportListItem";

// TODO:   neuen Eintrag erstellen
//         Picker für Gruppe und Übung
//         Validierung für neue Eingaben
//         DB
//         Sortierung?
//         Charts
//         Trends
//         Empfehlungen oder ähnliches oder Analysen sowas halt


const dummyData = [
    {
        id: 1,
        datum: "18.02.2025",
        gruppe: "Arme",
        uebungen: [{
            name: "French Press",
            saetze: [{
                gewicht: 20,
                widerholung: 20
            }, {
                gewicht: 30,
                widerholung: 30
            }
            ]
        }]
    },
    {
        id: 2,
        datum: "19.02.2025",
        gruppe: "Beine",
        uebungen: [{
            name: "Kniebeuge",
            saetze: [{
                gewicht: 20,
                widerholung: 20
            }]
        }]
    },
    {
        id: 3,
        datum: "20.02.2025",
        gruppe: "Schultern",
        uebungen:[{
            name: "Seitenheben",
            saetze: [{
                gewicht: 20,
                widerholung: 20
            }]
        }]
    }
];

export default function AusdauersportScreen(){
    const [kraftsportData, setData] = useState(dummyData);
    const [showNewDialog, setShowNewDialog] = useState(false);

    function addEintragToList(datum, name, strecke, dauer) {
        setShowNewDialog(false);
        const newEintrag = [...kraftsportData, {datum, gruppe, id: kraftsportData.length+1}];
        setData(newEintrag);
    }

    function removeEintragFromList(id){
        const newKraftsportData = [...kraftsportData];
        const index = newKraftsportData.indexOf(newKraftsportData.find(item => item.id === id));
        newKraftsportData.splice(index, 1);
        setData(newKraftsportData);
    }

    return (
        <View style={styles.container}>
            <IconButton
                onPress={() => setShowNewDialog(true)}
                style={styles.new}
                icon='add-circle'>
            </IconButton>
            <NeuerKraftsportEintrag
                visible={showNewDialog}
                onCancel={()=> setShowNewDialog(false)}
                onSave={addEintragToList}/>
            <FlatList data={kraftsportData}
                      renderItem={({item})=> (
                          <KraftsportListItem item={item} onDelete={(id) => removeEintragFromList(id)}/>
                      )}
                      keyExtractor={(item)=> item.id}
                      ItemSeparatorComponent={<View style={styles.listSeperators}/>}
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