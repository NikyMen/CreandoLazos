import { View, Text, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { Button as PaperButton } from 'react-native-paper';
import { useAuth } from '../../lib/auth';
import { Redirect } from 'expo-router';
import { colors, spacing } from '../../lib/theme';
import { useRouter } from 'expo-router';
import { getProfileFor } from '../../lib/profile';

export default function PatientHome() {
  const { logout, isAuthenticated, role, user } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  useEffect(() => {
    (async () => {
      const email = user?.email;
      if (!email) { setDisplayName(''); return; }
      try {
        const p = await getProfileFor(email);
        const name = (p?.nombreApellido || '').trim();
        setDisplayName(name || email.split('@')[0]);
      } catch {
        setDisplayName(email.split('@')[0]);
      }
    })();
  }, [user?.email]);
  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'PATIENT') return <Redirect href="/admin/home" />;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Image source={require('../../assets/icon.png')} style={{ width: 96, height: 96, marginBottom: spacing.sm }} />
      <Text style={{ fontSize: 20, marginBottom: 6, color: colors.accent }}>Hola, {displayName || 'Paciente'}</Text>
      <Text style={{ marginBottom: 12 }}>Bienvenido</Text>
      <View style={{ height: 12 }} />
      <PaperButton
        mode="contained"
        icon="calendar"
        onPress={() => router.push('/patient/calendar')}
        style={{ width: '90%', alignSelf: 'center', borderRadius: 12 }}
        contentStyle={{ height: 60 }}
        labelStyle={{ fontSize: 18 }}
      >
        Ver calendario
      </PaperButton>
      <View style={{ height: 8 }} />
      <PaperButton
        mode="contained"
        icon="file-document-outline"
        onPress={() => router.push('/patient/studies')}
        style={{ width: '90%', alignSelf: 'center', borderRadius: 12 }}
        contentStyle={{ height: 60 }}
        labelStyle={{ fontSize: 18 }}
      >
        Estudios / Certificados
      </PaperButton>
      <View style={{ height: 8 }} />
      <PaperButton
        mode="contained"
        icon="clock-outline"
        onPress={() => router.push('/patient/horarios')}
        style={{ width: '90%', alignSelf: 'center', borderRadius: 12 }}
        contentStyle={{ height: 60 }}
        labelStyle={{ fontSize: 18 }}
      >
        Horarios
      </PaperButton>
      <View style={{ height: 8 }} />
      <PaperButton
        mode="contained"
        icon="account"
        onPress={() => router.push('/patient/profile')}
        style={{ width: '90%', alignSelf: 'center', borderRadius: 12 }}
        contentStyle={{ height: 60 }}
        labelStyle={{ fontSize: 18 }}
      >
        Perfil
      </PaperButton>
      <PaperButton
        style={{ marginTop: 8, width: '90%', alignSelf: 'center', borderRadius: 12 }}
        mode="outlined"
        icon="logout"
        onPress={logout}
        contentStyle={{ height: 60 }}
        labelStyle={{ fontSize: 18 }}
      >
        Cerrar sesión
      </PaperButton>
    </View>
  );
}
