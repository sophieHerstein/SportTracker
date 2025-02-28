import { MaterialIcons } from '@expo/vector-icons';
import { Pressable } from "react-native";
import {IIconButtonProps} from "../utils/interfaces";

export default function IconButton({onPress, icon, style, color, size}: IIconButtonProps) {
    return (
        <Pressable onPress={onPress} style={style}>
            {/*@ts-ignore*/}
            <MaterialIcons name={icon} size={size} color={color}/>
        </Pressable>
    );
}