import {DatabaseService} from "./database.service";
import {TAGESZEIT} from "../models/constants";

export class AusdauerService {
    async fetchAllTrainingstypen() {
        return DatabaseService.getAll(`SELECT * FROM Trainingstyp`);
    }

    async fetchAllAusdauertrainingseinheiten() {
        return DatabaseService.getAll(`SELECT * FROM Ausdauertrainingseinheit`);
    }

    async deleteAusdauerTrainingseinheitWithId(id: number) {
        return DatabaseService.run("DELETE FROM Ausdauertrainingseinheit WHERE id = ?", [id]);
    }

    async addTrainingstyp(name: string) {
        return DatabaseService.run("INSERT INTO Trainingstyp (name) VALUES (?)", [name]);
    }

    async getIdForTrainingstyp(name: string) {
        return DatabaseService.getOne(
            "SELECT id FROM Trainingstyp WHERE LOWER(TRIM(name)) = LOWER(?)",
            [name.trim()]
        );
    }

    async addAusdauerTrainingseinheit(
        trainingsTypId: number,
        datum: number,
        dauer: number,
        strecke: number,
        zeit: TAGESZEIT
    ) {
        return DatabaseService.run(
            `INSERT INTO Ausdauertrainingseinheit (
                trainingstyp_id, datum, dauer_minuten, strecke_km, tageszeit
             ) VALUES (?, ?, ?, ?, ?)`,
            [trainingsTypId, datum, dauer, strecke, zeit]
        );
    }

    async updateAusdauerTrainingseinheit(
        id: number,
        trainingsTypId: number,
        datum: number,
        dauer: number,
        strecke: number
    ) {
        return DatabaseService.run(
            `UPDATE Ausdauertrainingseinheit
             SET trainingstyp_id = ?,
                 datum = ?,
                 dauer_minuten = ?,
                 strecke_km = ?
             WHERE id = ?`,
            [trainingsTypId, datum, dauer, strecke, id]
        );
    }
}
