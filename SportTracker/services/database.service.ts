import db from '../db/db'

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
}