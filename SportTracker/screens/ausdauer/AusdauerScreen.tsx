import {FlatList, StyleSheet, View} from 'react-native';
import AusdauerListItem from "./components/AusdauerListItem";
import IconButton from "../../components/IconButton";
import {useState} from 'react';
import * as SQLite from 'expo-sqlite'
import {useFocusEffect} from "@react-navigation/native";
import { useCallback } from 'react';
import {EAppPaths} from "../../utils/constants";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyList from "../../components/EmptyList";
import {
    createAusdauertrainingseinheitTable,
    createTrainingsTypTable, deleteAusdauerTrainingseinheitWithId, getAllAusdauertrainingseinheiten,
    getAllTrainingstypen
} from "../../utils/database-querys";
import {NativeStackScreenProps} from "@react-navigation/native-stack";
import {NavigatorParamList} from "../../Navigation";
import {
    IAusdauerData,
    IAusdauertrainingseinheitDatabaseResult,
    ITrainigstypDatabaseResult
} from "../../utils/interfaces";

type AusdauersportScreenProps = NativeStackScreenProps<NavigatorParamList, EAppPaths.AUSDAUER_HOME>;

const database = SQLite.openDatabaseSync('training.db');

export default function AusdauerScreen({navigation, route}: AusdauersportScreenProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [ausdauerData, setData] = useState<IAusdauerData[]>([]);
    const [trainingsTypen, setTrainingsTypen] = useState<ITrainigstypDatabaseResult[]>([]);

    useFocusEffect(useCallback(() => {
        initDB();
    }, []));


    async function initDB(){
        setIsLoading(true);
        database.runSync(createTrainingsTypTable);
        database.runSync(createAusdauertrainingseinheitTable);
        const [trainingsTypenRows, ausdauertrainingseinheitRows] = await Promise.all([
            database.getAllAsync(getAllTrainingstypen) as Promise<ITrainigstypDatabaseResult[]>,
            database.getAllAsync(getAllAusdauertrainingseinheiten) as Promise<IAusdauertrainingseinheitDatabaseResult[]>,
        ]);
        setTrainingsTypen(trainingsTypenRows);
        const newAusdauertrainingsDaten: IAusdauerData[] = ausdauertrainingseinheitRows.map((ad: IAusdauertrainingseinheitDatabaseResult)=> {
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
        newAusdauertrainingsDaten.sort((a,b) => b.datum_as_timestamp - a.datum_as_timestamp);
        setData(newAusdauertrainingsDaten);
        setIsLoading(false);
    }

    async function removeEintragFromList(id: number){
        const newAusdauerData: IAusdauerData[] = [...ausdauerData];
        await database.runAsync(deleteAusdauerTrainingseinheitWithId(id));
        const deletedAusdauerEntry = newAusdauerData.find(item => item.id === id);
        if(!!deletedAusdauerEntry){
            const index = newAusdauerData.indexOf(deletedAusdauerEntry);
            newAusdauerData.splice(index, 1);
        }
        setData(newAusdauerData);
    }


    if (isLoading) {
        <LoadingSpinner />
    }

    return (
        <View style={styles.container}>
            <IconButton
                size={36}
                color='royalblue'
                onPress={() => navigation.navigate(EAppPaths.AUSDAUER_STATISTIK, {ausdauerData})}
                style={styles.statistics}
                icon='bar-chart'>
            </IconButton>
            <IconButton
                size={36}
                color='royalblue'
                onPress={()=> navigation.navigate(EAppPaths.AUSDAUER_EINTRAG, { trainingsTypen })}
                style={styles.new}
                icon='add-circle'>
            </IconButton>
            <FlatList data={ausdauerData}
                      renderItem={({item})=> (
                          <AusdauerListItem item={item} onDelete={(id: number) => removeEintragFromList(id)}/>
                      )}
                      keyExtractor={(item)=> item.id.toString()}
                      ListEmptyComponent={EmptyList}
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