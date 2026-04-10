import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Bot, Shield, Globe } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const assets = [
  { name: 'Bitcoin', symbol: 'BTC', price: '$67,842', change: '+2.4%', color: '#f59e0b' },
  { name: 'Ethereum', symbol: 'ETH', price: '$3,421', change: '+1.8%', color: '#3b82f6' },
  { name: 'Apple Inc.', symbol: 'AAPL', price: '$189.45', change: '+1.2%', color: '#9ca3af' },
  { name: 'Tesla', symbol: 'TSLA', price: '$175.22', change: '-2.4%', color: '#ef4444' },
];

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0a0a1a', '#1a1a3a']}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header/Logo */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#3b82f6', '#06b6d4']}
            style={styles.logoIcon}
          >
            <TrendingUp size={24} color="#fff" />
          </LinearGradient>
          <Text style={styles.brandName}>X Bot Trader</Text>
        </View>

        {/* Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            Let AI Trade {'\n'}
            <Text style={styles.highlightText}>Everything</Text> For You
          </Text>
          <Text style={styles.heroSub}>
            The elite simulator for Crypto & Stocks. Join the evolution of automated wealth.
          </Text>
        </View>

        {/* Market Preview */}
        <View style={styles.marketSection}>
          <Text style={styles.sectionTitle}>Market Pulse</Text>
          <View style={styles.assetGrid}>
            {assets.map((asset) => (
              <View key={asset.symbol} style={styles.assetCard}>
                <View style={[styles.colorBar, { backgroundColor: asset.color }]} />
                <Text style={styles.assetName}>{asset.name}</Text>
                <Text style={styles.assetSymbol}>{asset.symbol}</Text>
                <Text style={styles.assetPrice}>{asset.price}</Text>
                <Text style={[styles.assetChange, { color: asset.change.startsWith('+') ? '#4ade80' : '#f87171' }]}>
                  {asset.change}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Features */}
        <View style={styles.featureSection}>
          <View style={styles.featureItem}>
            <Bot size={24} color="#3b82f6" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>AI-Powered Bots</Text>
              <Text style={styles.featureDesc}>Sophisticated DCA and Grid strategies for every market.</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Shield size={24} color="#10b981" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Your Money, Your Keys</Text>
              <Text style={styles.featureDesc}>We never hold funds. Trade directly via Coinbase & Alpaca.</Text>
            </View>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <TouchableOpacity style={styles.primaryButton}>
            <LinearGradient
              colors={['#2563eb', '#0891b2']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryButtonText}>Begin Your Evolution</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Sign In to Sanctuary</Text>
          </TouchableOpacity>
          
          <Text style={styles.footerNote}>
            $20/mo for Live Trading after paper success.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  brandName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  heroSection: {
    marginBottom: 40,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 48,
    marginBottom: 16,
  },
  highlightText: {
    color: '#3b82f6',
  },
  heroSub: {
    fontSize: 16,
    color: '#9ca3af',
    lineHeight: 24,
  },
  marketSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  assetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  assetCard: {
    width: (width - 52) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  colorBar: {
    width: 30,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  assetName: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 2,
  },
  assetSymbol: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  assetPrice: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  assetChange: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  featureSection: {
    marginBottom: 40,
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16,
    borderRadius: 16,
  },
  featureText: {
    marginLeft: 16,
    flex: 1,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featureDesc: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 18,
  },
  ctaSection: {
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    height: 60,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    width: '100%',
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '600',
  },
  footerNote: {
    color: '#4b5563',
    fontSize: 12,
  },
});
