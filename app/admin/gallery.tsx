import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Alert, FlatList, Image, TouchableOpacity } from 'react-native';
import { TextInput as PaperTextInput, Button as PaperButton, Divider, Portal, Modal, List, Card, IconButton, SegmentedButtons } from 'react-native-paper';
import { Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, spacing, radius } from '../../lib/theme';
import { listProfileEmails } from '../../lib/profile';
import { getGalleryFor, uploadImageToGallery, deleteGalleryItem, type GalleryItem } from '../../lib/gallery';
import { api } from '../../lib/api';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function AdminGallery() {
  const { isAuthenticated, role } = useAuth();
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [knownEmails, setKnownEmails] = useState<string[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ email: string; nombreApellido?: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const allPatientsData = useMemo(() => {
    return knownEmails.map(em => ({ email: em, nombreApellido: '' }));
  }, [knownEmails]);

  // Upload state
  const [newImageTitle, setNewImageTitle] = useState('');
  const [newImageType, setNewImageType] = useState<GalleryItem['type']>('activity');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const localList = await listProfileEmails();
        setKnownEmails(localList);
        
        const res = await api.get('/profiles');
        const data = Array.isArray(res.data) ? res.data : (res.data.profiles || res.data.users || res.data.data || res.data.patients);
        if (Array.isArray(data)) {
          const apiEmails = data.map((p: any) => p.email || p.correo || (typeof p === 'string' ? p : '')).filter(Boolean);
          setKnownEmails(prev => [...new Set([...prev, ...apiEmails])].sort());
        }
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    if (selectedEmail) {
      loadGallery(selectedEmail);
    }
  }, [selectedEmail]);

  const loadGallery = async (email: string) => {
    setIsLoading(true);
    const items = await getGalleryFor(email);
    setGalleryItems(items);
    setIsLoading(false);
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }

    const query = text.trim();
    setIsSearching(true);
    
    try {
      const searchParams = [{ query: query }, { email: query }, { search: query }];
      let data: any[] = [];
      const endpoints = ['/profiles', '/profiles/list', '/users', '/patients'];
      
      for (const endpoint of endpoints) {
        for (const params of searchParams) {
          try {
            const res = await api.get(endpoint, { params });
            if (res.data) {
              const results = Array.isArray(res.data) ? res.data : (res.data.profiles || res.data.users || res.data.patients || res.data.data);
              if (Array.isArray(results) && results.length > 0) {
                data = results;
                break;
              } else if (res.data.email || res.data.correo) {
                data = [res.data];
                break;
              }
            }
          } catch (e) {}
        }
        if (data.length > 0) break;
      }

      if (data.length > 0) {
        const mapped = data.map((p: any) => ({
          email: p.email || p.correo || p.user?.email || (typeof p === 'string' ? p : ''),
          nombreApellido: p.nombreApellido || p.nombre_apellido || p.nombre || p.name || ''
        })).filter(p => p.email);
        setSearchResults(mapped);
      } else {
        const lowerQuery = query.toLowerCase();
        const filtered = knownEmails
          .filter(em => em.toLowerCase().includes(lowerQuery))
          .map(em => ({ email: em }));
        setSearchResults(filtered);
      }
    } catch (err) {
      console.log('Error searching:', err);
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
      Alert.alert('Error', 'Ingresa un título para la imagen');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setUploading(true);

      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: 'base64',
      });

      const fullBase64 = `data:${file.mimeType || 'image/jpeg'};base64,${base64}`;
      
      const uploaded = await uploadImageToGallery(selectedEmail, fullBase64, newImageTitle, newImageType);

      if (uploaded) {
        Alert.alert('Éxito', 'Imagen subida correctamente');
        setNewImageTitle('');
        loadGallery(selectedEmail);
      } else {
        Alert.alert('Error', 'No se pudo subir la imagen');
      }
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Error', 'Ocurrió un error al subir la imagen');
    } finally {
      setUploading(false);
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

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'ADMIN') return <Redirect href="/patient/home" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Text style={{ fontSize: 24, color: colors.secondary, marginBottom: spacing.md, fontWeight: 'bold' }}>Gestionar Galería</Text>

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
            <Text style={{ fontSize: 18, marginBottom: spacing.md, fontWeight: '700', color: colors.primary }}>Subir Nueva Imagen</Text>
            
            <PaperTextInput
              label="Título de la imagen"
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

            <PaperButton 
              mode="contained" 
              icon="cloud-upload" 
              onPress={pickAndUploadImage}
              loading={uploading}
              disabled={uploading || !newImageTitle.trim()}
              style={{ paddingVertical: 4 }}
            >
              Seleccionar y Subir
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
                    <Card.Cover source={{ uri: item.uri }} style={{ height: 180 }} />
                    <Card.Title 
                      title={item.title} 
                      subtitle={`${item.date} • ${item.type}`}
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
            {isSearching ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text>Buscando...</Text>
              </View>
            ) : (
              <FlatList
                data={searchResults.length > 0 ? searchResults : allPatientsData}
                keyExtractor={(item, index) => item.email || index.toString()}
                ItemSeparatorComponent={() => <Divider />}
                ListEmptyComponent={() => (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#666' }}>No se encontraron pacientes</Text>
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
