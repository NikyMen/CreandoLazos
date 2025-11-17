import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Divider } from 'react-native-paper';
import { Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, spacing } from '../../lib/theme';
import { dias, timeSlots, getHorariosFor, keyFor } from '../../lib/horarios';

export default function PatientHorarios() {
  const { isAuthenticated, role, user } = useAuth();
  const [note, setNote] = useState('');
  const [cells, setCells] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const data = await getHorariosFor(user?.email);
      setNote(data.note || '');
      setCells(data.cells || {});
    })();
  }, [user?.email]);

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'PATIENT') return <Redirect href="/admin/home" />;

  const slots = useMemo(() => timeSlots(8, 18), []);

  return (
    <View style={{ flex: 1, padding: spacing.md }}>
      <Text style={{ fontSize: 22, color: colors.accent, marginBottom: spacing.xs }}>Horarios</Text>
      {note ? <Text style={{ marginBottom: spacing.sm, color: colors.muted }}>{note}</Text> : null}
      <ScrollView horizontal style={{ flex: 1 }}>
        <View style={{ minWidth: 900 }}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: 100, padding: 10, backgroundColor: colors.secondary }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Hora</Text>
            </View>
            {dias.map((d) => (
              <View key={d} style={{ flex: 1, padding: 10, backgroundColor: colors.secondary }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{d}</Text>
              </View>
            ))}
          </View>
          <Divider style={{ backgroundColor: colors.border }} />
          <ScrollView style={{ flex: 1 }}>
            {slots.map((t, idx) => (
              <View key={t} style={{ flexDirection: 'row', backgroundColor: idx % 2 === 0 ? '#f6f8fb' : '#ffffff' }}>
                <View style={{ width: 100, padding: 10 }}>
                  <Text style={{ fontWeight: '600' }}>{t}</Text>
                </View>
                {dias.map((d) => {
                  const k = keyFor(d, t);
                  const val = cells[k] || '';
                  return (
                    <View key={k} style={{ flex: 1, padding: 10 }}>
                      <Text style={{ color: colors.text }}>{val}</Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}
