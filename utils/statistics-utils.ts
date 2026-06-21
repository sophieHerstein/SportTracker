export function getCutoffTimestamp(days: number | null, referenceTimestamp = Date.now()): number {
    if (days === null) return 0;
    const date = new Date(referenceTimestamp);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - days);
    return date.getTime();
}

export function getMonday(timestamp: number): Date {
    const monday = new Date(timestamp);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return monday;
}

export function formatLocalDateKey(date: Date): string {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");
}
