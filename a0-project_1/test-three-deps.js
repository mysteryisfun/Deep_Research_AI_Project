// Simple script to verify Three.js dependencies are available
try {
  // Import Three.js
  const THREE = require('three');
  console.log('THREE.js version:', THREE.REVISION);
  
  // Try importing expo-three
  try {
    const expoThree = require('expo-three');
    console.log('expo-three available:', !!expoThree);
  } catch (err) {
    console.warn('expo-three not available:', err.message);
  }
  
  // Try importing expo-gl
  try {
    const gl = require('expo-gl');
    console.log('expo-gl available:', !!gl);
  } catch (err) {
    console.warn('expo-gl not available:', err.message);
  }
  
  // Try importing expo-asset
  try {
    const asset = require('expo-asset');
    console.log('expo-asset available:', !!asset);
  } catch (err) {
    console.warn('expo-asset not available:', err.message);
  }
  
  // Try importing gsap
  try {
    const gsap = require('gsap');
    console.log('GSAP available:', !!gsap);
  } catch (err) {
    console.warn('gsap not available:', err.message);
  }
  
  console.log('Done checking dependencies!');
} catch (error) {
  console.error('Error checking Three.js dependencies:', error);
} 