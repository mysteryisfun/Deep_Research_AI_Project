import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Animated, 
  Dimensions,
  Pressable,
  Platform
} from 'react-native';
import { WavyBackground } from '../components/ui/WavyBackground';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Ionicons, 
  MaterialIcons, 
  MaterialCommunityIcons, 
  FontAwesome5, 
  Feather 
} from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import { toast } from 'sonner-native';

// Custom blur component for cross-platform compatibility
const GlassMorphicBlur = ({ intensity = 50, tint = 'dark', style, children }) => {
  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={intensity} tint={tint} style={style}>
        {children}
      </BlurView>
    );
  }
  
  // For Android, we use a semi-transparent background
  return (
    <View style={[style, { backgroundColor: 'rgba(15, 23, 42, 0.75)' }]}>
      {children}
    </View>
  );
};

// Glow effect component
const GlowEffect = ({ color = '#6c63ff', size = 100, style }) => {
  const pulseAnim = useRef(new Animated.Value(0.6)).current;  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: pulseAnim.interpolate({
            inputRange: [0.6, 1],
            outputRange: [0.15, 0.25],
          }),
        },
        style,
      ]}
    />
  );
};

export default function DashboardScreen() {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const { theme, isDarkMode } = useTheme();
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.98],
    extrapolate: 'clamp',
  });
  
  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background Glow Effects */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['#0F172A', '#1A1F35', '#16162D']}
          style={StyleSheet.absoluteFill}
        />
        <GlowEffect 
          color="#4A00E0" 
          size={300} 
          style={{ top: -100, left: -100 }} 
        />
        <GlowEffect 
          color="#8E2DE2" 
          size={250} 
          style={{ bottom: 100, right: -50 }} 
        />
      </View>      {/* Header */}
      <View style={styles.headerContainer}>
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: headerOpacity,
              backgroundColor: 'transparent'
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.emptySpace} />
          
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>      {/* Main Content */}
      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.topBanner}>
          <WavyBackground
            colors={['#6C63FF', '#8E2DE2', '#4A00E0', '#2948ff', '#6C63FF']}
            speed="fast"
            verticalOffset={-40}
            waveOpacity={0.6}
            style={styles.wavyBgContainer}
          >
            <View style={styles.welcomeContainer}>
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 800 }}
              >
                <Text style={styles.welcomeTitle}>Research Dashboard</Text>
                <Text style={styles.welcomeSubtitle}>
                  Access your research tools and resources
                </Text>
              </MotiView>
            </View>
          </WavyBackground>
        </View>

        {/* Grid Layout */}
        <View style={styles.gridContainer}>
          {/* Row 1 */}
          <View style={styles.gridRow}>
            <GridButton 
              title="Start New Research"
              icon={<MaterialIcons name="add-task" size={32} color="#fff" />}
              color={['#4A00E0', '#8E2DE2']}
              delay={100}
              onPress={() => navigateToScreen('ChooseAgentScreen')}
            />
            <GridButton 
              title="History"
              icon={<MaterialIcons name="history" size={32} color="#fff" />}
              color={['#1A2980', '#26D0CE']}
              delay={200}
              onPress={() => navigateToScreen('History')}
            />
          </View>
          
          {/* Row 2 */}
          <View style={styles.gridRow}>
            <GridButton 
              title="Active Queue"
              icon={<MaterialCommunityIcons name="clipboard-text-clock" size={32} color="#fff" />}
              color={['#6a3093', '#a044ff']}
              delay={300}
              onPress={() => navigateToScreen('Queue')}
            />
            <GridButton 
              title="Find Study"
              icon={<Feather name="search" size={32} color="#fff" />}
              color={['#396afc', '#2948ff']}
              delay={400}
              onPress={() => navigateToScreen('FindStudyScreen')}
            />
          </View>
          
          {/* Row 3 - Single Button */}
          <View style={styles.gridRowSingle}>
            <GridButton 
              title="Our Agents"
              icon={<FontAwesome5 name="robot" size={32} color="#fff" />}
              color={['#3a1c71', '#d76d77', '#ffaf7b']}
              delay={500}
              fullWidth
              onPress={() => navigateToScreen('AgentListScreen')}
            />
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// Grid Button Component with enhanced animations
const GridButton = ({ title, icon, color, delay = 0, fullWidth = false, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const [isPressed, setIsPressed] = useState(false);
  
  useEffect(() => {
    if (isPressed) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 500,
          useNativeDriver: false,
        })
      ]).start();
    }
  }, [isPressed]);
  
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ 
        type: 'timing', 
        duration: 600,
        delay
      }}
      style={[styles.gridItemContainer, fullWidth && styles.gridItemFull]}
    >
      <Pressable
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        onPress={onPress}
        style={styles.gridButtonTouch}
      >
        <Animated.View 
          style={[
            styles.gridButton,
            { 
              transform: [{ scale: scaleAnim }],
              shadowOpacity: glowAnim,
            }
          ]}
        >
          <GlassMorphicBlur intensity={40} style={styles.gridBlurContainer}>
            <LinearGradient
              colors={color}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gridButtonGradient}
            >
              <View style={styles.gridButtonIcon}>
                {icon}
              </View>
              <Text style={styles.gridButtonText}>{title}</Text>
            </LinearGradient>
          </GlassMorphicBlur>
        </Animated.View>
      </Pressable>
    </MotiView>
  );
};

