import { Pressable, StyleSheet, Text } from 'react-native';

export default function BigButton({onPress, title, style}) {
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