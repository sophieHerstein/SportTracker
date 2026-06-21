import {TextStyle, ViewStyle} from "react-native";
import {ENotifications, ETimeRange} from "./constants";

export interface IKraftsportDatabaseResult {
    datum: number;
    exercise: string;
    muscle_group: string;
    repetitions: number;
    training_id: number;
    exercise_set_id: number;
    weight: number;
}

export interface IKraftsportData {
    training_id: number;
    datum: string;
    datum_as_timestamp: number;
    gruppe: string;
    uebungen: IUebung[];
}

export interface IUebung {
    id: number;
    exerciseId?: number;
    canRenameDuringAutosave?: boolean;
    nameConfirmed?: boolean;
    name: string;
    saetze: ISatz[];
    weightShouldBeIncreased?: boolean;
}

export interface ISatz {
    id: number;
    gewicht: number | string | null;
    wiederholungen: number | string | null;
}

export interface IKrafttrainingSaveRequest {
    trainingId: number | null;
    datum: number;
    muscleGroupName: string;
    tageszeit: string;
    requireAllExercisesValid: boolean;
    exercises: IUebung[];
}

export interface IKrafttrainingSaveResult {
    trainingId: number;
    savedExerciseCount: number;
    savedSetCount: number;
    exerciseIds: {
        clientId: number;
        exerciseId: number;
        canRenameDuringAutosave: boolean;
        createdDuringSave: boolean;
    }[];
}

export interface ISatzDB {
    satz_id: number;
    weight: number;
    repetitions: number;
}

export interface IMuscleGroupDatabaseResult {
    id: number;
    name: string;
}

export interface ITextIconButtonProps {
    stylePressable?: ViewStyle;
    styleText?: TextStyle;
    onPress: () => void;
    iconName: string;
    color?: string;
    iconSize?: number;
    title: string;
}

export interface IKraftsportUebungListItemProps {
    uebung: IUebung;
    updateSatz: (uebungId: number, satzId: number, wdh: string, text: string) => void;
    deleteSatz: (uebungId: number, satzId: number) => void;
    duplicateSatz: (uebungId: number, satzId: number) => void;
    updateUebungName: (uebungId: number, name: string) => void;
    confirmUebungName: (uebungId: number, name: string, exerciseId?: number) => void;
    addSatz: (uebungId: number) => void;
    deleteUebung: (uebungId: number) => void;
    moveUebung: (uebungId: number, direction: "up" | "down") => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
}

export interface ISatzListItemProps {
    satz: ISatz;
    uebungId: number;
    updateSatz: (uebungId: number, satzId: number, wdh: string, text: string) => void;
    deleteSatz: (uebungId: number, satzId: number) => void;
    duplicateSatz: (uebungId: number, satzId: number) => void;
}

export interface IIconButtonProps {
    onPress: () => void;
    icon: string;
    style?: ViewStyle;
    color: string;
    size: number;
}

export interface ITrainingDatabase {
    name: string;
    last_sets: number;
    last_weight: number;
    id: number;
    last_training_date: number;
}

export interface IKraftsportListItemProps {
    item: IKraftsportData;
    onDelete: (trainingId: string) => void;
    onUpdate: (trainingId: string, gruppe: string, datum: number) => void;
}

export interface IBigButtonProps {
    onPress: () => void;
    title: string;
}

export interface ITrainingstypDatabaseResult {
    id: number;
    name: string;
}

export interface IAusdauertrainingseinheitDatabaseResult {
    datum: number;
    dauer_minuten: number;
    id: number;
    strecke_km: number;
    trainingstyp_id: number;
}

export interface IAusdauerData {
    datum: string;
    datum_as_timestamp: number;
    dauer: number;
    id: number;
    name: string;
    trainingstypId: number;
    strecke: number;
    geschwindigkeit: number;
}

export interface IAusdauersportListItemProps {
    item: IAusdauerData;
    onDelete: (id: number) => void;
    onUpdate: (item: IAusdauerData) => void;
}

export interface ITrainingstypDropdown {
    label: string;
    value: string;
}

export interface IGewichtUebung {
    satz_anzahl: number;
    weight: number;
}

export interface IEntwicklungGewichtDatabaseResult {
    datum: number;
    uebung: string;
    max_weight: number;
}

