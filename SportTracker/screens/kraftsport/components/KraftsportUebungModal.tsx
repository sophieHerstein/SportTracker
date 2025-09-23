import {FlatList, Modal, Pressable, Switch, Text, View} from "react-native";
import {
    IEntwicklungGewichtData,
    IEntwicklungGewichtDatabaseResult,
    IKraftpsortUebungModalProps,
    ISatz,
    ISatzDB,
    IVictoryKraftsportChartProps
} from "../../../models/interfaces";
import {globalStyles} from "../../../utils/global-styles";
import EmptyList from "../../../components/EmptyList";
import {useEffect, useMemo, useState} from "react";
import {ETimeRange, primary, textColorPrimary} from "../../../models/constants";
import TimeFilter from "../../../components/TimeFilter";
import KraftsportLineChartListItem from "./KraftsportLineChartListItem";
import {KraftsportService} from "../../../services/kraftsport.service";

export default function KraftsportUebungModal({visible, onCancel, uebung}: IKraftpsortUebungModalProps) {

    const [uebungData, setUebungData] = useState<IVictoryKraftsportChartProps>({
        name: uebung.name,
        data: []
    });
    const [timeRange, setTimeRange] = useState<ETimeRange>(ETimeRange.GESAMT);
    const [lastUebungData, setLastUebungData] = useState<ISatz[]>([]);
    const [isWeightNotIncreasable, setIsWeightNotIncreasable] = useState<boolean>(true);

    const kraftsportService = useMemo(() => new KraftsportService(), []);

    useEffect(() => {
        fetchData();
    }, [])

    useEffect(() => {
        fetchData();
    }, [timeRange]);

    async function fetchData() {
        const lastUebung: ISatzDB[] = await kraftsportService.getLastSatzDataForUebung(uebung.id);
        const canWeightNotBeIncreased = await kraftsportService.getNoMoreIncrease(uebung.id);
        setIsWeightNotIncreasable(canWeightNotBeIncreased.no_more_increase === 1);

        setLastUebungData(lastUebung.map((satz) => {
            return {
                id: satz.satz_id,
                gewicht: satz.weight,
                wiederholungen: satz.repetitions,
            }
        }))

        const entwicklungGewichtResults: IEntwicklungGewichtDatabaseResult[] = await kraftsportService.getEntwicklungGewichtDataForUebung(uebung.id);

        let filteredResults = [...entwicklungGewichtResults]

        if (timeRange !== ETimeRange.GESAMT) {
            let timeRangeInNumbers: number;
            switch (timeRange) {
                case ETimeRange.JAHR:
                    timeRangeInNumbers = 365
                    break;
                case ETimeRange.SECHS_MONATE:
                    timeRangeInNumbers = 183
                    break;
                case ETimeRange.DREI_MONATE:
                    timeRangeInNumbers = 93
                    break;
                case ETimeRange.MONAT:
                    timeRangeInNumbers = 30
                    break;
            }
            filteredResults = entwicklungGewichtResults.filter(row =>
                new Date(row.datum) >= new Date(new Date().setDate(new Date().getDate() - timeRangeInNumbers))
            );
        }

        const groupedData: Record<string, { datum: string; gewicht: number }[]> = {};

        filteredResults.forEach(row => {
            const datum = new Date(row.datum).toLocaleDateString("de-DE");
            const gewicht = row.max_weight;

            if (!groupedData[uebung.name]) {
                groupedData[uebung.name] = [];
            }
            groupedData[uebung.name].push({datum, gewicht});
        });

        const chartData = groupedData[uebung.name] || [];

        const transformedData: IVictoryKraftsportChartProps = {
            name: uebung.name,
            data: chartData.map((item: IEntwicklungGewichtData) => ({
                x: item.datum,
                y: Number(item.gewicht) || 0
            }))
                .filter(d => !isNaN(d.y))
        };

        setUebungData(transformedData);
    }

    function changeIncreasabilityOfWeight() {
        const newIsWeightNotIncreasable = !isWeightNotIncreasable;
        setIsWeightNotIncreasable(newIsWeightNotIncreasable);
        kraftsportService.setNoMoreIncrease(uebung.name, newIsWeightNotIncreasable).then()
    }

    return (
        <Modal visible={visible} animationType="slide">
            <View style={[globalStyles.screenContainer, {paddingTop: 100}]}>
                <Text style={[globalStyles.title, {alignSelf: "center", paddingBottom: 25}]}>{uebung.name}</Text>
                <Text style={[globalStyles.text, {paddingBottom: 10}]}>Gewicht und Wiederholung der letzten
                    Durchführung:</Text>
                <FlatList style={{maxHeight: 100}}
                          data={lastUebungData}
                          renderItem={({item, index}) => {
                              return (
                                  <Text
                                      style={[globalStyles.text, {alignSelf: "center"}]}>Satz {index + 1}: {item.gewicht} x {item.wiederholungen}</Text>
                              )
                          }}
                          keyExtractor={(satz) => satz.id.toString()}
                          ListEmptyComponent={EmptyList}/>
                <View>
                    <TimeFilter
                        timeRange={timeRange}
                        onPressGesamt={() => setTimeRange(ETimeRange.GESAMT)}
                        onPressJahr={() => setTimeRange(ETimeRange.JAHR)}
                        onPress6Monate={() => setTimeRange(ETimeRange.SECHS_MONATE)}
                        onPress3Monate={() => setTimeRange(ETimeRange.DREI_MONATE)}
                        onPressMonat={() => setTimeRange(ETimeRange.MONAT)}/>
                    <KraftsportLineChartListItem isNotListElement={true} uebung={uebungData}/>
                </View>
                <View style={[globalStyles.row, {paddingVertical: 20}]}>
                    <Text style={globalStyles.text}>Gewicht kann nicht mehr erhöht werden</Text>
                    <Switch
                        trackColor={{true: primary}}
                        thumbColor={textColorPrimary}
                        value={isWeightNotIncreasable}
                        onValueChange={() => changeIncreasabilityOfWeight()}/>
                </View>
                <Pressable style={globalStyles.buttonPrimary} onPress={() => onCancel()}>
                    <Text style={globalStyles.buttonText}>Zurück</Text>
                </Pressable>
            </View>
        </Modal>
    );
}