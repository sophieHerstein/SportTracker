import {FlatList, Text, View} from 'react-native';
import {useEffect, useState} from "react";
import AusdauerStatistikListItem from "./components/AusdauerStatistikListItem";
import {NativeStackScreenProps} from "@react-navigation/native-stack";
import {NavigatorParamList} from "../../Navigation";
import {EAppPaths, ETimeRange} from "../../utils/constants";
import {IAusdauerData} from "../../utils/interfaces";
import EmptyList from "../../components/EmptyList";
import {globalStyles} from "../../utils/global-styles";
import Filter from "../../components/Filter";

type AusdauerStatistikScreenProps = NativeStackScreenProps<NavigatorParamList, EAppPaths.AUSDAUER_STATISTIK>;

export default function AusdauerStatistikScreen({route}: AusdauerStatistikScreenProps) {
    const [data, setData] = useState<IAusdauerData[][]>([]);
    const [timeRange, setTimeRange] = useState<ETimeRange>(ETimeRange.GESAMT);

    useEffect(() => {
        const grouped = route.params.ausdauerData.reduce<Record<string, IAusdauerData[]>>((acc, item) => {
            if(timeRange !== ETimeRange.GESAMT){
                let timeRangeInNumbers;
                switch (timeRange){
                    case ETimeRange.JAHR:
                        timeRangeInNumbers = 365
                        break;
                    case ETimeRange.SECHS_MONATE:
                        timeRangeInNumbers = 183
                        break;
                    case ETimeRange.MONAT:
                        timeRangeInNumbers = 30
                        break;
                }

                if(parseDate(item.datum) >= new Date(new Date().setDate(new Date().getDate() - timeRangeInNumbers))){
                    if (!acc[item.name]) {
                        acc[item.name] = [];
                    }
                    acc[item.name].push(item);
                }

            } else {
                if (!acc[item.name]) {
                    acc[item.name] = [];
                }
                acc[item.name].push(item);
            }
            return acc;
        }, {});
        const result = Object.values(grouped);
        setData(result);
    }, [timeRange])

    function parseDate(dateStr: string): Date {
        const [day, month, year] = dateStr.split(".").map(Number);
        return new Date(year, month, day);
    }

    return (
        <View style={globalStyles.screenContainer}>
            <Text style={globalStyles.title}>Entwicklung Dauer & Strecke</Text>
            <Filter
                timeRange={timeRange}
                onPressGesamt={()=> setTimeRange(ETimeRange.GESAMT)}
                onPressJahr={()=> setTimeRange(ETimeRange.JAHR)}
                onPress6Monate={()=> setTimeRange(ETimeRange.SECHS_MONATE)}
                onPressMonat={()=> setTimeRange(ETimeRange.MONAT)}/>
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
