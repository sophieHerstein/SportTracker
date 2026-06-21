import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import {backupDatabaseAsync, openDatabaseAsync, SQLiteDatabase} from "expo-sqlite";
import db from "../db/db";
import {IDatabaseRestorePreview} from "../models/interfaces";
import {DatabaseBackupService} from "./database-backup.service";
import {CURRENT_SCHEMA_VERSION, DatabaseSchemaService} from "./database-schema.service";

const RESTORE_DIRECTORY_NAME = "SportTrackerRestore";

export class DatabaseRestoreService {
    private readonly backupService = new DatabaseBackupService();
    private readonly schemaService = new DatabaseSchemaService();

    async pickAndInspectBackup(): Promise<IDatabaseRestorePreview | null> {
        const result = await DocumentPicker.getDocumentAsync({
            type: [
                "application/vnd.sqlite3",
                "application/x-sqlite3",
                "application/octet-stream",
                "*/*",
            ],
            copyToCacheDirectory: true,
            multiple: false,
        });

        if (result.canceled) return null;
        const asset = result.assets[0];
        if (!asset) throw new Error("Es wurde keine Datei ausgewählt.");

        return this.inspectBackupFile(asset.name, asset.uri);
    }

    async inspectBackupFile(
        sourceName: string,
        sourceUri: string
    ): Promise<IDatabaseRestorePreview> {
        const temporaryDirectory = await this.prepareTemporaryDirectory();
        const temporaryDatabaseName = `restore-${Date.now()}.db`;
        const temporaryUri = `${temporaryDirectory}/${temporaryDatabaseName}`;
        await FileSystem.copyAsync({from: sourceUri, to: temporaryUri});

        const sourceDatabase = await openDatabaseAsync(
            temporaryDatabaseName,
            {},
            temporaryDirectory
        );

        try {
            const originalVersionRow = await sourceDatabase.getFirstAsync<{user_version: number}>(
                "PRAGMA user_version"
            );
            const originalSchemaVersion = originalVersionRow?.user_version ?? 0;

            if (originalSchemaVersion > CURRENT_SCHEMA_VERSION) {
                throw new Error(
                    `Das Backup verwendet Schema-Version ${originalSchemaVersion}. Unterstützt wird höchstens Version ${CURRENT_SCHEMA_VERSION}.`
                );
            }

            await this.assertSportTrackerDatabase(sourceDatabase);
            await this.schemaService.prepareDatabase(sourceDatabase);

            const [
                trainingCount,
                enduranceTrainingCount,
                exerciseCount,
                muscleGroupCount,
                setCount,
            ] = await Promise.all([
                this.getCount(sourceDatabase, "training"),
                this.getCount(sourceDatabase, "ausdauertrainingseinheit"),
                this.getCount(sourceDatabase, "exercise"),
                this.getCount(sourceDatabase, "muscle_group"),
                this.getCount(sourceDatabase, "exercise_set"),
            ]);

            return {
                sourceName,
                temporaryDatabaseName,
                temporaryDirectory,
                schemaVersion: CURRENT_SCHEMA_VERSION,
                originalSchemaVersion,
                trainingCount,
                enduranceTrainingCount,
                exerciseCount,
                muscleGroupCount,
                setCount,
            };
        } catch (error) {
            await sourceDatabase.closeAsync();
            await FileSystem.deleteAsync(temporaryUri, {idempotent: true});
            throw error;
        } finally {
            try {
                await sourceDatabase.closeAsync();
            } catch {
                // Bereits im Fehlerpfad geschlossen.
            }
        }
    }

