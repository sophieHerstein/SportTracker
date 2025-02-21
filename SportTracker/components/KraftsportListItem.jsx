import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function KraftsportListItem(){
    return (
        <Pressable style={styles.container} onPress={()=>alert("Kraftsport")}>
            <View style={styles.info}>
                <Text style={styles.name}>TEXT</Text>
                <Text style={styles.email}>TEXT2</Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 70,
        gap: 10,
        padding: 10,
    },
    image: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    info: {
        justifyContent: 'space-evenly',
    },
    name: {
        fontSize: 20
    },
    email: {
        fontSize: 16,
        fontWeight: 100
    }
});