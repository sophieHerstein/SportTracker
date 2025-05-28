//MERKE: DIESE VARIANTE HIER IST DEFINITIV KEIN BEST PRACTICE!!!!!!

export const createMuscleGroupTable = 'CREATE TABLE IF NOT EXISTS muscle_group ( id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL)'

export const createExerciseTable = 'CREATE TABLE IF NOT EXISTS exercise (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL)'

export const createExerciseMuscleGroupTable = 'CREATE TABLE IF NOT EXISTS exercise_muscle_group (muscle_group_id INTEGER NOT NULL, exercise_id INTEGER NOT NULL, PRIMARY KEY (muscle_group_id, exercise_id), FOREIGN KEY (muscle_group_id) REFERENCES muscle_group(id) ON DELETE CASCADE, FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE)'

export const createTrainingTable = 'CREATE TABLE IF NOT EXISTS training (id INTEGER PRIMARY KEY, datum INT NOT NULL, muscle_group_id INTEGER NOT NULL, FOREIGN KEY (muscle_group_id) REFERENCES muscle_group(id) ON DELETE CASCADE)';

export const createExerciseTrainingTable = 'CREATE TABLE IF NOT EXISTS exercise_training (id INTEGER PRIMARY KEY, training_id INTEGER NOT NULL, exercise_id INTEGER NOT NULL, FOREIGN KEY (training_id) REFERENCES training(id) ON DELETE CASCADE, FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE)'

export const createExerciseSetTable = 'CREATE TABLE IF NOT EXISTS exercise_set (id INTEGER PRIMARY KEY, exercise_training_id INTEGER NOT NULL, weight REAL NOT NULL, repetitions INTEGER NOT NULL, FOREIGN KEY (exercise_training_id) REFERENCES exercise_training(id) ON DELETE CASCADE)'

export const getKraftsportHomeScreenData = 'SELECT t.id AS training_id, t.datum, mg.name AS muscle_group, e.name AS exercise, es.id AS exercise_set_id, es.weight, es.repetitions FROM training t JOIN muscle_group mg ON t.muscle_group_id = mg.id JOIN exercise_training et ON t.id = et.training_id JOIN exercise e ON et.exercise_id = e.id JOIN exercise_set es ON et.id = es.exercise_training_id ORDER BY t.datum DESC'

export const deleteTrainingWithId1 = (id: string)=>  `DELETE FROM exercise_set WHERE exercise_training_id IN (SELECT id FROM exercise_training WHERE training_id = ${id})`
export const deleteTrainingWithId2 = (id: string)=>  `DELETE FROM exercise_training WHERE training_id = ${id}`
export const deleteTrainingWithId3 = (id: string)=>  `DELETE FROM training WHERE id = ${id}`
export const deleteTrainingWithId4 = ()=>  `DELETE FROM exercise_training WHERE training_id NOT IN (SELECT id FROM training)`

export const getMuscleGroupData = 'SELECT * FROM muscle_group';

export const addMuscleGroupToTable = (additionalGruppe: string) => `INSERT INTO muscle_group (name) VALUES ('${additionalGruppe}')`

export const getLastUebungDataForGruppe = (gruppe: string)=> `SELECT e.id, e.name, MAX(t.datum) AS last_training_date, (SELECT es.weight FROM exercise_set es JOIN exercise_training et2 ON es.exercise_training_id = et2.id WHERE et2.exercise_id = e.id ORDER BY et2.training_id DESC LIMIT 1) AS last_weight, (SELECT COUNT(*) FROM exercise_set es JOIN exercise_training et2 ON es.exercise_training_id = et2.id WHERE et2.exercise_id = e.id AND et2.training_id = (SELECT id FROM training WHERE datum = (SELECT MAX(datum) FROM training t JOIN exercise_training et3 ON t.id = et3.training_id WHERE et3.exercise_id = e.id))) AS last_sets FROM exercise e JOIN exercise_training et ON e.id = et.exercise_id JOIN training t ON et.training_id = t.id WHERE e.id IN (SELECT exercise_id FROM exercise_muscle_group WHERE muscle_group_id = (SELECT id FROM muscle_group WHERE name = '${gruppe}')) GROUP BY e.id, e.name`;

export const deleteUebungReferenzFromGruppe = (uebungId: number, gruppe: string) => `DELETE FROM exercise_muscle_group WHERE exercise_id = ${uebungId} AND muscle_group_id = (SELECT id FROM muscle_group WHERE name = '${gruppe}')`;

export const getMuscleGroupIdForName = (name: string) => `SELECT id FROM muscle_group WHERE name='${name}'`;

export const addTraining = (datum: number, muscleGroupId: number) => `INSERT INTO training (datum, muscle_group_id) VALUES (${datum}, ${muscleGroupId})`

export const getIdForUebung = (name: string) => `SELECT id FROM exercise WHERE name = '${name}'`

export const addUebungToDatabase = (name: string) => `INSERT INTO exercise (name) VALUES ('${name}')`

