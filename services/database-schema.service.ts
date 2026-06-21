import {SQLiteDatabase} from "expo-sqlite";
import db from "../db/db";
import {DatabaseBackupService} from "./database-backup.service";
import {DatabaseService} from "./database.service";

export const CURRENT_SCHEMA_VERSION = 6;

type TableResult = {count: number};

export interface IDatabaseMigrationResult {
    previousVersion: number;
    currentVersion: number;
    backupFileName: string | null;
}

export class DatabaseSchemaService {
    private readonly backupService = new DatabaseBackupService();

    async initializeDatabase(): Promise<IDatabaseMigrationResult> {
        await db.execAsync("PRAGMA foreign_keys = ON");
        const previousVersion = await DatabaseService.getUserVersion();

        if (previousVersion > CURRENT_SCHEMA_VERSION) {
            throw new Error(
                `Die Datenbankversion ${previousVersion} ist neuer als die von dieser App unterstützte Version ${CURRENT_SCHEMA_VERSION}.`
            );
        }

        let backupFileName: string | null = null;
        if (previousVersion < CURRENT_SCHEMA_VERSION && (await this.hasExistingAppTables())) {
            const backup = await this.backupService.createBackup();
            backupFileName = backup.fileName;
        }

        try {
            await this.prepareDatabase(db);
        } catch (error) {
            const isForeignKeyIntegrityError =
                error instanceof Error && error.message.includes("Fremdschlüsselverletzung");
            if (!isForeignKeyIntegrityError) {
                throw error;
            }

            const integrityRows = await db.getAllAsync<{integrity_check: string}>(
                "PRAGMA integrity_check"
            );
            const integrityPassed =
                integrityRows.length === 1 &&
                integrityRows[0].integrity_check.toLowerCase() === "ok";
            const foreignKeyViolations = integrityPassed
                ? await db.getAllAsync("PRAGMA foreign_key_check")
                : [];

            if (!integrityPassed || foreignKeyViolations.length === 0) {
                throw error;
            }

            if (!backupFileName) {
                const backup = await this.backupService.createBackup();
                backupFileName = backup.fileName;
            }

            await this.repairForeignKeyViolations(db);
            await this.assertDatabaseIntegrity(db);
        }

        return {
            previousVersion,
            currentVersion: CURRENT_SCHEMA_VERSION,
            backupFileName,
        };
    }

    async prepareDatabase(database: SQLiteDatabase): Promise<number> {
        await database.execAsync("PRAGMA foreign_keys = ON");
        const versionRow = await database.getFirstAsync<{user_version: number}>(
            "PRAGMA user_version"
        );
        const previousVersion = versionRow?.user_version ?? 0;

        if (previousVersion > CURRENT_SCHEMA_VERSION) {
            throw new Error(
                `Die Datenbankversion ${previousVersion} ist neuer als die unterstützte Version ${CURRENT_SCHEMA_VERSION}.`
            );
        }

        if (previousVersion < 1) {
            await this.runMigration(database, 1, (txn) => this.migrateToVersion1(txn));
        }
        if (previousVersion < 2) {
            await this.runMigration(database, 2, (txn) => this.migrateToVersion2(txn));
        }
        if (previousVersion < 3) {
            await this.runMigration(database, 3, (txn) => this.migrateToVersion3(txn));
        }
        if (previousVersion < 4) {
            await this.runMigration(database, 4, (txn) => this.migrateToVersion4(txn));
        }
        if (previousVersion < 5) {
            await this.runMigration(database, 5, (txn) => this.migrateToVersion5(txn));
        }
        if (previousVersion < 6) {
            await this.runMigration(database, 6, (txn) => this.migrateToVersion6(txn));
        }

        await database.execAsync("PRAGMA foreign_keys = ON");
        await this.assertDatabaseIntegrity(database);
        return previousVersion;
    }

