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
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = values.length <= 1 ? width : width / (values.length - 1);

  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const baselineY = height - ((0 - min) / range) * height;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        {showBaseline && baselineY >= 0 && baselineY <= height && (
          <Line x1={0} y1={baselineY} x2={width} y2={baselineY} stroke="#eee" strokeWidth={1} />
        )}
        <Polyline points={points} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
});
