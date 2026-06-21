import React, {useEffect, useMemo, useState} from "react";
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import IconButton from "../../components/IconButton";
import {
    borderColor,
    EAppPaths,
    highlight,
    primary,
    secondary,
    secondaryBackground,
    surfaceElevated,
    textColorMuted,
} from "../../models/constants";
import {NativeStackScreenProps} from "@react-navigation/native-stack";
import {NavigatorParamList} from "../../Navigation";
import {IKrafttrainingUndUebungData} from "../../models/interfaces";
import {globalStyles} from "../../utils/global-styles";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {KraftsportService} from "../../services/kraftsport.service";
type KraftsportGruppeWaehlenScreenProps = NativeStackScreenProps<
    NavigatorParamList,
    EAppPaths.KRAFTSPORT_GRUPPE_WAEHLEN
>;

export default function KraftsportGruppeWaehlenScreen({
    navigation,
}: KraftsportGruppeWaehlenScreenProps) {
    const [datum, setDatum] = useState(new Date());
    const [additionalGruppe, setAdditionalGruppe] = useState("");
    const [gruppen, setGruppen] = useState<IKrafttrainingUndUebungData[]>([]);
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [itemForEdit, setItemForEdit] = useState<IKrafttrainingUndUebungData | null>(null);
    const [editName, setEditName] = useState("");
    const [editExercises, setEditExercises] = useState<{id: number; name: string}[]>([]);

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
        setGruppen(databaseData);
    }

    async function addGruppeToList() {
        const trimmedName = additionalGruppe.trim().replace(/\s+/g, " ");
        const exists = gruppen.some(
            (group) =>
                group.name.toLocaleLowerCase("de-DE") === trimmedName.toLocaleLowerCase("de-DE")
        );
        if (trimmedName && !exists) {
            await kraftsportService.addMuscleGroup(trimmedName);
            navigation.navigate(EAppPaths.KRAFTSPORT_UEBUNGEN, {
                gruppe: trimmedName,
                datum: datum.getTime(),
            });
        } else {
            if (exists) Alert.alert("Gruppe existiert bereits");
            setAdditionalGruppe("");
        }
    }

    async function handleRemoveExercise(exerciseId: number) {
        if (!itemForEdit) return;

        setEditExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
    }

    async function handleSaveEdit() {
        if (!itemForEdit) return;

        if (!itemForEdit.id) return;
        try {
            await kraftsportService.updateMuscleGroupConfiguration(
                itemForEdit.id,
                editName,
                editExercises
            );
            await getMuskelgruppe();
            setShowEditModal(false);
        } catch (error) {
            Alert.alert(
                "Änderungen nicht gespeichert",
                error instanceof Error ? error.message : "Unbekannter Fehler"
            );
        }
    }

    async function handleDeleteGroup() {
        if (!itemForEdit) return;

        Alert.alert("Gruppe löschen", "Willst du diese Gruppe wirklich entfernen?", [
            {text: "Abbrechen"},
            {
                text: "Löschen",
                onPress: async () => {
                    await kraftsportService.deleteMuscleGroup(itemForEdit.id!);
                    setShowEditModal(false);
                    await getMuskelgruppe();
                },
            },
        ]);
    }

    return (
        <KeyboardAvoidingView behavior={"padding"} style={globalStyles.screenContainer}>
            <View style={styles.intro}>
                <Text style={globalStyles.title}>Was trainierst du?</Text>
                <Text style={styles.caption}>Wähle eine Gruppe oder lege direkt eine neue an.</Text>
                <View style={styles.dateRow}>
                    <Text style={globalStyles.text}>Datum:</Text>
                    <Pressable style={globalStyles.setDate} onPress={showDatePicker}>
                        <Text style={globalStyles.setDateText}>
                            {datum.toLocaleDateString("de-DE", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                            })}
                        </Text>
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
            <FlatList
                data={gruppen}
                keyExtractor={(item) => item.id?.toString() ?? item.name}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <View style={styles.addCard}>
                        <View style={styles.addHeading}>
                            <View>
                                <Text style={globalStyles.subtitle}>Neue Gruppe</Text>
                                <Text style={styles.caption}>Zum Beispiel „Oberkörper“</Text>
                            </View>
                            <IconButton
                                size={28}
                                icon="add-circle"
                                color={secondary}
                                onPress={() => void addGruppeToList()}
                            />
                        </View>
                        <TextInput
                            value={additionalGruppe}
                            placeholder="Gruppenname"
                            style={[globalStyles.input, styles.fullInput]}
                            placeholderTextColor={textColorMuted}
                            returnKeyType="done"
                            onChangeText={setAdditionalGruppe}
                            onSubmitEditing={() => void addGruppeToList()}
                        />
                    </View>
                }
                renderItem={({item}) => (
                    <View style={styles.groupCard}>
                        <View style={styles.groupHeading}>
                            <Pressable
                                style={({pressed}) => [styles.groupText, pressed && styles.pressed]}
                                onPress={() =>
                                    navigation.navigate(EAppPaths.KRAFTSPORT_UEBUNGEN, {
                                        gruppe: item.name,
                                        datum: datum.getTime(),
                                    })
                                }
                            >
                                <View>
                                    <Text style={styles.groupTitle}>{item.name}</Text>
                                    <Text style={styles.exerciseCount}>
                                        {item.exercises.length === 0
                                            ? "Noch keine Übungen"
                                            : `${item.exercises.length} Übung${item.exercises.length === 1 ? "" : "en"}`}
                                    </Text>
                                </View>
                                {item.exercises.length > 0 && (
                                    <Text style={styles.exercisePreview}>
                                        {item.exercises
                                            .map((exercise) => exercise.name)
                                            .join(" · ")}
                                    </Text>
                                )}
                            </Pressable>
                            <IconButton
                                size={24}
                                color={textColorMuted}
                                icon="edit"
                                onPress={() => {
                                    setItemForEdit(item);
                                    setEditName(item.name);
                                    setEditExercises(item.exercises);
                                    setShowEditModal(true);
                                }}
                            />
                        </View>
                    </View>
                )}
            />
            <Modal animationType="slide" visible={showEditModal}>
                <KeyboardAvoidingView
                    behavior="padding"
                    style={[globalStyles.screenContainer, styles.modal]}
                >
                    <Text style={globalStyles.title}>Gruppe bearbeiten</Text>
                    <Text style={styles.caption}>
                        Änderungen werden erst beim Speichern übernommen.
                    </Text>
                    <View style={styles.editHeading}>
                        {/* Gruppenname */}
                        <TextInput
                            value={editName}
                            onChangeText={setEditName}
                            style={[globalStyles.input, styles.editNameInput]}
                        />
                        <IconButton
                            size={32}
                            icon="delete"
                            color={primary}
                            onPress={() => handleDeleteGroup()}
                        />
                    </View>
                    <Text style={[globalStyles.subtitle, styles.exerciseHeading]}>Übungen</Text>
                    {/* Übungen */}
                    <FlatList
                        data={editExercises}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({item}) => (
                            <View style={styles.exerciseRow}>
                                {/* Name bearbeiten */}
                                <TextInput
                                    value={item.name}
                                    onChangeText={(text) => {
                                        setEditExercises((prev) =>
                                            prev.map((ex) =>
                                                ex.id === item.id ? {...ex, name: text} : ex
                                            )
                                        );
                                    }}
                                    style={[globalStyles.input, styles.exerciseInput]}
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
                    <View style={styles.modalActions}>
                        <Pressable
                            style={globalStyles.buttonSecondary}
                            onPress={() => setShowEditModal(false)}
                        >
                            <Text style={globalStyles.buttonText}>Abbrechen</Text>
                        </Pressable>
                        <Pressable
                            style={globalStyles.buttonPrimary}
                            onPress={() => void handleSaveEdit()}
                        >
                            <Text style={globalStyles.buttonText}>Speichern</Text>
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    intro: {paddingBottom: 10},
    caption: {color: textColorMuted, lineHeight: 19},
    dateRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 16,
    },
    list: {paddingBottom: 28, gap: 10},
    addCard: {
        backgroundColor: surfaceElevated,
        borderColor: secondary,
        borderWidth: 1,
        borderRadius: 18,
        padding: 16,
        marginBottom: 4,
    },
    addHeading: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    fullInput: {width: "100%", marginBottom: 0},
    groupCard: {
        backgroundColor: secondaryBackground,
        borderColor,
        borderWidth: 1,
        borderRadius: 18,
        padding: 16,
    },
    pressed: {opacity: 0.75, transform: [{scale: 0.995}]},
    groupHeading: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    groupText: {flex: 1, paddingRight: 8},
    groupTitle: {color: highlight, fontSize: 18, fontWeight: "700"},
    exerciseCount: {color: textColorMuted, marginTop: 3},
    exercisePreview: {color: highlight, opacity: 0.82, lineHeight: 20, marginTop: 12},
    modal: {paddingTop: 60, paddingHorizontal: 24},
    editHeading: {flexDirection: "row", alignItems: "center", marginTop: 18},
    editNameInput: {flex: 1, width: undefined},
    exerciseHeading: {marginTop: 16},
    exerciseRow: {flexDirection: "row", alignItems: "center", marginBottom: 8},
    exerciseInput: {flex: 1, width: undefined},
    modalActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 12,
    },
});
