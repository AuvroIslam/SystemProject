import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types/pose';
import { C } from './theme/atelier';
import { HomeScreen } from './screens/HomeScreen';
import { ExerciseScreen } from './screens/ExerciseScreen';
import { SummaryScreen } from './screens/SummaryScreen';
import { FocusSetupScreen } from './screens/FocusSetupScreen';
import { FocusActiveScreen } from './screens/FocusActiveScreen';
import { ViolationWarningScreen } from './screens/ViolationWarningScreen';
import { PunishExerciseScreen } from './screens/PunishExerciseScreen';
import { DebtPayScreen } from './screens/DebtPayScreen';
import { FocusSummaryScreen } from './screens/FocusSummaryScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: C.surface },
        }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="FocusSetup" component={FocusSetupScreen} />
        <Stack.Screen name="FocusActive" component={FocusActiveScreen} />
        <Stack.Screen name="ViolationWarning" component={ViolationWarningScreen} />
        <Stack.Screen name="PunishExercise" component={PunishExerciseScreen} />
        <Stack.Screen name="DebtPay" component={DebtPayScreen} />
        <Stack.Screen name="FocusSummary" component={FocusSummaryScreen} />
        <Stack.Screen name="Exercise" component={ExerciseScreen} />
        <Stack.Screen name="Summary" component={SummaryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
