import {globalStyles} from "../../utils/global-styles";
import {Text, View} from "react-native";
import TextIconButton from "../../components/TextIconButton";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import {highlight} from "../../models/constants";
import {openDatabaseAsync} from "expo-sqlite";
import db from "../../db/db";

export default function SettingsScreen() {

    async function exportDatabase() {
        try {
            // 1️⃣ Alle Tabellennamen auslesen (Systemtabellen ausschließen)
            const tablesResult = await db.getAllAsync(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
      ORDER BY name;
    `);

            const tables: any[] = tablesResult.map((t: any) => t.name);
            const allData: Record<string, any[]> = {};

            // 2️⃣ Jede Tabelle komplett auslesen
            for (const table of tables) {
                try {
                    const rows = await db.getAllAsync(`SELECT * FROM ${table}`);
                    allData[table] = rows;
                } catch (innerErr) {
                    console.warn(`⚠️ Fehler beim Lesen von Tabelle ${table}:`, innerErr);
                }
            }

            // 3️⃣ JSON-Datei schreiben
            const json = JSON.stringify(allData, null, 2);
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const filePath = `${FileSystem.documentDirectory}sporttracker_backup_${timestamp}.json`;

            await FileSystem.writeAsStringAsync(filePath, json);

            // 4️⃣ Teilen (AirDrop, Dateien-App etc.)
            await Sharing.shareAsync(filePath, {
                mimeType: "application/json",
                dialogTitle: "SportTracker-Datenbank exportieren",
            });

            console.log("✅ Vollständiges Backup erstellt:", filePath);
        } catch (error) {
            console.error("❌ Fehler beim Export:", error);
            Alert.alert("Fehler", "Beim Export der Datenbank ist ein Problem aufgetreten.");
        }
    }


    async function importDatabase() {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: "application/json" });
            if (result.canceled) return;

            const file = result.assets[0];
            const json = await FileSystem.readAsStringAsync(file.uri);
            const data = JSON.parse(json);

            await db.withTransactionAsync(async () => {
                for (const [table, rows] of Object.entries(data)) {
                    if (!Array.isArray(rows) || rows.length === 0) continue;

                    for (const row of rows) {
                        const columns = Object.keys(row);
                        const placeholders = columns.map(() => "?").join(", ");
                        const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;
                        await db.runAsync(sql, Object.values(row));
                    }
                }
            });

            Alert.alert("Erfolg", "Datenbank erfolgreich importiert.\nBitte App neu starten.");
            console.log("✅ Vollständiges Backup importiert");

        } catch (error) {
            console.error("❌ Fehler beim Import:", error);
            Alert.alert("Fehler", "Beim Import der Datenbank ist ein Problem aufgetreten.");
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