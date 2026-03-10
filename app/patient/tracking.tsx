import { useEffect, useState } from 'react';
import { View, Text, FlatList, Alert, Platform, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, spacing, radius } from '../../lib/theme';
import { getStudiesFor, type Study, getRemoteStudies, type RemoteStudy } from '../../lib/studies';
import * as FileSystem from 'expo-file-system';
import { absoluteUrl } from '../../lib/api';
import { Card, Avatar, IconButton, Divider, Surface, Searchbar, List } from 'react-native-paper';

export default function PatientTracking() {
  const { isAuthenticated, role, user } = useAuth();
  const router = useRouter();
  const [studies, setStudies] = useState<Study[]>([]);
  const [remoteStudies, setRemoteStudies] = useState<RemoteStudy[]>([]);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user?.email]);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getStudiesFor(user?.email);
      setStudies(list);
      const remote = await getRemoteStudies(user?.email);
      setRemoteStudies(remote);
    } catch (e: any) {
      setRemoteError(e?.message || 'No se pudo cargar los estudios');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'PATIENT') return <Redirect href="/admin/home" />;

  const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

  const downloadRemote = async (study: RemoteStudy) => {
    try {
      if (Platform.OS === 'web') {
        const a = document.createElement('a');
        a.href = absoluteUrl(study.fileUrl);
        a.download = sanitize(study.name || 'archivo');
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
      const filename = sanitize(study.name || 'archivo.pdf');
      const fileUri = ((FileSystem as any).documentDirectory || '') + filename;
      const downloadRes = await FileSystem.downloadAsync(absoluteUrl(study.fileUrl), fileUri);
      Alert.alert('Descarga completa', `Guardado en: ${downloadRes.uri}`);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo descargar');
    }
  };

  const downloadLocal = async (study: Study) => {
    try {
      if (Platform.OS === 'web') {
        const a = document.createElement('a');
        a.href = study.dataUrl;
        a.download = sanitize(study.name || 'archivo');
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
      const ext = study.mimeType === 'application/pdf' ? '.pdf' : '';
      const filename = sanitize(study.name || 'archivo') + ext;
      const fileUri = ((FileSystem as any).documentDirectory || '') + filename;
      const base64 = (study.dataUrl.split(',')[1] || '');
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: 'base64' });
      Alert.alert('Descarga completa', `Guardado en: ${fileUri}`);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo descargar');
    }
  };

  const renderStudyItem = ({ item, isRemote }: { item: any; isRemote: boolean }) => (
    <Card style={styles.studyCard} mode="elevated" elevation={1}>
      <Card.Title
        title={item.name}
        subtitle={isRemote ? 'Documento en la nube' : 'Documento local'}
        left={(props) => (
          <Avatar.Icon
            {...props}
            icon={item.name.toLowerCase().endsWith('.pdf') ? 'file-pdf-box' : 'file-document'}
            style={{ backgroundColor: isRemote ? colors.primary : '#F2F2F7' }}
            color={isRemote ? '#fff' : colors.primary}
          />
        )}
        right={(props) => (
          <View style={styles.cardActions}>
            <IconButton icon="eye-outline" onPress={() => isRemote ? router.push({ pathname: '/patient/study', params: { url: item.fileUrl, name: item.name } }) : router.push({ pathname: '/patient/study', params: { id: item.id } })} />
            <IconButton icon="download-outline" onPress={() => isRemote ? downloadRemote(item) : downloadLocal(item)} />
          </View>
        )}
      />
    </Card>
  );

  const filteredRemote = remoteStudies.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredLocal = studies.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Seguimiento</Text>
        <Text style={styles.subtitle}>Consulta y descarga tus documentos</Text>
      </View>

      <Searchbar
        placeholder="Buscar por nombre..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        inputStyle={{ fontSize: 14 }}
      />

      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.statusText}>Cargando documentos...</Text>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Certificados y PDFs</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>{filteredRemote.length}</Text></View>
            </View>
            {filteredRemote.length > 0 ? (
              filteredRemote.map(item => renderStudyItem({ item, isRemote: true }))
            ) : (
              <Text style={styles.emptyText}>No hay certificados disponibles</Text>
            )}

            <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
              <Text style={styles.sectionTitle}>Otros Documentos</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>{filteredLocal.length}</Text></View>
            </View>
            {filteredLocal.length > 0 ? (
              filteredLocal.map(item => renderStudyItem({ item, isRemote: false }))
            ) : (
              <Text style={styles.emptyText}>No hay otros documentos disponibles</Text>
            )}
          </>
        )}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
  searchBar: {
    margin: spacing.md,
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
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#8E8E93',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
    color: '#8E8E93',
    fontSize: 14,
  },
});