    async restoreBackup(preview: IDatabaseRestorePreview): Promise<string> {
        const safetyBackup = await this.backupService.createBackup();
        const sourceDatabase = await openDatabaseAsync(
            preview.temporaryDatabaseName,
            {},
            preview.temporaryDirectory
        );

        try {
            await this.schemaService.assertDatabaseIntegrity(sourceDatabase);
            await backupDatabaseAsync({
                sourceDatabase,
                destDatabase: db,
            });
            await db.execAsync("PRAGMA foreign_keys = ON");
            await this.schemaService.assertDatabaseIntegrity(db);
        } catch (restoreError) {
            try {
                await this.restoreSafetyBackup(safetyBackup.uri);
                throw new Error(
                    `Das Backup konnte nicht aktiviert werden. Der vorherige Datenstand wurde erfolgreich zurückgespielt. Ursache: ${this.getErrorMessage(restoreError)}`
                );
            } catch (rollbackError) {
                if (
                    rollbackError instanceof Error &&
                    rollbackError.message.includes("erfolgreich zurückgespielt")
                ) {
                    throw rollbackError;
                }
                throw new Error(
                    `Restore und automatische Rücksicherung sind fehlgeschlagen. Sicherheitsbackup: ${safetyBackup.fileName}. Ursache: ${this.getErrorMessage(rollbackError)}`
                );
            }
        } finally {
            await sourceDatabase.closeAsync();
            await this.deleteTemporaryDatabase(preview);
        }

        return safetyBackup.fileName;
    }

    async discardPreview(preview: IDatabaseRestorePreview): Promise<void> {
        await this.deleteTemporaryDatabase(preview);
    }

    private async prepareTemporaryDirectory(): Promise<string> {
        if (!FileSystem.cacheDirectory) {
            throw new Error("Der temporäre Speicher ist auf diesem Gerät nicht verfügbar.");
        }
        const directory = `${FileSystem.cacheDirectory}${RESTORE_DIRECTORY_NAME}`;
        const info = await FileSystem.getInfoAsync(directory);
        if (!info.exists) {
            await FileSystem.makeDirectoryAsync(directory, {intermediates: true});
        }
        return directory;
    }

    private async assertSportTrackerDatabase(database: SQLiteDatabase): Promise<void> {
        const requiredTables = [
            "muscle_group",
            "exercise",
            "training",
            "exercise_training",
            "exercise_set",
            "trainingstyp",
            "ausdauertrainingseinheit",
        ];
        const rows = await database.getAllAsync<{name: string}>(`
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
        `);
        const tableNames = new Set(rows.map((row) => row.name));
        const missingTables = requiredTables.filter((table) => !tableNames.has(table));

        if (missingTables.length > 0) {
            throw new Error(
                `Die Datei ist kein vollständiges SportTracker-Backup. Fehlende Tabellen: ${missingTables.join(", ")}`
            );
        }
    }

    private async getCount(database: SQLiteDatabase, table: string): Promise<number> {
        const result = await database.getFirstAsync<{count: number}>(
            `SELECT COUNT(*) AS count FROM ${table}`
        );
        return result?.count ?? 0;
    }

    private splitFileUri(uri: string): {directory: string; fileName: string} {
        const separatorIndex = uri.lastIndexOf("/");
        if (separatorIndex < 0) throw new Error("Ungültiger Backup-Dateipfad.");
        return {
            directory: uri.slice(0, separatorIndex),
            fileName: uri.slice(separatorIndex + 1),
        };
    }

    private async restoreSafetyBackup(uri: string): Promise<void> {
        const {directory, fileName} = this.splitFileUri(uri);
        const safetyDatabase = await openDatabaseAsync(fileName, {}, directory);
        try {
            await backupDatabaseAsync({
                sourceDatabase: safetyDatabase,
                destDatabase: db,
            });
            await db.execAsync("PRAGMA foreign_keys = ON");
        } finally {
            await safetyDatabase.closeAsync();
        }
    }

    private async deleteTemporaryDatabase(preview: IDatabaseRestorePreview): Promise<void> {
        const uri = `${preview.temporaryDirectory}/${preview.temporaryDatabaseName}`;
        await FileSystem.deleteAsync(uri, {idempotent: true});
    }

    private getErrorMessage(error: unknown): string {
        return error instanceof Error ? error.message : "Unbekannter Fehler";
    }
}
