import { MD3LightTheme, type MD3Theme } from 'react-native-paper';

const theme: MD3Theme = {
  ...MD3LightTheme,
  fonts: {
    ...MD3LightTheme.fonts,
    // Large Display Text - Using Montserrat for headlines and large text
    displayLarge: { ...MD3LightTheme.fonts.displayLarge, fontFamily: 'Montserrat-Bold' },
    displayMedium: { ...MD3LightTheme.fonts.displayMedium, fontFamily: 'Montserrat-SemiBold' },
    displaySmall: { ...MD3LightTheme.fonts.displaySmall, fontFamily: 'Montserrat-Medium' },
    
    // Headlines - Using Montserrat for consistency with display text
    headlineLarge: { ...MD3LightTheme.fonts.headlineLarge, fontFamily: 'Montserrat-Bold' },
    headlineMedium: { ...MD3LightTheme.fonts.headlineMedium, fontFamily: 'Montserrat-SemiBold' },
    headlineSmall: { ...MD3LightTheme.fonts.headlineSmall, fontFamily: 'Montserrat-Medium' },
    
    // Titles - Using Poppins for modern look
    titleLarge: { ...MD3LightTheme.fonts.titleLarge, fontFamily: 'Poppins-SemiBold' },
    titleMedium: { ...MD3LightTheme.fonts.titleMedium, fontFamily: 'Poppins-Medium' },
    titleSmall: { ...MD3LightTheme.fonts.titleSmall, fontFamily: 'Poppins' },
    
    // Labels - Using Verdana for clarity
    labelLarge: { ...MD3LightTheme.fonts.labelLarge, fontFamily: 'Verdana-Bold' },
    labelMedium: { ...MD3LightTheme.fonts.labelMedium, fontFamily: 'Verdana' },
    labelSmall: { ...MD3LightTheme.fonts.labelSmall, fontFamily: 'Verdana' },
    
    // Body Text - Using Poppins for consistency
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