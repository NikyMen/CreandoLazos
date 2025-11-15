import { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, Button, Alert } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, spacing, radius } from '../../lib/theme';
import { dias, timeSlots, getHorariosFor, setHorarioCellFor, setHorarioNoteFor, setHorariosFor, keyFor, type Dia } from '../../lib/horarios';
import { colors as c } from '../../lib/theme';

export default function AdminHorarios() {
  const { isAuthenticated, role } = useAuth();
  const router = useRouter();
  const [note, setNote] = useState('');
  const [cells, setCells] = useState<Record<string, string>>({});
  const [email, setEmail] = useState('');

  useEffect(() => {
    (async () => {
      const data = await getHorariosFor(undefined);
      setNote(data.note || '');
      setCells(data.cells || {});
    })();
  }, []);

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'ADMIN') return <Redirect href="/patient/home" />;

  const slots = useMemo(() => timeSlots(8, 18), []);

  const onChangeCell = (day: Dia, time: string, value: string) => {
    const k = keyFor(day, time);
    setCells((prev) => ({ ...prev, [k]: value }));
  };

  const onBlurCell = async (day: Dia, time: string) => {
    const k = keyFor(day, time);
    const v = cells[k] || '';
    await setHorarioCellFor(email.trim() || undefined, day, time, v);
  };

  const onBlurNote = async () => {
    await setHorarioNoteFor(email.trim() || undefined, note);
  };

  return (
    <View style={{ flex: 1, padding: spacing.md }}>
      <Text style={{ fontSize: 22, color: colors.secondary, marginBottom: spacing.sm }}>Horarios</Text>
      <Text style={{ marginBottom: 4 }}>Paciente (email para asignar)</Text>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: spacing.sm }}>
        <TextInput
          placeholder="usuario@dominio"
          value={email}
          onChangeText={setEmail}
          style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 10, backgroundColor: '#fff' }}
        />
        <Button
          title="Ver horario"
          onPress={async () => {
            const data = await getHorariosFor(email.trim() || undefined);
            setNote(data.note || '');
            setCells(data.cells || {});
          }}
          color={colors.primary}
        />
      </View>
      <TextInput
        placeholder="Notas generales"
        value={note}
        onChangeText={setNote}
        onBlur={onBlurNote}
        multiline
        style={{ borderWidth: 1, borderColor: colors.border, padding: spacing.sm, borderRadius: radius.md, marginBottom: spacing.md, minHeight: 80, backgroundColor: '#fff' }}
      />
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.md }}>
        <Button
          title="Guardar"
          onPress={async () => {
            try {
              await setHorariosFor(email.trim() || undefined, { note, cells });
              Alert.alert('Guardado', 'Horarios y nota guardados');
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'No se pudo guardar');
            }
          }}
          color={colors.primary}
        />
      </View>
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
                    <View key={k} style={{ flex: 1, padding: 6 }}>
                      <TextInput
                        value={val}
                        onChangeText={(v) => onChangeCell(d, t, v)}
                        onBlur={() => onBlurCell(d, t)}
                        placeholder=""
                        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 8, backgroundColor: '#fff' }}
                      />
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
