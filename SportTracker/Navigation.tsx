import * as Icon from '@expo/vector-icons';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import KraftsportScreen from "./screens/kraftsport/KraftsportScreen";
import KraftsportUebungenScreen from "./screens/kraftsport/KraftsportUebungenScreen";
import AusdauerScreen from "./screens/ausdauer/AusdauerScreen";
import KraftsportGruppeWaehlenScreen from "./screens/kraftsport/KraftsportGruppeWaehlenScreen";
import NeuerAusdauerEintragScreen from "./screens/ausdauer/NeuerAusdauerEintragScreen";
import AusdauerStatistikScreen from "./screens/ausdauer/AusdauerStatistikScreen";
import {EAppPaths, highlight, secondaryBackground} from "./models/constants";
import {IAusdauerData, ITrainingstypDatabaseResult} from "./models/interfaces";
import KraftsportStatistikScreen from "./screens/kraftsport/KraftsportStatistikScreen";
import StartScreen from "./screens/start/StartScreen";
import {globalStyles} from "./utils/global-styles";

export type NavigatorParamList = {
    [EAppPaths.HOME]: undefined;
    [EAppPaths.KRAFTSPORT_HOME]: undefined;
    [EAppPaths.KRAFTSPORT_GRUPPE_WAEHLEN]: undefined;
    [EAppPaths.KRAFTSPORT_UEBUNGEN]: {
        gruppe: string;
        datum: number;
        id?: string;
        uebungen?: {uebung: string}[]
    };
    [EAppPaths.KRAFTSPORT_STATISTIK]: undefined;
    [EAppPaths.AUSDAUER_HOME]: undefined;
    [EAppPaths.AUSDAUER_EINTRAG]: {
        trainingsTypen: ITrainingstypDatabaseResult[]
    };
    [EAppPaths.AUSDAUER_STATISTIK]: {
        ausdauerData: IAusdauerData[]
    };
    [EAppPaths.KRAFTSPORT_STACK]: undefined;
    [EAppPaths.AUSDAUER_STACK]: undefined;
};

const Stack = createNativeStackNavigator<NavigatorParamList>();
const Tab = createBottomTabNavigator<NavigatorParamList>();

function KraftsportStack() {
    return (
        <Stack.Navigator screenOptions={{headerStyle: {backgroundColor: secondaryBackground}}}>
            <Stack.Screen name={EAppPaths.KRAFTSPORT_HOME} component={KraftsportScreen}
                          options={{title: "Kraftsport", headerTitleStyle: globalStyles.title}}/>
            <Stack.Screen name={EAppPaths.KRAFTSPORT_GRUPPE_WAEHLEN} component={KraftsportGruppeWaehlenScreen}
                          options={{title: "Gruppe wählen", headerTitleStyle: globalStyles.title}}></Stack.Screen>
            <Stack.Screen name={EAppPaths.KRAFTSPORT_UEBUNGEN} component={KraftsportUebungenScreen}
                          options={({route}) => {
                              const gruppe = route.params.gruppe;
                              const datum = new Date(route.params.datum).toLocaleDateString('de-DE', {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric"
                              });
                              return {title: `${gruppe} (${datum})`, headerTitleStyle: globalStyles.title}
                          }}></Stack.Screen>
            <Stack.Screen name={EAppPaths.KRAFTSPORT_STATISTIK} component={KraftsportStatistikScreen} options={{
                title: "Kraftsport Statistik",
                headerTitleStyle: globalStyles.title
            }}></Stack.Screen>
        </Stack.Navigator>
    );
}

function AusdauerStack() {
    return (
        <Stack.Navigator screenOptions={{headerStyle: {backgroundColor: secondaryBackground}}}>
            <Stack.Screen name={EAppPaths.AUSDAUER_HOME} component={AusdauerScreen}
                          options={{title: "Ausdauer", headerTitleStyle: globalStyles.title}}/>
            <Stack.Screen name={EAppPaths.AUSDAUER_EINTRAG} component={NeuerAusdauerEintragScreen}
                          options={{title: "Neuer Eintrag", headerTitleStyle: globalStyles.title}}></Stack.Screen>
            <Stack.Screen name={EAppPaths.AUSDAUER_STATISTIK} component={AusdauerStatistikScreen}
                          options={{title: "Ausdauer Statistik", headerTitleStyle: globalStyles.title}}></Stack.Screen>
        </Stack.Navigator>
    );
}


export default function Navigation() {
    return (
        <NavigationContainer>
            <Tab.Navigator initialRouteName={EAppPaths.HOME} screenOptions={({route}) => {
                return {
                    tabBarIcon: ({focused, size, color}) => {
                        let icon;
                        if (route.name === EAppPaths.KRAFTSPORT_STACK) icon = focused ? 'barbell' : 'barbell-outline';
                        if (route.name === EAppPaths.AUSDAUER_STACK) icon = focused ? 'body' : 'body-outline';
                        if (route.name === EAppPaths.HOME) icon = focused ? 'home' : 'home-outline';
                        // @ts-ignore
                        return <Icon.Ionicons name={icon} size={size} color={color}/>
                    },
                    tabBarActiveTintColor: highlight,
                    tabBarStyle: {
                        backgroundColor: secondaryBackground,
                    },
                    headerShown: false,
                }
            }}>
                <Tab.Screen
                    name={EAppPaths.KRAFTSPORT_STACK}
                    component={KraftsportStack}
                    options={
                        {
                            title: 'Kraftsport',
                            headerTitleStyle: globalStyles.title
                        }
                    }
                />
                <Tab.Screen
                    name={EAppPaths.HOME}
                    component={StartScreen}
                    options={{headerShown: false, title: ''}}
                />
                <Tab.Screen
                    name={EAppPaths.AUSDAUER_STACK}
                    component={AusdauerStack}
                    options={
                        {
                            title: 'Ausdauer',
                            headerTitleStyle: globalStyles.title
                        }
                    }
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
}