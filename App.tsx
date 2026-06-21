import {useEffect, useMemo, useState} from "react";
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from "react-native";
import Navigation from "./Navigation";
import {DatabaseSchemaService} from "./services/database-schema.service";
import {background, highlight, primary, textColorPrimary} from "./models/constants";

export default function App() {
    const [isReady, setReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const schemaService = useMemo(() => new DatabaseSchemaService(), []);

    useEffect(() => {
        void initialize();
    }, []);

    async function initialize() {
        setError(null);
        setReady(false);
        try {
            await schemaService.initializeDatabase();
            setReady(true);
        } catch (initializationError) {
            console.error("❌ Datenbankinitialisierung fehlgeschlagen:", initializationError);
            setError(
                initializationError instanceof Error
                    ? initializationError.message
                    : "Unbekannter Fehler bei der Datenbankinitialisierung"
            );
        }
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Datenbank konnte nicht geöffnet werden</Text>
                <Text style={styles.message}>{error}</Text>
                <Text style={styles.message}>
                    Die App hat keine weiteren Änderungen an den Trainingsdaten vorgenommen.
                </Text>
                <Pressable style={styles.button} onPress={() => void initialize()}>
                    <Text style={styles.buttonText}>Erneut versuchen</Text>
                </Pressable>
            </View>
        );
    }

    if (!isReady) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={highlight} />
                <Text style={styles.message}>Datenbank wird geprüft …</Text>
            </View>
        );
    }

    return <Navigation />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: background,
        alignItems: "center",
        justifyContent: "center",
        padding: 28,
    },
    title: {
        color: textColorPrimary,
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 16,
    },
    message: {
        color: textColorPrimary,
        textAlign: "center",
        lineHeight: 21,
        marginTop: 12,
    },
    button: {
        marginTop: 24,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: primary,
    },
    buttonText: {
        color: textColorPrimary,
        fontWeight: "bold",
    },
});
