import {useEffect, useState} from 'react';
import {Text, StyleSheet, View, Pressable, TextInput} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import IconButton from "./IconButton";
import * as SQLite from "expo-sqlite";
import {openDatabaseSync} from "expo-sqlite";

const database = SQLite.openDatabaseSync('training.db');

export default function NeuerKraftsportEintrag({navigation}) {
    const [datum, setDatum] = useState(new Date());
    const [showInput, setShowInput] = useState(false);
    const [additionalGruppe, setAdditionalGruppe] = useState('');
    const [gruppen, setGruppen] = useState([]);

    useEffect(() => {
        getMuskelgruppe();
    }, []);

    async function getMuskelgruppe(){
        const databaseData = await database.getAllAsync('SELECT * FROM muscle_group');
        const muscleGroups = databaseData.map((row) => {
            return row.name;
        })
        setGruppen(muscleGroups);
    }

    async function addGruppeToList(){
        if(!gruppen.includes(additionalGruppe) && additionalGruppe.trim() !== ''){
            const neueGruppen = [...gruppen];
            neueGruppen.push(additionalGruppe);
            setGruppen(neueGruppen);
            await database.runAsync("INSERT INTO muscle_group (name) VALUES (?)",additionalGruppe)
            setAdditionalGruppe('');
            setShowInput(false);
        } else {
            setAdditionalGruppe('');
            setShowInput(false);
        }
    }

    function onDateChange(event, selectedDate){
        setDatum(selectedDate);
    }

    return (
        <View style={styles.container}>
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
            </View>
            <View style={styles.uebungContainer}>
                {gruppen.map((gruppe, index) => (
                    <Pressable key={index} style={styles.uebung} onPress={()=> navigation.navigate('kraftsportUebungenScreen', {gruppe, datum: datum.toLocaleDateString('de-DE', {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                        })})}><Text style={styles.uebungText}>{gruppe}</Text></Pressable>
                ))}
            </View>
            <IconButton size={36} icon='add-circle' color='royalblue' onPress={()=> setShowInput(true)}></IconButton>
            {showInput && (
                <TextInput placeholder='Gruppe'
                           style={styles.input}
                           returnKeyType='done'
                           onChangeText={setAdditionalGruppe}
                           onSubmitEditing={()=> addGruppeToList()}>
                </TextInput>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
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
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        paddingBottom: 20,
        color: 'royalblue',
    },
    uebungContainer: {
        paddingTop: 20,
        paddingBottom: 20
    },
    uebung: {
        backgroundColor: 'lightskyblue',
        margin: 5,
        fontSize: 20,
        padding: 10,
        borderRadius: 10,
        width: 200,
        alignItems: 'center',
    },
    uebungText: {
        fontSize: 20,
    },
    input: {
    borderWidth: 1,
        borderColor: 'darkslateblue',
        padding: 10,
        margin: 10,
        width: '80%',
        borderRadius: 5,
        fontSize: 20
},
});