import {globalStyles} from "../../utils/global-styles";
import {Text, View} from "react-native";
import TextIconButton from "../../components/TextIconButton";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import {highlight} from "../../models/constants";

export default function SettingsScreen() {

    async function exportDatabase() {
        try {
            const dbPath = `${FileSystem.documentDirectory}SQLite/sporttracker.db`;
            const exportPath = `${FileSystem.cacheDirectory}sporttracker_backup.db`;

            // Datei in Cache kopieren (Sharing kann nicht aus documentDirectory lesen)
            await FileSystem.copyAsync({ from: dbPath, to: exportPath });

            // Teilen / Speichern (z. B. AirDrop, iCloud, Dateien)
            await Sharing.shareAsync(exportPath, {
                mimeType: 'application/octet-stream',
                dialogTitle: 'SportTracker Datenbank exportieren',
            });

        } catch (error) {
            console.error('❌ Fehler beim Exportieren:', error);
            Alert.alert('Fehler', 'Die Datenbank konnte nicht exportiert werden.');
        }
    }


    async function importDatabase() {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/octet-stream',
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];
            const destPath = `${FileSystem.documentDirectory}SQLite/sporttracker.db`;

            // Alte DB sichern oder löschen
            const backupPath = `${FileSystem.documentDirectory}SQLite/sporttracker_old.db`;
            const exists = await FileSystem.getInfoAsync(destPath);
            if (exists.exists) {
                await FileSystem.moveAsync({ from: destPath, to: backupPath });
            }

            // Neue DB-Datei reinkopieren
            await FileSystem.copyAsync({ from: file.uri, to: destPath });

            Alert.alert('Erfolg', 'Datenbank wurde erfolgreich importiert.\nBitte App neu starten.');

        } catch (error) {
            console.error('❌ Fehler beim Importieren:', error);
            Alert.alert('Fehler', 'Die Datenbank konnte nicht importiert werden.');
        }
    }

    return (
        <View style={globalStyles.screenContainer}>
            <View style={globalStyles.row}>
                <Text style={globalStyles.title}>Daten exportieren</Text>
                <TextIconButton iconName='ios-share' color={highlight} onPress={() => exportDatabase()} iconSize={20}
                                stylePressable={globalStyles.buttonPrimary} styleText={globalStyles.buttonText}
                                title="Daten exportieren"
                />
            </View>
            <View style={globalStyles.row}>
                <Text style={globalStyles.title}>Daten importieren</Text>
                <TextIconButton iconName='downloading' color={highlight} onPress={() => importDatabase()} iconSize={20}
                                stylePressable={globalStyles.buttonPrimary} styleText={globalStyles.buttonText}
                                title="Daten importieren"
                />
            </View>
        </View>
    );
}