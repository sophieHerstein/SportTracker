import {Button, Text, View} from "react-native";
import {globalStyles} from "../utils/global-styles";
import {ETimeRange, highlight, primary} from "../models/constants";
import {ITimeFilterProps} from "../models/interfaces";

export default function TimeFilter({
                                       timeRange,
                                       onPressGesamt,
                                       onPressJahr,
                                       onPress6Monate,
                                       onPress3Monate,
                                       onPressMonat
                                   }: ITimeFilterProps) {
    return (
        <View>
            <Text style={[globalStyles.text, globalStyles.light]}>Filter: </Text>
            <View style={globalStyles.row}>
                <Button color={timeRange === ETimeRange.GESAMT ? primary : highlight} title={"Gesamt"}
                        onPress={onPressGesamt}/>
                <Button color={timeRange === ETimeRange.JAHR ? primary : highlight} title={"Jahr"}
                        onPress={onPressJahr}/>
                <Button color={timeRange === ETimeRange.SECHS_MONATE ? primary : highlight} title={"6 Monate"}
                        onPress={onPress6Monate}/>
                <Button color={timeRange === ETimeRange.DREI_MONATE ? primary : highlight} title={"3 Monate"}
                        onPress={onPress3Monate}/>
                <Button color={timeRange === ETimeRange.MONAT ? primary : highlight} title={"Monat"}
                        onPress={onPressMonat}/>
            </View>
        </View>
    )
}