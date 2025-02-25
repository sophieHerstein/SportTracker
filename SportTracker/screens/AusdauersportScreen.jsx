import {ActivityIndicator, FlatList, StyleSheet, Text, View} from 'react-native';
import AusdauersportListItem from "../components/AusdauersportListItem";
import IconButton from "../components/IconButton";
import {useState} from 'react';
import * as SQLite from 'expo-sqlite'
import {useFocusEffect} from "@react-navigation/native";
import { useCallback } from 'react';

// TODO:   Charts
//         Trends
//         Empfehlungen oder ähnliches oder Analysen sowas halt

const database = SQLite.openDatabaseSync('training.db');

export default function AusdauersportScreen({navigation, route}) {
    const [isLoading, setIsLoading] = useState(false);
    const [ausdauerData, setData] = useState([]);
    const [trainingsTypen, setTrainingsTypen] = useState([]);

    useFocusEffect(useCallback(() => {
        initDB();
    }, []));


    async function initDB(){
        setIsLoading(true);
        database.runSync('CREATE TABLE IF NOT EXISTS Trainingstyp (id PRIMARY KEY, name TEXT UNIQUE NOT NULL)');
        database.runSync('CREATE TABLE IF NOT EXISTS Ausdauertrainingseinheit (id PRIMARY KEY, trainingstyp_id INT REFERENCES Trainingstyp(id) ON DELETE CASCADE, datum INT NOT NULL, dauer_minuten INT NOT NULL, strecke_km DECIMAL(5,2) NOT NULL)');
        const [trainingsTypenRows, ausdauertrainingseinheitRows] = await Promise.all([
            database.getAllAsync('SELECT * FROM Trainingstyp'),
            database.getAllAsync('SELECT * FROM Ausdauertrainingseinheit')
        ]);
        setTrainingsTypen(trainingsTypenRows);
        const newAusdauertrainingsDaten = ausdauertrainingseinheitRows.map((ad)=> {
            return {
                datum_as_timestamp: ad.datum,
                datum: new Date(ad.datum).toLocaleDateString('de-DE', {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }),
                dauer: ad.dauer_minuten,
                id: ad.id,
                strecke: ad.strecke_km,
                name: trainingsTypenRows.filter((tt) => tt.id === ad.trainingstyp_id)[0].name
            }
        });
        newAusdauertrainingsDaten.sort((a,b) => a.datum_as_timestamp - b.datum_as_timestamp);
        setData(newAusdauertrainingsDaten);
        setIsLoading(false);
    }

    async function removeEintragFromList(id){
        const newAusdauerData = [...ausdauerData];
        await database.runAsync('DELETE FROM Ausdauertrainingseinheit WHERE id=?', id);
        const index = newAusdauerData.indexOf(newAusdauerData.find(item => item.id === id));
        newAusdauerData.splice(index, 1);
        setData(newAusdauerData);
    }


    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="red" />
                <Text>Lade Daten...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <IconButton
                size={36}
                color='royalblue'
                onPress={() => navigation.navigate('ausdauerStatistikScreen')}
                style={styles.statistics}
                icon='bar-chart'>
            </IconButton>
            <IconButton
                size={36}
                color='royalblue'
                onPress={()=> navigation.navigate('neuerAusdauerEintragScreen', { trainingsTypen })}
                style={styles.new}
                icon='add-circle'>
            </IconButton>
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
    statistics: {
        position: 'absolute',
        top: 60,
        left: 30,
    },
    new: {
        position: 'absolute',
        top: 60,
        right: 30,
    },
});