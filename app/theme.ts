import { MD3LightTheme, type MD3Theme } from 'react-native-paper';

const theme: MD3Theme = {
  ...MD3LightTheme,
  fonts: {
    ...MD3LightTheme.fonts,
    displayLarge: { ...MD3LightTheme.fonts.displayLarge, fontFamily: 'Poppins-Bold' },
    displayMedium: { ...MD3LightTheme.fonts.displayMedium, fontFamily: 'Poppins-SemiBold' },
    displaySmall: { ...MD3LightTheme.fonts.displaySmall, fontFamily: 'Poppins-Medium' },
    
    headlineLarge: { ...MD3LightTheme.fonts.headlineLarge, fontFamily: 'Poppins-Bold' },
    headlineMedium: { ...MD3LightTheme.fonts.headlineMedium, fontFamily: 'Poppins-SemiBold' },
    headlineSmall: { ...MD3LightTheme.fonts.headlineSmall, fontFamily: 'Poppins-Medium' },
    
    titleLarge: { ...MD3LightTheme.fonts.titleLarge, fontFamily: 'Poppins-SemiBold' },
    titleMedium: { ...MD3LightTheme.fonts.titleMedium, fontFamily: 'Poppins-Medium' },
    titleSmall: { ...MD3LightTheme.fonts.titleSmall, fontFamily: 'Poppins' },
    
    labelLarge: { ...MD3LightTheme.fonts.labelLarge, fontFamily: 'Poppins-SemiBold' },
    labelMedium: { ...MD3LightTheme.fonts.labelMedium, fontFamily: 'Poppins-Medium' },
    labelSmall: { ...MD3LightTheme.fonts.labelSmall, fontFamily: 'Poppins' },
    
    bodyLarge: { ...MD3LightTheme.fonts.bodyLarge, fontFamily: 'Poppins-Medium' },
    bodyMedium: { ...MD3LightTheme.fonts.bodyMedium, fontFamily: 'Poppins' },
    bodySmall: { ...MD3LightTheme.fonts.bodySmall, fontFamily: 'Poppins' },
  },
  roundness: 8,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4a5eff',
    secondary: '#00c853',
    error: '#dc3545',
    background: '#f8f9fa',
    surface: '#ffffff',
  },
};

export default theme; 