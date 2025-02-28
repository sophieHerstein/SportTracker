import {ActivityIndicator, Text, View} from "react-native";

export default function LoadingSpinner() {
    return (
        <View>
            <ActivityIndicator size="large" color="red" />
            <Text>Lade Daten...</Text>
        </View>
    )
}