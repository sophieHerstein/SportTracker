import {
    IDashboardStatistics,
    IEnduranceStatistics,
    IStatisticOption,
    IStatisticPoint,
    IStrengthExerciseStatistics,
} from "../models/interfaces";
import {DatabaseService} from "./database.service";
import {formatLocalDateKey, getCutoffTimestamp, getMonday} from "../utils/statistics-utils";

type DashboardRow = {
    strength_7: number;
    endurance_7: number;
    total_30: number;
    active_weeks_8: number;
    duration_30: number;
};
type StrengthPointRow = {
    datum: number;
    max_weight: number;
    estimated_one_rep_max: number;
    volume: number;
};
type StrengthSummaryRow = {
    session_count: number;
    personal_record: number;
};
type EndurancePointRow = {
    datum: number;
    duration: number;
    distance: number;
    speed: number | null;
    pace: number | null;
};
type EnduranceSummaryRow = {
    session_count: number;
    total_duration: number;
    total_distance: number;
    longest_duration: number;
    longest_distance: number;
};
type WeeklyDurationRow = {
    week_start: string;
    duration: number;
};

export class StatisticsService {
    private formatDate(timestamp: number): string {
        return new Date(timestamp).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
        });
    }

    async getDashboardStatistics(): Promise<IDashboardStatistics> {
        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        const eightWeeksAgo = now - 56 * 24 * 60 * 60 * 1000;

        const result = await DatabaseService.getOne<DashboardRow>(
            `
            SELECT
                (SELECT COUNT(*) FROM training WHERE datum >= ?) AS strength_7,
                (SELECT COUNT(*) FROM ausdauertrainingseinheit WHERE datum >= ?) AS endurance_7,
                (
                    (SELECT COUNT(*) FROM training WHERE datum >= ?)
                    + (SELECT COUNT(*) FROM ausdauertrainingseinheit WHERE datum >= ?)
                ) AS total_30,
                (
                    SELECT COUNT(DISTINCT week_key)
                    FROM (
                        SELECT strftime('%Y-%W', datum / 1000, 'unixepoch', 'localtime') AS week_key
                        FROM training
                        WHERE datum >= ?
                        UNION
                        SELECT strftime('%Y-%W', datum / 1000, 'unixepoch', 'localtime') AS week_key
                        FROM ausdauertrainingseinheit
                        WHERE datum >= ?
                    )
                ) AS active_weeks_8,
                (
                    SELECT COALESCE(SUM(dauer_minuten), 0)
                    FROM ausdauertrainingseinheit
                    WHERE datum >= ?
                ) AS duration_30
        `,
            [
                sevenDaysAgo,
                sevenDaysAgo,
                thirtyDaysAgo,
                thirtyDaysAgo,
                eightWeeksAgo,
                eightWeeksAgo,
                thirtyDaysAgo,
            ]
        );

        return {
            strengthLast7Days: result?.strength_7 ?? 0,
            enduranceLast7Days: result?.endurance_7 ?? 0,
            totalLast30Days: result?.total_30 ?? 0,
            activeWeeksLast8: result?.active_weeks_8 ?? 0,
            totalDurationLast30Days: result?.duration_30 ?? 0,
        };
    }

    async getWeeklyTrainingFrequency(weeks = 12): Promise<IStatisticPoint[]> {
        const cutoff = Date.now() - weeks * 7 * 24 * 60 * 60 * 1000;
        const rows = await DatabaseService.getAll<{week_start: string; count: number}>(
            `
            SELECT week_start, SUM(count) AS count
            FROM (
                SELECT date(datum / 1000, 'unixepoch', 'localtime', 'weekday 0', '-6 days') AS week_start,
                       COUNT(*) AS count
                FROM training
                WHERE datum >= ?
                GROUP BY week_start
                UNION ALL
                SELECT date(datum / 1000, 'unixepoch', 'localtime', 'weekday 0', '-6 days') AS week_start,
                       COUNT(*) AS count
                FROM ausdauertrainingseinheit
                WHERE datum >= ?
                GROUP BY week_start
            )
            GROUP BY week_start
            ORDER BY week_start ASC
        `,
            [cutoff, cutoff]
        );

        const countByWeek = new Map(rows.map((row) => [row.week_start, row.count]));
        const currentMonday = getMonday(Date.now());

        return Array.from({length: weeks}, (_, index) => {
            const monday = new Date(currentMonday);
            monday.setDate(currentMonday.getDate() - (weeks - 1 - index) * 7);
            const key = formatLocalDateKey(monday);
            return {
                timestamp: index,
                label: monday.toLocaleDateString("de-DE", {day: "2-digit", month: "2-digit"}),
                value: countByWeek.get(key) ?? 0,
            };
        });
    }

    async getStrengthExerciseOptions(): Promise<IStatisticOption[]> {
        return DatabaseService.getAll<IStatisticOption>(`
            SELECT DISTINCT e.id, e.name
            FROM exercise e
            JOIN exercise_training et ON et.exercise_id = e.id
            JOIN exercise_set es ON es.exercise_training_id = et.id
            ORDER BY e.name COLLATE NOCASE
        `);
    }

    async getStrengthExerciseStatistics(
        exerciseId: number,
        days: number | null
    ): Promise<IStrengthExerciseStatistics | null> {
        const cutoff = getCutoffTimestamp(days);
        const exercise = await DatabaseService.getOne<IStatisticOption>(
            "SELECT id, name FROM exercise WHERE id = ?",
            [exerciseId]
        );
        if (!exercise) return null;

        const [rows, summary] = await Promise.all([
            DatabaseService.getAll<StrengthPointRow>(
                `
            SELECT datum, max_weight, estimated_one_rep_max, volume
            FROM (
                SELECT t.id,
                       t.datum,
                       MAX(es.weight) AS max_weight,
                       MAX(es.weight * (1.0 + es.repetitions / 30.0)) AS estimated_one_rep_max,
                       SUM(es.weight * es.repetitions) AS volume
                FROM training t
                JOIN exercise_training et ON et.training_id = t.id
                JOIN exercise_set es ON es.exercise_training_id = et.id
                WHERE et.exercise_id = ?
                  AND t.datum >= ?
                GROUP BY t.id, t.datum
                ORDER BY t.datum DESC, t.id DESC
                LIMIT 60
            )
            ORDER BY datum ASC, id ASC
        `,
                [exerciseId, cutoff]
            ),
            DatabaseService.getOne<StrengthSummaryRow>(
                `
                SELECT COUNT(DISTINCT CASE WHEN t.datum >= ? THEN t.id END) AS session_count,
                       MAX(es.weight * (1.0 + es.repetitions / 30.0)) AS personal_record
                FROM exercise_training et
                JOIN exercise_set es ON es.exercise_training_id = et.id
                JOIN training t ON t.id = et.training_id
                WHERE et.exercise_id = ?
            `,
                [cutoff, exerciseId]
            ),
        ]);

        const e1rmPoints = rows.map((row) => ({
            timestamp: row.datum,
            label: this.formatDate(row.datum),
            value: Number(row.estimated_one_rep_max.toFixed(1)),
        }));
        const volumePoints = rows.map((row) => ({
            timestamp: row.datum,
            label: this.formatDate(row.datum),
            value: Math.round(row.volume),
        }));
        const current = rows.at(-1);
        const previous = rows.at(-2);

        return {
            exerciseId,
            exerciseName: exercise.name,
            sessionCount: summary?.session_count ?? 0,
            currentEstimatedOneRepMax: current
                ? Number(current.estimated_one_rep_max.toFixed(1))
                : 0,
            previousEstimatedOneRepMax: previous
                ? Number(previous.estimated_one_rep_max.toFixed(1))
                : null,
            personalRecordEstimatedOneRepMax: Number((summary?.personal_record ?? 0).toFixed(1)),
            currentVolume: current ? Math.round(current.volume) : 0,
            previousVolume: previous ? Math.round(previous.volume) : null,
            estimatedOneRepMaxPoints: e1rmPoints,
            volumePoints,
        };
    }

    async getEnduranceTypeOptions(): Promise<IStatisticOption[]> {
        return DatabaseService.getAll<IStatisticOption>(`
            SELECT DISTINCT tt.id, tt.name
            FROM trainingstyp tt
            JOIN ausdauertrainingseinheit a ON a.trainingstyp_id = tt.id
            ORDER BY tt.name COLLATE NOCASE
        `);
    }

    async getEnduranceStatistics(
        typeId: number,
        days: number | null
    ): Promise<IEnduranceStatistics | null> {
        const cutoff = getCutoffTimestamp(days);
        const type = await DatabaseService.getOne<IStatisticOption>(
            "SELECT id, name FROM trainingstyp WHERE id = ?",
            [typeId]
        );
        if (!type) return null;

        const [rows, summary] = await Promise.all([
            DatabaseService.getAll<EndurancePointRow>(
                `
            SELECT datum, duration, distance, speed, pace
            FROM (
                SELECT id,
                       datum,
                       dauer_minuten AS duration,
                       strecke_km AS distance,
                       CASE
                           WHEN dauer_minuten > 0 AND strecke_km > 0
                           THEN strecke_km / (dauer_minuten / 60.0)
                           ELSE NULL
                       END AS speed,
                       CASE
                           WHEN strecke_km > 0
                           THEN dauer_minuten / strecke_km
                           ELSE NULL
                       END AS pace
                FROM ausdauertrainingseinheit
                WHERE trainingstyp_id = ?
                  AND datum >= ?
                ORDER BY datum DESC, id DESC
                LIMIT 60
            )
            ORDER BY datum ASC, id ASC
        `,
                [typeId, cutoff]
            ),
            DatabaseService.getOne<EnduranceSummaryRow>(
                `
                SELECT COUNT(*) AS session_count,
                       COALESCE(SUM(dauer_minuten), 0) AS total_duration,
                       COALESCE(SUM(strecke_km), 0) AS total_distance,
                       COALESCE(MAX(dauer_minuten), 0) AS longest_duration,
                       COALESCE(MAX(strecke_km), 0) AS longest_distance
                FROM ausdauertrainingseinheit
                WHERE trainingstyp_id = ?
                  AND datum >= ?
            `,
                [typeId, cutoff]
            ),
        ]);

        const weeklyRows = await DatabaseService.getAll<WeeklyDurationRow>(
            `
            SELECT week_start, duration
            FROM (
                SELECT date(datum / 1000, 'unixepoch', 'localtime', 'weekday 0', '-6 days') AS week_start,
                       SUM(dauer_minuten) AS duration
                FROM ausdauertrainingseinheit
                WHERE trainingstyp_id = ?
                  AND datum >= ?
                GROUP BY week_start
                ORDER BY week_start DESC
                LIMIT 16
            )
            ORDER BY week_start ASC
        `,
            [typeId, cutoff]
        );

        const totalDuration = summary?.total_duration ?? 0;
        const totalDistance = summary?.total_distance ?? 0;

        const toPoints = (key: "duration" | "distance" | "pace"): IStatisticPoint[] =>
            rows
                .filter((row) => row[key] !== null && Number.isFinite(row[key]))
                .map((row) => ({
                    timestamp: row.datum,
                    label: this.formatDate(row.datum),
                    value: Number((row[key] as number).toFixed(2)),
                }));

        return {
            typeId,
            typeName: type.name.replace("-", " "),
            sessionCount: summary?.session_count ?? 0,
            totalDuration,
            totalDistance: Number(totalDistance.toFixed(2)),
            averagePace:
                totalDistance > 0 ? Number((totalDuration / totalDistance).toFixed(2)) : null,
            averageSpeed:
                totalDuration > 0 && totalDistance > 0
                    ? Number((totalDistance / (totalDuration / 60)).toFixed(2))
                    : null,
            longestDuration: summary?.longest_duration ?? 0,
            longestDistance: Number((summary?.longest_distance ?? 0).toFixed(2)),
            durationPoints: toPoints("duration"),
            distancePoints: toPoints("distance"),
            pacePoints: toPoints("pace"),
            weeklyDurationPoints: weeklyRows.map((row, index) => ({
                timestamp: index,
                label: row.week_start.slice(5),
                value: row.duration,
            })),
        };
    }

    async fetchLastKrafttraining() {
        return DatabaseService.getAll(`
            SELECT muscle_group.id AS id, muscle_group.name AS name, MAX(training.datum) AS last_training
            FROM muscle_group
            LEFT JOIN training ON muscle_group.id = training.muscle_group_id
            GROUP BY muscle_group.id
        `);
    }

    async fetchLastAusdauertraining() {
        return DatabaseService.getOne(
            "SELECT MAX(datum) AS last_training FROM ausdauertrainingseinheit"
        );
    }
}
