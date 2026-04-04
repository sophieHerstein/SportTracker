import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Modal, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import BigButton from '../../components/BigButton';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {ITrainingstypDatabaseResult, ITrainingstypDropdown} from "../../models/interfaces";
import {NativeStackScreenProps} from "@react-navigation/native-stack";
import {NavigatorParamList} from "../../Navigation";
import {EAppPaths, highlight, secondary, secondaryBackground, textColorPrimary} from "../../models/constants";
import {globalStyles} from "../../utils/global-styles";
import IconButton from "../../components/IconButton";
import {AusdauerService} from "../../services/ausdauer.service";
import {getTageszeit} from "../../utils/helper";
import {Dropdown} from "react-native-element-dropdown";

type NeuerAusdauerEintragScreenProps = NativeStackScreenProps<NavigatorParamList, EAppPaths.AUSDAUER_EINTRAG>;

export default function NeuerAusdauerEintragScreen({navigation, route}: NeuerAusdauerEintragScreenProps) {
    const [datum, setDatum] = useState(new Date());
    const [name, setName] = useState('');
    const [strecke, setStrecke] = useState('');
    const [dauer, setDauer] = useState('');
    const [sportarten, setSportarten] = useState<ITrainingstypDropdown[]>([]);
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);
    const [newSportart, setNewSportart] = useState('');

    const ausdauerService = useMemo(() => new AusdauerService(), []);

    useEffect(() => {
        navigation.setOptions({
            headerLeft: () =>
                <IconButton onPress={() => showAlert()} icon='arrow-back-ios-new' color={textColorPrimary} size={24}/>
        });
    }, [navigation,
        datum,
        name,
        strecke,
        dauer]);

    useEffect(() => {
        const trainingsTypen = route.params.trainingsTypen;
        const trainigstypenMapping: ITrainingstypDropdown[] = trainingsTypen.map((tt: ITrainingstypDatabaseResult) => {
            return {label: tt.name, value: tt.name}
        })
        const dropdownData = [
            ...trainigstypenMapping,
            {label: '+ Neue Sportart hinzufügen', value: '__add_new__'}
        ];
        setSportarten(dropdownData);
    }, [])

    function showAlert() {
        Alert.alert(
            "Training speichern?",
            "Soll das Training gespeichert werden?",
            [{text: "Nein", onPress: () => navigation.goBack(), style: "destructive"}, {
                text: "Ja",
                onPress: () => saveEintrag()
            }]
        )
    }

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

    function isStringValidNumber(value: string) {
        return !Number.isNaN(parseFloat(value));
    }

    function isDauerValid() {
        return isStringValidNumber(dauer) && parseFloat(dauer) > 0;
    }

    async function saveEintrag() {
        if (!isDauerValid()) {
            alert('Bitte die Dauer überprüfen');
            return;
        }
        if (!strecke) {
            setStrecke('0');
        }

        try {
            await saveEintragInDB()
            navigation.goBack();
        } catch (error) {
            console.error("❌ Fehler beim Speichern: ", error);
        }
    }

    async function saveEintragInDB() {
        if (!trainingsTypExists(name)) {
            await ausdauerService.addTrainingstyp(name)
        }
        const trainingsTypId: { id: number } | null = await ausdauerService.getIdForTrainingstyp(name);

        if (!!trainingsTypId) {
            const tagesZeit = getTageszeit();
            await ausdauerService.addAusdauerTrainingseinheit(trainingsTypId.id, datum.getTime(), parseFloat(dauer), parseFloat(strecke ?? 0), tagesZeit);
        }
    }

    function trainingsTypExists(trainingstypName: string) {
        return route.params.trainingsTypen.filter((tt: ITrainingstypDatabaseResult) => tt.name === trainingstypName).length > 0;
    }

    function handleAddSportart() {
        const trimmed = newSportart.trim();
        if (!trimmed) return;

        const exists = sportarten.some(
            (s) => s.value.toLowerCase() === trimmed.toLowerCase()
        );

        if (exists) {
            Alert.alert("Existiert bereits");
            return;
        }

        const newEntry = {
            label: trimmed,
            value: trimmed,
        };

        setSportarten(prev => [...prev, newEntry]);
        setName(trimmed);

        setNewSportart('');
        setModalVisible(false);
    }

    return (
        <View style={[globalStyles.screenContainer, styles.center]}>
            <Text style={globalStyles.title}>Neuen Eintrag hinzufügen</Text>
            <View style={styles.inputContainer}>
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
                <View style={globalStyles.row}>
                    <Text style={globalStyles.text}>Sportart:</Text>
                    <View style={{width: '72%', marginStart: 26}}>
                        <Dropdown
                            style={styles.dropdown}
                            data={sportarten}
                            labelField="label"
                            valueField="value"
                            placeholder="Sportart auswählen"
                            search
                            searchPlaceholder="Suche ..."
                            value={name}
                            onChange={(item) => {
                                if (item.value === '__add_new__') {
                                    setModalVisible(true);
                                    return;
                                }
                                if (item.value !== '__add_new__') {
                                    setName(item.value);
                                }
                            }}
                            selectedTextStyle={{color: highlight}}   // wichtig für Sichtbarkeit
                            placeholderStyle={{color: 'gray'}}
                        />
                    </View>
                </View>
                <View style={globalStyles.row}>
                    <Text style={globalStyles.text}>Zeit:</Text>
                    <View style={styles.input}>
                        <TextInput
                            style={globalStyles.input}
                            onChangeText={setDauer}/>
                        <Text style={globalStyles.text}>min</Text>
                    </View>
                </View>
                <View style={globalStyles.row}>
                    <Text style={globalStyles.text}>Strecke:</Text>
                    <View style={styles.input}>
                        <TextInput
                            style={globalStyles.input}
                            onChangeText={setStrecke}/>
                        <Text style={globalStyles.text}>km</Text>
                    </View>
                </View>
            </View>
            <BigButton title='Speichern' onPress={() => saveEintrag()}></BigButton>
            <Modal visible={isModalVisible} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={globalStyles.title}>Neue Sportart</Text>

                        <TextInput
                            style={globalStyles.input}
                            placeholder="z.B. Tennis"
                            value={newSportart}
                            onChangeText={setNewSportart}
                        />

                        <View style={{flexDirection: 'row', marginTop: 10}}>
                            <BigButton
                                title="Abbrechen"
                                onPress={() => {
                                    setModalVisible(false);
                                    setName('');
                                    setNewSportart('');
                                }}
                            />
                            <BigButton
                                title="Hinzufügen"
                                onPress={handleAddSportart}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    background: {
        backgroundColor: highlight,
        borderRadius: 10
    },
    inputContainer: {
        justifyContent: 'center',
        width: '80%',
        paddingTop: 10,
        paddingBottom: 10
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
    input: {
        width: '75%',
        flexDirection: 'row',
        alignItems: 'center'
    },
    center: {
        justifyContent: "center",
        alignItems: "center"
    },
    dropdown: {
        margin: 10,
        marginStart: 0,
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        height: 50,
        borderColor: highlight,
        color: highlight,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: secondaryBackground,
        padding: 20,
        borderRadius: 10,
        borderColor: secondary,
    }
})