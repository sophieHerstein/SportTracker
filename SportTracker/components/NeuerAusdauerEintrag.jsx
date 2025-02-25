import {useEffect, useState} from 'react';
import {Text, KeyboardAvoidingView, Modal, Platform, StyleSheet, TextInput, View} from 'react-native';
import BigButton from './BigButton';
import IconButton from './IconButton';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from "react-native-dropdown-picker";
import * as SQLite from "expo-sqlite";

const database = SQLite.openDatabaseSync('training.db');

export default function NeuerAusdauerEintrag({navigation, route}) {
    const [datum, setDatum] = useState(new Date());
    const [name, setName] = useState('Laufen');
    const [strecke, setStrecke] = useState('0');
    const [dauer, setDauer] = useState('0');
    const [sportarten, setSportarten] = useState([]);

    const [open, setOpen] = useState(false);

    useEffect(() => {
        const trainingsTypen = route.params.trainingsTypen;
        const trainigstypenMapping = trainingsTypen.map((tt)=>{
            return {label: tt.name, value: tt.name}
        })
        setSportarten(trainigstypenMapping);
    }, [])

    function isNumberValid(numberString) {
        const number = parseFloat(numberString);
        return !isNaN(numberString) && number > 0;
    }

    function isStreckeValid() {
        return isNumberValid(strecke);
    }

    function isDauerValid() {
        return isNumberValid(dauer);
    }

    async function saveEintrag(){
        if(!isDauerValid()){
            alert('Bitte die Dauer überprüfen');
            return;
        }
        if(!isStreckeValid()){
            alert('Bitte die Strecke überprüfen');
            return;
        }

        try {
            await saveEintragInDB()
            navigation.goBack();
        } catch (error) {
            console.error("Fehler beim Speichern: ", error);
            alert("Fehler beim Speichern des Eintrags.");
        }
    }

    async function saveEintragInDB() {
        if(!trainingsTypExists(name)){
            await database.runAsync('INSERT INTO Trainingstyp (id, name) VALUES (?, ?)', datum.getTime(), name);
        }
        const trainigsTypId = await database.getFirstAsync('SELECT id FROM Trainingstyp WHERE name=?', name);
        await database.runAsync('INSERT INTO Ausdauertrainingseinheit (id, trainingstyp_id, datum, dauer_minuten, strecke_km) VALUES (?, ?,?,?,?)', datum.getTime(), trainigsTypId.id, datum.getTime(), dauer, strecke);
    }

    function trainingsTypExists(trainigstypName){
        return route.params.trainingsTypen.filter((tt) => tt.label === trainigstypName).length > 0;
    }

    function onDateChange(event, selectedDate){
        setDatum(selectedDate);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Neuen Eintrag hinzufügen</Text>
            <View style={styles.inputContainer}>
                <View style={styles.row}>
                    <Text style={styles.label}>Datum:</Text>
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={datum}
                        mode='date'
                        onChange={onDateChange}
                    />
                </View>
                <View style={styles.pickerRow}>
                    <Text style={styles.label}>Sportart:</Text>
                    <DropDownPicker style={styles.picker} dropDownContainerStyle={styles.picker}
                            open={open}
                            value={name}
                            items={sportarten}
                            setOpen={setOpen}
                            setValue={setName}
                            setItems={setSportarten}
                            searchable={true}
                            addCustomItem={true}
                            searchPlaceholder="Suche ..."
                    />
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Strecke:</Text>
                    <View style={styles.inputStuff}>
                        <TextInput
                            style={styles.input}
                            onChangeText={setStrecke}/>
                        <Text style={styles.label}>km</Text>
                    </View>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Zeit:</Text>
                    <View style={styles.inputStuff}>
                        <TextInput
                            style={styles.input}
                            onChangeText={setDauer}/>
                        <Text style={styles.label}>min</Text>
                    </View>
                </View>
            </View>
            <BigButton style={styles.speichern} title='Speichern' onPress={()=> saveEintrag()}></BigButton>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    picker: {
        borderWidth: 1,
        borderColor: 'lightsteelblue',
        padding: 10,
        margin: 10,
        width: '72%',
        borderRadius: 5,
        fontSize: 20,
        marginStart: 26
    },
    pickerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    inputContainer: {
        justifyContent: 'center',
        width: '80%',
        paddingTop: 10,
        paddingBottom: 10
    },
    label: {
      fontSize: 18,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    inputStuff: {
        width: '75%',
        flexDirection: 'row',
        alignItems: 'center'
    },
    input: {
        borderWidth: 1,
        borderColor: 'lightsteelblue',
        padding: 10,
        margin: 10,
        width: '75%',
        borderRadius: 5,
        fontSize: 20
    },
    back: {
        position: 'absolute',
        top: 50,
        left: 20
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        paddingBottom: 20,
        color: 'royalblue',
    },
    speichern: {
        marginTop: 20
    }
});