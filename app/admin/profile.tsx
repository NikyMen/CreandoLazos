import { useEffect, useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { TextInput as PaperTextInput, Button as PaperButton } from 'react-native-paper';
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
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md }}>
      <Text style={{ fontSize: 22, color: colors.secondary, marginBottom: spacing.sm }}>Perfil</Text>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: spacing.md }}>
        <PaperTextInput
          placeholder="usuario@dominio"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={{ flex: 1 }}
        />
        <PaperButton mode="contained" icon="account-search" onPress={loadProfile}>Ver perfil</PaperButton>
      </View>
      <Text>Nombre y apellido</Text>
      <PaperTextInput
        value={profile.nombreApellido || ''}
        onChangeText={(v) => setProfile((p) => ({ ...p, nombreApellido: v }))}
        mode="outlined"
        style={{ marginBottom: spacing.sm }}
      />
      <Text>CUIL/DNI</Text>
      <PaperTextInput
        value={profile.cuilDni || ''}
        onChangeText={(v) => setProfile((p) => ({ ...p, cuilDni: v }))}
        mode="outlined"
        style={{ marginBottom: spacing.sm }}
      />
      <Text>Obra social</Text>
      <PaperTextInput
        value={profile.obraSocial || ''}
        onChangeText={(v) => setProfile((p) => ({ ...p, obraSocial: v }))}
        mode="outlined"
        style={{ marginBottom: spacing.sm }}
      />
      <Text>Correo</Text>
      <PaperTextInput
        value={profile.correo || ''}
        onChangeText={(v) => setProfile((p) => ({ ...p, correo: v }))}
        keyboardType="email-address"
        autoCapitalize="none"
        mode="outlined"
        style={{ marginBottom: spacing.sm }}
      />
      <Text>Escuela</Text>
      <PaperTextInput
        value={profile.escuela || ''}
        onChangeText={(v) => setProfile((p) => ({ ...p, escuela: v }))}
        mode="outlined"
        style={{ marginBottom: spacing.sm }}
      />
      <Text>Diagnóstico</Text>
      <PaperTextInput
        value={profile.diagnostico || ''}
        onChangeText={(v) => setProfile((p) => ({ ...p, diagnostico: v }))}
        multiline
        mode="outlined"
        style={{ minHeight: 80, marginBottom: spacing.md }}
      />
      <PaperButton mode="contained" icon="content-save" onPress={saveProfile}>Guardar</PaperButton>

      <View style={{ height: spacing.lg }} />
      <Text style={{ fontSize: 18, marginBottom: spacing.sm }}>Crear nuevo paciente</Text>
      <Text>Email</Text>
      <PaperTextInput
        placeholder="paciente@dominio"
        value={newPatientEmail}
        onChangeText={setNewPatientEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        mode="outlined"
        style={{ marginBottom: spacing.sm }}
      />
      <Text>Contraseña</Text>
      <PaperTextInput
        placeholder="********"
        value={newPatientPassword}
        onChangeText={setNewPatientPassword}
        secureTextEntry
        mode="outlined"
        style={{ marginBottom: spacing.sm }}
      />
      <PaperButton mode="contained" icon="account-plus" onPress={createPatient}>Crear paciente</PaperButton>
      <View style={{ height: spacing.md }} />
    </ScrollView>
  );
}