    private async hasExistingAppTables(): Promise<boolean> {
        const result = await DatabaseService.getOne<TableResult>(`
            SELECT COUNT(*) AS count
            FROM sqlite_master
            WHERE type = 'table'
              AND name IN (
                'muscle_group',
                'exercise',
                'training',
                'exercise_training',
                'exercise_set',
                'trainingstyp',
                'ausdauertrainingseinheit'
              )
        `);
        return (result?.count ?? 0) > 0;
    }

    private async runMigration(
        database: SQLiteDatabase,
        version: number,
        migration: (txn: SQLiteDatabase) => Promise<void>
    ): Promise<void> {
        await database.withExclusiveTransactionAsync(async (txn) => {
            await migration(txn);
            await txn.execAsync(`PRAGMA user_version = ${version}`);
        });
    }

    private async addColumnIfMissing(
        txn: SQLiteDatabase,
        table: string,
        column: string,
        sql: string
    ): Promise<void> {
        const columns = await txn.getAllAsync<{name: string}>(`PRAGMA table_info(${table})`);
        if (!columns.some((existingColumn) => existingColumn.name === column)) {
            await txn.execAsync(sql);
        }
    }

    private async migrateToVersion1(txn: SQLiteDatabase): Promise<void> {
        await txn.execAsync(`
            CREATE TABLE IF NOT EXISTS muscle_group (
                id INTEGER PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                is_deleted INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS exercise (
                id INTEGER PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                no_more_increase INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS training (
                id INTEGER PRIMARY KEY,
                datum INTEGER NOT NULL,
                muscle_group_id INTEGER NOT NULL,
                tageszeit TEXT,
                is_draft INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (muscle_group_id) REFERENCES muscle_group(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS exercise_training (
                id INTEGER PRIMARY KEY,
                training_id INTEGER NOT NULL,
                exercise_id INTEGER NOT NULL,
                FOREIGN KEY (training_id) REFERENCES training(id) ON DELETE CASCADE,
                FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS exercise_set (
                id INTEGER PRIMARY KEY,
                exercise_training_id INTEGER NOT NULL,
                weight REAL NOT NULL,
                repetitions INTEGER NOT NULL,
                FOREIGN KEY (exercise_training_id) REFERENCES exercise_training(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS exercise_muscle_group (
                muscle_group_id INTEGER NOT NULL,
                exercise_id INTEGER NOT NULL,
                PRIMARY KEY (muscle_group_id, exercise_id),
                FOREIGN KEY (muscle_group_id) REFERENCES muscle_group(id) ON DELETE CASCADE,
                FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS trainingstyp (
                id INTEGER PRIMARY KEY,
                name TEXT UNIQUE NOT NULL
            );

            CREATE TABLE IF NOT EXISTS ausdauertrainingseinheit (
                id INTEGER PRIMARY KEY,
                trainingstyp_id INTEGER,
                datum INTEGER NOT NULL,
                dauer_minuten INTEGER NOT NULL,
                strecke_km REAL NOT NULL,
                tageszeit TEXT,
                FOREIGN KEY (trainingstyp_id) REFERENCES trainingstyp(id) ON DELETE CASCADE
            );
        `);

        await this.addColumnIfMissing(
            txn,
            "training",
            "is_draft",
            "ALTER TABLE training ADD COLUMN is_draft INTEGER NOT NULL DEFAULT 0"
        );
        await this.addColumnIfMissing(
            txn,
            "training",
            "tageszeit",
            "ALTER TABLE training ADD COLUMN tageszeit TEXT"
        );
        await this.addColumnIfMissing(
            txn,
            "exercise",
            "no_more_increase",
            "ALTER TABLE exercise ADD COLUMN no_more_increase INTEGER NOT NULL DEFAULT 0"
        );
        await this.addColumnIfMissing(
            txn,
            "ausdauertrainingseinheit",
            "tageszeit",
            "ALTER TABLE ausdauertrainingseinheit ADD COLUMN tageszeit TEXT"
        );
        await this.addColumnIfMissing(
            txn,
            "muscle_group",
            "is_deleted",
            "ALTER TABLE muscle_group ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0"
        );

        await txn.execAsync("UPDATE training SET is_draft = 0");
    }

