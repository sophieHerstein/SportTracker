import {ActivityIndicator, StyleSheet, View} from "react-native";
import {highlight} from "../models/constants";
import {globalStyles} from "../utils/global-styles";

export default function LoadingSpinner() {
    return (
        <View style={[globalStyles.screenContainer, styles.container]}>
            <ActivityIndicator size="large" color={highlight}/>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
    }
})