export interface IEntwicklungGewicht {
    name: string;
    data: IEntwicklungGewichtData[];
}

export interface IEntwicklungGewichtData {
    datum: string;
    gewicht: number;
}

export interface ITrainingsProMonatDatabaseResult {
    monat: string;
    trainingsanzahl: number;
}

export interface ITrainingsProWocheDatabaseResult {
    woche: string;
    trainingsanzahl: number;
}

export interface IProgressionsAnalyseDatabaseResult {
    uebung: string;
    differenz: number;
}

export interface IBarChartProps {
    label: string;
    value: number;
}

export interface INotification {
    typ: ENotifications;
    additionalData?: string;
}

export interface INotificationProps {
    notification: INotification;
}

export interface IKraftsportLineChartListItemProps {
    uebung: IVictoryKraftsportChartProps;
    isNotListElement?: boolean;
}

export interface IVictoryKraftsportChartProps {
    name: string;
    data: IVictoryChartProps[];
}

export interface IVictoryChartProps {
    x: string | number;
    y: number;
}

export interface ITimeFilterProps {
    timeRange: ETimeRange;
    onPressGesamt: () => void;
    onPressJahr: () => void;
    onPress6Monate: () => void;
    onPress3Monate: () => void;
    onPressMonat: () => void;
}

export interface ITypeFilterProps {
    types: string[];
    currentChosenType: string;
    onPress: (type: string) => void;
    compact?: boolean;
}

export interface IKraftpsortUebungModalProps {
    visible: boolean;
    onCancel: () => void;
    uebung: IUebung;
}

export interface IKrafttrainingUndUebungData {
    id?: number;
    name: string;
    exercises: {
        id: number;
        name: string;
    }[];
}

export interface RawRow {
    muscle_group_id: number;
    muscle_group_name: string;
    exercises: string | null;
}

export interface IDatabaseIntegrityIssue {
    key: string;
    title: string;
    description: string;
    count: number;
    severity: "info" | "warning" | "critical";
}

export interface IDatabaseIntegrityReport {
    createdAt: number;
    integrityCheckPassed: boolean;
    integrityMessages: string[];
    foreignKeyViolationCount: number;
    schemaVersion: number;
    issues: IDatabaseIntegrityIssue[];
}

export interface IDatabaseBackup {
    fileName: string;
    uri: string;
    size: number | null;
    createdAt: number | null;
}

export interface IExerciseMergeCandidate {
    sourceId: number;
    sourceName: string;
    targetId: number;
    targetName: string;
    sourceUsageCount: number;
}

export interface ISuspiciousExercise {
    id: number;
    name: string;
    usageCount: number;
}

export interface IDatabaseRestorePreview {
    sourceName: string;
    temporaryDatabaseName: string;
    temporaryDirectory: string;
    schemaVersion: number;
    originalSchemaVersion: number;
    trainingCount: number;
    enduranceTrainingCount: number;
    exerciseCount: number;
    muscleGroupCount: number;
    setCount: number;
}

export interface IStatisticOption {
    id: number;
    name: string;
}

export interface IStatisticPoint {
    timestamp: number;
    label: string;
    value: number;
}

export interface IDashboardStatistics {
    strengthLast7Days: number;
    enduranceLast7Days: number;
    totalLast30Days: number;
    activeWeeksLast8: number;
    totalDurationLast30Days: number;
}

export interface IStrengthExerciseStatistics {
    exerciseId: number;
    exerciseName: string;
    sessionCount: number;
    currentEstimatedOneRepMax: number;
    previousEstimatedOneRepMax: number | null;
    personalRecordEstimatedOneRepMax: number;
    currentVolume: number;
    previousVolume: number | null;
    estimatedOneRepMaxPoints: IStatisticPoint[];
    volumePoints: IStatisticPoint[];
}

export interface IEnduranceStatistics {
    typeId: number;
    typeName: string;
    sessionCount: number;
    totalDuration: number;
    totalDistance: number;
    averagePace: number | null;
    averageSpeed: number | null;
    longestDuration: number;
    longestDistance: number;
    durationPoints: IStatisticPoint[];
    distancePoints: IStatisticPoint[];
    pacePoints: IStatisticPoint[];
    weeklyDurationPoints: IStatisticPoint[];
}
