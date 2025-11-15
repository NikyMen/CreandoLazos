import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, spacing, radius } from '../../lib/theme';
import { getProfileFor, setProfileFor, type ProfileData } from '../../lib/profile';
import { api } from '../../lib/api';

export default function AdminProfile() {
  const { isAuthenticated, role } = useAuth();
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState<ProfileData>({});
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [newPatientPassword, setNewPatientPassword] = useState('');

  useEffect(() => {
    setProfile({});
  }, []);

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'ADMIN') return <Redirect href="/patient/home" />;

  const loadProfile = async () => {
    const p = await getProfileFor(email.trim());
    setProfile(p);
  };

  const saveProfile = async () => {
    try {
      const targetEmail = email.trim() || profile.correo || '';
      if (!targetEmail) throw new Error('Correo requerido');
      await setProfileFor(targetEmail, profile);
      Alert.alert('Guardado', 'Perfil actualizado');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo guardar');
    }
  };

  const createPatient = async () => {
    try {
      const em = newPatientEmail.trim();
      const pw = newPatientPassword.trim();
      if (!em || !/[^@\s]+@[^@\s]+\.[^@\s]+/.test(em)) throw new Error('Correo inválido');
      if (pw.length < 6) throw new Error('Contraseña mínima 6 caracteres');
      await api.post('/auth/register', { email: em, password: pw, role: 'PATIENT' });
      Alert.alert('Paciente creado', em);
      setNewPatientEmail('');
      setNewPatientPassword('');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || e?.message || 'No se pudo crear');
    }
  };

  return (
    <View style={{ flex: 1, padding: spacing.md }}>
      <Text style={{ fontSize: 22, color: colors.secondary, marginBottom: spacing.sm }}>Perfil</Text>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: spacing.md }}>
        <TextInput
          placeholder="usuario@dominio"
          value={email}
          onChangeText={setEmail}
          style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 10, backgroundColor: '#fff' }}
        />
        <Button title="Ver perfil" onPress={loadProfile} color={colors.primary} />
      </View>
      <Text>Nombre y apellido</Text>
      <TextInput
        value={profile.nombreApellido || ''}
        onChangeText={(v) => setProfile((p) => ({ ...p, nombreApellido: v }))}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 10, marginBottom: spacing.sm, backgroundColor: '#fff' }}
      />
      <Text>CUIL/DNI</Text>
      <TextInput
        value={profile.cuilDni || ''}
        onChangeText={(v) => setProfile((p) => ({ ...p, cuilDni: v }))}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 10, marginBottom: spacing.sm, backgroundColor: '#fff' }}
      />
      <Text>Obra social</Text>
      <TextInput
        value={profile.obraSocial || ''}
        onChangeText={(v) => setProfile((p) => ({ ...p, obraSocial: v }))}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 10, marginBottom: spacing.sm, backgroundColor: '#fff' }}
      />
      <Text>Correo</Text>
      <TextInput
        value={profile.correo || ''}
        onChangeText={(v) => setProfile((p) => ({ ...p, correo: v }))}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 10, marginBottom: spacing.sm, backgroundColor: '#fff' }}
      />
      <Text>Escuela</Text>
      <TextInput
        value={profile.escuela || ''}
        onChangeText={(v) => setProfile((p) => ({ ...p, escuela: v }))}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 10, marginBottom: spacing.sm, backgroundColor: '#fff' }}
      />
      <Text>Diagnóstico</Text>
      <TextInput
        value={profile.diagnostico || ''}
        onChangeText={(v) => setProfile((p) => ({ ...p, diagnostico: v }))}
        multiline
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 10, minHeight: 80, marginBottom: spacing.md, backgroundColor: '#fff' }}
      />
      <Button title="Guardar" onPress={saveProfile} color={colors.primary} />

      <View style={{ height: spacing.lg }} />
      <Text style={{ fontSize: 18, marginBottom: spacing.sm }}>Crear nuevo paciente</Text>
      <Text>Email</Text>
      <TextInput
        placeholder="paciente@dominio"
        value={newPatientEmail}
        onChangeText={setNewPatientEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 10, backgroundColor: '#fff', marginBottom: spacing.sm }}
      />
      <Text>Contraseña</Text>
      <TextInput
        placeholder="********"
        value={newPatientPassword}
        onChangeText={setNewPatientPassword}
        secureTextEntry
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 10, backgroundColor: '#fff', marginBottom: spacing.sm }}
      />
      <Button title="Crear paciente" onPress={createPatient} color={colors.primary} />
    </View>
  );
}
