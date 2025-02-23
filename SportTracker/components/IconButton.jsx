import { MaterialIcons } from '@expo/vector-icons';
import { Pressable } from "react-native";

export default function IconButton({onPress, icon, style, color, size}) {
    return (
        <Pressable onPress={onPress} style={style}>
            <MaterialIcons name={icon} size={size} color={color}/>
        </Pressable>
    );
}