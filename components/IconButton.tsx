import {MaterialIcons} from "@expo/vector-icons";
import {Pressable, StyleSheet} from "react-native";
import {IIconButtonProps} from "../models/interfaces";

export default function IconButton({onPress, icon, style, color, size}: IIconButtonProps) {
    return (
        <Pressable
            hitSlop={10}
            onPress={onPress}
            style={({pressed}) => [styles.button, style, pressed && styles.pressed]}
        >
            {/*@ts-ignore*/}
            <MaterialIcons name={icon} size={size} color={color} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        minWidth: 44,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 22,
    },
    pressed: {
        opacity: 0.65,
    },
});
