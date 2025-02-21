import * as Icon from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import KraftsportScreen from "./screens/KraftsportScreen";
import AusdauersportScreen from "./screens/AusdauersportScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// function KraftsportStack() {
//     return (
//         <Stack.Navigator screenOptions={{headerStyle: {backgroundColor: 'aliceblue'}}}>
//             <Stack.Screen name="kraftsportScreen" component={KraftsportScreen} options={{title: "Kraftsport"}}/>
//             <Stack.Screen name="kraftsportDetailScreen" component={KraftsportDetailScreen} options={({route}) => {
//                 const {first, last} = route.params.friend.name;
//                 return {title: first + ' ' + last}
//             }}></Stack.Screen>
//         </Stack.Navigator>
//     );
// }
//
// function AusdauerStack() {
//     return (
//         <Stack.Navigator screenOptions={{headerStyle: {backgroundColor: 'aliceblue'}}}>
//             <Stack.Screen name="ausdauersportScreen" component={AusdauersportScreen} options={{title: "Ausdauer"}}/>
//             <Stack.Screen name="ausdauersportDetailScreen" component={AusdauerDetailScreen} options={({route}) => {
//                 const {first, last} = route.params.friend.name;
//                 return {title: first + ' ' + last}
//             }}></Stack.Screen>
//         </Stack.Navigator>
//     );
// }

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
                    component={KraftsportScreen}
                    options={
                        {
                            title: 'Kraftsport',
                        }
                    }
                />
                <Tab.Screen
                    name="ausdauer"
                    component={AusdauersportScreen}
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