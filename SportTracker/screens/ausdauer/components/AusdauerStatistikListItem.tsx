import {Dimensions, StyleSheet, Text, View} from 'react-native';
import {VictoryAxis, VictoryChart, VictoryScatter, VictoryTheme} from "victory-native";
import AusdauerLineChart from "./AusdauerLineChart";
import AusdauerScatterPlot from "./AusdauerScatterPlot";
import {IAusdauerStatistikListItemProps} from "../../../utils/interfaces";

const screenWidth = Dimensions.get("window").width;

export default function AusdauerStatistikListItem({item}: IAusdauerStatistikListItemProps) {
    return (
        <View>
            <Text>{item[0].name}</Text>
            <AusdauerLineChart screenwidth={screenWidth} items={item} dataKey="dauer" text="Dauer (Minuten)"/>
            <AusdauerLineChart screenwidth={screenWidth} items={item} dataKey="strecke" text="Strecke (km)"/>
            <AusdauerScatterPlot screenwidth={screenWidth} items={item}/>
        </View>
    );
}

const styles = StyleSheet.create({

});