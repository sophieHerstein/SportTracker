import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("training.db");
db.execSync("PRAGMA foreign_keys = ON");

export default db;
