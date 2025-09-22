import {DatabaseService} from "./database.service";
import {IColumnDefinition} from "../models/interfaces";

export class DatabaseSchemaService {
    async setUpTables(): Promise<void> {
        try {
            await DatabaseService.runBatch([
                {
                    query: `CREATE TABLE IF NOT EXISTS muscle_group (
                        id INTEGER PRIMARY KEY,
                        name TEXT UNIQUE NOT NULL
                    )`,
                },
                {
                    query: `CREATE TABLE IF NOT EXISTS exercise (
                        id INTEGER PRIMARY KEY,
                        name TEXT UNIQUE NOT NULL
                    )`,
                },
                {
                    query: `CREATE TABLE IF NOT EXISTS exercise_muscle_group (
                        muscle_group_id INTEGER NOT NULL,
                        exercise_id INTEGER NOT NULL,
                        PRIMARY KEY (muscle_group_id, exercise_id),
                        FOREIGN KEY (muscle_group_id) REFERENCES muscle_group(id) ON DELETE CASCADE,
                        FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE
                    )`,
                },
                {
                    query: `CREATE TABLE IF NOT EXISTS training (
                        id INTEGER PRIMARY KEY,
                        datum INT NOT NULL,
                        muscle_group_id INTEGER NOT NULL,
                        FOREIGN KEY (muscle_group_id) REFERENCES muscle_group(id) ON DELETE CASCADE
                    )`,
                },
                {
                    query: `CREATE TABLE IF NOT EXISTS exercise_training (
                        id INTEGER PRIMARY KEY,
                        training_id INTEGER NOT NULL,
                        exercise_id INTEGER NOT NULL,
                        FOREIGN KEY (training_id) REFERENCES training(id) ON DELETE CASCADE,
                        FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE
                    )`,
                },
                {
                    query: `CREATE TABLE IF NOT EXISTS exercise_set (
                        id INTEGER PRIMARY KEY,
                        exercise_training_id INTEGER NOT NULL,
                        weight REAL NOT NULL,
                        repetitions INTEGER NOT NULL,
                        FOREIGN KEY (exercise_training_id) REFERENCES exercise_training(id) ON DELETE CASCADE
                    )`,
                },
                {
                    query: `CREATE TABLE IF NOT EXISTS trainingstyp (
                        id INTEGER PRIMARY KEY,
                        name TEXT UNIQUE NOT NULL
                    )`,
                },
                {
                    query: `CREATE TABLE IF NOT EXISTS ausdauertrainingseinheit (
                        id INTEGER PRIMARY KEY,
                        trainingstyp_id INT REFERENCES trainingstyp(id) ON DELETE CASCADE,
                        datum INT NOT NULL,
                        dauer_minuten INT NOT NULL,
                        strecke_km DECIMAL(5,2) NOT NULL
                    )`,
                },
            ]);

            console.log("✅ Database schema created");
        } catch (error) {
            console.error("❌ Error creating database schema", error);
        }
    }

    async addNewColumns(columns: IColumnDefinition[]): Promise<void> {
        await DatabaseService.ensureColumnsExist(columns)
    }

    async dropTables(): Promise<void> {
        try {
            await DatabaseService.runBatch([
                {query: "DROP TABLE IF EXISTS exercise_set"},
                {query: "DROP TABLE IF EXISTS training"},
                {query: "DROP TABLE IF EXISTS exercise_training"},
                {query: "DROP TABLE IF EXISTS exercise_muscle_group"},
                {query: "DROP TABLE IF EXISTS exercise"},
                {query: "DROP TABLE IF EXISTS muscle_group"},
                {query: "DROP TABLE IF EXISTS trainingstyp"},
                {query: "DROP TABLE IF EXISTS ausdauertrainingseinheit"},
            ]);

            console.log("✅ Database schema dropped");
        } catch (error) {
            console.error("❌ Error dropping database schema", error);
        }
    }
}