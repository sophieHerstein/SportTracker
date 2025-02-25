import * as Icon from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import KraftsportScreen from "./screens/KraftsportScreen";
import UebungenScreen from "./screens/UebungenScreen";
import AusdauersportScreen from "./screens/AusdauersportScreen";
import NeuerKraftsportEintrag from "./components/NeuerKraftsportEintrag";
import NeuerAusdauerEintrag from "./components/NeuerAusdauerEintrag";
import AusdauerStatistikScreen from "./screens/AusdauerStatistikScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function KraftsportStack() {
    return (
        <Stack.Navigator screenOptions={{headerStyle: {backgroundColor: 'aliceblue'}}}>
            <Stack.Screen name="kraftsportScreen" component={KraftsportScreen} options={{title: "Kraftsport"}}/>
            <Stack.Screen name="kraftsportDetailScreen" component={NeuerKraftsportEintrag} options={{title: "Gruppe wählen"}}></Stack.Screen>
            <Stack.Screen name="kraftsportUebungenScreen" component={UebungenScreen} options={({route}) => {
                const gruppe = route.params.gruppe;
                return {title: gruppe}
            }}></Stack.Screen>
        </Stack.Navigator>
    );
}

function AusdauerStack() {
    return (
        <Stack.Navigator screenOptions={{headerStyle: {backgroundColor: 'aliceblue'}}}>
            <Stack.Screen name="ausdauerScreen" component={AusdauersportScreen} options={{title: "Ausdauer"}}/>
            <Stack.Screen name="neuerAusdauerEintragScreen" component={NeuerAusdauerEintrag} options={{title: "Neuer Eintrag"}}></Stack.Screen>
            <Stack.Screen name="ausdauerStatistikScreen" component={AusdauerStatistikScreen} options={{title: "Ausdauer Statistik"}}></Stack.Screen>
        </Stack.Navigator>
    );
}


export default function Navigation() {
    return (
        <NavigationContainer>
            <Tab.Navigator screenOptions={({route}) => {
                return {
                    tabBarIcon: ({focused, size, color}) => {
                        let icon;
                        if(route.name === 'kraftsport') icon = focused ? 'barbell' : 'barbell-outline';
                        if(route.name === 'ausdauer') icon = focused ? 'body' : 'body-outline';
                        return <Icon.Ionicons name={icon} size={size} color={color}/>
                    },
                    tabBarActiveTintColor: 'royalblue',
                    tabBarStyle: {
                        backgroundColor: 'aliceblue',
                    },
                    headerShown: false
                }
            }}>
                <Tab.Screen
                    name="kraftsport"
                    component={KraftsportStack}
                    options={
                        {
                            title: 'Kraftsport',
                        }
                    }
                />
                <Tab.Screen
                    name="ausdauer"
                    component={AusdauerStack}
                    options={
                        {
                            title: 'Ausdauer',
                        }
                    }
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
}