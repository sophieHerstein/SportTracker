import { Pressable, StyleSheet, Text } from 'react-native';
import {IBigButtonProps} from "../utils/interfaces";

export default function BigButton({onPress, title, style}: IBigButtonProps) {
    return (
        <Pressable
            onPress={onPress}
            style={[styles.button, style]}>
            <Text style={styles.title}>{title}</Text>
        </Pressable>
    );
}


const styles =  StyleSheet.create({
    button: {
        borderWidth: 1,
        padding: 10,
        borderRadius: 10,
        borderColor: 'royalblue',
        backgroundColor:'royalblue'
    },
    title: {
        color: 'white',
        fontSize: 18
    }
});