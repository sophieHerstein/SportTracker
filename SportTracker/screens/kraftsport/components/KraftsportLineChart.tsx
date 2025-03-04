import {FlatList, ScrollView, StyleSheet, Text, View} from "react-native";
import {
    IKraftsportLineChartProps,
    IEntwicklungGewichtData,
    IVictoryKraftsportChartProps
} from "../../../utils/interfaces";
import { useMemo } from "react";
import KraftsportLineChartListItem from "./KraftsportLineChartListItem";

export default function KraftsportLineChart({ data }: IKraftsportLineChartProps) {

    const transformedData: IVictoryKraftsportChartProps[] = useMemo(() => {
        return data.map(uebung => ({
            name: uebung.name,
            data: uebung.data
                .map((item: IEntwicklungGewichtData) => ({
                    x: item.datum,
                    y: Number(item.gewicht) || 0
                }))
                .filter(d => !isNaN(d.y) && d.y !== null && d.y !== undefined)
        }));
    }, [data]);

    return (
        <View style={styles.paddingBottom}>
            <FlatList data={transformedData} renderItem={({item})=>
                <KraftsportLineChartListItem uebung={item}/>}/>
        </View>
    );
}

const styles = StyleSheet.create({
    paddingBottom: {
        paddingBottom: 15
    }
});