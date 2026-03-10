import { Stack, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../lib/auth';
import { colors, paperTheme } from '../lib/theme';
import { Provider as PaperProvider } from 'react-native-paper';
import { View, Text, Image, TouchableOpacity, Platform } from 'react-native';

function HeaderTitle() {
  const router = useRouter();
  const { role } = useAuth();
  
  const handlePress = () => {
    if (role === 'ADMIN') {
      router.push('/admin/home');
    } else if (role === 'PATIENT') {
      router.push('/patient/home');
    } else {
      router.push('/login');
    }
  };

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
      activeOpacity={0.7}
    >
      <Image 
        source={require('../assets/icon.png')} 
        style={{ width: 32, height: 32, borderRadius: 4 }} 
      />
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
        Creando Lazos
      </Text>
    </TouchableOpacity>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <AuthProvider>
          <Stack screenOptions={{
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#fff',
            headerTitle: () => <HeaderTitle />,
            headerTitleAlign: 'left',
            contentStyle: { backgroundColor: colors.background },
          }}>
            <Stack.Screen name="login" options={{ 
              headerTitle: 'Iniciar sesión',
              headerShown: false 
            }} />
            <Stack.Screen name="admin/home" options={{ headerTitle: () => <HeaderTitle /> }} />
            <Stack.Screen name="admin/novedades" options={{ headerTitle: () => <HeaderTitle /> }} />
            <Stack.Screen name="patient/home" options={{ headerTitle: () => <HeaderTitle /> }} />
            <Stack.Screen name="patient/novedades" options={{ headerTitle: () => <HeaderTitle /> }} />
          </Stack>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
