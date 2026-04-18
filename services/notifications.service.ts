import {ENotifications} from "../models/constants";
import {INotification} from "../models/interfaces";
import {StatisticsService} from "./statistics.service";

export class NotificationsService {
    private statisticsService = new StatisticsService();

    async generateNotifications(): Promise<INotification[]> {
        const now = Date.now();
        const notifications: INotification[] = [];

        const kraft = await this.getKraftTrainingNotifications(now);
        const ausdauer = await this.getAusdauerTrainingNotifications(now);

        notifications.push(...kraft, ...ausdauer);

        return notifications;
    }

    private async getKraftTrainingNotifications(now: number): Promise<INotification[]> {
        const DAYS_THRESHOLD = 28;
        const result = await this.statisticsService.fetchLastKrafttraining();
        const notifications: INotification[] = [];

        const vernachlaessigte = result.filter(entry => {
            const last = entry.last_training;
            return !last || now - last > DAYS_THRESHOLD * 24 * 60 * 60 * 1000;
        });

        for (const entry of vernachlaessigte) {
            notifications.push({
                typ: ENotifications.MUSKELGRUPPE_TRAINIEREN,
                additionalData: entry.name
            });
        }

        return notifications;
    }

    private async getAusdauerTrainingNotifications(now: number): Promise<INotification[]> {
        const DAYS_THRESHOLD = 14;
        const result = await this.statisticsService.fetchLastAusdauertraining();

        if (!result || now - result.last_training > DAYS_THRESHOLD * 24 * 60 * 60 * 1000) {
            return [{
                typ: ENotifications.ZEIT_FUER_AUSDAUER
            }];
        }

        return [];
    }
}