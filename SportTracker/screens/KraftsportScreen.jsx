import {FlatList, StyleSheet, Text, View} from 'react-native';
import KraftsportListItem from "../components/KraftsportListItem";

const dummyData = [{}, {}, {}];

export default function KraftsportScreen(){
    return (
        <View style={styles.container}>
            <FlatList data={dummyData}
                      renderItem={()=> (
                          <KraftsportListItem/>
                      )}
                      ItemSeparatorComponent={<View style={styles.listSeperators}/>}
                      ListEmptyComponent={<Text style={styles.listEmpty}>Keine Daten geladen</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 50
    },
    listSeperators: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'lightsalmon'
    },
    listEmpty: {
        fontSize: 32,
        paddingTop: 100,
        textAlign: 'center'
    }
});