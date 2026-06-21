import db from "../db/db";

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

    static runBatch(queries: {query: string; params?: any[]}[]): Promise<void> {
        return db.withExclusiveTransactionAsync(async (txn) => {
            for (const {query, params = []} of queries) {
                await txn.runAsync(query, params);
            }
        });
    }

    static async getUserVersion(): Promise<number> {
        const result = await db.getFirstAsync<{user_version: number}>("PRAGMA user_version");
        return result?.user_version ?? 0;
    }
}
