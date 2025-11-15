import { View, Text } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { useAuth } from '../../lib/auth';
import { Redirect } from 'expo-router';
import { colors } from '../../lib/theme';
import { useRouter } from 'expo-router';

export default function PatientHome() {
  const { logout, isAuthenticated, role } = useAuth();
  const router = useRouter();
  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'PATIENT') return <Redirect href="/admin/home" />;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 12, color: colors.accent }}>Panel Paciente</Text>
      <Text>Consulta tus horarios, estudios, informes y noticias.</Text>
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
        Estudios
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
