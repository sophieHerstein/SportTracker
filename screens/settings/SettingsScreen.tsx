import {useCallback, useMemo, useState} from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import {useFocusEffect} from "@react-navigation/native";
import {DatabaseBackupService} from "../../services/database-backup.service";
import {DatabaseIntegrityService} from "../../services/database-integrity.service";
import {
    IDatabaseBackup,
    IDatabaseIntegrityReport,
    IDatabaseRestorePreview,
    IExerciseMergeCandidate,
    ISuspiciousExercise,
} from "../../models/interfaces";
import {globalStyles} from "../../utils/global-styles";
import {highlight, primary, secondary, secondaryBackground} from "../../models/constants";
import {DatabaseRepairService} from "../../services/database-repair.service";
import {DatabaseRestoreService} from "../../services/database-restore.service";

export default function SettingsScreen() {
    const [report, setReport] = useState<IDatabaseIntegrityReport | null>(null);
    const [backups, setBackups] = useState<IDatabaseBackup[]>([]);
    const [isLoading, setLoading] = useState(true);
    const [isCreatingBackup, setCreatingBackup] = useState(false);
    const [mergeCandidates, setMergeCandidates] = useState<IExerciseMergeCandidate[]>([]);
    const [mergingSourceId, setMergingSourceId] = useState<number | null>(null);
    const [restorePreview, setRestorePreview] = useState<IDatabaseRestorePreview | null>(null);
    const [isInspectingBackup, setInspectingBackup] = useState(false);
    const [isRestoringBackup, setRestoringBackup] = useState(false);
    const [isRepairing, setRepairing] = useState(false);
    const [suspiciousExercises, setSuspiciousExercises] = useState<ISuspiciousExercise[]>([]);
    const [exerciseNameDrafts, setExerciseNameDrafts] = useState<Record<number, string>>({});
    const [editingExerciseId, setEditingExerciseId] = useState<number | null>(null);

    const integrityService = useMemo(() => new DatabaseIntegrityService(), []);
    const backupService = useMemo(() => new DatabaseBackupService(), []);
    const repairService = useMemo(() => new DatabaseRepairService(), []);
    const restoreService = useMemo(() => new DatabaseRestoreService(), []);

    useFocusEffect(
        useCallback(() => {
            void loadData();
        }, [])
    );

    async function loadData() {
        setLoading(true);
        try {
            const [newReport, existingBackups, candidates, suspicious] = await Promise.all([
                integrityService.createReport(),
                backupService.getBackups(),
                repairService.getExerciseMergeCandidates(),
                repairService.getSuspiciousExercises(),
            ]);
            setReport(newReport);
            setBackups(existingBackups);
            setMergeCandidates(candidates);
            setSuspiciousExercises(suspicious);
            setExerciseNameDrafts(
                Object.fromEntries(suspicious.map((exercise) => [exercise.id, exercise.name]))
            );
        } catch (error) {
            console.error("❌ Fehler beim Prüfen der Datenbank:", error);
            Alert.alert("Datenprüfung fehlgeschlagen", getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }

    async function createAndShareBackup() {
        setCreatingBackup(true);
        try {
            const backup = await backupService.createBackup();
            setBackups(await backupService.getBackups());
            Alert.alert(
                "Backup erstellt",
                `${backup.fileName}\n\nDas Backup bleibt zusätzlich im Dokumentbereich der App gespeichert.`,
                [
                    {text: "Später"},
                    {
                        text: "Jetzt teilen",
                        onPress: () => {
                            void shareBackup(backup);
                        },
                    },
                ]
            );
        } catch (error) {
            console.error("❌ Backup konnte nicht erstellt werden:", error);
            Alert.alert("Backup fehlgeschlagen", getErrorMessage(error));
        } finally {
            setCreatingBackup(false);
        }
    }

    async function shareBackup(backup: IDatabaseBackup) {
        try {
            await backupService.shareBackup(backup);
        } catch (error) {
            Alert.alert("Export fehlgeschlagen", getErrorMessage(error));
        }
    }

    async function chooseBackupForRestore() {
        setInspectingBackup(true);
        try {
            if (restorePreview) {
                await restoreService.discardPreview(restorePreview);
                setRestorePreview(null);
            }
            const preview = await restoreService.pickAndInspectBackup();
            if (preview) setRestorePreview(preview);
        } catch (error) {
            Alert.alert("Backup ungültig", getErrorMessage(error));
        } finally {
            setInspectingBackup(false);
        }
    }

    async function inspectLocalBackup(backup: IDatabaseBackup) {
        setInspectingBackup(true);
        try {
            if (restorePreview) {
                await restoreService.discardPreview(restorePreview);
                setRestorePreview(null);
            }
            const preview = await restoreService.inspectBackupFile(backup.fileName, backup.uri);
            setRestorePreview(preview);
        } catch (error) {
            Alert.alert("Backup ungültig", getErrorMessage(error));
        } finally {
            setInspectingBackup(false);
        }
    }

    function confirmRestore() {
        if (!restorePreview) return;
        Alert.alert(
            "Datenbank wiederherstellen?",
            "Die aktuell aktive Datenbank wird vorher automatisch gesichert und anschließend vollständig durch dieses Backup ersetzt.",
            [
                {text: "Abbrechen", style: "cancel"},
                {
                    text: "Wiederherstellen",
                    style: "destructive",
                    onPress: () => void restoreSelectedBackup(),
                },
            ]
        );
    }

    async function restoreSelectedBackup() {
        if (!restorePreview) return;
        setRestoringBackup(true);
        try {
            const safetyBackup = await restoreService.restoreBackup(restorePreview);
            setRestorePreview(null);
            await loadData();
            Alert.alert(
                "Wiederherstellung abgeschlossen",
                `Der vorherige Datenstand wurde zusätzlich als „${safetyBackup}“ gesichert.`
            );
        } catch (error) {
            Alert.alert("Wiederherstellung fehlgeschlagen", getErrorMessage(error));
        } finally {
            setRestoringBackup(false);
        }
    }

    async function cancelRestorePreview() {
        if (!restorePreview) return;
        try {
            await restoreService.discardPreview(restorePreview);
        } finally {
            setRestorePreview(null);
        }
    }

    function confirmMerge(candidate: IExerciseMergeCandidate) {
        Alert.alert(
            "Übungen zusammenführen?",
            `„${candidate.sourceName}“ wird vollständig in „${candidate.targetName}“ überführt. Trainingsdaten und Gruppenzuordnungen bleiben erhalten.`,
            [
                {text: "Abbrechen", style: "cancel"},
                {
                    text: "Zusammenführen",
                    style: "destructive",
                    onPress: () => void mergeExercises(candidate),
                },
            ]
        );
    }

    async function mergeExercises(candidate: IExerciseMergeCandidate) {
        setMergingSourceId(candidate.sourceId);
        try {
            const backupFileName = await repairService.mergeExercises(
                candidate.sourceId,
                candidate.targetId
            );
            await loadData();
            Alert.alert(
                "Übungen zusammengeführt",
                `Vor der Änderung wurde das Backup „${backupFileName}“ erstellt.`
            );
        } catch (error) {
            Alert.alert("Zusammenführen fehlgeschlagen", getErrorMessage(error));
        } finally {
            setMergingSourceId(null);
        }
    }

    async function acceptExerciseNames(candidate: IExerciseMergeCandidate) {
        setMergingSourceId(candidate.sourceId);
        try {
            await repairService.ignoreExerciseMergeCandidate(
                candidate.sourceId,
                candidate.targetId
            );
            await loadData();
        } catch (error) {
            Alert.alert("Entscheidung nicht gespeichert", getErrorMessage(error));
        } finally {
            setMergingSourceId(null);
        }
    }

    async function saveExerciseName(exercise: ISuspiciousExercise) {
        setEditingExerciseId(exercise.id);
        try {
            await repairService.renameSuspiciousExercise(
                exercise.id,
                exerciseNameDrafts[exercise.id] ?? exercise.name
            );
            await loadData();
        } catch (error) {
            Alert.alert("Umbenennen fehlgeschlagen", getErrorMessage(error));
        } finally {
            setEditingExerciseId(null);
        }
    }

    async function acceptSuspiciousExercise(exercise: ISuspiciousExercise) {
        setEditingExerciseId(exercise.id);
        try {
            await repairService.ignoreSuspiciousExercise(exercise.id);
            await loadData();
        } catch (error) {
            Alert.alert("Entscheidung nicht gespeichert", getErrorMessage(error));
        } finally {
            setEditingExerciseId(null);
        }
    }

    function confirmDeleteExercise(exercise: ISuspiciousExercise) {
        const usageNotice =
            exercise.usageCount > 0
                ? ` Sie wird in ${exercise.usageCount} Trainingseinheit(en) verwendet. Dabei werden auch die zugehörigen historischen Sätze entfernt.`
                : " Sie wurde bisher in keinem Training verwendet.";
        Alert.alert(
            "Übung vollständig löschen?",
            `„${exercise.name || "(leerer Name)"}“ wird aus der Datenbank entfernt.${usageNotice} Vorher wird automatisch ein Backup erstellt.`,
            [
                {text: "Abbrechen", style: "cancel"},
                {
                    text: "Endgültig löschen",
                    style: "destructive",
                    onPress: () => void deleteExercise(exercise),
                },
            ]
        );
    }

    async function deleteExercise(exercise: ISuspiciousExercise) {
        setEditingExerciseId(exercise.id);
        try {
            const backupFileName = await repairService.deleteExerciseCompletely(exercise.id);
            await loadData();
            Alert.alert(
                "Übung gelöscht",
                `Der vorherige Stand wurde als „${backupFileName}“ gesichert.`
            );
        } catch (error) {
            Alert.alert("Löschen fehlgeschlagen", getErrorMessage(error));
        } finally {
            setEditingExerciseId(null);
        }
    }

    function confirmSafeRepair() {
        Alert.alert(
            "Daten sicher bereinigen?",
            "Verwaiste oder leere technische Datensätze werden entfernt und doppelte Zuordnungen zusammengeführt. Vorher wird automatisch ein Backup erstellt.",
            [
                {text: "Abbrechen", style: "cancel"},
                {
                    text: "Bereinigen",
                    onPress: () => void repairSafeIssues(),
                },
            ]
        );
    }

    async function repairSafeIssues() {
        setRepairing(true);
        try {
            const backupFileName = await repairService.repairSafeIntegrityIssues();
            await loadData();
            Alert.alert(
                "Bereinigung abgeschlossen",
                `Der vorherige Stand wurde als „${backupFileName}“ gesichert. Auffällige Übungsnamen bleiben zur manuellen Prüfung erhalten.`
            );
        } catch (error) {
            Alert.alert("Bereinigung fehlgeschlagen", getErrorMessage(error));
        } finally {
            setRepairing(false);
        }
    }

    function getErrorMessage(error: unknown): string {
        return error instanceof Error ? error.message : "Unbekannter Fehler";
    }

    function formatFileSize(size: number | null): string {
        if (size == null) return "Größe unbekannt";
        if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    const totalIssues = report?.issues.reduce((sum, issue) => sum + issue.count, 0) ?? 0;
    const automaticallyRepairableKeys = new Set([
        "foreign-keys",
        "duplicate-exercise-trainings",
        "orphan-sets",
        "orphan-exercise-trainings",
        "orphan-muscle-group-links",
        "trainings-without-exercises",
        "exercise-trainings-without-sets",
    ]);
    const repairableIssueCount =
        report?.issues
            .filter((issue) => automaticallyRepairableKeys.has(issue.key))
            .reduce((sum, issue) => sum + issue.count, 0) ?? 0;

    return (
        <ScrollView
            style={globalStyles.screenContainer}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={highlight} />
            }
        >
            <Text style={globalStyles.title}>Daten & Sicherheit</Text>

            <View style={globalStyles.cards}>
                <Text style={globalStyles.subtitle}>Datenbankstatus</Text>
                {isLoading && !report ? (
                    <ActivityIndicator color={highlight} />
                ) : report ? (
                    <>
                        <Text style={globalStyles.text}>
                            SQLite-Integrität: {report.integrityCheckPassed ? "OK" : "Fehler"}
                        </Text>
                        <Text style={globalStyles.text}>
                            Schema-Version: {report.schemaVersion}
                        </Text>
                        <Text style={globalStyles.text}>
                            Gefundene Auffälligkeiten: {totalIssues}
                        </Text>
                        <Text style={styles.muted}>
                            Geprüft am {new Date(report.createdAt).toLocaleString("de-DE")}
                        </Text>
                    </>
                ) : (
                    <Text style={globalStyles.text}>Noch keine Prüfung vorhanden.</Text>
                )}
            </View>

            <Pressable
                style={[globalStyles.buttonPrimary, isCreatingBackup && styles.disabled]}
                disabled={isCreatingBackup}
                onPress={createAndShareBackup}
            >
                {isCreatingBackup ? (
                    <ActivityIndicator color={highlight} />
                ) : (
                    <Text style={globalStyles.buttonText}>Neues Backup erstellen</Text>
                )}
            </Pressable>

            <Pressable
                style={[globalStyles.buttonSecondary, isInspectingBackup && styles.disabled]}
                disabled={isInspectingBackup || isRestoringBackup}
                onPress={chooseBackupForRestore}
            >
                {isInspectingBackup ? (
                    <ActivityIndicator color={highlight} />
                ) : (
                    <Text style={globalStyles.buttonText}>Backup-Datei wiederherstellen</Text>
                )}
            </Pressable>

            {restorePreview && (
                <View style={[globalStyles.cards, styles.restorePreview]}>
                    <Text style={globalStyles.subtitle}>Backup-Vorschau</Text>
                    <Text style={globalStyles.text}>{restorePreview.sourceName}</Text>
                    <Text style={styles.muted}>
                        Schema {restorePreview.originalSchemaVersion} →{" "}
                        {restorePreview.schemaVersion}
                    </Text>
                    <Text style={globalStyles.text}>
                        {restorePreview.trainingCount} Krafttrainings ·{" "}
                        {restorePreview.enduranceTrainingCount} Ausdauertrainings
                    </Text>
                    <Text style={globalStyles.text}>
                        {restorePreview.exerciseCount} Übungen · {restorePreview.setCount} Sätze ·{" "}
                        {restorePreview.muscleGroupCount} Muskelgruppen
                    </Text>
                    <View style={styles.restoreActions}>
                        <Pressable
                            disabled={isRestoringBackup}
                            onPress={() => void cancelRestorePreview()}
                        >
                            <Text style={styles.cancelText}>Abbrechen</Text>
                        </Pressable>
                        <Pressable disabled={isRestoringBackup} onPress={confirmRestore}>
                            {isRestoringBackup ? (
                                <ActivityIndicator color={highlight} />
                            ) : (
                                <Text style={styles.restoreText}>Wiederherstellen</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            )}

            <Text style={[globalStyles.subtitle, styles.sectionTitle]}>Diagnose</Text>
            {repairableIssueCount > 0 && (
                <View style={styles.repairBanner}>
                    <View style={styles.repairText}>
                        <Text style={globalStyles.subtitle}>
                            {repairableIssueCount} technisch behebbare Auffälligkeit(en)
                        </Text>
                        <Text style={styles.muted}>
                            Die Bereinigung erstellt zuerst ein Backup und verändert keine gültigen
                            Trainingsinhalte.
                        </Text>
                    </View>
                    <Pressable
                        disabled={isRepairing}
                        style={[styles.repairButton, isRepairing && styles.disabled]}
                        onPress={confirmSafeRepair}
                    >
                        {isRepairing ? (
                            <ActivityIndicator color={highlight} />
                        ) : (
                            <Text style={styles.repairButtonText}>Sicher bereinigen</Text>
                        )}
                    </Pressable>
                </View>
            )}
            {report?.issues.map((issue) => (
                <View key={issue.key} style={[globalStyles.cards, styles.issueRow]}>
                    <View style={styles.issueText}>
                        <Text style={globalStyles.subtitle}>{issue.title}</Text>
                        <Text style={styles.muted}>{issue.description}</Text>
                        {issue.count > 0 && (
                            <Text style={styles.issueAction}>
                                {automaticallyRepairableKeys.has(issue.key)
                                    ? "Automatisch behebbar"
                                    : issue.key === "possible-partial-exercise-names"
                                      ? "Unten einzeln prüfbar"
                                      : "Manuelle Prüfung erforderlich"}
                            </Text>
                        )}
                    </View>
                    <View
                        style={[
                            styles.badge,
                            issue.count > 0
                                ? issue.severity === "critical"
                                    ? styles.critical
                                    : styles.warning
                                : styles.ok,
                        ]}
                    >
                        <Text style={styles.badgeText}>{issue.count}</Text>
                    </View>
                </View>
            ))}

            {suspiciousExercises.length > 0 && (
                <>
                    <Text style={[globalStyles.subtitle, styles.sectionTitle]}>
                        Auffällige Übungsnamen bearbeiten
                    </Text>
                    <Text style={styles.muted}>
                        Namen korrigieren, bewusst akzeptieren oder die Übung vollständig löschen.
                    </Text>
                    {suspiciousExercises.map((exercise) => (
                        <View
                            key={exercise.id}
                            style={[globalStyles.cards, styles.exerciseRepairCard]}
                        >
                            <TextInput
                                style={[globalStyles.input, styles.exerciseNameInput]}
                                value={exerciseNameDrafts[exercise.id] ?? ""}
                                placeholder="Übungsname"
                                placeholderTextColor="#A8A8B3"
                                onChangeText={(text) =>
                                    setExerciseNameDrafts((current) => ({
                                        ...current,
                                        [exercise.id]: text,
                                    }))
                                }
                            />
                            <Text style={styles.muted}>
                                {exercise.usageCount} gespeicherte Verwendung(en)
                            </Text>
                            {editingExerciseId === exercise.id ? (
                                <ActivityIndicator
                                    style={styles.exerciseLoader}
                                    color={highlight}
                                />
                            ) : (
                                <View style={styles.exerciseRepairActions}>
                                    <Pressable
                                        onPress={() => void acceptSuspiciousExercise(exercise)}
                                    >
                                        <Text style={styles.acceptText}>Passt so</Text>
                                    </Pressable>
                                    <Pressable onPress={() => void saveExerciseName(exercise)}>
                                        <Text style={styles.shareText}>Umbenennen</Text>
                                    </Pressable>
                                    <Pressable onPress={() => confirmDeleteExercise(exercise)}>
                                        <Text style={styles.restoreText}>Löschen</Text>
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    ))}
                </>
            )}

            {mergeCandidates.length > 0 && (
                <>
                    <Text style={[globalStyles.subtitle, styles.sectionTitle]}>
                        Mögliche Teilwort-Übungen
                    </Text>
                    <Text style={styles.muted}>
                        Bitte jeden Vorschlag prüfen. Es wird nichts automatisch zusammengeführt.
                    </Text>
                    {mergeCandidates.map((candidate) => (
                        <View
                            key={`${candidate.sourceId}-${candidate.targetId}`}
                            style={[globalStyles.cards, styles.mergeRow]}
                        >
                            <View style={styles.backupText}>
                                <Text style={globalStyles.text}>
                                    {candidate.sourceName} → {candidate.targetName}
                                </Text>
                                <Text style={styles.muted}>
                                    {candidate.sourceUsageCount} gespeicherte Verwendung(en)
                                </Text>
                            </View>
                            <View style={styles.candidateActions}>
                                {mergingSourceId === candidate.sourceId ? (
                                    <ActivityIndicator color={highlight} />
                                ) : (
                                    <>
                                        <Pressable
                                            disabled={mergingSourceId !== null}
                                            onPress={() => void acceptExerciseNames(candidate)}
                                        >
                                            <Text style={styles.acceptText}>Passt so</Text>
                                        </Pressable>
                                        <Pressable
                                            disabled={mergingSourceId !== null}
                                            onPress={() => confirmMerge(candidate)}
                                        >
                                            <Text style={styles.restoreText}>Zusammenführen</Text>
                                        </Pressable>
                                    </>
                                )}
                            </View>
                        </View>
                    ))}
                </>
            )}

            <Text style={[globalStyles.subtitle, styles.sectionTitle]}>Lokale Backups</Text>
            {backups.length === 0 ? (
                <Text style={styles.muted}>Noch kein lokales Backup vorhanden.</Text>
            ) : (
                backups.map((backup) => (
                    <View key={backup.uri} style={[globalStyles.cards, styles.backupRow]}>
                        <View style={styles.backupText}>
                            <Text style={globalStyles.text} numberOfLines={2}>
                                {backup.fileName}
                            </Text>
                            <Text style={styles.muted}>
                                {backup.createdAt
                                    ? new Date(backup.createdAt).toLocaleString("de-DE")
                                    : "Datum unbekannt"}{" "}
                                · {formatFileSize(backup.size)}
                            </Text>
                        </View>
                        <View style={styles.backupActions}>
                            <Pressable onPress={() => shareBackup(backup)}>
                                <Text style={styles.shareText}>Teilen</Text>
                            </Pressable>
                            <Pressable onPress={() => void inspectLocalBackup(backup)}>
                                <Text style={styles.restoreText}>Restore</Text>
                            </Pressable>
                        </View>
                    </View>
                ))
            )}

            <Text style={styles.notice}>
                Vor jeder Wiederherstellung wird der aktuelle Datenstand automatisch gesichert.
                Lokal werden höchstens die zehn neuesten Backups behalten.
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingTop: 28,
        paddingBottom: 36,
    },
    sectionTitle: {
        marginTop: 20,
    },
    muted: {
        color: "#A8A8B3",
        marginTop: 4,
    },
    disabled: {
        opacity: 0.6,
    },
    issueRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    issueText: {
        flex: 1,
        paddingRight: 12,
    },
    issueAction: {
        color: highlight,
        fontSize: 12,
        fontWeight: "700",
        marginTop: 8,
    },
    repairBanner: {
        backgroundColor: secondaryBackground,
        borderColor: secondary,
        borderWidth: 1,
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
    },
    repairText: {
        marginBottom: 12,
    },
    repairButton: {
        minHeight: 44,
        borderRadius: 12,
        backgroundColor: secondary,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
    },
    repairButtonText: {
        color: highlight,
        fontWeight: "700",
    },
    badge: {
        minWidth: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    ok: {
        backgroundColor: "#247A49",
    },
    warning: {
        backgroundColor: secondary,
    },
    critical: {
        backgroundColor: primary,
    },
    badgeText: {
        color: highlight,
        fontWeight: "bold",
    },
    backupRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: secondaryBackground,
    },
    mergeRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    candidateActions: {
        alignItems: "flex-end",
        gap: 12,
    },
    exerciseRepairCard: {
        marginTop: 10,
    },
    exerciseNameInput: {
        width: "100%",
        marginTop: 0,
    },
    exerciseRepairActions: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 14,
    },
    exerciseLoader: {
        marginTop: 14,
    },
    acceptText: {
        color: highlight,
        fontWeight: "700",
    },
    backupText: {
        flex: 1,
        paddingRight: 12,
    },
    shareText: {
        color: highlight,
        fontWeight: "bold",
    },
    restoreText: {
        color: primary,
        fontWeight: "bold",
    },
    cancelText: {
        color: highlight,
    },
    restorePreview: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: primary,
    },
    restoreActions: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 16,
    },
    backupActions: {
        gap: 12,
        alignItems: "flex-end",
    },
    notice: {
        color: "#A8A8B3",
        marginVertical: 20,
        lineHeight: 20,
    },
});
