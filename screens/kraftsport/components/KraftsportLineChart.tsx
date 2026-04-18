import {FlatList} from "react-native";
import {
    IEntwicklungGewichtData,
    IKraftsportLineChartProps,
    IVictoryKraftsportChartProps
} from "../../../models/interfaces";
import {useMemo} from "react";
import KraftsportLineChartListItem from "./KraftsportLineChartListItem";

export default function KraftsportLineChart({data}: IKraftsportLineChartProps) {

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
        <FlatList data={transformedData} renderItem={({item}) =>
            <KraftsportLineChartListItem uebung={item}/>}/>
    );
}