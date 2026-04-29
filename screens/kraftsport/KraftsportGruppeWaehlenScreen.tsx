import React, {useEffect, useMemo, useState} from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import IconButton from "../../components/IconButton";
import {EAppPaths, highlight, primary, secondary} from "../../models/constants";
import {NativeStackScreenProps} from "@react-navigation/native-stack";
import {NavigatorParamList} from "../../Navigation";
import {IKrafttrainingUndUebungData,} from "../../models/interfaces";
import {globalStyles} from "../../utils/global-styles";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {KraftsportService} from "../../services/kraftsport.service";
import Carousel from "pinar";

const width = Dimensions.get('window').width;
type KraftsportGruppeWaehlenScreenProps = NativeStackScreenProps<NavigatorParamList, EAppPaths.KRAFTSPORT_GRUPPE_WAEHLEN>;

export default function KraftsportGruppeWaehlenScreen({navigation}: KraftsportGruppeWaehlenScreenProps) {
    const [datum, setDatum] = useState(new Date());
    const [additionalGruppe, setAdditionalGruppe] = useState('');
    const [gruppen, setGruppen] = useState<IKrafttrainingUndUebungData[]>([]);
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [itemForEdit, setItemForEdit] = useState<IKrafttrainingUndUebungData | null>(null);
    const [editName, setEditName] = useState('');
    const [editExercises, setEditExercises] = useState<{ id: number, name: string }[]>([]);

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
        const databaseData = await kraftsportService.getMuscleGroupsWithExercises();
        const databaseDataWithAdditionalSlide = [
            ...databaseData,
            {
                id: Date.now(),
                name: "Neue Gruppe hinzufügen",
                exercises: []
            }
        ]
        setGruppen(databaseDataWithAdditionalSlide);
    }

    async function addGruppeToList() {
        if (!gruppen.some(g => g.name === additionalGruppe) && additionalGruppe.trim() !== '') {
            await kraftsportService.addMuscleGroup(additionalGruppe);
            navigation.navigate(EAppPaths.KRAFTSPORT_UEBUNGEN, {
                gruppe: additionalGruppe,
                datum: datum.getTime()
            })
        } else {
            setAdditionalGruppe('');
        }
    }

    async function handleRemoveExercise(exerciseId: number) {
        if (!itemForEdit) return;

        setEditExercises(prev => prev.filter(ex => ex.id !== exerciseId));

        await kraftsportService.deleteUebungReferenzFromGruppe(
            exerciseId,
            itemForEdit.name
        );

        const trainingIds = await kraftsportService.getExcerciseTrainingsIdsForExerciseId(exerciseId);

        if (!trainingIds) {
            console.log("trainingIds ist null/undefined");
            return;
        }

        for (const trainingId of trainingIds) {
            const setIds = await kraftsportService.getExcerciseSetIdsForExcerciseTrainingsId(trainingId.id);

            if (!setIds || setIds.length === 0) {
                await kraftsportService.deleteExerciseTrainingForId(trainingId.id);
                await kraftsportService.deleteExerciseForId(exerciseId);
            }
        }
    }

    async function handleSaveEdit() {
        if (!itemForEdit) return;

        // 1. Gruppenname updaten
        if (editName !== itemForEdit.name && !!itemForEdit.id) {
            await kraftsportService.updateMuscleGroup(itemForEdit.id, editName);
        }

        // 2. Übungen updaten
        for (const ex of editExercises) {
            const original = itemForEdit.exercises.find(e => e.id === ex.id);

            if (original && original.name !== ex.name) {
                await kraftsportService.updateExercise(ex.id, ex.name);
            }
        }

        // 3. UI aktualisieren
        await getMuskelgruppe();

        setShowEditModal(false);
    }

    async function handleDeleteGroup() {
        if (!itemForEdit) return;

        Alert.alert(
            "Gruppe löschen",
            "Willst du diese Gruppe wirklich entfernen?",
            [
                {text: "Abbrechen"},
                {
                    text: "Löschen",
                    onPress: async () => {
                        await kraftsportService.deleteMuscleGroup(itemForEdit.id!);
                        setShowEditModal(false);
                        await getMuskelgruppe();
                    }
                }
            ]
        );
    }

    return (
        <KeyboardAvoidingView behavior={"height"} style={[globalStyles.screenContainer, styles.center]}>
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
                <Carousel
                    key={gruppen.length}
                    showsControls={false}
                    showsDots={true}
                    loop={true}
                    autoplay={false}
                    dotStyle={styles.dotStyle}
                    activeDotStyle={[styles.dotStyle, styles.activeDotStyle]}
                >
                    {gruppen.map((item, index) => (
                        <View
                            key={item.id}
                            style={styles.carousel}
                        >
                            {item.name != "Neue Gruppe hinzufügen" &&
                                <IconButton
                                    style={styles.editButton}
                                    size={32}
                                    color={highlight}
                                    icon="edit"
                                    onPress={() => {
                                        setItemForEdit(item);
                                        setEditName(item.name);
                                        setEditExercises(item.exercises);
                                        setShowEditModal(true);
                                    }}></IconButton>}
                            <Pressable onPress={() => {
                                if (index != gruppen.length - 1) {
                                    navigation.navigate(EAppPaths.KRAFTSPORT_UEBUNGEN, {
                                        gruppe: item.name,
                                        datum: datum.getTime()
                                    })
                                }
                            }}>
                                <Text style={[globalStyles.title, {color: highlight}]}>
                                    {item.name}
                                </Text>
                                {item.exercises.length > 0 &&
                                    <View style={{marginTop: 10}}>
                                        {item.exercises.map((ex) => (
                                            <Text key={ex.id} style={[globalStyles.text, {color: highlight}]}>
                                                {ex.name}
                                            </Text>
                                        ))}
                                    </View>
                                }
                                {item.exercises.length == 0 && item.name == "Neue Gruppe hinzufügen" &&
                                    <View style={{marginTop: 10, flexDirection: "row", alignItems: "center"}}>
                                        <TextInput placeholder='Gruppe'
                                                   style={globalStyles.input}
                                                   placeholderTextColor={highlight}
                                                   returnKeyType='done'
                                                   onChangeText={setAdditionalGruppe}
                                                   onSubmitEditing={() => addGruppeToList()}>
                                        </TextInput>
                                        <IconButton
                                            size={36}
                                            icon='add'
                                            color={secondary}
                                            onPress={() => addGruppeToList()}>
                                        </IconButton>
                                    </View>
                                }
                            </Pressable>
                        </View>
                    ))}
                </Carousel>
            </View>
            <Modal animationType="slide" visible={showEditModal}>
                <View style={[globalStyles.screenContainer, {paddingTop: 100}]}>
                    <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 30}}>

                        {/* Gruppenname */}
                        <TextInput
                            value={editName}
                            onChangeText={setEditName}
                            style={[globalStyles.input, {flex: 1}]}
                        />
                        <IconButton
                            size={32}
                            icon="delete"
                            color={primary}
                            onPress={() => handleDeleteGroup()}
                        />
                    </View>
                    <Text style={globalStyles.subtitle}>Übungen</Text>
                    {/* Übungen */}
                    <FlatList
                        data={editExercises}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({item}) => (
                            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10}}>

                                {/* Name bearbeiten */}
                                <TextInput
                                    value={item.name}
                                    onChangeText={(text) => {
                                        setEditExercises(prev =>
                                            prev.map(ex =>
                                                ex.id === item.id ? {...ex, name: text} : ex
                                            )
                                        );
                                    }}
                                    style={[globalStyles.input, {flex: 1}]}
                                />

                                {/* Entfernen */}
                                <IconButton
                                    size={32}
                                    icon="delete"
                                    color={primary}
                                    onPress={() => handleRemoveExercise(item.id)}
                                />
                            </View>
                        )}
                    />

                    {/* Buttons */}
                    <View style={{flexDirection: 'row', justifyContent: 'space-around', marginTop: 20}}>
                        <IconButton color={primary} size={32} icon="close" onPress={() => setShowEditModal(false)}/>
                        <IconButton color={primary} size={32} icon="check" onPress={handleSaveEdit}/>
                    </View>

                </View>
            </Modal>
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
    },
    carousel: {
        flex: 1,
        backgroundColor: primary,
        margin: 5,
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 20,
        justifyContent: 'flex-start',
        gap: 75
    },
    editButton: {
        alignSelf: "flex-end",
    },
    dotStyle: {
        backgroundColor: secondary,
        width: 10,
        height: 10,
        margin: 5,
        borderRadius: 50
    },
    activeDotStyle: {
        backgroundColor: highlight
    }
})