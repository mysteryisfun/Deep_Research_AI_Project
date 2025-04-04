import React, { useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import { StarBorder } from '../components/ui/StarBorder';
import FloatingPathsBackground from '../components/ui/FloatingPathsBackground';

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { theme, isDarkMode } = useTheme();
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);
  
  const navigateToDashboard = () => {
    navigation.navigate('Dashboard');
  };
  
  const navigateToLogin = () => {
    navigation.navigate('Login');
  };
  
  const navigateToProfile = () => {
    navigation.navigate('Profile');
  };
  
  return (
    <FloatingPathsBackground>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        
        <View style={styles.content}>
          {/* Top Bar */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <View style={styles.logoContainer}>
              <MaterialIcons name="science" size={24} color="#fff" />
              <Text style={styles.logoText}>Royal Research</Text>
            </View>
            <TouchableOpacity onPress={navigateToProfile} style={styles.profileButton}>
              <Ionicons name="person-circle-outline" size={30} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
          
          {/* Main Content */}
          <Animated.View 
            style={[
              styles.mainContent, 
              { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })}] }
            ]}
          >
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                type: 'timing', 
                duration: 1000,
              } as any}
              style={styles.titleContainer}
            >
              <Text style={styles.title}>Welcome to the Future</Text>
              <Text style={styles.subtitle}>
                Explore the frontiers of scientific discovery
              </Text>
            </MotiView>
            <StarBorder 
              title="Get Started" 
              onPress={navigateToDashboard}
              color="#FFD700"
              animationSpeed={3000}
              style={styles.starButton}
            />
            <TouchableOpacity 
              style={styles.backButton}
              onPress={navigateToLogin}
            >
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </FloatingPathsBackground>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  profileButton: {
    padding: 5,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    maxWidth: '80%',
  },
  starButton: {
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#4e7bff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  backButton: {
    marginTop: 20,
    padding: 10,
  },
  backButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
});