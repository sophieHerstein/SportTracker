import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('training.db');

export default db;