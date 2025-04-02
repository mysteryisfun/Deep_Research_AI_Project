import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

// Theme type definition
export type ThemeType = {
  background: string;
  card: string;
  text: string;
  secondaryText: string;
  accent: string;
  border: string;
  statusBar: 'light' | 'dark';
  inputBackground: string;
  gradientStart: string;
  gradientEnd: string;
  gradient: string[];
};

// Theme context type definition
type ThemeContextType = {
  isDarkMode: boolean;
  theme: ThemeType;
  toggleTheme: () => void;
  isLoading: boolean;
};

// Define theme colors and styles
export const lightTheme: ThemeType = {
  background: '#f8f9fa',
  card: 'white',
  text: '#333333',
  secondaryText: '#666666',
  accent: '#6c63ff',
  border: '#eee',
  statusBar: 'dark',
  inputBackground: '#F1F3F4',
  gradientStart: '#4A00E0',
  gradientEnd: '#8E2DE2',
  gradient: ['#4A00E0', '#8E2DE2'],
};

export const darkTheme: ThemeType = {
  background: '#0F172A', // Dark navy-inspired background
  card: '#1E293B', // Slightly lighter navy for cards
  text: '#E5E7EB', // Light gray for text
  secondaryText: '#CBD5E1', // Lighter gray for secondary text
  accent: '#8B5CF6', // Vibrant purple accent for dark mode
  border: '#334155', // Subtle border color
  statusBar: 'light',
  inputBackground: '#293548', // Slightly lighter than card for inputs
  gradientStart: '#2E3192',
  gradientEnd: '#1BFFFF',
  gradient: ['#2E3192', '#1BFFFF'],
};

// Create the context with default values
const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  theme: lightTheme,
  toggleTheme: () => {},
  isLoading: true
});

// Provider component that wraps the app
export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Determine the active theme based on isDarkMode state
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  // Load saved theme preference on startup
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('appTheme');
        
        if (storedTheme !== null) {
          // Use stored preference if available
          setIsDarkMode(storedTheme === 'dark');
        } else {
          // Otherwise use device preference
          const deviceTheme = Appearance.getColorScheme();
          setIsDarkMode(deviceTheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
        // Default to light theme if there's an error
        setIsDarkMode(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTheme();
    
    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Only apply system changes if user hasn't set a preference
      AsyncStorage.getItem('appTheme').then(storedTheme => {
        if (storedTheme === null) {
          setIsDarkMode(colorScheme === 'dark');
        }
      });
    });
    
    return () => {
      subscription.remove();
    };
  }, []);
  
  // Toggle theme and save preference
  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('appTheme', newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };
  
  // Provide theme context to children components
  return (
    <ThemeContext.Provider value={{ isDarkMode, theme, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using the theme context
export const useTheme = () => useContext(ThemeContext);