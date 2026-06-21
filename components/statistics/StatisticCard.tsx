import {StyleSheet, Text, View} from "react-native";
import {globalStyles} from "../../utils/global-styles";
import {primary, textColorMuted} from "../../models/constants";

interface Props {
    label: string;
    value: string;
    detail?: string;
    trend?: number | null;
}

export default function StatisticCard({label, value, detail, trend}: Props) {
    return (
        <View style={[globalStyles.cards, styles.card]}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
            {trend != null && (
                <Text style={[styles.detail, trend >= 0 ? styles.positive : styles.negative]}>
                    {trend >= 0 ? "+" : ""}
                    {trend.toFixed(1)} %
                </Text>
            )}
            {detail && <Text style={styles.detail}>{detail}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        minWidth: "46%",
        marginBottom: 0,
    },
    label: {
        color: textColorMuted,
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.7,
    },
    value: {
        color: primary,
        fontSize: 25,
        fontWeight: "800",
        marginTop: 6,
    },
    detail: {
        color: textColorMuted,
        fontSize: 12,
        marginTop: 4,
    },
    positive: {
        color: "#43C59E",
    },
    negative: {
        color: primary,
    },
});
