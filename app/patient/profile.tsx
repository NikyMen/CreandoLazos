import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, spacing } from '../../lib/theme';
import { getProfileFor, type ProfileData } from '../../lib/profile';

export default function PatientProfile() {
  const { isAuthenticated, role, user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({});

  useEffect(() => {
    (async () => {
      const p = await getProfileFor(user?.email);
      setProfile(p);
    })();
  }, [user?.email]);

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'PATIENT') return <Redirect href="/admin/home" />;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md }}>
      <Text style={{ fontSize: 22, color: colors.accent, marginBottom: spacing.sm }}>Perfil</Text>
      <Text style={{ marginBottom: spacing.sm }}>Nombre y apellido: {profile.nombreApellido || ''}</Text>
      <Text style={{ marginBottom: spacing.sm }}>CUIL/DNI: {profile.cuilDni || ''}</Text>
      <Text style={{ marginBottom: spacing.sm }}>Obra social: {profile.obraSocial || ''}</Text>
      <Text style={{ marginBottom: spacing.sm }}>Correo: {profile.correo || ''}</Text>
      <Text style={{ marginBottom: spacing.sm }}>Escuela: {profile.escuela || ''}</Text>
      <Text style={{ marginBottom: spacing.sm }}>Diagnóstico: {profile.diagnostico || ''}</Text>
      <View style={{ height: spacing.md }} />
    </ScrollView>
  );
}
