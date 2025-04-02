import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

// Create an AnimatedPath component that can be animated
const AnimatedPath = Animated.createAnimatedComponent(Path);

const FloatingPathsSection = ({ position = 1 }) => {
  // Get current theme for proper coloring
  const { isDarkMode } = useTheme();
  const pathColor = isDarkMode ? '#fff' : '#1e293b';
  
  // Create paths with animations
  const paths = Array.from({ length: 24 }, (_, i) => {
    const pathAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0.1 + i * 0.01)).current;
    
    // Define dynamic path for each line based on the position parameter
    const pathD = `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`;
    
    // Start the animation
    useEffect(() => {
      // Duration varies for each path for more organic movement
      const duration = 15000 + Math.random() * 12000;
      
      // Path animation
      Animated.loop(
        Animated.timing(pathAnim, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        })
      ).start();
      
      // Opacity animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.3 + i * 0.01,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.1 + i * 0.01,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      return () => {
        pathAnim.stopAnimation();
        opacityAnim.stopAnimation();
      };
    }, []);
    
    return {
      id: i,
      pathD,
      pathAnim,
      opacityAnim,
      width: 0.5 + i * 0.03,
    };
  });
  
  return (
    <View style={styles.container}>
      <Svg width="100%" height="100%" viewBox="0 0 800 600">
        {paths.map((path) => (
          <AnimatedPath
            key={path.id}
            d={path.pathD}
            stroke={pathColor}
            strokeWidth={path.width}
            strokeOpacity={path.opacityAnim}
            strokeDasharray={[1, 1]}
            strokeDashoffset={path.pathAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            })}
            fill="none"
          />
        ))}
      </Svg>
    </View>
  );
};

const AnimatedPathsBackground = ({ children }) => {
  const { isDarkMode } = useTheme();
  const backgroundColor = isDarkMode ? '#0f172a' : '#f8fafc';
  
  return (
    <View style={[styles.backgroundContainer, { backgroundColor }]}>
      {/* Floating paths with different positions for varied effect */}
      <View style={styles.pathsContainer}>
        <FloatingPathsSection position={1} />
        <FloatingPathsSection position={-1} />
        <FloatingPathsSection position={0.5} />
      </View>
      
      {/* Semi-transparent overlay for better content visibility */}
      <View style={[
        styles.overlay, 
        { backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.25)' : 'rgba(255, 255, 255, 0.25)' }
      ]} />
      
      {/* Render the child components above the background */}
      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundContainer: {
    flex: 1,
    position: 'relative',
  },
  pathsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backdropFilter: 'blur(1px)', // Note: only works on iOS
  },
  contentContainer: {
    flex: 1,
  },
});

export default AnimatedPathsBackground;