    private async migrateToVersion2(txn: SQLiteDatabase): Promise<void> {
        await txn.execAsync(`
            DELETE FROM exercise_set
            WHERE exercise_training_id NOT IN (SELECT id FROM exercise_training);

            DELETE FROM exercise_training
            WHERE training_id NOT IN (SELECT id FROM training)
               OR exercise_id NOT IN (SELECT id FROM exercise);

            DELETE FROM exercise_muscle_group
            WHERE muscle_group_id NOT IN (SELECT id FROM muscle_group)
               OR exercise_id NOT IN (SELECT id FROM exercise);

            DELETE FROM exercise_set
            WHERE exercise_training_id IN (
                SELECT et.id
                FROM exercise_training et
                JOIN training t ON t.id = et.training_id
                WHERE t.muscle_group_id NOT IN (SELECT id FROM muscle_group)
            );

            DELETE FROM exercise_training
            WHERE training_id IN (
                SELECT id
                FROM training
                WHERE muscle_group_id NOT IN (SELECT id FROM muscle_group)
            );

            DELETE FROM training
            WHERE muscle_group_id NOT IN (SELECT id FROM muscle_group);

            DELETE FROM ausdauertrainingseinheit
            WHERE trainingstyp_id IS NOT NULL
              AND trainingstyp_id NOT IN (SELECT id FROM trainingstyp);

            UPDATE exercise_set
            SET exercise_training_id = (
                SELECT MIN(canonical.id)
                FROM exercise_training canonical
                WHERE canonical.training_id = (
                    SELECT duplicate.training_id
                    FROM exercise_training duplicate
                    WHERE duplicate.id = exercise_set.exercise_training_id
                )
                  AND canonical.exercise_id = (
                    SELECT duplicate.exercise_id
                    FROM exercise_training duplicate
                    WHERE duplicate.id = exercise_set.exercise_training_id
                )
            )
            WHERE exercise_training_id IN (
                SELECT duplicate.id
                FROM exercise_training duplicate
                WHERE duplicate.id != (
                    SELECT MIN(canonical.id)
                    FROM exercise_training canonical
                    WHERE canonical.training_id = duplicate.training_id
                      AND canonical.exercise_id = duplicate.exercise_id
                )
            );

            DELETE FROM exercise_training
            WHERE id NOT IN (
                SELECT MIN(id)
                FROM exercise_training
                GROUP BY training_id, exercise_id
            );

            CREATE UNIQUE INDEX IF NOT EXISTS ux_exercise_training_training_exercise
                ON exercise_training(training_id, exercise_id);

            CREATE INDEX IF NOT EXISTS ix_training_datum
                ON training(datum);
            CREATE INDEX IF NOT EXISTS ix_training_muscle_group
                ON training(muscle_group_id);
            CREATE INDEX IF NOT EXISTS ix_exercise_training_exercise
                ON exercise_training(exercise_id);
            CREATE INDEX IF NOT EXISTS ix_exercise_set_exercise_training
                ON exercise_set(exercise_training_id);
            CREATE INDEX IF NOT EXISTS ix_exercise_muscle_group_exercise
                ON exercise_muscle_group(exercise_id);
            CREATE INDEX IF NOT EXISTS ix_ausdauertrainingseinheit_datum
                ON ausdauertrainingseinheit(datum);
            CREATE INDEX IF NOT EXISTS ix_ausdauertrainingseinheit_trainingstyp
                ON ausdauertrainingseinheit(trainingstyp_id);
        `);
    }

