import {Button, Text, View} from "react-native";
import {globalStyles} from "../utils/global-styles";
import {ETimeRange, hightlight, primary} from "../utils/constants";
import {IFilterProps} from "../utils/interfaces";

export default function Filter({timeRange, onPressGesamt, onPressJahr, onPress6Monate, onPressMonat, onPressWoche}: IFilterProps) {
    return (
        <View>
            <Text style={[globalStyles.text, globalStyles.light]}>Filter: </Text>
            <View style={globalStyles.row}>
                <Button color={timeRange === ETimeRange.GESAMT ? primary : hightlight} title={"Gesamt"} onPress={onPressGesamt}/>
                <Button color={timeRange === ETimeRange.JAHR ? primary : hightlight} title={"Jahr"} onPress={onPressJahr}/>
                <Button color={timeRange === ETimeRange.SECHS_MONATE ? primary : hightlight} title={"6 Monate"} onPress={onPress6Monate}/>
                <Button color={timeRange === ETimeRange.MONAT ? primary : hightlight} title={"Monat"} onPress={onPressMonat}/>
                {onPressWoche && (
                    <Button color={timeRange === ETimeRange.WOCHE ? primary : hightlight} title={"Woche"} onPress={onPressWoche}/>
                )}
            </View>
        </View>
    )
}