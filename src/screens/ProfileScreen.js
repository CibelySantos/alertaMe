import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Teste</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', // centraliza verticalmente
    alignItems: 'center', // centraliza horizontalmente
    backgroundColor: '#fff', // fundo branco
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
});
