import {Pressable, Text} from "react-native";
import {IBigButtonProps} from "../models/interfaces";
import {globalStyles} from "../utils/global-styles";

export default function BigButton({onPress, title}: IBigButtonProps) {
    return (
        <Pressable
            onPress={onPress}
            style={({pressed}) => [
                globalStyles.buttonPrimary,
                pressed && {opacity: 0.78, transform: [{scale: 0.99}]},
            ]}
        >
            <Text style={globalStyles.buttonText}>{title}</Text>
        </Pressable>
    );
}
