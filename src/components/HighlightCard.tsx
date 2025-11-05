import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type HighlightCardProps = {
  emoji: string;
  title: string;
  description: string;
  stats?: { label: string; value: string }[];
  titleColor?: string;
};

export default function HighlightCard({ 
  emoji, 
  title, 
  description, 
  stats,
  titleColor = '#ff6b9d'
}: HighlightCardProps) {
  return (
    <View style={styles.highlightCard}>
      <View style={styles.highlightIcon}>
        <Text style={styles.highlightEmoji}>{emoji}</Text>
      </View>
      <View style={styles.highlightContent}>
        <Text style={[styles.highlightTitle, { color: titleColor }]}>{title}</Text>
        <Text style={styles.highlightDescription}>{description}</Text>
        {stats && stats.length > 0 && (
          <View style={styles.highlightStats}>
            {stats.map((stat, i) => (
              <Text key={i} style={styles.highlightStat}>
                {stat.label} <Text style={styles.highlightStatValue}>{stat.value}</Text>
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  highlightCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginBottom: 12,
  },
  highlightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff5f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightEmoji: {
    fontSize: 24,
  },
  highlightContent: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  highlightDescription: {
    fontSize: 15,
    color: '#111',
    lineHeight: 20,
  },
  highlightStats: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  highlightStat: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  highlightStatValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },
});
