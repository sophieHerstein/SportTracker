import React, {useEffect, useMemo, useState} from 'react';
import {Alert, KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import IconButton from "../../components/IconButton";
import {EAppPaths, highlight, secondary, textColorPrimary} from "../../models/constants";
import {NativeStackScreenProps} from "@react-navigation/native-stack";
import {NavigatorParamList} from "../../Navigation";
import {IKrafttrainingImportData, IMuscleGroupDatabaseResult} from "../../models/interfaces";
import {globalStyles} from "../../utils/global-styles";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {KraftsportService} from "../../services/kraftsport.service";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";

type KraftsportGruppeWaehlenScreenProps = NativeStackScreenProps<NavigatorParamList, EAppPaths.KRAFTSPORT_GRUPPE_WAEHLEN>;

export default function KraftsportGruppeWaehlenScreen({navigation}: KraftsportGruppeWaehlenScreenProps) {
    const [datum, setDatum] = useState(new Date());
    const [showInput, setShowInput] = useState(false);
    const [additionalGruppe, setAdditionalGruppe] = useState('');
    const [gruppen, setGruppen] = useState<string[]>([]);
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [gruppeSchonVorhanden, setGruppeSchonVorhanden] = useState<boolean>(true);

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

    async function importTraining() {
        const result = await DocumentPicker.getDocumentAsync({ type: "application/json" });

        if (result.assets) {
            const fileUri = result.assets[0].uri;
            const content = await FileSystem.readAsStringAsync(fileUri);
            const data: IKrafttrainingImportData = JSON.parse(content);


            await addGruppeToList(data.muscle_group);

            if (!gruppeSchonVorhanden){
               navigation.navigate(EAppPaths.KRAFTSPORT_UEBUNGEN, {
                    gruppe: data.muscle_group,
                    datum: datum.getTime(),
                    uebungen: data.uebungen
                })
            }

        }

    }

    async function getMuskelgruppe() {
        const databaseData: IMuscleGroupDatabaseResult[] = await kraftsportService.getMuscleGroupData();
        const muscleGroups = databaseData.map((row: IMuscleGroupDatabaseResult) => {
            return row.name;
        })
        setGruppen(muscleGroups);
    }

    async function addGruppeToList(gruppe?: string) {
        if(gruppe) {
            if (!gruppen.includes(gruppe) && gruppe.trim() !== '') {
                const neueGruppen = [...gruppen];
                neueGruppen.push(gruppe);
                setGruppen(neueGruppen);
                await kraftsportService.addMuscleGroup(gruppe);
                setGruppeSchonVorhanden(false);
            } else {
                Alert.alert(
                    "Gruppe existiert bereits",
                    "Eine Gruppe mit dem Namen existiert bereits und kann deshalb nicht importiert werden.",
                    [ {
                        text: "Okay",
                        onPress: () => {
                            const alteGruppen = [...gruppen];
                            setGruppen(alteGruppen)
                        }
                    }]
                )
            }
        } else {
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
                           placeholderTextColor={highlight}
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
        backgroundColor: highlight,
        borderRadius: 10
    }
})