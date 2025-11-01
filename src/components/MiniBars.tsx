import React from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

type Props = {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  barWidth?: number;
  gap?: number;
  radius?: number;
};

export default function MiniBars({
  values,
  width = 140,
  height = 60,
  color = '#ff6b00',
  barWidth = 6,
  gap = 4,
  radius = 3,
}: Props) {
  if (!values || values.length === 0) return <View style={{ width, height }} />;
  // Show last 14 values for compact view
  const data = values.slice(-14);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const w = Math.min(width, data.length * (barWidth + gap));
  const bars = data.map((v, i) => {
    const x = i * (barWidth + gap);
    const h = Math.max(2, ((v - min) / range) * height);
    const y = height - h;
    return <Rect key={i} x={x} y={y} width={barWidth} height={h} rx={radius} ry={radius} fill={color} />;
  });

  return (
    <View style={{ width: w, height }}>
      <Svg width={w} height={height}>
        {bars}
      </Svg>
    </View>
  );
}