// Activity Card Component
const ActivityCard = ({ title, date, status, statusColor, icon, iconBgColor, delay = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);
  
  useEffect(() => {
    if (isPressed) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }
  }, [isPressed]);
  
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ 
        type: 'timing', 
        duration: 400,
        delay
      }}
      style={styles.activityCardContainer}
    >
      <Pressable
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
      >
        <Animated.View 
          style={[
            styles.activityCard,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <GlassMorphicBlur intensity={35} style={styles.activityCardBlur}>
            <View style={styles.activityIconContainer}>
              <View style={[styles.activityIconBg, { backgroundColor: iconBgColor }]}>
                {icon}
              </View>
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{title}</Text>
              <Text style={styles.activityDate}>{date}</Text>
              <View style={[styles.activityStatus, { backgroundColor: `${statusColor}20` }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.activityStatusText, { color: statusColor }]}>{status}</Text>
              </View>
            </View>
          </GlassMorphicBlur>
        </Animated.View>
      </Pressable>
    </MotiView>
  );
};

const { width } = Dimensions.get('window');
const gridItemWidth = width <= 360 ? (width - 32) / 2 : (width - 48) / 2; // Adjust for smaller screens

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backgroundContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: -1,
  },  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  headerBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: 'transparent',
  },
  backButton: {
    padding: 6,
  },
  emptySpace: {
    flex: 1,
  },
  profileButton: {
    padding: 6,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  topBanner: {
    height: 180,
    width: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  wavyBgContainer: {
    height: 180,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    justifyContent: 'center',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  welcomeContainer: {
    marginBottom: 10,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },  gridContainer: {
    padding: width <= 360 ? 12 : 16,
    marginTop: 10,
    marginBottom: width <= 360 ? 12 : 16,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridRowSingle: {
    marginBottom: 16,
  },
  gridItemContainer: {
    width: gridItemWidth,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gridItemFull: {
    width: '100%',
  },
  gridButtonTouch: {
    flex: 1,
  },  gridButton: {
    flex: 1,
    borderRadius: width <= 360 ? 12 : 16,
    overflow: 'hidden',
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 7,
  },
  gridBlurContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  gridButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  gridButtonIcon: {
    marginBottom: 12,
  },  gridButtonText: {
    color: '#fff',
    fontSize: width <= 360 ? 14 : 16,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginTop: width <= 360 ? 8 : 12,
  },
  recentActivityContainer: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitleContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  sectionDivider: {
    height: 2,
    backgroundColor: 'rgba(108, 99, 255, 0.4)',
    width: 50,
    borderRadius: 1,
  },
  activityCardContainer: {
    marginBottom: 12,
  },  activityCard: {
    borderRadius: width <= 360 ? 10 : 12,
    overflow: 'hidden',
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: width <= 360 ? 8 : 12,
  },
  activityCardBlur: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  activityIconContainer: {
    marginRight: 16,
  },
  activityIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  activityStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  activityStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});