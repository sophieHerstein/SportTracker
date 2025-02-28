//MERKE: DIESE VARIANTE HIER IST DEFINITIV KEIN BEST PRACTICE!!!!!!

export const createMuscleGroupTable = 'CREATE TABLE IF NOT EXISTS muscle_group ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL)'

export const createExerciseTable = 'CREATE TABLE IF NOT EXISTS exercise (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL);'

export const createExerciseMuscleGroupTable = 'CREATE TABLE IF NOT EXISTS exercise_muscle_group (muscle_group_id INTEGER NOT NULL, exercise_id INTEGER NOT NULL, PRIMARY KEY (muscle_group_id, exercise_id), FOREIGN KEY (muscle_group_id) REFERENCES muscle_group(id) ON DELETE CASCADE, FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE)'

export const createTrainingTable = 'CREATE TABLE IF NOT EXISTS training (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, muscle_group_id INTEGER NOT NULL, FOREIGN KEY (muscle_group_id) REFERENCES muscle_group(id) ON DELETE CASCADE)';

export const createExerciseTrainingTable = 'CREATE TABLE IF NOT EXISTS exercise_training (id INTEGER PRIMARY KEY AUTOINCREMENT, training_id INTEGER NOT NULL, exercise_id INTEGER NOT NULL, FOREIGN KEY (training_id) REFERENCES training(id) ON DELETE CASCADE, FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE)'

export const createExerciseSetTable = 'CREATE TABLE IF NOT EXISTS exercise_set (id INTEGER PRIMARY KEY AUTOINCREMENT, exercise_training_id INTEGER NOT NULL, weight REAL NOT NULL, repetitions INTEGER NOT NULL, FOREIGN KEY (exercise_training_id) REFERENCES exercise_training(id) ON DELETE CASCADE);'

export const getKraftsportHomeScreenData = 'SELECT t.id AS training_id, t.date, mg.name AS muscle_group, e.name AS exercise, es.weight, es.repetitions FROM training t JOIN muscle_group mg ON t.muscle_group_id = mg.id JOIN exercise_training et ON t.id = et.training_id JOIN exercise e ON et.exercise_id = e.id JOIN exercise_set es ON et.id = es.exercise_training_id ORDER BY t.date DESC'

export const deleteTrainingWithId = (id: string)=>  `DELETE FROM training WHERE id = ${id}`

export const getMuscleGroupData = 'SELECT * FROM muscle_group';

export const addMuscleGroupToTable = (additionalGruppe: string) => `INSERT INTO muscle_group (name) VALUES ('${additionalGruppe}')`

export const getLastUebungDataForGruppe = (gruppe: string)=> `SELECT e.name, es.weight, COUNT(es.id) as sets FROM training t JOIN exercise_training et ON t.id = et.training_id JOIN exercise e ON et.exercise_id = e.id JOIN exercise_set es ON et.id = es.exercise_training_id WHERE t.muscle_group_id = (SELECT id FROM muscle_group WHERE name = '${gruppe}') AND t.date = (SELECT MAX(date) FROM training WHERE muscle_group_id = t.muscle_group_id) GROUP BY e.name, es.weight ORDER BY t.date DESC`;

export const deleteUebungReferenzFromGruppe = (uebung: string, gruppe: string) => `DELETE FROM exercise_muscle_group WHERE exercise_id = (SELECT id FROM exercise WHERE name = '${uebung}') AND muscle_group_id = (SELECT id FROM muscle_group WHERE name = '${gruppe}')`;

export const getMuscleGroupIdForName = (name: string) => `SELECT id FROM muscle_group WHERE name='${name}'`;

export const addTrainig = (datum: string, muscleGroupId: number) => `INSERT INTO training (date, muscle_group_id) VALUES ('${datum}', ${muscleGroupId})`

export const getIdForUebung = (name: string) => `SELECT id FROM exercise WHERE name = '${name}'`

export const addUebungToDatabase = (name: string) => `INSERT INTO exercise (name) VALUES ('${name}')`

export const connectMuscleGroupAndUebung = (muscleGroupId: number, exerciseId: number) => `INSERT OR IGNORE INTO exercise_muscle_group (muscle_group_id, exercise_id) VALUES (${muscleGroupId}, ${exerciseId})`

export const addExerciseToTraining = (trainingId: number, exerciseId: number) => `INSERT INTO exercise_training (training_id, exercise_id) VALUES (${trainingId}, ${exerciseId})`

export const addSatzToDatabase = (exerciseTrainingId: number, weight: number, repetitions: number) => `INSERT INTO exercise_set (exercise_training_id, weight, repetitions) VALUES (${exerciseTrainingId}, ${weight}, ${repetitions})`

export const createTrainingsTypTable = 'CREATE TABLE IF NOT EXISTS Trainingstyp (id PRIMARY KEY, name TEXT UNIQUE NOT NULL)';

export const createAusdauertrainingseinheitTable = 'CREATE TABLE IF NOT EXISTS Ausdauertrainingseinheit (id PRIMARY KEY, trainingstyp_id INT REFERENCES Trainingstyp(id) ON DELETE CASCADE, datum INT NOT NULL, dauer_minuten INT NOT NULL, strecke_km DECIMAL(5,2) NOT NULL)';

export const getAllTrainingstypen = "SELECT * FROM Trainingstyp";

export const getAllAusdauertrainingseinheiten = 'SELECT * FROM Ausdauertrainingseinheit';

export const deleteAusdauerTrainingseinheitWithId = (id: number)=> `DELETE FROM Ausdauertrainingseinheit WHERE id=${id}`

export const addTrainingsTypToTable = (trainingstypId: number, trainingstyp: string) => `INSERT INTO Trainingstyp (id, name) VALUES (${trainingstypId}, '${trainingstyp}')`

export const getIdForTrainingsTyp = (trainingstyp: string) => `SELECT id FROM Trainingstyp WHERE name='${trainingstyp}'`

export const addAusdauertrainingsEinheitToTable = (id: number, trainigsTypId: number, datum: number, dauer: number, strecke: number) => `INSERT INTO Ausdauertrainingseinheit (id, trainingstyp_id, datum, dauer_minuten, strecke_km) VALUES (${id}, ${trainigsTypId},${datum},${dauer},${strecke})`


