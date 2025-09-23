import {Button, View} from "react-native";
import {globalStyles} from "../utils/global-styles";
import {highlight, primary} from "../models/constants";
import {ITypeFilterProps} from "../models/interfaces";

export default function TypeFilter({
                                       types,
                                       onPress,
                                       currentChosenType,
                                   }: ITypeFilterProps) {
    return (
        <View style={globalStyles.row}>
            {types.map((t) => (
                <Button
                    key={t}
                    color={t === currentChosenType ? primary : highlight}
                    title={t}
                    onPress={() => onPress(t)}
                />
            ))}
        </View>
    );
}