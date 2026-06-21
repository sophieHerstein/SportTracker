const test = require("node:test");
const assert = require("node:assert/strict");
const {execFileSync} = require("node:child_process");
const {mkdtempSync} = require("node:fs");
const {tmpdir} = require("node:os");
const {join} = require("node:path");

function createDatabase() {
    const directory = mkdtempSync(join(tmpdir(), "sporttracker-test-"));
    const database = join(directory, "training.db");
    execute(
        database,
        `
        PRAGMA foreign_keys = ON;
        CREATE TABLE muscle_group (
            id INTEGER PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            is_deleted INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE exercise (
            id INTEGER PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            no_more_increase INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE training (
            id INTEGER PRIMARY KEY,
            datum INTEGER NOT NULL,
            muscle_group_id INTEGER NOT NULL REFERENCES muscle_group(id) ON DELETE CASCADE,
            tageszeit TEXT
        );
        CREATE TABLE exercise_training (
            id INTEGER PRIMARY KEY,
            training_id INTEGER NOT NULL REFERENCES training(id) ON DELETE CASCADE,
            exercise_id INTEGER NOT NULL REFERENCES exercise(id) ON DELETE CASCADE,
            sort_order INTEGER NOT NULL DEFAULT 0,
            UNIQUE(training_id, exercise_id)
        );
        CREATE TABLE exercise_set (
            id INTEGER PRIMARY KEY,
            exercise_training_id INTEGER NOT NULL REFERENCES exercise_training(id) ON DELETE CASCADE,
            weight REAL NOT NULL,
            repetitions INTEGER NOT NULL
        );
        CREATE TABLE exercise_muscle_group (
            muscle_group_id INTEGER NOT NULL REFERENCES muscle_group(id) ON DELETE CASCADE,
            exercise_id INTEGER NOT NULL REFERENCES exercise(id) ON DELETE CASCADE,
            PRIMARY KEY (muscle_group_id, exercise_id)
        );
        INSERT INTO muscle_group (id, name) VALUES (1, 'Push');
    `
    );
    return database;
}

function execute(database, sql) {
    return execFileSync("sqlite3", [database], {
        input: `.bail on\nPRAGMA foreign_keys = ON;\n${sql}`,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
    });
}

function scalar(database, sql) {
    return Number(
        execFileSync("sqlite3", ["-noheader", database, sql], {
            encoding: "utf8",
        }).trim()
    );
}

function sqliteCommand(database, command) {
    return execFileSync("sqlite3", [database, command], {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
    });
}

test("ein vollständiges Training wird mit Übungen und Sätzen gespeichert", () => {
    const database = createDatabase();
    execute(
        database,
        `
        BEGIN;
        INSERT INTO training (id, datum, muscle_group_id, tageszeit)
        VALUES (1, 1782036000000, 1, 'abends');
        INSERT INTO exercise (id, name) VALUES (1, 'Bankdrücken'), (2, 'Trizepsdrücken');
        INSERT INTO exercise_training (id, training_id, exercise_id, sort_order)
        VALUES (1, 1, 1, 0), (2, 1, 2, 1);
        INSERT INTO exercise_set (exercise_training_id, weight, repetitions)
        VALUES (1, 80, 8), (1, 80, 7), (2, 30, 0);
        COMMIT;
    `
    );

    assert.equal(scalar(database, "SELECT COUNT(*) FROM training"), 1);
    assert.equal(scalar(database, "SELECT COUNT(*) FROM exercise_training"), 2);
    assert.equal(scalar(database, "SELECT COUNT(*) FROM exercise_set"), 3);
});

test("ein Fehler innerhalb der Transaktion hinterlässt keinen Teilstand", () => {
    const database = createDatabase();

    assert.throws(() =>
        execute(
            database,
            `
        BEGIN;
        INSERT INTO training (id, datum, muscle_group_id) VALUES (1, 1, 1);
        INSERT INTO exercise (id, name) VALUES (1, 'Bankdrücken');
        INSERT INTO exercise_training (training_id, exercise_id) VALUES (1, 1);
        INSERT INTO exercise_training (training_id, exercise_id) VALUES (1, 1);
        COMMIT;
    `
        )
    );

    assert.equal(scalar(database, "SELECT COUNT(*) FROM training"), 0);
    assert.equal(scalar(database, "SELECT COUNT(*) FROM exercise"), 0);
});

