import {KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, View} from "react-native";
import IconButton from "./IconButton";
import BigButton from "./BigButton";


export default function NeuerKraftsportEintrag({visible, onCancel, onSave}) {

    function cancelEditing(){
        onCancel();
    }


    function saveEintrag(){
        alert('Speichern');
    }


    return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? "padding": "height"} style={styles.container}>
            <IconButton onPress={cancelEditing} icon='arrow-back' style={styles.back}/>
            <Text style={styles.title}>Neuen Eintrag hinzufügen</Text>
            {/*<View style={styles.inputContainer}>*/}
            {/*    <View style={styles.row}>*/}
            {/*        <Text style={styles.label}>Datum:</Text>*/}
            {/*        <DateTimePicker*/}
            {/*            testID="dateTimePicker"*/}
            {/*            value={datum}*/}
            {/*            mode='date'*/}
            {/*            onChange={onDateChange}*/}
            {/*        />*/}
            {/*    </View>*/}
            {/*    <View style={styles.pickerRow}>*/}
            {/*        <Text style={styles.label}>Sportart:</Text>*/}
            {/*        <DropDownPicker style={styles.picker} dropDownContainerStyle={styles.picker}*/}
            {/*                        open={open}*/}
            {/*                        value={name}*/}
            {/*                        items={sportarten}*/}
            {/*                        setOpen={setOpen}*/}
            {/*                        setValue={setName}*/}
            {/*                        setItems={setSportarten}*/}
            {/*                        searchable={true}*/}
            {/*                        addCustomItem={true}*/}
            {/*                        searchPlaceholder="Suche ..."*/}
            {/*        />*/}
            {/*    </View>*/}
            {/*    <View style={styles.row}>*/}
            {/*        <Text style={styles.label}>Strecke:</Text>*/}
            {/*        <View style={styles.inputStuff}>*/}
            {/*            <TextInput*/}
            {/*                style={styles.input}*/}
            {/*                onChangeText={setStrecke}/>*/}
            {/*            <Text style={styles.label}>km</Text>*/}
            {/*        </View>*/}
            {/*    </View>*/}
            {/*    <View style={styles.row}>*/}
            {/*        <Text style={styles.label}>Zeit:</Text>*/}
            {/*        <View style={styles.inputStuff}>*/}
            {/*            <TextInput*/}
            {/*                style={styles.input}*/}
            {/*                onChangeText={setDauer}/>*/}
            {/*            <Text style={styles.label}>min</Text>*/}
            {/*        </View>*/}
            {/*    </View>*/}
            {/*</View>*/}
            <BigButton style={styles.speichern} title='Speichern' onPress={()=> saveEintrag()}></BigButton>
        </KeyboardAvoidingView>
    </Modal>
);
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    picker: {
        borderWidth: 1,
        borderColor: 'lightsteelblue',
        padding: 10,
        margin: 10,
        width: '72%',
        borderRadius: 5,
        fontSize: 20,
        marginStart: 26
    },
    pickerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    inputContainer: {
        justifyContent: 'center',
        width: '80%',
        paddingTop: 10,
        paddingBottom: 10
    },
    label: {
        fontSize: 18,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    inputStuff: {
        width: '75%',
        flexDirection: 'row',
        alignItems: 'center'
    },
    input: {
        borderWidth: 1,
        borderColor: 'lightsteelblue',
        padding: 10,
        margin: 10,
        width: '75%',
        borderRadius: 5,
        fontSize: 20
    },
    back: {
        position: 'absolute',
        top: 50,
        left: 20
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        paddingBottom: 20,
        color: 'royalblue',
    },
    speichern: {
        marginTop: 20
    }
});