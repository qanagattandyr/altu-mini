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

export default function EnergyDetailScreen({ navigation }: any) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('W');
  const [series, setSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await healthSeries();
        setSeries(data);
      } catch (error) {
        console.error('Error loading energy data:', error);
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

  const energyData = series.energy.points.map((p: any) => ({ 
    date: p.date, 
    value: p.value
  }));
  
  // Get data based on selected range
  const getDataForRange = () => {
    switch (selectedRange) {
      case 'W':
        return energyData.slice(-7);
      case 'M':
        return energyData.slice(-30);
      case '6M':
        return energyData.slice(-180);
      case 'Y':
        return energyData.slice(-365);
      default:
        return energyData.slice(-7);
    }
  };

  const displayData = getDataForRange();
  const latestEnergy = displayData[displayData.length - 1]?.value || 0;
  
  // Always show today's date for current data
  const today = new Date();
  const latestDate = displayData[displayData.length - 1]?.date || today;
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

  const energyStatus = latestEnergy >= average ? 'above' : 'below';

  return (
    <LinearGradient colors={["#a8d5ff", "#e8f4ff"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <DetailHeader title="Active Energy" onBackPress={() => navigation.goBack()} />

        <ScrollView showsVerticalScrollIndicator={false}>
          <TimeRangeSelector 
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
            ranges={['W', 'M', '6M', 'Y']}
          />

          <MetricTotal
            label="TOTAL"
            value={latestEnergy}
            unit="kcal"
            subtitle={formatDate(dateToShow)}
          />

          <TimeSeriesChart 
            data={displayData}
            selectedRange={selectedRange}
            color="#f39c12"
            showWeekSeparators={true}
          />

          <View style={styles.highlights}>
            <Text style={styles.highlightsTitle}>Highlights</Text>
            
            <HighlightCard
              emoji="🔥"
              title="Active Energy"
              description={
                energyStatus === 'above'
                  ? `Great! You burned ${latestEnergy.toLocaleString()} kcal today, above your average.`
                  : `You burned ${latestEnergy.toLocaleString()} kcal today.`
              }
              stats={[
                { label: 'Average', value: `${average.toLocaleString()} kcal` }
              ]}
              titleColor="#f39c12"
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
