export interface IEnduranceInput {
    name: string;
    duration: string;
    distance: string;
}

export interface IValidatedEnduranceInput {
    name: string;
    duration: number;
    distance: number;
}

export function parseLocalizedNumber(value: string): number | null {
    const normalized = value.trim().replace(",", ".");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}

export function validateEnduranceInput(input: IEnduranceInput): IValidatedEnduranceInput {
    const name = input.name.trim().replace(/\s+/g, " ");
    const duration = parseLocalizedNumber(input.duration);
    const distance = parseLocalizedNumber(input.distance) ?? 0;

    if (!name) throw new Error("Bitte wähle eine Sportart aus.");
    if (duration === null || duration <= 0) {
        throw new Error("Die Dauer muss größer als 0 Minuten sein.");
    }
    if (distance < 0) throw new Error("Die Strecke darf nicht negativ sein.");

    return {name, duration, distance};
}
