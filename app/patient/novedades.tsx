import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, spacing, radius } from '../../lib/theme';
import { getEventsFor, type CalendarEvent, compareEventDates, formatTime } from '../../lib/schedule';
import { Card, Divider, Avatar } from 'react-native-paper';

export default function PatientNovedades() {
  const { isAuthenticated, role, user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const evs = await getEventsFor(user?.email);
      // Ordenar por fecha descendente (lo más nuevo arriba) para un foro
      evs.sort((a, b) => compareEventDates(b, a));
      setEvents(evs);
      setLoading(false);
    })();
  }, [user?.email]);

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'PATIENT') return <Redirect href="/admin/home" />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Foro de Novedades</Text>
        <Text style={styles.headerSubtitle}>Entérate de las últimas noticias y avisos.</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={{ marginTop: 10, color: colors.muted }}>Cargando novedades...</Text>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Avatar.Icon size={80} icon="bell-off-outline" style={{ backgroundColor: '#F2F2F7' }} color="#8E8E93" />
          <Text style={styles.emptyText}>No hay novedades publicadas aún.</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md }}
          renderItem={({ item }) => (
            <Card style={styles.novedadCard} mode="elevated">
              <Card.Title 
                title={item.title} 
                subtitle={`${item.date} ${item.time ? '— ' + formatTime(item.time) : ''}`}
                titleStyle={styles.cardTitle}
                subtitleStyle={styles.cardSubtitle}
                left={(props) => <Avatar.Icon {...props} icon="bullhorn" size={40} style={{ backgroundColor: colors.primary }} />}
              />
              <Card.Content>
                <Divider style={{ marginVertical: 8 }} />
                {item.notes ? (
                  <Text style={styles.cardNotes}>{item.notes}</Text>
                ) : (
                  <Text style={[styles.cardNotes, { fontStyle: 'italic', color: colors.muted }]}>Sin descripción adicional.</Text>
                )}
              </Card.Content>
            </Card>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
  novedadCard: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.muted,
  },
  cardNotes: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginTop: 4,
  },
});