    private async migrateToVersion3(txn: SQLiteDatabase): Promise<void> {
        await this.addColumnIfMissing(
            txn,
            "exercise_training",
            "sort_order",
            "ALTER TABLE exercise_training ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0"
        );

        await txn.execAsync(`
            UPDATE exercise_training
            SET sort_order = (
                SELECT COUNT(*)
                FROM exercise_training earlier
                WHERE earlier.training_id = exercise_training.training_id
                  AND earlier.id < exercise_training.id
            );

            CREATE INDEX IF NOT EXISTS ix_exercise_training_training_order
                ON exercise_training(training_id, sort_order);
        `);
    }

    private async migrateToVersion4(txn: SQLiteDatabase): Promise<void> {
        await txn.execAsync(`
            CREATE INDEX IF NOT EXISTS ix_training_datum_id
                ON training(datum, id);
            CREATE INDEX IF NOT EXISTS ix_exercise_training_exercise_training
                ON exercise_training(exercise_id, training_id);
            CREATE INDEX IF NOT EXISTS ix_endurance_type_date
                ON ausdauertrainingseinheit(trainingstyp_id, datum);
        `);
    }

    private async migrateToVersion5(txn: SQLiteDatabase): Promise<void> {
        await txn.execAsync(`
            CREATE TABLE IF NOT EXISTS ignored_exercise_merge (
                source_exercise_id INTEGER NOT NULL,
                target_exercise_id INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                PRIMARY KEY (source_exercise_id, target_exercise_id),
                FOREIGN KEY (source_exercise_id) REFERENCES exercise(id) ON DELETE CASCADE,
                FOREIGN KEY (target_exercise_id) REFERENCES exercise(id) ON DELETE CASCADE
            );
        `);
    }

    private async migrateToVersion6(txn: SQLiteDatabase): Promise<void> {
        await txn.execAsync(`
            CREATE TABLE IF NOT EXISTS ignored_suspicious_exercise (
                exercise_id INTEGER PRIMARY KEY,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE
            );
        `);
    }

    private async repairForeignKeyViolations(database: SQLiteDatabase): Promise<void> {
        await database.withExclusiveTransactionAsync(async (txn) => {
            await txn.execAsync(`
                DELETE FROM exercise_set
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM exercise_training et
                    WHERE et.id = exercise_set.exercise_training_id
                );

                DELETE FROM exercise_training
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM training t
                    WHERE t.id = exercise_training.training_id
                )
                   OR NOT EXISTS (
                    SELECT 1
                    FROM exercise e
                    WHERE e.id = exercise_training.exercise_id
                );

                DELETE FROM exercise_muscle_group
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM muscle_group mg
                    WHERE mg.id = exercise_muscle_group.muscle_group_id
                )
                   OR NOT EXISTS (
                    SELECT 1
                    FROM exercise e
                    WHERE e.id = exercise_muscle_group.exercise_id
                );

                DELETE FROM training
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM muscle_group mg
                    WHERE mg.id = training.muscle_group_id
                );

                DELETE FROM ausdauertrainingseinheit
                WHERE trainingstyp_id IS NOT NULL
                  AND NOT EXISTS (
                    SELECT 1
                    FROM trainingstyp tt
                    WHERE tt.id = ausdauertrainingseinheit.trainingstyp_id
                );
            `);
        });
    }

    async assertDatabaseIntegrity(database: SQLiteDatabase = db): Promise<void> {
        const integrityRows = await database.getAllAsync<{integrity_check: string}>(
            "PRAGMA integrity_check"
        );
        const integrityPassed =
            integrityRows.length === 1 && integrityRows[0].integrity_check.toLowerCase() === "ok";

        if (!integrityPassed) {
            throw new Error(
                `SQLite-Integritätsprüfung fehlgeschlagen: ${integrityRows.map((row) => row.integrity_check).join(", ")}`
            );
        }

        const foreignKeyViolations = await database.getAllAsync("PRAGMA foreign_key_check");
        if (foreignKeyViolations.length > 0) {
            throw new Error(
                `Die Datenbank enthält ${foreignKeyViolations.length} Fremdschlüsselverletzung(en).`
            );
        }
    }
}
