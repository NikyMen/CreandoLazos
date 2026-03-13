import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Alert, FlatList, Image, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { TextInput as PaperTextInput, Button as PaperButton, Divider, Portal, Modal, List, Card, IconButton, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, spacing, radius } from '../../lib/theme';
import { listProfileEmails } from '../../lib/profile';
import { getGalleryFor, uploadMediaToGallery, deleteGalleryItem, type GalleryItem, testCloudinaryConnection } from '../../lib/gallery';
import { api } from '../../lib/api';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function AdminGallery() {
  const { isAuthenticated, role, user: authUser } = useAuth();
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [knownPatients, setKnownPatients] = useState<{ email: string; nombreApellido?: string }[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ email: string; nombreApellido?: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Status de conexión
  const [isCheckingConfig, setIsCheckingConfig] = useState(false);
  const [configStatus, setConfigStatus] = useState<'idle' | 'ok' | 'error'>('idle');

  // Upload state
  const [newImageTitle, setNewImageTitle] = useState('');
  const [newImageType, setNewImageType] = useState<GalleryItem['type']>('activity');
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');

  // 0. Esperar a que el auth esté listo
  useEffect(() => {
    const timer = setTimeout(() => setIsAuthReady(true), 500);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  // 1. Carga inicial de pacientes
  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get('/profiles');
        const data = Array.isArray(res.data) ? res.data : (res.data.profiles || res.data.users || res.data.patients || res.data.data);
        
        if (Array.isArray(data)) {
          const mapped = data.map((p: any) => ({
            email: String(p.email || p.correo || p.user?.email || (typeof p === 'string' ? p : '')).toLowerCase(),
            nombreApellido: String(p.nombreApellido || p.nombre_apellido || p.nombre || p.name || '')
          })).filter(p => p.email);
          setKnownPatients(mapped);
        } else {
          const localEmails = await listProfileEmails();
          setKnownPatients(localEmails.map(em => ({ email: String(em).toLowerCase(), nombreApellido: '' })));
        }
      } catch (e) {
        console.error('Error cargando pacientes:', e);
        try {
          const localEmails = await listProfileEmails();
          setKnownPatients(localEmails.map(em => ({ email: String(em).toLowerCase(), nombreApellido: '' })));
        } catch (e2) {
          setKnownPatients([]);
        }
      }
    };
    init();
    checkConfigSilently();
  }, []);

  // 2. Cargar galería cuando cambia el email seleccionado
  useEffect(() => {
    if (selectedEmail) {
      loadGallery(selectedEmail);
    }
  }, [selectedEmail]);

  const checkConfigSilently = async () => {
    const ok = await testCloudinaryConnection();
    setConfigStatus(ok ? 'ok' : 'error');
  };

  const checkConfig = async () => {
    setIsCheckingConfig(true);
    const ok = await testCloudinaryConnection();
    setConfigStatus(ok ? 'ok' : 'error');
    setIsCheckingConfig(false);
    
    if (ok) {
      Alert.alert('Éxito', 'Conexión con Cloudinary establecida correctamente');
    } else {
      Alert.alert('Error', 'No se pudo conectar con Cloudinary. Verifica el modo "Unsigned" en tu panel.');
    }
  };

  const loadGallery = async (email: string) => {
    setIsLoading(true);
    try {
      const items = await getGalleryFor(email);
      setGalleryItems(items || []);
    } catch (e) {
      setGalleryItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }

    const query = text.trim().toLowerCase();
    setIsSearching(true);
    
    try {
      // Búsqueda local segura
      const localMatches = knownPatients.filter(p => 
        (p.email && p.email.toLowerCase().includes(query)) || 
        (p.nombreApellido && p.nombreApellido.toLowerCase().includes(query))
      );

      setSearchResults(localMatches);

      // Búsqueda en API para asegurar perfiles nuevos
      try {
        const res = await api.get('/profiles', { params: { query: text.trim() } });
        const apiData = Array.isArray(res.data) ? res.data : (res.data.profiles || res.data.users || res.data.patients || res.data.data);
        
        if (Array.isArray(apiData)) {
          const mappedApi = apiData.map((p: any) => ({
            email: (p.email || p.correo || p.user?.email || '').toLowerCase(),
            nombreApellido: p.nombreApellido || p.nombre_apellido || p.nombre || p.name || ''
          })).filter(p => p.email);

          // Combinar sin duplicados
          const combined = [...localMatches, ...mappedApi];
          const uniqueResults = Array.from(new Map(combined.map(item => [item.email, item])).values());
          setSearchResults(uniqueResults);
        }
      } catch (e) {
        // Fallback silencioso si falla la API, ya mostramos los locales
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectPatient = (email: string) => {
    setSelectedEmail(email);
    setSearchModalVisible(false);
  };

  const pickAndUploadImage = async () => {
    if (!selectedEmail) {
      Alert.alert('Error', 'Selecciona un paciente primero');
      return;
    }

    if (!newImageTitle.trim()) {
      Alert.alert('Error', 'Ingresa un título para el archivo');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const isVideo = file.mimeType?.startsWith('video/') || file.name.toLowerCase().endsWith('.mp4') || file.name.toLowerCase().endsWith('.mov');
      
      setUploading(true);
      setUploadStep('Preparando archivo...');

      let fileData: any;
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        fileData = blob;
      } else {
        // En móvil (Native), FormData requiere este objeto específico para reconocer el archivo
        fileData = {
          uri: file.uri,
          type: file.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
          name: file.name || (isVideo ? 'video.mp4' : 'image.jpg'),
        };
      }
      
      const uploaded = await uploadMediaToGallery(
        selectedEmail, 
        fileData, 
        newImageTitle, 
        newImageType,
        isVideo ? 'video' : 'image',
        (step) => setUploadStep(step)
      );

      if (uploaded) {
        Alert.alert('Éxito', 'Contenido subido correctamente');
        setNewImageTitle('');
        setUploadStep('');
        loadGallery(selectedEmail);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      Alert.alert('Error de Subida', err.message || 'Ocurrió un error inesperado');
    } finally {
      setUploading(false);
      setUploadStep('');
    }
  };

  const handleDeleteItem = async (id: string) => {
    Alert.alert(
      'Eliminar Imagen',
      '¿Estás seguro de que quieres eliminar esta imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            const success = await deleteGalleryItem(id);
            if (success && selectedEmail) {
              loadGallery(selectedEmail);
            } else {
              Alert.alert('Error', 'No se pudo eliminar la imagen');
            }
          }
        }
      ]
    );
  };

  if (!isAuthReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'ADMIN') return <Redirect href="/patient/home" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <Text style={{ fontSize: 24, color: colors.secondary, fontWeight: 'bold' }}>Gestionar Galería</Text>
          <IconButton 
            icon={configStatus === 'ok' ? 'cloud-check' : configStatus === 'error' ? 'cloud-alert' : 'cloud-sync'} 
            iconColor={configStatus === 'ok' ? '#4CAF50' : configStatus === 'error' ? '#F44336' : colors.primary}
            onPress={checkConfig}
            loading={isCheckingConfig}
          />
        </View>

        {/* Card de Configuración Cloudinary */}
        <Card style={{ marginBottom: spacing.md, backgroundColor: '#f8f9fa' }}>
          <Card.Content>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', color: colors.primary }}>Estado de Cloudinary</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>Preset: ml_default</Text>
              </View>
              <PaperButton 
                mode="outlined" 
                onPress={checkConfig} 
                loading={isCheckingConfig}
                compact
              >
                Probar
              </PaperButton>
            </View>
            
            {configStatus === 'error' && (
              <Surface style={{ padding: spacing.sm, backgroundColor: '#FFF5F5', borderRadius: 8, marginTop: 4 }}>
                <Text style={{ fontSize: 11, color: '#C53030', fontWeight: 'bold' }}>⚠️ Acción Requerida:</Text>
                <Text style={{ fontSize: 11, color: '#C53030' }}>
                  1. Ve a Configuración -> Upload en Cloudinary.{"\n"}
                  2. Cambia el preset "ml_default" a modo "Unsigned".
                </Text>
              </Surface>
            )}
          </Card.Content>
        </Card>

        <View style={{ backgroundColor: '#fff', padding: spacing.md, borderRadius: radius.md, elevation: 2, marginBottom: spacing.md }}>
          <Text style={{ fontSize: 16, marginBottom: spacing.sm, fontWeight: '600' }}>Paciente Seleccionado</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: selectedEmail ? colors.text : colors.muted, fontWeight: selectedEmail ? '700' : '400' }}>
                {selectedEmail || 'Ningún paciente seleccionado'}
              </Text>
            </View>
            <PaperButton 
              mode="outlined" 
              icon="account-search" 
              onPress={() => setSearchModalVisible(true)}
            >
              Buscar
            </PaperButton>
          </View>
        </View>

        {selectedEmail && (
          <View style={{ backgroundColor: '#fff', padding: spacing.md, borderRadius: radius.md, elevation: 2, marginBottom: spacing.md }}>
            <Text style={{ fontSize: 18, marginBottom: spacing.md, fontWeight: '700', color: colors.primary }}>Subir Nuevo Recuerdo</Text>
            
            <PaperTextInput
              label="Título (Imagen o Video)"
              value={newImageTitle}
              onChangeText={setNewImageTitle}
              mode="outlined"
              style={{ marginBottom: spacing.md }}
            />

            <Text style={{ marginBottom: spacing.xs, fontWeight: '600' }}>Tipo de momento</Text>
            <SegmentedButtons
              value={newImageType}
              onValueChange={v => setNewImageType(v as any)}
              style={{ marginBottom: spacing.md }}
              buttons={[
                { value: 'activity', label: 'Actividad', icon: 'palette' },
                { value: 'session', label: 'Sesión', icon: 'human-greeting' },
                { value: 'event', label: 'Evento', icon: 'party-popper' },
              ]}
            />

            {uploading && (
              <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
                <ActivityIndicator animating={true} color={colors.primary} />
                <Text style={{ marginTop: 8, color: colors.primary, fontWeight: '600' }}>{uploadStep}</Text>
              </View>
            )}

            <PaperButton 
              mode="contained" 
              icon="cloud-upload" 
              onPress={pickAndUploadImage}
              loading={uploading}
              disabled={uploading || !newImageTitle.trim()}
              style={{ paddingVertical: 4 }}
            >
              {uploading ? 'Subiendo...' : 'Seleccionar Imagen o Video'}
            </PaperButton>
          </View>
        )}

        {selectedEmail && (
          <View>
            <Text style={{ fontSize: 18, marginBottom: spacing.md, fontWeight: '700', color: colors.secondary }}>Galería del Paciente</Text>
            {isLoading ? (
              <Text style={{ textAlign: 'center', marginTop: 20 }}>Cargando galería...</Text>
            ) : galleryItems.length === 0 ? (
              <Text style={{ textAlign: 'center', marginTop: 20, color: colors.muted }}>Este paciente no tiene imágenes en su galería.</Text>
            ) : (
              <View style={{ gap: spacing.md }}>
                {galleryItems.map((item) => (
                  <Card key={item.id} style={{ overflow: 'hidden' }}>
                    {item.resourceType === 'video' ? (
                      <View style={{ height: 180, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}>
                        <IconButton icon="video" size={48} iconColor={colors.primary} />
                        <Text style={{ color: colors.muted }}>Video</Text>
                      </View>
                    ) : (
                      <Card.Cover source={{ uri: item.uri }} style={{ height: 180 }} />
                    )}
                    <Card.Title 
                      title={item.title} 
                      subtitle={`${item.date} • ${item.type} • ${item.resourceType || 'image'}`}
                      right={(props) => (
                        <IconButton 
                          {...props} 
                          icon="delete-outline" 
                          iconColor={colors.accent} 
                          onPress={() => handleDeleteItem(item.id)} 
                        />
                      )}
                    />
                  </Card>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal de Búsqueda de Pacientes */}
      <Portal>
        <Modal
          visible={searchModalVisible}
          onDismiss={() => setSearchModalVisible(false)}
          contentContainerStyle={{ 
            backgroundColor: 'white', 
            padding: 20, 
            margin: 20, 
            borderRadius: radius.md,
            maxHeight: '80%'
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: spacing.md }}>Buscador de Pacientes</Text>
          
          <PaperTextInput
            placeholder="Escribe nombre o email..."
            value={searchQuery}
            onChangeText={handleSearch}
            mode="outlined"
            autoFocus={true}
            left={<PaperTextInput.Icon icon="magnify" />}
            style={{ marginBottom: spacing.md }}
          />

          <View style={{ maxHeight: 300 }}>
            {isSearching && searchResults.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator color={colors.primary} />
                <Text style={{ marginTop: 10 }}>Buscando...</Text>
              </View>
            ) : (
              <FlatList
                data={searchResults.length > 0 ? searchResults : (searchQuery.trim() ? [] : knownPatients)}
                keyExtractor={(item, index) => item.email || index.toString()}
                ItemSeparatorComponent={() => <Divider />}
                ListEmptyComponent={() => (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#666' }}>
                      {searchQuery.trim() ? 'No se encontraron pacientes' : 'Cargando pacientes...'}
                    </Text>
                  </View>
                )}
                renderItem={({ item }) => (
                  <List.Item
                    title={item.nombreApellido || item.email}
                    description={item.nombreApellido ? item.email : ''}
                    onPress={() => selectPatient(item.email)}
                    left={props => <List.Icon {...props} icon="account" color={colors.primary} />}
                  />
                )}
              />
            )}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.md }}>
            <PaperButton mode="outlined" onPress={() => setSearchModalVisible(false)}>Cerrar</PaperButton>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

