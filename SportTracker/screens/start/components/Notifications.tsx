import {Dimensions, StyleSheet, Text, View} from "react-native";
import {INotificationProps} from "../../../utils/interfaces";
import {background, ENotifications, hightlight, primary} from "../../../utils/constants";
import {globalStyles} from "../../../utils/global-styles";

export default function Notifications({notification}: INotificationProps) {

    let content = "DIES IST EINE NOTIFICATION";

    switch (notification.typ) {
        case ENotifications.MUSKELGRUPPE_TRAINIEREN:
            content = `Es ist mal wieder Zeit ${notification.additionalData} zu trainieren.`
            break;
        case ENotifications.ZEIT_FUER_AUSDAUER:
            content = "Es ist mal wieder Zeit für ein Ausdauertraining."
            break;
    }

    return (
        <View style={styles.container}>
            <Text style={[globalStyles.title, globalStyles.centerText]}>{content}</Text>
        </View>)
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 5,
        padding: 10,
        backgroundColor: primary,
        width: Dimensions.get("window").width * 0.9,
        height: 70,
        marginBottom: 10,
        justifyContent: 'center',
        alignItems: 'center',
    }
})
