import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type MetricTotalProps = {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
};

export default function MetricTotal({ label, value, unit, subtitle }: MetricTotalProps) {
  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <View style={styles.totalContainer}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={styles.totalValue}>
        {formattedValue} {unit && <Text style={styles.totalUnit}>{unit}</Text>}
      </Text>
      {subtitle && <Text style={styles.totalDate}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  totalContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  totalLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111',
    marginTop: 8,
  },
  totalUnit: {
    fontSize: 24,
    color: '#666',
  },
  totalDate: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
  },
});
