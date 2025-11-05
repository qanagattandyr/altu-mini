import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { healthSeries } from '../data/dbLoaders';
import DetailHeader from '../components/DetailHeader';
import TimeRangeSelector, { TimeRange } from '../components/TimeRangeSelector';
import MetricTotal from '../components/MetricTotal';
import TimeSeriesChart from '../components/TimeSeriesChart';
import HighlightCard from '../components/HighlightCard';

export default function SleepDetailScreen({ navigation }: any) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('W');
  const [series, setSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await healthSeries();
        setSeries(data);
      } catch (error) {
        console.error('Error loading sleep data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !series) {
    return (
      <LinearGradient colors={["#a8d5ff", "#e8f4ff"]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const sleepData = series.sleep.points.map((p: any) => ({ 
    date: p.date, 
    value: p.value / 60 // Convert to hours
  }));
  
  // Get data based on selected range
  const getDataForRange = () => {
    switch (selectedRange) {
      case 'W':
        return sleepData.slice(-7);
      case 'M':
        return sleepData.slice(-30);
      case '6M':
        return sleepData.slice(-180);
      case 'Y':
        return sleepData.slice(-365);
      default:
        return sleepData.slice(-7);
    }
  };

  const displayData = getDataForRange();
  const latestSleep = displayData[displayData.length - 1]?.value || 0;
  
  // Always show today's date for current data
  const today = new Date();
  const latestDate = displayData[displayData.length - 1]?.date || today;
  const displayDate = new Date(latestDate);
  const isToday = displayDate.toDateString() === today.toDateString();
  const dateToShow = isToday ? today : displayDate;

  // Calculate average
  const average = (
    displayData.reduce((sum: number, d: any) => sum + d.value, 0) / displayData.length
  ).toFixed(1);

  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const recommendedSleep = 8; // hours
  const sleepQuality = latestSleep >= recommendedSleep ? 'good' : 'below';

  return (
    <LinearGradient colors={["#a8d5ff", "#e8f4ff"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <DetailHeader title="Sleep" onBackPress={() => navigation.goBack()} />

        <ScrollView showsVerticalScrollIndicator={false}>
          <TimeRangeSelector 
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
            ranges={['W', 'M', '6M', 'Y']}
          />

          <MetricTotal
            label="TOTAL"
            value={latestSleep.toFixed(1)}
            unit="hours"
            subtitle={formatDate(dateToShow)}
          />

          <TimeSeriesChart 
            data={displayData}
            selectedRange={selectedRange}
            color="#6c5ce7"
            showWeekSeparators={true}
          />

          <View style={styles.highlights}>
            <Text style={styles.highlightsTitle}>Highlights</Text>
            
            <HighlightCard
              emoji="😴"
              title="Sleep"
              description={
                sleepQuality === 'good'
                  ? `Great! You're getting ${latestSleep.toFixed(1)} hours of sleep.`
                  : `You got ${latestSleep.toFixed(1)} hours. Try to aim for ${recommendedSleep} hours.`
              }
              stats={[
                { label: 'Average', value: `${average} hours` }
              ]}
              titleColor="#6c5ce7"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  highlights: {
    marginTop: 32,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  highlightsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
  },
});
