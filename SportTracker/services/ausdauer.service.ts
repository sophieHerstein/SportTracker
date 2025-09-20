import {DatabaseService} from "./database.service";

export class AusdauerService {

    async fetchAllTrainingstypen() {
        return DatabaseService.getAll(`SELECT * FROM Trainingstyp`)
    }

    async fetchAllAusdauertrainingseinheiten() {
        return DatabaseService.getAll(`SELECT * FROM Ausdauertrainingseinheit`)
    }

    async deleteAusdauerTrainingseinheitWithId(id: number) {
        return DatabaseService.run(`DELETE FROM Ausdauertrainingseinheit WHERE id=${id}`)
    }

    async addTrainingstyp(name: string) {
        return DatabaseService.run(`INSERT INTO Trainingstyp (name) VALUES ('${name}')`)
    }

    async getIdForTrainingstyp(name: string) {
        return DatabaseService.getOne(`SELECT id FROM Trainingstyp WHERE name='${name}'`)
    }

    async addAusdauerTrainingseinheit(trainingsTypId: number, datum: number, dauer: number, strecke: number) {
        return DatabaseService.run(`INSERT INTO Ausdauertrainingseinheit (trainingstyp_id, datum, dauer_minuten, strecke_km) VALUES (${trainingsTypId},${datum},${dauer},${strecke})`)
    }
}