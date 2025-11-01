import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { healthSeries, aggregateScreentimeByCategory } from '../data/loaders';
import Sparkline from '../components/Sparkline';
import MiniBars from '../components/MiniBars';
import PieChart from '../components/PieChart';
import { pearsonCorrelation } from '../utils/analytics';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const CATEGORY_COLORS = [
  '#ff6b9d', // Pink
  '#4a90e2', // Blue
  '#f39c12', // Orange
  '#9b59b6', // Purple
  '#27ae60', // Green
  '#e74c3c', // Red
  '#00b894', // Teal
  '#fdcb6e', // Yellow
  '#6c5ce7', // Indigo
  '#fd79a8', // Light pink
  '#74b9ff', // Sky blue
  '#55efc4', // Mint
  '#e17055', // Coral
  '#a29bfe', // Lavender
  '#ff7675', // Soft red
  '#fab1a0', // Peach
];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const series = useMemo(() => healthSeries(), []);
  const screentimeByCategory = useMemo(() => aggregateScreentimeByCategory(), []);

  const stepsValues = series.steps.points.map((p) => p.value);
  const sleepValues = series.sleep.points.map((p) => p.value);
  const workoutValues = series.workout.points.map((p) => p.value);
  const lastDate = series.steps.points.length ? series.steps.points[series.steps.points.length - 1].date : new Date();
  const corrStepsWorkout = useMemo(
    () => pearsonCorrelation(stepsValues, workoutValues),
    [stepsValues, workoutValues]
  );

  const lastValue = (arr: number[]) => (arr.length ? arr[arr.length - 1] : 0);
  const avg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
  const fmtDate = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const screentimePieData = useMemo(() => {
    return Object.entries(screentimeByCategory)
      .map(([category, data], index) => ({
        label: category,
        value: data.totalMinutes,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [screentimeByCategory]);

  return (
    <LinearGradient colors={["#a8d5ff", "#e8f4ff"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
          <View style={[styles.header, { paddingTop: Math.max(6, insets.top * 0.25) }]}>
            <Text style={styles.headerTitle}>Summary</Text>
            <Text style={styles.headerSubtitle}>Pinned</Text>
          </View>

          <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Steps</Text>
              <Text style={styles.subtle}>{fmtDate(lastDate)}</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.bigNumber}>{lastValue(stepsValues).toLocaleString()}</Text>
              <MiniBars values={stepsValues} />
            </View>
            <Text style={styles.caption}>Avg 90d: {avg(stepsValues)}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Sleep (min)</Text>
              <Text style={styles.subtle}>{fmtDate(lastDate)}</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.bigNumber}>{lastValue(sleepValues).toLocaleString()}</Text>
              <MiniBars values={sleepValues} color="#6c5ce7" />
            </View>
            <Text style={styles.caption}>Avg 90d: {avg(sleepValues)}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Steps vs Workout Minutes</Text>
            <Text style={styles.metric}>Correlation (r): {corrStepsWorkout.toFixed(2)}</Text>
            <Text style={styles.caption}>Positive means they move together; negative means inverse.</Text>
            <View style={{ marginTop: 8 }}>
              <Sparkline values={workoutValues.map((v, i) => (stepsValues[i] ?? 0) + v)} stroke="#888" />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Screen Time by Category</Text>
            <Text style={styles.caption}>Total time spent across all apps</Text>
            <View style={{ marginTop: 16 }}>
              <PieChart data={screentimePieData} size={180} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 36, fontWeight: '800', letterSpacing: -0.5 },
  headerSubtitle: { marginTop: 6, fontSize: 20, fontWeight: '700' },
  content: { paddingHorizontal: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  bigNumber: { fontSize: 32, fontWeight: '800' },
  metric: { fontSize: 16, fontWeight: '700' },
  caption: { color: '#666', fontSize: 12, marginTop: 6 },
  subtle: { color: '#777' },
});
