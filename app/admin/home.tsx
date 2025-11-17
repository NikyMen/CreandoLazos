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
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Image source={require('../../assets/icon.png')} style={{ width: 96, height: 96, marginBottom: spacing.sm }} />
      <Text style={{ fontSize: 20, marginBottom: 12, color: colors.secondary }}>Panel Administrador</Text>
      <Text>Desde aquí gestionarás horarios, estudios, informes y noticias.</Text>
      <View style={{ height: 12 }} />
      <PaperButton
        mode="contained"
        icon="calendar"
        onPress={() => router.push('/admin/calendar')}
        style={{ width: '90%', alignSelf: 'center', borderRadius: 12 }}
        contentStyle={{ height: 60 }}
        labelStyle={{ fontSize: 18 }}
      >
        Agendar cita
      </PaperButton>
      <View style={{ height: 8 }} />
      <PaperButton
        mode="contained"
        icon="file-document-outline"
        onPress={() => router.push('/admin/studies')}
        style={{ width: '90%', alignSelf: 'center', borderRadius: 12 }}
        contentStyle={{ height: 60 }}
        labelStyle={{ fontSize: 18 }}
      >
        Subir estudios
      </PaperButton>
      <View style={{ height: 8 }} />
      <PaperButton
        mode="contained"
        icon="clock-outline"
        onPress={() => router.push('/admin/horarios')}
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
        onPress={() => router.push('/admin/profile')}
        style={{ width: '90%', alignSelf: 'center', borderRadius: 12 }}
        contentStyle={{ height: 60 }}
        labelStyle={{ fontSize: 18 }}
      >
        Buscar paciente / crear paciente
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
