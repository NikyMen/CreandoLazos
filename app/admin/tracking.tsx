import { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Alert, Platform, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { TextInput as PaperTextInput, Button as PaperButton, IconButton, Card, Avatar, Divider, Surface, Searchbar, List } from 'react-native-paper';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, spacing, radius } from '../../lib/theme';
import { addStudy, deleteStudy, getStudies, type Study, uploadPdfStudy, getRemoteStudies, type RemoteStudy, deleteRemoteStudy } from '../../lib/studies';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { absoluteUrl } from '../../lib/api';

export default function AdminTracking() {
  const { isAuthenticated, role } = useAuth();
  const router = useRouter();
  const [studies, setStudies] = useState<Study[]>([]);
  const [remoteStudies, setRemoteStudies] = useState<RemoteStudy[]>([]);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [forEmail, setForEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const list = await getStudies();
    setStudies(list);
    try {
      const remote = await getRemoteStudies();
      setRemoteStudies(remote);
    } catch (e: any) {
      setRemoteError(e?.message || 'No se pudo cargar los estudios del backend');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'ADMIN') return <Redirect href="/patient/home" />;

  const isValidEmail = (email: string) => /[^@\s]+@[^@\s]+\.[^@\s]+/.test(email);

  const handleUpload = async (asset: any) => {
    const name = asset?.name || '';
    const uri = asset?.uri || '';
    const mimeType = asset?.mimeType || null;
    const base64 = asset?.base64 || '';
    
    const mt = mimeType || guessMimeTypeByName(name);
    const emailRaw = forEmail.trim();
    const email = emailRaw ? (isValidEmail(emailRaw) ? emailRaw : undefined) : undefined;
    
    if (emailRaw && !email) {
      Alert.alert('Email inválido', 'Usa un correo válido.');
      return;
    }

    try {
      setLoading(true);
      if (mt === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
        const created = await uploadPdfStudy(name, base64, email);
        setRemoteStudies((prev) => [created, ...prev]);
        Alert.alert('Éxito', 'PDF guardado en la nube');
      } else {
        const dataUrl = `data:${mt};base64,${base64}`;
        const created = await addStudy({ name, mimeType: mt, dataUrl, forEmail: email });
        setStudies((prev) => [created, ...prev]);
        Alert.alert('Éxito', 'Estudio guardado localmente');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo subir el estudio');
    } finally {
      setLoading(false);
    }
  };

  const pickWeb = async () => {
    const input = inputRef.current;
    if (input) input.click();
  };

  const onWebFilesSelected = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const files = ev.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      await handleUpload({ name: file.name, mimeType: file.type, base64 });
      ev.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const pickNative = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
    if (res.canceled) return;
    const asset = res.assets[0];
    const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
    await handleUpload({ ...asset, base64 });
  };

  const guessMimeTypeByName = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.doc')) return 'application/msword';
    if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (lower.endsWith('.xls')) return 'application/vnd.ms-excel';
    if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    return 'application/octet-stream';
  };

  const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

  const renderStudyItem = ({ item, isRemote }: { item: any; isRemote: boolean }) => (
    <Card style={styles.studyCard} mode="outlined">
      <Card.Title
        title={item.name}
        subtitle={item.forEmail ? `Para: ${item.forEmail}` : 'Sin asignar'}
        left={(props) => (
          <Avatar.Icon
            {...props}
            icon={item.name.toLowerCase().endsWith('.pdf') ? 'file-pdf-box' : 'file-document'}
            style={{ backgroundColor: isRemote ? colors.primary : '#E5E5EA' }}
            color={isRemote ? '#fff' : colors.secondary}
          />
        )}
        right={(props) => (
          <View style={styles.cardActions}>
            <IconButton icon="eye-outline" onPress={() => isRemote ? router.push({ pathname: '/patient/study', params: { url: item.fileUrl, name: item.name } }) : router.push({ pathname: '/patient/study', params: { id: item.id } })} />
            <IconButton icon="delete-outline" iconColor={colors.accent} onPress={() => isRemote ? deleteRemoteStudy(item.id).then(loadData) : deleteStudy(item.id).then(loadData)} />
          </View>
        )}
      />
    </Card>
  );

  const filteredRemote = remoteStudies.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.forEmail || '').toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredLocal = studies.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.forEmail || '').toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Seguimiento</Text>
        <Text style={styles.subtitle}>Gestión de certificados y estudios médicos</Text>
      </View>

      <Surface style={styles.uploadSection} elevation={1}>
        <PaperTextInput
          label="Asignar a paciente (email)"
          value={forEmail}
          onChangeText={setForEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.emailInput}
          outlineStyle={{ borderRadius: 12 }}
          left={<PaperTextInput.Icon icon="account-search" />}
        />
        <View style={styles.uploadButtons}>
          <PaperButton
            mode="contained"
            icon="plus"
            onPress={Platform.OS === 'web' ? pickWeb : pickNative}
            style={styles.mainButton}
            contentStyle={{ height: 48 }}
            loading={loading}
          >
            Subir Nuevo Archivo
          </PaperButton>
          {Platform.OS === 'web' && (
            <input ref={inputRef as any} type="file" style={{ display: 'none' }} onChange={onWebFilesSelected} />
          )}
        </View>
      </Surface>

      <Searchbar
        placeholder="Buscar por nombre o email..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        inputStyle={{ fontSize: 14 }}
      />

      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>En la Nube (PDF)</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>{filteredRemote.length}</Text></View>
        </View>
        {filteredRemote.length > 0 ? (
          filteredRemote.map(item => renderStudyItem({ item, isRemote: true }))
        ) : (
          <Text style={styles.emptyText}>No hay archivos en la nube</Text>
        )}

        <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
          <Text style={styles.sectionTitle}>Locales (Otros formatos)</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>{filteredLocal.length}</Text></View>
        </View>
        {filteredLocal.length > 0 ? (
          filteredLocal.map(item => renderStudyItem({ item, isRemote: false }))
        ) : (
          <Text style={styles.emptyText}>No hay archivos locales</Text>
        )}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // iOS background
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 2,
  },
  uploadSection: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emailInput: {
    backgroundColor: '#fff',
    marginBottom: spacing.md,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  mainButton: {
    flex: 1,
    borderRadius: 12,
  },
  searchBar: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 0,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8E8E93',
  },
  studyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
    color: '#8E8E93',
    fontSize: 14,
  },
});
