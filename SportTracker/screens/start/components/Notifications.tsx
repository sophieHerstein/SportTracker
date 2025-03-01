import {Text} from "react-native";
import {INotificationProps} from "../../../utils/interfaces";
import {ENotifications} from "../../../utils/constants";

export default function Notifications({notification}: INotificationProps) {

    let content = "";

    switch (notification.typ) {
        case ENotifications.MUSKELGRUPPE_TRAINIEREN:
            content = `Es ist mal wieder Zeit ${notification.additionalData} zu trainieren.`
            break;
        case ENotifications.ZEIT_FUER_AUSDAUER:
            content = "Es ist mal wieder Zeit für ein Ausdauertraining."
            break;
    }

    return (<Text>{content}</Text>)
}