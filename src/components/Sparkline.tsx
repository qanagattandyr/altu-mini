import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Line } from 'react-native-svg';

type Props = {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  showBaseline?: boolean;
};

export default function Sparkline({
  values,
  width = 320,
  height = 80,
  stroke = '#1f77b4',
  strokeWidth = 2,
  showBaseline = true,
}: Props) {
  if (!values || values.length === 0) return <View style={{ width, height }} />;
  
  const padding = strokeWidth;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = values.length <= 1 ? chartWidth : chartWidth / (values.length - 1);

  const points = values
    .map((v, i) => {
      const x = padding + i * stepX;
      const y = padding + chartHeight - ((v - min) / range) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  const baselineY = padding + chartHeight - ((0 - min) / range) * chartHeight;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        {showBaseline && baselineY >= padding && baselineY <= height - padding && (
          <Line x1={padding} y1={baselineY} x2={width - padding} y2={baselineY} stroke="#eee" strokeWidth={1} />
        )}
        <Polyline 
          points={points} 
          fill="none" 
          stroke={stroke} 
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
});
