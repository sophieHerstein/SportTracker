import {FlatList, View} from 'react-native';
import {useEffect, useState} from "react";
import AusdauerStatistikListItem from "./components/AusdauerStatistikListItem";
import {NativeStackScreenProps} from "@react-navigation/native-stack";
import {NavigatorParamList} from "../../Navigation";
import {EAppPaths} from "../../utils/constants";
import {IAusdauerData} from "../../utils/interfaces";
import EmptyList from "../../components/EmptyList";

type AusdauerStatistikScreenProps = NativeStackScreenProps<NavigatorParamList, EAppPaths.AUSDAUER_STATISTIK>;

export default function AusdauerStatistikScreen({route}: AusdauerStatistikScreenProps) {
    const [data, setData] = useState<IAusdauerData[][]>([]);


    useEffect(() => {
        const grouped = route.params.ausdauerData.reduce<Record<string, IAusdauerData[]>>((acc, item) => {
            if (!acc[item.name]) {
                acc[item.name] = [];
            }
            acc[item.name].push(item);
            return acc;
        }, {});
        const result = Object.values(grouped);
        setData(result);
    }, [])


    return (
        <View>
            <FlatList data={data}
                      renderItem={({item})=> (
                          <AusdauerStatistikListItem item={item}/>
                      )}
                      keyExtractor={(item)=> item[0].name}
                      ListEmptyComponent={
                        <EmptyList/>
                      }
            />
        </View>
    );
}
