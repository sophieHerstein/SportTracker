import {FlatList, StyleSheet, Text, View} from 'react-native';
import {useEffect, useState} from "react";
import StatistikListItem from "../components/StatistikListItem";


export default function AusdauerStatistikScreen({route}) {
    const [data, setData] = useState([]);


    useEffect(() => {
        const grouped = route.params.ausdauerData.reduce((acc, item) => {
            if (!acc[item.name]) {
                acc[item.name] = [];
            }
            acc[item.name].push(item);
            return acc;
        }, {});
        const result = Object.values(grouped);
        result.forEach((item) => {
            console.log(item);
        })
        setData(result);
    }, [])


    return (
        <View>
            <FlatList data={data}
                      renderItem={({item})=> (
                          <StatistikListItem item={item}/>
                      )}
                      keyExtractor={(item)=> item.name}
                      ListEmptyComponent={<Text style={styles.listEmpty}>Keine Daten geladen</Text>}
            />
        </View>
    );
}


const styles =  StyleSheet.create({

});