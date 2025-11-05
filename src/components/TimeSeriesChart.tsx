import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';

export type TimeRange = 'W' | 'M' | '6M' | 'Y';

type TimeSeriesChartProps = {
  data: { date: Date; value: number }[];
  selectedRange?: TimeRange;
  color?: string;
  showWeekSeparators?: boolean;
};

// Aggregate daily data into monthly averages
function aggregateByMonth(data: { date: Date; value: number }[]) {
  const monthlyData: { [key: string]: { sum: number; count: number; date: Date } } = {};
  
  data.forEach((point) => {
    const monthKey = `${point.date.getFullYear()}-${String(point.date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        sum: 0,
        count: 0,
        date: new Date(point.date.getFullYear(), point.date.getMonth(), 1)
      };
    }
    
    monthlyData[monthKey].sum += point.value;
    monthlyData[monthKey].count += 1;
  });
  
  return Object.values(monthlyData).map(month => ({
    date: month.date,
    value: Math.round(month.sum / month.count)
  }));
}

export default function TimeSeriesChart({ 
  data, 
  selectedRange = 'W',
  color = '#ff6b9d',
  showWeekSeparators = true
}: TimeSeriesChartProps) {
  const width = Dimensions.get('window').width - 32;
  const height = 300;
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // For 6M and Y views, aggregate by month
  const aggregatedData = selectedRange === '6M' || selectedRange === 'Y' 
    ? aggregateByMonth(data)
    : data;

  const maxValue = Math.max(...aggregatedData.map((d: any) => d.value), 1);
  const barWidth = chartWidth / aggregatedData.length;
  const barSpacing = barWidth * 0.2;
  const actualBarWidth = barWidth - barSpacing;

  const formatDay = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()].slice(0, 3);
  };

  const formatMonth = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[date.getMonth()];
  };

  const formatLabel = (date: Date) => {
    if (selectedRange === '6M' || selectedRange === 'Y') {
      return formatMonth(date);
    }
    return formatDay(date);
  };

  // Grid lines
  const gridLines = [0, 5000, 10000, 15000];

  return (
    <View style={styles.chartContainer}>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {gridLines.map((value, i) => {
          const y = padding + chartHeight - (value / maxValue) * chartHeight;
          return (
            <React.Fragment key={i}>
              <Line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#e0e0e0"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <SvgText
                x={width - padding + 5}
                y={y + 4}
                fontSize="10"
                fill="#999"
              >
                {value >= 1000 ? `${value / 1000}k` : value}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Bars */}
        {aggregatedData.map((point: any, i: number) => {
          const barHeight = (point.value / maxValue) * chartHeight;
          const x = padding + i * barWidth + barSpacing / 2;
          const y = padding + chartHeight - barHeight;
          
          const isLast = i === aggregatedData.length - 1;
          const isMonday = point.date.getDay() === 1;
          const shouldShowLabel = selectedRange === 'M' ? isMonday : true;
          const shouldShowWeekSeparator = (selectedRange === 'W' || selectedRange === 'M') && showWeekSeparators;

          return (
            <React.Fragment key={i}>
              {/* Week separator line for Mondays (only for W and M views) */}
              {shouldShowWeekSeparator && isMonday && i > 0 && (
                <Line
                  x1={x - barSpacing / 2}
                  y1={padding}
                  x2={x - barSpacing / 2}
                  y2={height - 20}
                  stroke="#ccc"
                  strokeWidth="1.5"
                />
              )}
              <Rect
                x={x}
                y={y}
                width={actualBarWidth}
                height={barHeight}
                fill={color}
                opacity={isLast ? 1 : 0.7}
                rx={3}
              />
              {shouldShowLabel && (
                <SvgText
                  x={x + actualBarWidth / 2}
                  y={height - 5}
                  fontSize="10"
                  fill="#666"
                  textAnchor="middle"
                >
                  {formatLabel(point.date)}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
});
