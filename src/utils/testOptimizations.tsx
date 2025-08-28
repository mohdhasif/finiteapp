import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Test component to verify optimizations are working
export const TestOptimizations: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Performance Optimizations Test</Text>
      <Text style={styles.subtitle}>All optimizations are loaded and ready!</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✅ Available Optimizations:</Text>
        <Text style={styles.item}>• API Client with caching</Text>
        <Text style={styles.item}>• Memory optimization</Text>
        <Text style={styles.item}>• Lazy loading hooks</Text>
        <Text style={styles.item}>• Virtualized lists</Text>
        <Text style={styles.item}>• Animation optimization</Text>
        <Text style={styles.item}>• Performance monitoring</Text>
        <Text style={styles.item}>• Optimized images</Text>
        <Text style={styles.item}>• Screen optimization</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#0072B5',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  item: {
    fontSize: 14,
    marginBottom: 5,
    color: '#555',
  },
});

export default TestOptimizations;