export const connectMuscleGroupAndUebung = (muscleGroupId: number, exerciseId: number) => `INSERT OR IGNORE INTO exercise_muscle_group (muscle_group_id, exercise_id) VALUES (${muscleGroupId}, ${exerciseId})`

export const addExerciseToTraining = (trainingId: string, exerciseId: number) => `INSERT INTO exercise_training (training_id, exercise_id) VALUES (${trainingId}, ${exerciseId})`

export const addSatzToDatabase = (exerciseTrainingId: number, weight: number, repetitions: number) => `INSERT INTO exercise_set (exercise_training_id, weight, repetitions) VALUES (${exerciseTrainingId}, ${weight}, ${repetitions})`

export const createTrainingsTypTable = 'CREATE TABLE IF NOT EXISTS trainingstyp (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL)';

export const createAusdauertrainingseinheitTable = 'CREATE TABLE IF NOT EXISTS ausdauertrainingseinheit (id INTEGER PRIMARY KEY, trainingstyp_id INT REFERENCES Trainingstyp(id) ON DELETE CASCADE, datum INT NOT NULL, dauer_minuten INT NOT NULL, strecke_km DECIMAL(5,2) NOT NULL)';

export const getAllTrainingstypen = "SELECT * FROM Trainingstyp";

export const getAllAusdauertrainingseinheiten = 'SELECT * FROM Ausdauertrainingseinheit';

export const deleteAusdauerTrainingseinheitWithId = (id: number)=> `DELETE FROM Ausdauertrainingseinheit WHERE id=${id}`

export const addTrainingsTypToTable = (trainingstyp: string) => `INSERT INTO Trainingstyp (name) VALUES ('${trainingstyp}')`

export const getIdForTrainingsTyp = (trainingstyp: string) => `SELECT id FROM Trainingstyp WHERE name='${trainingstyp}'`

export const addAusdauertrainingsEinheitToTable = (trainingsTypId: number, datum: number, dauer: number, strecke: number) => `INSERT INTO Ausdauertrainingseinheit (trainingstyp_id, datum, dauer_minuten, strecke_km) VALUES (${trainingsTypId},${datum},${dauer},${strecke})`

export const getLastWeightForUebung = (uebung: string) => `SELECT es.weight, COUNT(es.id) AS satz_anzahl FROM exercise_set es JOIN exercise_training et ON es.exercise_training_id = et.id JOIN exercise e ON et.exercise_id = e.id WHERE e.name = '${uebung}' AND et.training_id = (SELECT et2.training_id FROM exercise_training et2 JOIN training t ON et2.training_id = t.id WHERE et2.exercise_id = (SELECT id FROM exercise WHERE name = '${uebung}') ORDER BY t.id DESC LIMIT 1) GROUP BY es.exercise_training_id ORDER BY es.id DESC LIMIT 1`

export const shouldExerciseAndMuscleGroupBeUnlinked = (uebungId: number) => `WITH last_training AS (SELECT id FROM training  WHERE muscle_group_id = (SELECT muscle_group_id FROM training  WHERE id IN (SELECT training_id  FROM exercise_training WHERE exercise_id = ${uebungId})) ORDER BY datum DESC LIMIT 1 ) , previous_training AS ( SELECT id FROM training  WHERE muscle_group_id = ( SELECT muscle_group_id FROM training  WHERE id IN (SELECT training_id FROM exercise_training WHERE exercise_id = ${uebungId}) )  AND id < (SELECT id FROM last_training)  ORDER BY datum DESC LIMIT 1 ), last_5_trainings AS ( SELECT id FROM training WHERE muscle_group_id = ( SELECT muscle_group_id FROM training WHERE id IN (SELECT training_id FROM exercise_training WHERE exercise_id = ${uebungId}) ) ORDER BY datum DESC LIMIT 5 ), exercise_last_training AS ( SELECT 1 FROM exercise_training WHERE exercise_id = ${uebungId} AND training_id = (SELECT id FROM last_training)), exercise_previous_training AS ( SELECT 1 FROM exercise_training WHERE exercise_id = ${uebungId} AND training_id = (SELECT id FROM previous_training)), exercise_last_5_trainings AS (SELECT COUNT (*) as count FROM exercise_training WHERE exercise_id = ${uebungId} AND training_id IN (SELECT id FROM last_5_trainings)) SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM last_training) THEN 0 WHEN EXISTS (SELECT 1 FROM exercise_last_training) AND NOT EXISTS (SELECT 1 FROM exercise_previous_training) THEN 1 WHEN (SELECT count FROM exercise_last_5_trainings) = 0 THEN 1 ELSE 0 END AS should_unlink`

export const shouldWeightBeIncreased = (uebungName: string)=> `WITH last_weights AS (SELECT es.weight, es.repetitions, t.id AS training_id FROM exercise_set es JOIN exercise_training et ON es.exercise_training_id = et.id JOIN training t ON et.training_id = t.id WHERE et.exercise_id = (SELECT id FROM exercise WHERE name = '${uebungName}') ORDER BY t.id DESC LIMIT 6 ) SELECT CASE WHEN COUNT(*) = 6 AND MIN(weight) = MAX(weight) AND AVG(repetitions) >= 12 THEN 1 ELSE 0 END AS increaseWeight FROM last_weights;`

