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

export default function StepsDetailScreen({ navigation }: any) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('W');
  const [series, setSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await healthSeries();
        setSeries(data);
      } catch (error) {
        console.error('Error loading steps data:', error);
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

  const stepsData = series.steps.points.map((p: any) => ({ date: p.date, value: p.value }));
  
  // Get data based on selected range
  const getDataForRange = () => {
    const now = new Date();
    switch (selectedRange) {
      case 'W':
        return stepsData.slice(-7);
      case 'M':
        return stepsData.slice(-30);
      case '6M':
        return stepsData.slice(-180);
      case 'Y':
        return stepsData.slice(-365);
      default:
        return stepsData.slice(-7);
    }
  };

  const displayData = getDataForRange();
  const latestSteps = displayData[displayData.length - 1]?.value || 0;
  
  // Always show today's date for current data
  const today = new Date();
  const latestDate = displayData[displayData.length - 1]?.date || today;
  
  // Use today's date if the latest data is from today, otherwise use the data's date
  const displayDate = new Date(latestDate);
  const isToday = displayDate.toDateString() === today.toDateString();
  const dateToShow = isToday ? today : displayDate;

  // Calculate average
  const average = Math.round(
    displayData.reduce((sum: number, d: any) => sum + d.value, 0) / displayData.length
  );

  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  return (
    <LinearGradient colors={["#a8d5ff", "#e8f4ff"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <DetailHeader title="Steps" onBackPress={() => navigation.goBack()} />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Time Range Selector */}
          <TimeRangeSelector 
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
            ranges={['W', 'M', '6M', 'Y']}
          />

          {/* Total Display */}
          <MetricTotal
            label="TOTAL"
            value={latestSteps}
            unit="steps"
            subtitle={formatDate(dateToShow)}
          />

          {/* Chart */}
          <TimeSeriesChart 
            data={displayData}
            selectedRange={selectedRange}
            color="#ff6b9d"
            showWeekSeparators={true}
          />

          {/* Highlights */}
          <View style={styles.highlights}>
            <Text style={styles.highlightsTitle}>Highlights</Text>
            
            <HighlightCard
              emoji="🔥"
              title="Steps"
              description={
                latestSteps < average 
                  ? "So far, you're taking fewer steps than you normally do."
                  : "Great job! You're above your average."
              }
              stats={[
                { label: 'Average', value: `${average.toLocaleString()} steps` }
              ]}
              titleColor="#ff6b9d"
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
