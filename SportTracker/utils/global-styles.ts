import {StyleSheet} from "react-native";
import {
    background,
    hightlight,
    primary,
    secondary,
    secondaryBackground,
    textColorPrimary,
    textColorSecondary
} from "../models/constants";

export const globalStyles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: background,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: textColorPrimary,
        paddingBottom: 10
    },
    subtitle: {
        fontSize: 16,
        color: textColorPrimary,
        paddingBottom: 5
    },
    cards: {
        backgroundColor: secondaryBackground,
        borderRadius: 10,
        padding: 10,
        marginBottom: 10
    },
    text: {
        color: textColorPrimary,
    },
    centerText: {
        textAlign: "center"
    },
    topLeft: {
        position: "absolute",
        top: 20,
        left: 30
    },
    topRight: {
        position: "absolute",
        top: 20,
        right: 30
    },
    light: {
        fontWeight: "100"
    },
    buttonPrimary: {
        backgroundColor: primary,
        margin: 5,
        fontSize: 20,
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonSecondary: {
        backgroundColor: secondary,
        margin: 5,
        fontSize: 20,
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: textColorPrimary,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    rowWithoutSpace: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
    },
    container: {
        justifyContent: "center",
        width: "80%"
    },
    input: {
        borderWidth: 1,
        borderColor: hightlight,
        color: hightlight,
        padding: 10,
        margin: 10,
        width: '80%',
        borderRadius: 5,
        fontSize: 20
    },
    setDate: {
        backgroundColor: hightlight,
        height: 30,
        width: 100,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    setDateText: {
        color: textColorSecondary
    }
});