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
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md }}>
      <PaperButton
        style={{ position: 'absolute', top: spacing.md, left: spacing.md }}
        mode="outlined"
        icon="logout"
        onPress={logout}
        contentStyle={{ height: 44 }}
      >
        Cerrar sesión
      </PaperButton>
      <Image source={require('../../assets/icon.png')} style={{ width: 96, height: 96, marginBottom: spacing.sm }} />
      <Text style={{ fontSize: 20, marginBottom: 6, color: colors.accent }}>Hola, {displayName || 'Paciente'}</Text>
      <Text style={{ marginBottom: 12 }}>Bienvenido</Text>
      <View style={{ height: spacing.md }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' }}>
        <PaperButton
          mode="contained"
          icon="bullhorn-outline"
          onPress={() => router.push('/patient/novedades')}
          style={{ width: '46%', borderRadius: 12 }}
          contentStyle={{ height: 110, justifyContent: 'center' }}
          labelStyle={{ fontSize: 16 }}
        >
          Novedades
        </PaperButton>
        <PaperButton
          mode="contained"
          icon="file-document-outline"
          onPress={() => router.push('/patient/tracking')}
          style={{ width: '46%', borderRadius: 12 }}
          contentStyle={{ height: 110, justifyContent: 'center' }}
          labelStyle={{ fontSize: 16 }}
        >
          Seguimiento
        </PaperButton>
        <PaperButton
          mode="contained"
          icon="clock-outline"
          onPress={() => router.push('/patient/horarios')}
          style={{ width: '46%', borderRadius: 12 }}
          contentStyle={{ height: 110, justifyContent: 'center' }}
          labelStyle={{ fontSize: 16 }}
        >
          Horarios
        </PaperButton>
        <PaperButton
          mode="contained"
          icon="account"
          onPress={() => router.push('/patient/profile')}
          style={{ width: '46%', borderRadius: 12 }}
          contentStyle={{ height: 110, justifyContent: 'center' }}
          labelStyle={{ fontSize: 16 }}
        >
          Perfil
        </PaperButton>
        <PaperButton
          mode="contained"
          icon="image-multiple"
          onPress={() => router.push('/patient/gallery')}
          style={{ width: '46%', borderRadius: 12 }}
          contentStyle={{ height: 110, justifyContent: 'center' }}
          labelStyle={{ fontSize: 16 }}
        >
          Galería
        </PaperButton>
      </View>
    </View>
  );
}
