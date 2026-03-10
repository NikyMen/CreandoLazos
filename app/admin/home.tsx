import { View, Text, Image } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { useAuth } from '../../lib/auth';
import { Redirect } from 'expo-router';
import { colors, spacing } from '../../lib/theme';
import { useRouter } from 'expo-router';

export default function AdminHome() {
  const { logout, isAuthenticated, role } = useAuth();
  const router = useRouter();
  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'ADMIN') return <Redirect href="/patient/home" />;
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
      <Text style={{ fontSize: 20, marginBottom: 12, color: colors.secondary }}>Panel Administrador</Text>
      <Text>Desde aquí gestionarás horarios, estudios, informes y noticias.</Text>
      <View style={{ height: spacing.md }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' }}>
        <PaperButton
          mode="contained"
          icon="bullhorn-outline"
          onPress={() => router.push('/admin/novedades')}
          style={{ width: '46%', borderRadius: 12 }}
          contentStyle={{ height: 110, justifyContent: 'center' }}
          labelStyle={{ fontSize: 16 }}
        >
          Novedades
        </PaperButton>
        <PaperButton
          mode="contained"
          icon="file-document-outline"
          onPress={() => router.push('/admin/tracking')}
          style={{ width: '46%', borderRadius: 12 }}
          contentStyle={{ height: 110, justifyContent: 'center' }}
          labelStyle={{ fontSize: 16 }}
        >
          Seguimiento
        </PaperButton>
        <PaperButton
          mode="contained"
          icon="clock-outline"
          onPress={() => router.push('/admin/horarios')}
          style={{ width: '46%', borderRadius: 12 }}
          contentStyle={{ height: 110, justifyContent: 'center' }}
          labelStyle={{ fontSize: 16 }}
        >
          Horarios
        </PaperButton>
        <PaperButton
          mode="contained"
          icon="account"
          onPress={() => router.push('/admin/profile')}
          style={{ width: '46%', borderRadius: 12 }}
          contentStyle={{ height: 110, justifyContent: 'center' }}
          labelStyle={{ fontSize: 16 }}
        >
          Buscar paciente / crear paciente
        </PaperButton>
        <PaperButton
          mode="contained"
          icon="image-multiple"
          onPress={() => router.push('/admin/gallery')}
          style={{ width: '46%', borderRadius: 12 }}
          contentStyle={{ height: 110, justifyContent: 'center' }}
          labelStyle={{ fontSize: 16 }}
        >
          Gestionar Galería
        </PaperButton>
      </View>
    </View>
  );
}
