import { Pressable, Text } from 'react-native';
import {IBigButtonProps} from "../utils/interfaces";
import {globalStyles} from "../utils/global-styles";

export default function BigButton({onPress, title}: IBigButtonProps) {
    return (
        <Pressable
            onPress={onPress}
            style={globalStyles.buttonPrimary}>
            <Text style={globalStyles.text}>{title}</Text>
        </Pressable>
    );
}