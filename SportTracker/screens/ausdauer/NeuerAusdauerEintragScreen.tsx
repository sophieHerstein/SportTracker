import {useEffect, useState} from 'react';
import {Text, StyleSheet, TextInput, View} from 'react-native';
import BigButton from '../../components/BigButton';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from "react-native-dropdown-picker";
import * as SQLite from "expo-sqlite";
import {
    addAusdauertrainingsEinheitToTable,
    addTrainingsTypToTable,
    getIdForTrainingsTyp
} from "../../utils/database-querys";
import {ITrainingstypDatabaseResult, ITrainingstypDropdown} from "../../utils/interfaces";
import {NativeStackScreenProps} from "@react-navigation/native-stack";
import {NavigatorParamList} from "../../Navigation";
import {EAppPaths, hightlight} from "../../utils/constants";
import {globalStyles} from "../../utils/global-styles";

type NeuerAusdauerEintragScreenProps = NativeStackScreenProps<NavigatorParamList, EAppPaths.AUSDAUER_EINTRAG>;

const database = SQLite.openDatabaseSync('training.db');

export default function NeuerAusdauerEintragScreen({navigation, route}: NeuerAusdauerEintragScreenProps) {
    const [datum, setDatum] = useState(new Date());
    const [name, setName] = useState('Laufen');
    const [strecke, setStrecke] = useState('');
    const [dauer, setDauer] = useState('');
    const [sportarten, setSportarten] = useState<ITrainingstypDropdown[]>([]);

    const [open, setOpen] = useState(false);

    useEffect(() => {
        const trainingsTypen = route.params.trainingsTypen;
        const trainigstypenMapping: ITrainingstypDropdown[] = trainingsTypen.map((tt: ITrainingstypDatabaseResult)=>{
            return {label: tt.name, value: tt.name}
        })
        setSportarten(trainigstypenMapping);
    }, [])

    function isStringValidNumber(value: string) {
        return !Number.isNaN(parseFloat(value)) && parseFloat(value) > 0;
    }

    function isStreckeValid() {
        return isStringValidNumber(strecke);
    }

    function isDauerValid() {
        return isStringValidNumber(dauer);
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
            console.error("❌ Fehler beim Speichern: ", error);
        }
    }

    async function saveEintragInDB() {
        if(!trainingsTypExists(name)){
            await database.runAsync(addTrainingsTypToTable(name));
        }
        const trainingsTypId: {id: number}| null = await database.getFirstAsync(getIdForTrainingsTyp(name));
        if(!!trainingsTypId){
            await database.runAsync(addAusdauertrainingsEinheitToTable(trainingsTypId.id, datum.getTime(), parseFloat(dauer), parseFloat(strecke)));
        }
    }

    function trainingsTypExists(trainingstypName: string){
        return route.params.trainingsTypen.filter((tt: ITrainingstypDatabaseResult) => tt.name === trainingstypName).length > 0;
    }

    return (
        <View style={[globalStyles.screenContainer, styles.center]}>
            <Text style={globalStyles.title}>Neuen Eintrag hinzufügen</Text>
            <View style={styles.inputContainer}>
                <View style={globalStyles.row}>
                    <Text style={globalStyles.text}>Datum:</Text>
                    <DateTimePicker
                        style={styles.background}
                        testID="dateTimePicker"
                        value={datum}
                        mode='date'
                        onChange={(_, datum) => setDatum(datum ?? new Date())}
                    />
                </View>
                <View style={globalStyles.row}>
                    <Text style={globalStyles.text}>Sportart:</Text>
                    <DropDownPicker style={styles.picker} dropDownContainerStyle={{}}
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
                <View style={globalStyles.row}>
                    <Text style={globalStyles.text}>Strecke:</Text>
                    <View style={styles.input}>
                        <TextInput
                            style={globalStyles.input}
                            onChangeText={setStrecke}/>
                        <Text style={globalStyles.text}>km</Text>
                    </View>
                </View>
                <View style={globalStyles.row}>
                    <Text style={globalStyles.text}>Zeit:</Text>
                    <View style={styles.input}>
                        <TextInput
                            style={globalStyles.input}
                            onChangeText={setDauer}/>
                        <Text style={globalStyles.text}>min</Text>
                    </View>
                </View>
            </View>
            <BigButton title='Speichern' onPress={()=> saveEintrag()}></BigButton>
        </View>
    );
}

const styles = StyleSheet.create({
    background: {
        backgroundColor: hightlight,
        borderRadius: 10
    },
    inputContainer: {
        justifyContent: 'center',
        width: '80%',
        paddingTop: 10,
        paddingBottom: 10
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
    input: {
        width: '75%',
        flexDirection: 'row',
        alignItems: 'center'
    },
    center: {
        justifyContent: "center",
        alignItems: "center"
    }
})