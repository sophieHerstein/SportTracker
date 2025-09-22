import db from '../db/db'
import {IColumnDefinition} from "../models/interfaces";

export class DatabaseService {
    static run(query: string, params: any[] = []) {
        return db.runAsync(query, params);
    }

    static getOne<T = any>(query: string, params: any[] = []): Promise<T | undefined | null> {
        return db.getFirstAsync(query, params);
    }

    static getAll<T = any>(query: string, params: any[] = []): Promise<T[]> {
        return db.getAllAsync(query, params);
    }

    static runBatch(queries: { query: string; params?: any[] }[]): Promise<void> {
        return db.withTransactionAsync(async () => {
            for (const {query, params = []} of queries) {
                await db.runAsync(query, params);
            }
        });
    }

    static ensureColumnsExist(columns: IColumnDefinition[]): Promise<void> {
        return db.withTransactionAsync(async () => {
            for (const { table, column, sql } of columns) {
                const result = await db.getAllAsync<{ name: string }>(
                    `PRAGMA table_info(${table});`
                );
                const exists = result.some(row => row.name === column);
                if (!exists) {
                    console.log(`🛠️ Spalte '${column}' in Tabelle '${table}' wird hinzugefügt...`);
                    await db.runAsync(sql);
                } else {
                    console.log(`✅ Spalte '${column}' in Tabelle '${table}' ist bereits vorhanden.`);
                }
            }
        });
    }
}