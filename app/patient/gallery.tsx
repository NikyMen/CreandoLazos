import { View, Text, StyleSheet, ScrollView, Image, Dimensions, Modal, TouchableOpacity, Platform, RefreshControl, Linking } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { IconButton, Card, Surface, Avatar, ActivityIndicator, Button as PaperButton } from 'react-native-paper';
import { Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, spacing, radius } from '../../lib/theme';
import { getGalleryFor, type GalleryItem } from '../../lib/gallery';

export default function PatientGallery() {
  const { isAuthenticated, role, user } = useAuth();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [memories, setMemories] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGallery = useCallback(async () => {
    setLoading(true);
    const items = await getGalleryFor(user?.email);
    setMemories(items);
    setLoading(false);
  }, [user?.email]);

  useEffect(() => {
    const init = async () => {
      if (user?.email) {
        await loadGallery();
      }
    };
    init();
  }, [user?.email, loadGallery]);

  const onRefresh = async () => {
    setRefreshing(true);
    const items = await getGalleryFor(user?.email);
    setMemories(items);
    setRefreshing(false);
  };

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'PATIENT') return <Redirect href="/admin/home" />;

  const handleNext = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex + 1) % memories.length);
    }
  };

  const handlePrev = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex - 1 + memories.length) % memories.length);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'activity': return 'palette';
      case 'session': return 'human-greeting';
      case 'event': return 'party-popper';
      default: return 'image';
    }
  };

  const renderMedia = (item: GalleryItem, style: any) => {
    if (item.resourceType === 'video') {
      return (
        <View style={[style, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
          <IconButton icon="play-circle-outline" size={64} iconColor="#fff" />
          <Text style={{ color: '#fff', fontSize: 12 }}>Video</Text>
        </View>
      );
    }
    return <Card.Cover source={{ uri: item.uri }} style={style} />;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Nuestros Momentos</Text>
          <Text style={styles.subtitle}>Recuerdos de las actividades compartidas</Text>
        </View>

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.muted }}>Cargando tus momentos...</Text>
          </View>
        ) : memories.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Avatar.Icon size={64} icon="image-off" style={{ backgroundColor: 'transparent' }} color={colors.muted} />
            <Text style={{ marginTop: 10, color: colors.muted, textAlign: 'center' }}>
              Aún no hay fotos en tu galería.
            </Text>
          </View>
        ) : (
          <View style={styles.feed}>
            {memories.map((item, index) => (
              <Card 
                key={item.id} 
                style={styles.memoryCard} 
                mode="elevated"
                onPress={() => setSelectedImageIndex(index)}
              >
                {renderMedia(item, styles.cardImage)}
                <Card.Content style={styles.cardInfo}>
                  <View style={styles.cardHeader}>
                    <Avatar.Icon 
                      size={32} 
                      icon={getIconForType(item.type)} 
                      style={{ backgroundColor: colors.primary + '20' }} 
                      color={colors.primary}
                    />
                    <View style={styles.textContainer}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardDate}>{item.date}</Text>
                    </View>
                    <IconButton icon="chevron-right" size={20} iconColor={colors.muted} />
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Visualizador de Imagen (Modal) */}
      <Modal
        visible={selectedImageIndex !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImageIndex(null)}
      >
        <Surface style={styles.modalBackground} elevation={0}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{selectedImageIndex !== null ? memories[selectedImageIndex].title : ''}</Text>
              <Text style={styles.modalDate}>{selectedImageIndex !== null ? memories[selectedImageIndex].date : ''}</Text>
            </View>
            <IconButton
              icon="close"
              iconColor="#fff"
              size={28}
              onPress={() => setSelectedImageIndex(null)}
              style={styles.closeBtn}
            />
          </View>
          
          <View style={styles.viewerContainer}>
            <IconButton
              icon="chevron-left"
              iconColor="#fff"
              size={40}
              onPress={handlePrev}
              style={styles.navButton}
            />
            
            {selectedImageIndex !== null && (
              memories[selectedImageIndex].resourceType === 'video' ? (
                <View style={styles.videoViewer}>
                  {Platform.OS === 'web' ? (
                    <video 
                      src={memories[selectedImageIndex].uri} 
                      controls 
                      style={{ width: '100%', height: '100%', maxWidth: 800 }}
                    />
                  ) : (
                    <>
                      <IconButton icon="video" size={80} iconColor="#fff" />
                      <Text style={{ color: '#fff', textAlign: 'center', padding: 20 }}>
                        Este es un video. Para verlo en dispositivos móviles se requiere instalar expo-av.
                      </Text>
                      <PaperButton 
                        mode="contained" 
                        onPress={() => Linking.openURL(memories[selectedImageIndex].uri)}
                        style={{ marginTop: 10 }}
                      >
                        Ver en Navegador
                      </PaperButton>
                    </>
                  )}
                </View>
              ) : (
                <Image
                  source={{ uri: memories[selectedImageIndex].uri }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              )
            )}

            <IconButton
              icon="chevron-right"
              iconColor="#fff"
              size={40}
              onPress={handleNext}
              style={styles.navButton}
            />
          </View>

          <Surface style={styles.counterBadge} elevation={4}>
            <Text style={styles.counterText}>
              {(selectedImageIndex ?? 0) + 1} de {memories.length}
            </Text>
          </Surface>
        </Surface>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: '#fff',
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    marginTop: 6,
    lineHeight: 22,
  },
  feed: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  memoryCard: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  cardImage: {
    height: 220,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  cardInfo: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  cardDate: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    width: '100%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalDate: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  viewerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
  },
  fullImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  videoViewer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  counterBadge: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  counterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});


