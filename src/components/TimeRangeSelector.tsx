import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export type TimeRange = 'W' | 'M' | '6M' | 'Y';

type TimeRangeSelectorProps = {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  ranges?: TimeRange[];
};

export default function TimeRangeSelector({ 
  selectedRange, 
  onRangeChange,
  ranges = ['W', 'M', '6M', 'Y']
}: TimeRangeSelectorProps) {
  return (
    <View style={styles.rangeSelector}>
      {ranges.map((range) => (
        <TouchableOpacity
          key={range}
          style={[styles.rangeButton, selectedRange === range && styles.rangeButtonActive]}
          onPress={() => onRangeChange(range)}
        >
          <Text style={[styles.rangeText, selectedRange === range && styles.rangeTextActive]}>
            {range}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rangeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  rangeButtonActive: {
    backgroundColor: '#ff6b9d',
  },
  rangeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  rangeTextActive: {
    color: '#fff',
  },
});
