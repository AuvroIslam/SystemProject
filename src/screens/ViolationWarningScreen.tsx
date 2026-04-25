import React from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/pose';
import { useFocusStore, AVAILABLE_APPS } from '../store/focusStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AppBackground } from '../components/ui/AppBackground';
import { D, SP, R, SH } from '../theme/design';

type Props = NativeStackScreenProps<RootStackParamList, 'ViolationWarning'>;

export function ViolationWarningScreen({ navigation }: Props) {
  const { currentViolation, pendingSets, acknowledgeWarning } = useFocusStore();

  const violatedApp = currentViolation
    ? AVAILABLE_APPS.find((a) => a.packageName === currentViolation.packageName)?.label ?? 'a blocked app'
    : 'a blocked app';

  const handleGoBack = () => {
    acknowledgeWarning();
    navigation.goBack();
  };

  return (
    <AppBackground variant={1}>
    <SafeAreaView style={s.safe}>
      <View style={s.container}>

        {/* Illustration */}
        <Image
          source={require('../../Elements/SomeThingWrong.png')}
          style={s.illustration}
          resizeMode="contain"
        />

        {/* Badge */}
        <View style={s.alertBadge}>
          <Text style={s.alertBadgeText}>⚠️  VIOLATION DETECTED</Text>
        </View>

        <Text style={s.headline}>Focus Breach!</Text>
        <Text style={s.message}>
          You opened{' '}
          <Text style={s.appName}>{violatedApp}</Text>
          {'\n'}which is on your restricted list.
        </Text>

        {/* Stats card */}
        <Card style={s.statsCard} padding={SP.xl}>
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: D.danger }]}>+1</Text>
              <Text style={s.statLabel}>SET ADDED</Text>
            </View>
            <View style={s.divider} />
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: D.primary }]}>{pendingSets}</Text>
              <Text style={s.statLabel}>TOTAL DUE</Text>
            </View>
          </View>
        </Card>

        <Text style={s.note}>
          Each restricted app you open adds one more{'\n'}set to your exercise debt.
        </Text>

        <Button
          label="Go Back & Stay Focused"
          onPress={handleGoBack}
          variant="primary"
          fullWidth
        />
      </View>
    </SafeAreaView>
    </AppBackground>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: 'transparent' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SP.xxl, paddingBottom: SP.xxl },

  illustration: { width: 180, height: 160, marginBottom: SP.xl },

  alertBadge:    { backgroundColor: D.dangerLight, borderRadius: R.pill, paddingHorizontal: 18, paddingVertical: 8, marginBottom: SP.lg, borderWidth: 1.5, borderColor: D.danger },
  alertBadgeText:{ color: D.danger, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },

  headline: { fontSize: 30, fontWeight: '800', color: D.text, marginBottom: SP.sm, textAlign: 'center' },
  message:  { fontSize: 15, color: D.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: SP.xl },
  appName:  { color: D.primary, fontWeight: '700' },

  statsCard: { width: '100%', marginBottom: SP.xl },
  statsRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  statItem:  { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 38, fontWeight: '900' },
  statLabel: { fontSize: 10, fontWeight: '800', color: D.textMuted, letterSpacing: 1.5, marginTop: 4 },
  divider:   { width: 1, height: 44, backgroundColor: D.border },

  note: { color: D.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: SP.xl },
});
