import { View, Text, Image, Linking, TouchableOpacity, StyleSheet } from 'react-native';
import { Button as PaperButton, IconButton } from 'react-native-paper';
import { useAuth } from '../../lib/auth';
import { Redirect } from 'expo-router';
import { colors, spacing, radius } from '../../lib/theme';
import { useRouter } from 'expo-router';

export default function AdminHome() {
  const { logout, isAuthenticated, role } = useAuth();
  const router = useRouter();

  const openURL = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'ADMIN') return <Redirect href="/patient/home" />;

  return (
    <View style={styles.container}>
      <PaperButton
        style={styles.logoutButton}
        mode="outlined"
        icon="logout"
        onPress={logout}
        contentStyle={{ height: 44 }}
      >
        Cerrar sesión
      </PaperButton>

      <View style={styles.mainContent}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
        <Text style={styles.title}>Panel Administrador</Text>
        <Text style={styles.description}>Desde aquí gestionarás horarios, estudios, informes y noticias.</Text>
        
        <View style={styles.gridContainer}>
          <PaperButton
            mode="contained"
            icon="bullhorn-outline"
            onPress={() => router.push('/admin/novedades')}
            style={styles.gridButton}
            contentStyle={styles.gridButtonContent}
            labelStyle={styles.gridButtonLabel}
          >
            Novedades
          </PaperButton>
          <PaperButton
            mode="contained"
            icon="file-document-outline"
            onPress={() => router.push('/admin/tracking')}
            style={styles.gridButton}
            contentStyle={styles.gridButtonContent}
            labelStyle={styles.gridButtonLabel}
          >
            Seguimiento
          </PaperButton>
          <PaperButton
            mode="contained"
            icon="clock-outline"
            onPress={() => router.push('/admin/horarios')}
            style={styles.gridButton}
            contentStyle={styles.gridButtonContent}
            labelStyle={styles.gridButtonLabel}
          >
            Horarios
          </PaperButton>
          <PaperButton
            mode="contained"
            icon="account"
            onPress={() => router.push('/admin/profile')}
            style={styles.gridButton}
            contentStyle={styles.gridButtonContent}
            labelStyle={styles.gridButtonLabel}
          >
            Buscar / Crear Paciente
          </PaperButton>
          <PaperButton
            mode="contained"
            icon="image-multiple"
            onPress={() => router.push('/admin/gallery')}
            style={styles.gridButton}
            contentStyle={styles.gridButtonContent}
            labelStyle={styles.gridButtonLabel}
          >
            Gestionar Galería
          </PaperButton>
        </View>
      </View>

      {/* Footer con Links */}
      <View style={styles.footer}>
        <IconButton
          icon="web"
          size={32}
          iconColor={colors.primary}
          onPress={() => openURL('https://creandolazos.ar/')}
        />
        
        <IconButton
          icon="instagram"
          size={32}
          iconColor="#E1306C"
          onPress={() => openURL('https://www.instagram.com/creandolazoscentro')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  logoutButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    zIndex: 10,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.secondary,
  },
  description: {
    textAlign: 'center',
    color: colors.text,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    width: '100%',
  },
  gridButton: {
    width: '46%',
    borderRadius: 12,
  },
  gridButtonContent: {
    height: 100,
    justifyContent: 'center',
  },
  gridButtonLabel: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border + '50',
  },
  webLink: {
    paddingVertical: 8,
  },
  webLinkText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