test("Fremdschlüssel löschen abhängige Trainingsdaten vollständig", () => {
    const database = createDatabase();
    execute(
        database,
        `
        INSERT INTO training (id, datum, muscle_group_id) VALUES (1, 1, 1);
        INSERT INTO exercise (id, name) VALUES (1, 'Bankdrücken');
        INSERT INTO exercise_training (id, training_id, exercise_id) VALUES (1, 1, 1);
        INSERT INTO exercise_set (id, exercise_training_id, weight, repetitions)
        VALUES (1, 1, 80, 8);
        DELETE FROM training WHERE id = 1;
    `
    );

    assert.equal(scalar(database, "SELECT COUNT(*) FROM exercise_training"), 0);
    assert.equal(scalar(database, "SELECT COUNT(*) FROM exercise_set"), 0);
    assert.equal(scalar(database, "SELECT COUNT(*) FROM pragma_foreign_key_check"), 0);
});

test("konservative Reparatur entfernt verwaiste Sätze", () => {
    const database = createDatabase();
    execute(
        database,
        `
        PRAGMA foreign_keys = OFF;
        INSERT INTO exercise_set (id, exercise_training_id, weight, repetitions)
        VALUES (1, 999, 50, 10);
    `
    );
    assert.equal(scalar(database, "SELECT COUNT(*) FROM pragma_foreign_key_check"), 1);

    execute(
        database,
        `
        DELETE FROM exercise_set
        WHERE NOT EXISTS (
            SELECT 1 FROM exercise_training
            WHERE exercise_training.id = exercise_set.exercise_training_id
        );
    `
    );

    assert.equal(scalar(database, "SELECT COUNT(*) FROM pragma_foreign_key_check"), 0);
});

test("fehlgeschlagenes Update erhält den vorherigen Trainingsstand", () => {
    const database = createDatabase();
    execute(
        database,
        `
        INSERT INTO training (id, datum, muscle_group_id) VALUES (1, 1, 1);
        INSERT INTO exercise (id, name) VALUES (1, 'Bankdrücken');
        INSERT INTO exercise_training (id, training_id, exercise_id) VALUES (1, 1, 1);
        INSERT INTO exercise_set (id, exercise_training_id, weight, repetitions)
        VALUES (1, 1, 80, 8);
    `
    );

    assert.throws(() =>
        execute(
            database,
            `
        BEGIN;
        DELETE FROM exercise_set WHERE exercise_training_id = 1;
        INSERT INTO exercise_set (exercise_training_id, weight, repetitions)
        VALUES (1, 85, 8);
        INSERT INTO exercise_training (training_id, exercise_id) VALUES (1, 1);
        COMMIT;
    `
        )
    );

    assert.equal(scalar(database, "SELECT weight FROM exercise_set WHERE id = 1"), 80);
    assert.equal(scalar(database, "SELECT COUNT(*) FROM exercise_set"), 1);
});

test("Abbrechen entfernt neue Sitzung, bewahrt aber bestehende Übungen", () => {
    const database = createDatabase();
    execute(
        database,
        `
        INSERT INTO exercise (id, name) VALUES (1, 'Bankdrücken'), (2, 'Neue Übung');
        INSERT INTO exercise_muscle_group (muscle_group_id, exercise_id) VALUES (1, 1), (1, 2);
        INSERT INTO training (id, datum, muscle_group_id) VALUES (1, 1, 1);
        INSERT INTO exercise_training (training_id, exercise_id) VALUES (1, 1), (1, 2);
        DELETE FROM training WHERE id = 1;
        DELETE FROM exercise_muscle_group
        WHERE exercise_id = 2
          AND NOT EXISTS (SELECT 1 FROM exercise_training WHERE exercise_id = 2);
        DELETE FROM exercise
        WHERE id = 2
          AND NOT EXISTS (SELECT 1 FROM exercise_training WHERE exercise_id = 2);
    `
    );

    assert.equal(scalar(database, "SELECT COUNT(*) FROM training"), 0);
    assert.equal(scalar(database, "SELECT COUNT(*) FROM exercise WHERE id = 1"), 1);
    assert.equal(scalar(database, "SELECT COUNT(*) FROM exercise WHERE id = 2"), 0);
});

test("SQLite-Backup und Restore stellen den vorherigen Stand wieder her", () => {
    const database = createDatabase();
    const backup = `${database}.backup`;
    execute(database, "INSERT INTO exercise (id, name) VALUES (1, 'Bankdrücken');");
    sqliteCommand(database, `.backup '${backup}'`);
    execute(database, "DELETE FROM exercise WHERE id = 1;");
    assert.equal(scalar(database, "SELECT COUNT(*) FROM exercise"), 0);

    sqliteCommand(database, `.restore '${backup}'`);
    assert.equal(scalar(database, "SELECT COUNT(*) FROM exercise WHERE id = 1"), 1);
    assert.equal(scalar(database, "SELECT COUNT(*) FROM pragma_foreign_key_check"), 0);
});
