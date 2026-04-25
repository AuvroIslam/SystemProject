import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from './types/pose';
import { D } from './theme/design';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ExerciseScreen } from './screens/ExerciseScreen';
import { SummaryScreen } from './screens/SummaryScreen';
import { FocusSetupScreen } from './screens/FocusSetupScreen';
import { FocusActiveScreen } from './screens/FocusActiveScreen';
import { ViolationWarningScreen } from './screens/ViolationWarningScreen';
import { PunishExerciseScreen } from './screens/PunishExerciseScreen';
import { DebtPayScreen } from './screens/DebtPayScreen';
import { FocusSummaryScreen } from './screens/FocusSummaryScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { FitnessScreen } from './screens/FitnessScreen';
import { AskAIScreen } from './screens/AskAIScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { PlanSelectionScreen } from './screens/PlanSelectionScreen';
import { InstructorPlanSetupScreen } from './screens/InstructorPlanSetupScreen';
import { ExercisePlanScreen } from './screens/ExercisePlanScreen';
import { DailyWorkoutScreen } from './screens/DailyWorkoutScreen';
import { AIPlanChatScreen } from './screens/AIPlanChatScreen';
import { initializeAuth } from './services/authService';
import { useAuthStore } from './store/authStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return unsubscribe;
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: D.bg },
        }}>
        {isInitializing ? (
          <Stack.Screen name="Auth" component={AuthBootstrapScreen} />
        ) : user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="FocusSetup" component={FocusSetupScreen} />
            <Stack.Screen name="FocusActive" component={FocusActiveScreen} />
            <Stack.Screen name="ViolationWarning" component={ViolationWarningScreen} />
            <Stack.Screen name="PunishExercise" component={PunishExerciseScreen} />
            <Stack.Screen name="DebtPay" component={DebtPayScreen} />
            <Stack.Screen name="FocusSummary" component={FocusSummaryScreen} />
            <Stack.Screen name="Exercise" component={ExerciseScreen} />
            <Stack.Screen name="Summary" component={SummaryScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="Fitness" component={FitnessScreen} />
            <Stack.Screen name="AskAI" component={AskAIScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="PlanSelection" component={PlanSelectionScreen} />
            <Stack.Screen name="InstructorPlanSetup" component={InstructorPlanSetupScreen} />
            <Stack.Screen name="ExercisePlan" component={ExercisePlanScreen} />
            <Stack.Screen name="DailyWorkout" component={DailyWorkoutScreen} />
            <Stack.Screen name="AIPlanChat" component={AIPlanChatScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AuthBootstrapScreen() {
  return (
    <View style={s.boot}>
      <Text style={s.bootTitle}>FitCounter</Text>
      <Text style={s.bootText}>Preparing authentication...</Text>
    </View>
  );
}

const s = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: D.bg,
    padding: 24,
  },
  bootTitle: {
    color: D.primary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  bootText: {
    color: D.textMuted,
    fontSize: 14,
  },
});
