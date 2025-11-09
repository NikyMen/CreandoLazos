import { View, Text, Button } from 'react-native';
import { useAuth } from '../../lib/auth';
import { Redirect } from 'expo-router';
import { colors } from '../../lib/theme';

export default function PatientHome() {
  const { logout, isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'PATIENT') return <Redirect href="/admin/home" />;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 12, color: colors.accent }}>Panel Paciente</Text>
      <Text>Consulta tus horarios, estudios, informes y noticias.</Text>
      <Button title="Cerrar sesión" onPress={logout} />
    </View>
  );
}