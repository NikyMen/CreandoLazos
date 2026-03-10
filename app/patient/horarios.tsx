import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Divider, Card, List, useTheme, Surface } from 'react-native-paper';
import { Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, spacing, radius } from '../../lib/theme';
import { dias, timeSlots, getHorariosFor, keyFor } from '../../lib/horarios';

export default function PatientHorarios() {
  const { isAuthenticated, role, user } = useAuth();
  const [note, setNote] = useState('');
  const [cells, setCells] = useState<Record<string, string>>({});
  const [selectedDay, setSelectedDay] = useState(dias[0]);

  useEffect(() => {
    (async () => {
      const data = await getHorariosFor(user?.email);
      setNote(data.note || '');
      setCells(data.cells || {});
    })();
  }, [user?.email]);

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'PATIENT') return <Redirect href="/admin/home" />;

  const slots = timeSlots(8, 18);

  const renderDaySelector = () => (
    <View style={styles.segmentedContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmentedScrollContent}>
        {dias.map((d) => (
          <Pressable
            key={d}
            onPress={() => setSelectedDay(d)}
            style={[
              styles.segmentItem,
              selectedDay === d && styles.segmentItemActive
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                selectedDay === d && styles.segmentTextActive
              ]}
            >
              {d.substring(0, 3)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderTimeline = () => {
    const activeSlots = slots.filter(t => cells[keyFor(selectedDay, t)]);

    if (activeSlots.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <List.Icon icon="calendar-clock" color="#CBD5E0" />
          <Text style={styles.emptyText}>Sin actividades para este día</Text>
          <Text style={styles.emptySubtext}>Tu agenda está libre el {selectedDay.toLowerCase()}.</Text>
        </View>
      );
    }

    return (
      <View style={styles.timelineContainer}>
        {activeSlots.map((t, idx) => (
          <View key={t} style={styles.timelineItem}>
            <View style={styles.timeColumn}>
              <Text style={styles.timeText}>{t}</Text>
              <View style={[styles.timeDot, { backgroundColor: colors.primary }]} />
              {idx < activeSlots.length - 1 && <View style={styles.timeLine} />}
            </View>
            <View style={styles.activityCardWrapper}>
              <View style={styles.activityCard}>
                <Text style={styles.activityText}>{cells[keyFor(selectedDay, t)]}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Horarios</Text>
        {note ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>{note}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.selectorWrapper}>
        {renderDaySelector()}
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle}>{selectedDay}</Text>
          <Text style={styles.daySubtitle}>Programación del día</Text>
        </View>
        {renderTimeline()}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -1,
  },
  noteBox: {
    backgroundColor: '#F2F2F7',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  noteText: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  selectorWrapper: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  segmentedContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 2,
    height: 40,
  },
  segmentedScrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  segmentItem: {
    paddingHorizontal: 16,
    height: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 65,
  },
  segmentItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  segmentTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  dayHeader: {
    marginBottom: spacing.lg,
  },
  dayTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  daySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  timelineContainer: {
    marginTop: spacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  timeColumn: {
    width: 60,
    alignItems: 'center',
    paddingTop: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  timeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 2,
  },
  timeLine: {
    position: 'absolute',
    top: 28,
    bottom: -spacing.md - 4,
    width: 1,
    backgroundColor: '#E5E5EA',
    zIndex: 1,
  },
  activityCardWrapper: {
    flex: 1,
    marginLeft: spacing.md,
  },
  activityCard: {
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  activityText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
    lineHeight: 22,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});


