const test = require("node:test");
const assert = require("node:assert/strict");

const {
    parseTrainingNumber,
    prepareExercisesForSave,
} = require("../.phase7-test-build/utils/training-validation.js");
const {
    parseLocalizedNumber,
    validateEnduranceInput,
} = require("../.phase7-test-build/utils/endurance-validation.js");
const {
    formatLocalDateKey,
    getCutoffTimestamp,
    getMonday,
} = require("../.phase7-test-build/utils/statistics-utils.js");

function exercise(overrides = {}) {
    return {
        id: 1,
        name: "Bankdrücken",
        nameConfirmed: true,
        saetze: [{id: 1, gewicht: "80", wiederholungen: "8"}],
        ...overrides,
    };
}

test("deutsche Dezimalwerte werden normalisiert", () => {
    assert.equal(parseTrainingNumber("82,5"), 82.5);
    assert.equal(parseLocalizedNumber(" 12,75 "), 12.75);
    assert.equal(parseLocalizedNumber(""), null);
});

test("Autosave speichert Gewicht und ergänzt fehlende Wiederholungen mit 0", () => {
    const result = prepareExercisesForSave(
        [
            exercise({
                name: "  Bankdrücken   Langhantel ",
                saetze: [
                    {id: 1, gewicht: "82,5", wiederholungen: ""},
                    {id: 2, gewicht: null, wiederholungen: null},
                ],
            }),
        ],
        false
    );

    assert.deepEqual(result, [
        {
            clientId: 1,
            exerciseId: undefined,
            canRenameDuringAutosave: false,
            name: "Bankdrücken Langhantel",
            sets: [{weight: 82.5, repetitions: 0}],
        },
    ]);
});

test("Autosave überspringt unbestätigte und gewichtlose Übungen", () => {
    const result = prepareExercisesForSave(
        [
            exercise({nameConfirmed: false}),
            exercise({
                id: 2,
                name: "Kniebeuge",
                saetze: [{id: 2, gewicht: "", wiederholungen: "8"}],
            }),
        ],
        false
    );

    assert.deepEqual(result, []);
});

test("Finales Speichern verlangt vollständige Wiederholungen", () => {
    assert.throws(
        () =>
            prepareExercisesForSave(
                [exercise({saetze: [{id: 1, gewicht: "80", wiederholungen: ""}]})],
                true
            ),
        /vollständig und gültig/
    );
});

test("Doppelte Übungen werden unabhängig von Großschreibung erkannt", () => {
    assert.throws(
        () => prepareExercisesForSave([exercise(), exercise({id: 2, name: " bankdrücken "})], true),
        /mehrfach/
    );
});

test("Ausdauerwerte werden validiert und leere Strecke wird 0", () => {
    assert.deepEqual(
        validateEnduranceInput({name: "  Trail   Run ", duration: "45,5", distance: ""}),
        {name: "Trail Run", duration: 45.5, distance: 0}
    );
    assert.throws(
        () => validateEnduranceInput({name: "", duration: "20", distance: "5"}),
        /Sportart/
    );
    assert.throws(
        () => validateEnduranceInput({name: "Laufen", duration: "0", distance: "5"}),
        /größer als 0/
    );
    assert.throws(
        () => validateEnduranceInput({name: "Laufen", duration: "20", distance: "-1"}),
        /nicht negativ/
    );
});

test("Statistik-Zeiträume beginnen am lokalen Tagesanfang", () => {
    const reference = new Date(2026, 5, 21, 18, 30).getTime();
    const cutoff = new Date(getCutoffTimestamp(30, reference));

    assert.equal(cutoff.getHours(), 0);
    assert.equal(cutoff.getMinutes(), 0);
    assert.equal(formatLocalDateKey(cutoff), "2026-05-22");
});

test("Wochenstatistiken verwenden Montag als Wochenbeginn", () => {
    const sunday = new Date(2026, 5, 21, 12).getTime();
    const monday = getMonday(sunday);

    assert.equal(monday.getDay(), 1);
    assert.equal(formatLocalDateKey(monday), "2026-06-15");
});
