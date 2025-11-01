import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Sparkline from './Sparkline';

type MetricTileProps = {
  title: string;
  value: string;
  unit?: string;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  sparklineData?: number[];
  color?: string;
  invertColors?: boolean; // For metrics where increase is bad (e.g., screen time)
};

export default function MetricTile({ 
  title, 
  value, 
  unit, 
  change, 
  changeType = 'neutral',
  sparklineData,
  color = '#007aff',
  invertColors = false,
}: MetricTileProps) {
  const changeColor = invertColors 
    ? (changeType === 'up' ? '#e74c3c' : changeType === 'down' ? '#27ae60' : '#999')
    : (changeType === 'up' ? '#27ae60' : changeType === 'down' ? '#e74c3c' : '#999');
  const changeIcon = changeType === 'up' ? '↑' : changeType === 'down' ? '↓' : '−';

  return (
    <View style={styles.tile}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      {change && (
        <Text style={[styles.change, { color: changeColor }]}>
          {changeIcon} {change}
        </Text>
      )}
      {sparklineData && sparklineData.length > 0 && (
        <View style={styles.sparklineContainer}>
          <Sparkline values={sparklineData} stroke={color} height={24} width={140} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
  },
  unit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginLeft: 2,
  },
  change: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  sparklineContainer: {
    height: 24,
    marginTop: 4,
    overflow: 'hidden',
  },
});