export const dropExerciseSetTable = "DROP TABLE IF EXISTS exercise_set"

export const dropTrainingTable = "DROP TABLE IF EXISTS training"

export const dropExerciseTrainingTable = 'DROP TABLE IF EXISTS exercise_training';

export const dropExerciseMuscleGroupTable = 'DROP TABLE IF EXISTS exercise_muscle_group';

export const dropExerciseTable = 'DROP TABLE IF EXISTS exercise';

export const dropMuscleGroupTable = 'DROP TABLE IF EXISTS muscle_group';

export const dropTrainingstypTable = 'DROP TABLE IF EXISTS trainingstyp';

export const dropAusdauertrainingseinheitTable = 'DROP TABLE IF EXISTS ausdauertrainingseinheit'

export const getKraftsportTrainingProMonat = "SELECT strftime('%Y-%m', t.datum / 1000, 'unixepoch') AS monat, COUNT(*) AS trainingsanzahl FROM training t GROUP BY monat ORDER BY monat DESC";

export const getKraftsportTrainingProWoche = "SELECT strftime('%Y-%W', t.datum / 1000, 'unixepoch') AS woche, COUNT(*) AS trainingsanzahl FROM training t GROUP BY woche ORDER BY woche DESC;"

export const getAusdauerTrainingProMonat = "SELECT strftime('%Y-%m', a.datum / 1000, 'unixepoch') AS monat, COUNT(*) AS trainingsanzahl FROM ausdauertrainingseinheit a GROUP BY monat ORDER BY monat DESC"

export const getAusdauerTrainingProWoche = "SELECT strftime('%Y-%W', a.datum / 1000, 'unixepoch') AS woche, COUNT(*) AS trainingsanzahl FROM ausdauertrainingseinheit a GROUP BY woche ORDER BY woche DESC;"

export const getProgressionsData = "SELECT et.exercise_id, e.name AS uebung, MAX(es.weight) - MIN(es.weight) AS differenz FROM exercise_set es JOIN exercise_training et ON es.exercise_training_id = et.id JOIN training t ON et.training_id = t.id JOIN exercise e ON et.exercise_id = e.id GROUP BY et.exercise_id, e.name ORDER BY differenz DESC;"

export const getEntwicklungGewichtData = "SELECT e.name AS uebung, t.datum, MAX(es.weight) AS max_weight FROM exercise_set es JOIN exercise_training et ON es.exercise_training_id = et.id JOIN training t ON et.training_id = t.id JOIN exercise e ON et.exercise_id = e.id GROUP BY e.name, t.datum ORDER BY e.name ASC, t.datum ASC"

export const getEntwicklungGewichtDataForUebung = (uebungId: number)=> `SELECT t.datum, MAX(es.weight) AS max_weight FROM exercise_set es JOIN exercise_training et ON es.exercise_training_id = et.id JOIN training t ON et.training_id = t.id JOIN exercise e ON et.exercise_id = e.id WHERE e.id = '${uebungId}' GROUP BY t.datum ORDER BY t.datum DESC`

export const keinAusdauerSeit14Tagen = "SELECT CASE WHEN MAX(datum) < strftime('%s', 'now', '-14 days') * 1000 THEN 1 ELSE 0 END AS zeit_fuer_ausdauer FROM ausdauertrainingseinheit";

export const muskelgruppeSollteTrainiertWerden =`SELECT mg.name, MAX(COALESCE(t.datum, 0)) AS last_training FROM muscle_group mg LEFT JOIN training t ON mg.id = t.muscle_group_id GROUP BY mg.name HAVING last_training < (strftime('%s', 'now', '-30 days') * 1000)`

export const getExercisesForTraining = (trainingId: string) => `SELECT et.id as exercise_training_id, e.id as exercise_id, e.name, es.id as set_id, es.weight, es.repetitions FROM exercise_training et JOIN exercise e ON et.exercise_id = e.id LEFT JOIN exercise_set es ON es.exercise_training_id = et.id WHERE et.training_id = ${trainingId} ORDER BY e.name ASC, es.id ASC`;

export const deleteSatzFromTraining = (trainingId: string) => `DELETE FROM exercise_set WHERE exercise_training_id IN (SELECT id FROM exercise_training WHERE training_id = '${trainingId}')`;

export const deleteTraining = (trainingId: string) => `DELETE FROM exercise_training WHERE training_id = '${trainingId}'`

export const getLastSatzDataForUebung = (uebungId: number) => `SELECT es.id AS satz_id, es.weight, es.repetitions FROM exercise_set es JOIN exercise_training et ON es.exercise_training_id = et.id JOIN training t ON et.training_id = t.id WHERE et.exercise_id = '${uebungId}' AND t.datum = (SELECT MAX(t2.datum) FROM exercise_training et2 JOIN training t2 ON et2.training_id = t2.id WHERE et2.exercise_id = '${uebungId}')`