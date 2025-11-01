import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { healthSeries, aggregateScreentimeByCategory, loadScreentime } from '../data/loaders';
import MetricTile from '../components/MetricTile';
import InsightCard from '../components/InsightCard';
import MiniBars from '../components/MiniBars';
import { pearsonCorrelation } from '../utils/analytics';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const series = useMemo(() => healthSeries(), []);
  const [selectedTrend, setSelectedTrend] = useState<'activity' | 'sleep' | 'screen'>('activity');

  const stepsData = series.steps.points.map((p) => p.value);
  const sleepData = series.sleep.points.map((p) => p.value / 60); // hours
  const workoutData = series.workout.points.map((p) => p.value);
  const energyData = series.energy.points.map((p) => p.value);
  
  // Get last 7 days for sparklines
  const last7Steps = stepsData.slice(-7);
  const last7Sleep = sleepData.slice(-7);
  const last7Workout = workoutData.slice(-7);
  const last7Energy = energyData.slice(-7);

  // Latest values
  const latestSteps = stepsData[stepsData.length - 1] || 0;
  const latestSleep = sleepData[sleepData.length - 1] || 0;
  const latestWorkout = workoutData[workoutData.length - 1] || 0;
  const latestEnergy = energyData[energyData.length - 1] || 0;
  const lastDate = series.steps.points.length ? series.steps.points[series.steps.points.length - 1].date : new Date();

  // Averages
  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const avg90Steps = avg(stepsData);
  const avg90Sleep = avg(sleepData);
  const avg7Steps = avg(stepsData.slice(-7));

  // Screen time
  const screentime = useMemo(() => loadScreentime(), []);
  const latestDateStr = lastDate.toISOString().split('T')[0];
  const todayScreen = screentime
    .filter((s) => s.date === latestDateStr)
    .reduce((sum, s) => sum + s.minutes, 0);
  const last7Screen = screentime
    .filter((s) => {
      const date = new Date(s.date);
      const daysDiff = (lastDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff >= 0 && daysDiff < 7;
    })
    .reduce((sum, s) => sum + s.minutes, 0) / 7;

  const screentimeByCategory = useMemo(() => {
    const last7Days = screentime.filter((s) => {
      const date = new Date(s.date);
      const daysDiff = (lastDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff >= 0 && daysDiff < 7;
    });
    
    const agg: Record<string, number> = {};
    for (const row of last7Days) {
      const key = row.category || 'Other';
      if (!agg[key]) agg[key] = 0;
      agg[key] += row.minutes;
    }
    return agg;
  }, [screentime, lastDate]);
  
  const categoryData = Object.entries(screentimeByCategory)
    .map(([category, minutes]) => ({ category, minutes }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 3);

  // Insights
  const workoutEnergyCorr = useMemo(() => pearsonCorrelation(workoutData, energyData), [workoutData, energyData]);
  
  const fmtDate = (d: Date) => {
    const month = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    const day = d.getUTCDate();
    return `${month} ${day}`;
  };

  const getChange = (current: number, avg: number): { text: string; type: 'up' | 'down' | 'neutral' } => {
    const diff = ((current - avg) / avg) * 100;
    if (Math.abs(diff) < 1) return { text: 'vs 90d avg', type: 'neutral' };
    return {
      text: `${diff > 0 ? '+' : ''}${diff.toFixed(0)}% vs 90d avg`,
      type: diff > 0 ? 'up' : 'down',
    };
  };

  const stepsChange = getChange(latestSteps, avg90Steps);
  const sleepChange = getChange(latestSleep, avg90Sleep);

  return (
    <LinearGradient colors={["#a8d5ff", "#e8f4ff"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: Math.max(6, insets.top * 0.25) }]}>
            <Text style={styles.headerTitle}>Summary</Text>
            <Text style={styles.headerSubtitle}>Today — {fmtDate(lastDate)}</Text>
          </View>

          <View style={styles.content}>
            {/* Today Metrics - 2 column grid */}
            <View style={styles.section}>
              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <MetricTile
                    title="Steps"
                    value={latestSteps.toLocaleString()}
                    change={stepsChange.text}
                    changeType={stepsChange.type}
                    sparklineData={last7Steps}
                    color="#ff6b9d"
                  />
                </View>
                <View style={styles.gridItem}>
                  <MetricTile
                    title="Sleep"
                    value={latestSleep.toFixed(1)}
                    unit="h"
                    change={sleepChange.text}
                    changeType={sleepChange.type}
                    sparklineData={last7Sleep}
                    color="#6c5ce7"
                  />
                </View>
                <View style={styles.gridItem}>
                  <MetricTile
                    title="Workout"
                    value={latestWorkout.toString()}
                    unit="min"
                    sparklineData={last7Workout}
                    color="#27ae60"
                  />
                </View>
                <View style={styles.gridItem}>
                  <MetricTile
                    title="Energy"
                    value={latestEnergy.toLocaleString()}
                    unit="kcal"
                    sparklineData={last7Energy}
                    color="#f39c12"
                  />
                </View>
              </View>
              <View style={styles.fullWidth}>
                <MetricTile
                  title="Screen Time"
                  value={(todayScreen / 60).toFixed(1)}
                  unit="h"
                  change={`${((todayScreen / 60 - last7Screen / 60) / (last7Screen / 60) * 100).toFixed(0)}% vs 7d avg`}
                  changeType={todayScreen > last7Screen ? 'up' : 'down'}
                  color="#4a90e2"
                  invertColors={true}
                />
              </View>
            </View>

            {/* Insights */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Insights</Text>
              
              {workoutEnergyCorr > 0.7 && (
                <InsightCard
                  emoji="🟢"
                  title="Workouts drive energy"
                  description={`Strong correlation (r = ${workoutEnergyCorr.toFixed(2)}). Days you work out tend to have ${((workoutEnergyCorr - 0.5) * 200).toFixed(0)}% higher active energy.`}
                  color="#27ae60"
                />
              )}
              
              {todayScreen > last7Screen * 1.15 && (
                <InsightCard
                  emoji="🟡"
                  title="Screen time above average"
                  description={`Today: ${(todayScreen / 60).toFixed(1)}h vs 7-day avg: ${(last7Screen / 60).toFixed(1)}h → +${((todayScreen / last7Screen - 1) * 100).toFixed(0)}%`}
                  color="#f39c12"
                />
              )}
              
              {latestSteps < avg7Steps * 0.93 && (
                <InsightCard
                  emoji="🔵"
                  title="Steps below weekly average"
                  description={`Today: ${latestSteps.toLocaleString()} vs 7-day avg: ${Math.round(avg7Steps).toLocaleString()} → ${((latestSteps / avg7Steps - 1) * 100).toFixed(0)}%`}
                  color="#4a90e2"
                />
              )}

              {latestSleep < avg90Sleep * 0.9 && (
                <InsightCard
                  emoji="🟣"
                  title="Sleep below average"
                  description={`Last night: ${latestSleep.toFixed(1)}h vs 90-day avg: ${avg90Sleep.toFixed(1)}h. Consider going to bed earlier tonight.`}
                  color="#6c5ce7"
                />
              )}
            </View>

            {/* Screen Time by Category */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Screen Time</Text>
              <View style={styles.card}>
                <Text style={styles.cardSubtitle}>Top Categories (Last 7 Days)</Text>
                {categoryData.map((item, index) => (
                  <View key={index} style={styles.categoryRow}>
                    <Text style={styles.categoryName}>{item.category}</Text>
                    <View style={styles.categoryBar}>
                      <View 
                        style={[
                          styles.categoryBarFill, 
                          { 
                            width: `${(item.minutes / categoryData[0].minutes) * 100}%`,
                            backgroundColor: ['#ff6b9d', '#4a90e2', '#f39c12'][index],
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.categoryValue}>{(item.minutes / 60).toFixed(1)}h</Text>
                  </View>
                ))}
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
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  headerSubtitle: { marginTop: 2, fontSize: 14, fontWeight: '600', color: '#666' },
  content: { paddingHorizontal: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#111' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  gridItem: { width: '50%', paddingHorizontal: 6, marginBottom: 12 },
  fullWidth: { marginBottom: 12 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 14, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardSubtitle: { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 12 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  categoryName: { fontSize: 13, fontWeight: '600', color: '#111', width: 100 },
  categoryBar: { flex: 1, height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, marginHorizontal: 8 },
  categoryBarFill: { height: 8, borderRadius: 4 },
  categoryValue: { fontSize: 13, fontWeight: '700', color: '#111', width: 40, textAlign: 'right' },
});
