import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import {backupDatabaseAsync, openDatabaseAsync} from "expo-sqlite";
import db from "../db/db";
import {IDatabaseBackup} from "../models/interfaces";
import {DatabaseService} from "./database.service";

const BACKUP_DIRECTORY_NAME = "SportTrackerBackups";
const MAX_LOCAL_BACKUPS = 10;

export class DatabaseBackupService {
    private getBackupDirectory(): string {
        if (!FileSystem.documentDirectory) {
            throw new Error("Der Dokumentordner ist auf diesem Gerät nicht verfügbar.");
        }
        return `${FileSystem.documentDirectory}${BACKUP_DIRECTORY_NAME}`;
    }

    private async ensureBackupDirectory(): Promise<string> {
        const directory = this.getBackupDirectory();
        const info = await FileSystem.getInfoAsync(directory);
        if (!info.exists) {
            await FileSystem.makeDirectoryAsync(directory, {intermediates: true});
        }
        return directory;
    }

    private createBackupFileName(schemaVersion: number): string {
        const timestamp = new Date()
            .toISOString()
            .replace(/\.\d{3}Z$/, "Z")
            .replace(/:/g, "-");
        return `SportTracker_${timestamp}_schema-${schemaVersion}.db`;
    }

    async createBackup(): Promise<IDatabaseBackup> {
        const directory = await this.ensureBackupDirectory();
        const schemaVersion = await DatabaseService.getUserVersion();
        const fileName = this.createBackupFileName(schemaVersion);
        const destinationDatabase = await openDatabaseAsync(fileName, {}, directory);

        try {
            await backupDatabaseAsync({
                sourceDatabase: db,
                destDatabase: destinationDatabase,
            });
        } finally {
            await destinationDatabase.closeAsync();
        }

        const uri = `${directory}/${fileName}`;
        const info = await FileSystem.getInfoAsync(uri);

        if (!info.exists) {
            throw new Error("Die Backup-Datei wurde nicht erstellt.");
        }

        const backup = {
            fileName,
            uri,
            size: "size" in info ? info.size : null,
            createdAt:
                "modificationTime" in info && info.modificationTime
                    ? info.modificationTime * 1000
                    : Date.now(),
        };
        await this.rotateBackups(directory);
        return backup;
    }

    async getBackups(): Promise<IDatabaseBackup[]> {
        const directory = await this.ensureBackupDirectory();
        const files = await FileSystem.readDirectoryAsync(directory);
        const backups = await Promise.all(
            files
                .filter((fileName) => fileName.endsWith(".db"))
                .map(async (fileName) => {
                    const uri = `${directory}/${fileName}`;
                    const info = await FileSystem.getInfoAsync(uri);
                    return {
                        fileName,
                        uri,
                        size: info.exists && "size" in info ? info.size : null,
                        createdAt:
                            info.exists && "modificationTime" in info && info.modificationTime
                                ? info.modificationTime * 1000
                                : null,
                    };
                })
        );

        const sortedBackups = backups.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        await this.deleteOverflowBackups(sortedBackups);
        return sortedBackups.slice(0, MAX_LOCAL_BACKUPS);
    }

    private async rotateBackups(directory: string): Promise<void> {
        const files = await FileSystem.readDirectoryAsync(directory);
        const backups = await Promise.all(
            files
                .filter((fileName) => fileName.endsWith(".db"))
                .map(async (fileName) => {
                    const uri = `${directory}/${fileName}`;
                    const info = await FileSystem.getInfoAsync(uri);
                    return {
                        fileName,
                        uri,
                        size: info.exists && "size" in info ? info.size : null,
                        createdAt:
                            info.exists && "modificationTime" in info && info.modificationTime
                                ? info.modificationTime * 1000
                                : null,
                    };
                })
        );
        backups.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        await this.deleteOverflowBackups(backups);
    }

    private async deleteOverflowBackups(backups: IDatabaseBackup[]): Promise<void> {
        await Promise.all(
            backups
                .slice(MAX_LOCAL_BACKUPS)
                .map((backup) => FileSystem.deleteAsync(backup.uri, {idempotent: true}))
        );
    }

    async shareBackup(backup: IDatabaseBackup): Promise<void> {
        const sharingAvailable = await Sharing.isAvailableAsync();
        if (!sharingAvailable) {
            throw new Error("Teilen ist auf diesem Gerät nicht verfügbar.");
        }

        await Sharing.shareAsync(backup.uri, {
            dialogTitle: "SportTracker-Backup exportieren",
            mimeType: "application/vnd.sqlite3",
            UTI: "public.database",
        });
    }
}
