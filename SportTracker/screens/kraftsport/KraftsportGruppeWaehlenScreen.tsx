import {useEffect, useMemo, useState} from 'react';
import {KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import IconButton from "../../components/IconButton";
import {EAppPaths, hightlight, secondary} from "../../models/constants";
import {NativeStackScreenProps} from "@react-navigation/native-stack";
import {NavigatorParamList} from "../../Navigation";
import {IMuscleGroupDatabaseResult} from "../../models/interfaces";
import {globalStyles} from "../../utils/global-styles";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {KraftsportService} from "../../services/kraftsport.service";

type KraftsportGruppeWaehlenScreenProps = NativeStackScreenProps<NavigatorParamList, EAppPaths.KRAFTSPORT_GRUPPE_WAEHLEN>;

export default function KraftsportGruppeWaehlenScreen({navigation}: KraftsportGruppeWaehlenScreenProps) {
    const [datum, setDatum] = useState(new Date());
    const [showInput, setShowInput] = useState(false);
    const [additionalGruppe, setAdditionalGruppe] = useState('');
    const [gruppen, setGruppen] = useState<string[]>([]);
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    const kraftsportService = useMemo(() => new KraftsportService(), []);

    useEffect(() => {
        getMuskelgruppe();
    }, []);

    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const handleConfirm = (date: Date) => {
        setDatum(date);
        hideDatePicker();
    };

    async function getMuskelgruppe() {
        const databaseData: IMuscleGroupDatabaseResult[] = await kraftsportService.getMuscleGroupData();
        const muscleGroups = databaseData.map((row: IMuscleGroupDatabaseResult) => {
            return row.name;
        })
        setGruppen(muscleGroups);
    }

    async function addGruppeToList() {
        if (!gruppen.includes(additionalGruppe) && additionalGruppe.trim() !== '') {
            const neueGruppen = [...gruppen];
            neueGruppen.push(additionalGruppe);
            setGruppen(neueGruppen);
            await kraftsportService.addMuscleGroup(additionalGruppe);
            setAdditionalGruppe('');
            setShowInput(false);
        } else {
            setAdditionalGruppe('');
            setShowInput(false);
        }
    }

    return (
        <KeyboardAvoidingView behavior={"height"} style={[globalStyles.screenContainer, styles.center]}>
            <Text style={globalStyles.title}>Gruppe wählen</Text>
            <View style={[globalStyles.container, styles.paddingVertical]}>
                <View style={globalStyles.row}>
                    <Text style={globalStyles.text}>Datum:</Text>
                    <Pressable style={globalStyles.setDate} onPress={showDatePicker}>
                        <Text style={globalStyles.setDateText}>{datum.toLocaleDateString('de-DE', {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                        })}</Text>
                    </Pressable>
                    <DateTimePickerModal
                        locale="de-DE"
                        isVisible={isDatePickerVisible}
                        mode="date"
                        onConfirm={handleConfirm}
                        onCancel={hideDatePicker}
                        confirmTextIOS="OK"
                        cancelTextIOS="Abbrechen"
                        date={datum}
                    />
                </View>
            </View>
            <View style={styles.paddingVertical}>
                {gruppen.map((gruppe, index) => (
                    <Pressable
                        key={index}
                        style={[globalStyles.buttonPrimary, styles.buttonWidth]}
                        onPress={() => navigation.navigate(EAppPaths.KRAFTSPORT_UEBUNGEN, {
                            gruppe,
                            datum: datum.getTime()
                        })}>
                        <Text style={globalStyles.buttonText}>{gruppe}</Text>
                    </Pressable>
                ))}
            </View>
            <IconButton
                size={36}
                icon='add'
                color={secondary}
                onPress={() => setShowInput(true)}>
            </IconButton>
            {showInput && (
                <TextInput placeholder='Gruppe'
                           style={globalStyles.input}
                           placeholderTextColor={hightlight}
                           returnKeyType='done'
                           onChangeText={setAdditionalGruppe}
                           onSubmitEditing={() => addGruppeToList()}>
                </TextInput>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    buttonWidth: {
        width: 150
    },
    paddingVertical: {
        paddingVertical: 10
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    background: {
        backgroundColor: hightlight,
        borderRadius: 10
    }
})