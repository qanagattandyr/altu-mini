import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

type ColumnChartProps = {
  values: number[];
  fill?: string;
  height?: number;
  width?: number;
  gap?: number;
};

export default function ColumnChart({ 
  values, 
  fill = '#007aff', 
  height = 32, 
  width = 140,
  gap = 2,
}: ColumnChartProps) {
  if (!values || values.length === 0) {
    return null;
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  
  const columnWidth = (width - (values.length - 1) * gap) / values.length;

  return (
    <View style={[styles.container, { height, width }]}>
      <Svg width={width} height={height}>
        {values.map((value, i) => {
          const normalizedValue = ((value - min) / range);
          const columnHeight = normalizedValue * height;
          const x = i * (columnWidth + gap);
          const y = height - columnHeight;
          
          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={columnWidth}
              height={columnHeight}
              fill={fill}
              rx={1}
              opacity={0.9}
            />
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
