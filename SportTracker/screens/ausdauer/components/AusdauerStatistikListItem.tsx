import {Dimensions, Text, View} from 'react-native';
import AusdauerLineChart from "./AusdauerLineChart";
import AusdauerScatterPlot from "./AusdauerScatterPlot";
import {IAusdauerStatistikListItemProps} from "../../../utils/interfaces";
import {globalStyles} from "../../../utils/global-styles";

const screenWidth = Dimensions.get("window").width;

export default function AusdauerStatistikListItem({item}: IAusdauerStatistikListItemProps) {
    return (
        <View>
            <Text style={globalStyles.title}>{item[0].name}</Text>
            <AusdauerLineChart screenwidth={screenWidth} items={item} dataKey="dauer" text="Dauer (Minuten)"/>
            {item.some((i)=> i.strecke > 0) && <AusdauerLineChart screenwidth={screenWidth} items={item} dataKey="strecke" text="Strecke (km)"/>}
            {item.some((i)=> i.strecke > 0) && <AusdauerLineChart screenwidth={screenWidth} items={item} dataKey="geschwindigkeit" text="Geschwindigkeit (km/h)"/>}
            {item.some((i)=> i.strecke > 0) && <AusdauerScatterPlot screenwidth={screenWidth} items={item}/>}
        </View>
    );
}