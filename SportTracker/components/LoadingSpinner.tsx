import {ActivityIndicator, StyleSheet, View} from "react-native";
import {hightlight} from "../models/constants";
import {globalStyles} from "../utils/global-styles";

export default function LoadingSpinner() {
    return (
        <View style={[globalStyles.screenContainer, styles.container]}>
            <ActivityIndicator size="large" color={hightlight}/>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
    }
})