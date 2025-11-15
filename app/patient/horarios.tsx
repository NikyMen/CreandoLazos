import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
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
      <Text style={{ fontSize: 22, color: colors.accent, marginBottom: spacing.sm }}>Horarios</Text>
      {note ? <Text style={{ marginBottom: spacing.md }}>{note}</Text> : null}
      <ScrollView horizontal style={{ flex: 1 }}>
        <View style={{ minWidth: 800 }}>
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ width: 90, padding: 8 }}>
              <Text style={{ fontWeight: '600' }}>Hora</Text>
            </View>
            {dias.map((d) => (
              <View key={d} style={{ flex: 1, padding: 8 }}>
                <Text style={{ fontWeight: '600' }}>{d}</Text>
              </View>
            ))}
          </View>
          <ScrollView style={{ flex: 1 }}>
            {slots.map((t) => (
              <View key={t} style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <View style={{ width: 90, padding: 8 }}>
                  <Text>{t}</Text>
                </View>
                {dias.map((d) => {
                  const k = keyFor(d, t);
                  const val = cells[k] || '';
                  return (
                    <View key={k} style={{ flex: 1, padding: 8 }}>
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
