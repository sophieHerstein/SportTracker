import {ActivityIndicator, Alert, FlatList, StyleSheet, Text, View} from 'react-native';
import IconButton from "../components/IconButton";
import {useState, useEffect, useCallback} from 'react';
import KraftsportListItem from "../components/KraftsportListItem";
import * as SQLite from "expo-sqlite";
import {useFocusEffect} from "@react-navigation/native";

// TODO:   DB
//         Sortierung?
//         Charts
//         Trends
//         Empfehlungen oder ähnliches oder Analysen sowas halt

const database = SQLite.openDatabaseSync('training.db');

// Tabellen erstellen (falls nicht vorhanden)
async function setupDatabase(){
    try {
        await database.runAsync(`
            CREATE TABLE IF NOT EXISTS muscle_group (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL
            );
        `);

        await database.runAsync(`
            CREATE TABLE IF NOT EXISTS exercise (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL
            );
        `);

        await database.runAsync(`
            CREATE TABLE IF NOT EXISTS exercise_muscle_group (
                muscle_group_id INTEGER NOT NULL,
                exercise_id INTEGER NOT NULL,
                PRIMARY KEY (muscle_group_id, exercise_id),
                FOREIGN KEY (muscle_group_id) REFERENCES muscle_group(id) ON DELETE CASCADE,
                FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE
            );
        `);

        await database.runAsync(`
            CREATE TABLE IF NOT EXISTS training (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                muscle_group_id INTEGER NOT NULL,
                FOREIGN KEY (muscle_group_id) REFERENCES muscle_group(id) ON DELETE CASCADE
            );
        `);

        await database.runAsync(`
            CREATE TABLE IF NOT EXISTS exercise_training (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                training_id INTEGER NOT NULL,
                exercise_id INTEGER NOT NULL,
                FOREIGN KEY (training_id) REFERENCES training(id) ON DELETE CASCADE,
                FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE
            );
        `);

        await database.runAsync(`
            CREATE TABLE IF NOT EXISTS exercise_set (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                exercise_training_id INTEGER NOT NULL,
                weight REAL NOT NULL,
                repetitions INTEGER NOT NULL,
                FOREIGN KEY (exercise_training_id) REFERENCES exercise_training(id) ON DELETE CASCADE
            );
        `);
    } catch (error) {
        console.error("Fehler beim Einrichten der Datenbank:", error);
    }
}

function transformTrainingData(rawData) {
    const transformedData = {};

    rawData.forEach((entry, index) => {
        const key = `${entry.date}-${entry.muscle_group}`;

        if (!transformedData[key]) {
            transformedData[key] = {
                datum: entry.date,
                gruppe: entry.muscle_group,
                uebungen: {}
            };
        }

        if (!transformedData[key].uebungen[entry.exercise]) {
            transformedData[key].uebungen[entry.exercise] = [];
        }

        transformedData[key].uebungen[entry.exercise].push({
            gewicht: entry.weight,
            widerholung: entry.repetitions
        });
    });

    // Umwandlung der Übungen in ein Array für das gewünschte Format
    return Object.values(transformedData).map((training, index) => ({
        training_id: new Date().getTime() + Math.random() * 1000,
        datum: training.datum,
        gruppe: training.gruppe,
        uebungen: Object.entries(training.uebungen).map(([name, saetze]) => ({
            name,
            saetze
        }))
    }));
}

export default function AusdauersportScreen({navigation, route}){
    const [kraftsportData, setData] = useState([]);
    const [isLoading, setLoading] = useState(true);

    useFocusEffect(useCallback(() => {
        setupDatabase();
        fetchTrainings(setData);
        }, []
    ));

    // Ein Training löschen
    async function deleteTraining(id, setData){
        try {
            await database.runAsync("DELETE FROM training WHERE id = ?", [id]);
            Alert.alert("Training gelöscht!");
            fetchTrainings(setData); // Daten neu laden
        } catch (error) {
            console.error("Fehler beim Löschen des Trainings:", error);
        }
    }

// Dashboard-Daten abrufen
    async function fetchTrainings(setData) {
        setLoading(true)
        try {
            const results = await database.getAllAsync(
                `SELECT t.id AS training_id, t.date, mg.name AS muscle_group, 
                    e.name AS exercise, es.weight, es.repetitions
             FROM training t
             JOIN muscle_group mg ON t.muscle_group_id = mg.id
             JOIN exercise_training et ON t.id = et.training_id
             JOIN exercise e ON et.exercise_id = e.id
             JOIN exercise_set es ON et.id = es.exercise_training_id
             ORDER BY t.date DESC;`
            );
            const transformedData = transformTrainingData(results)
            setData(transformedData);
        } catch (error) {
            console.error("Fehler beim Abrufen der Trainings:", error);
        }
        setLoading(false);
    }

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="red" />
                <Text>Lade Daten...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <IconButton
                size={36}
                color='royalblue'
                onPress={() => navigation.navigate('kraftsportDetailScreen')}
                style={styles.new}
                icon='add-circle'>
            </IconButton>
            <FlatList data={kraftsportData}
                      renderItem={({item})=> (
                          <KraftsportListItem item={item} onDelete={(id) => deleteTraining(id, setData)}/>
                      )}
                      keyExtractor={(item)=> item.training_id}
                      ListEmptyComponent={<Text style={styles.listEmpty}>Keine Daten geladen</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 100
    },
    listEmpty: {
        fontSize: 32,
        paddingTop: 100,
        textAlign: 'center'
    },
    new: {
        position: 'absolute',
        top: 60,
        right: 30,
    },
});