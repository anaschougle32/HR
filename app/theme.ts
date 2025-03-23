import { MD3LightTheme } from 'react-native-paper';

const theme = {
  ...MD3LightTheme,
  fonts: {
    ...MD3LightTheme.fonts,
    displayLarge: { fontFamily: 'Poppins-Bold' },
    displayMedium: { fontFamily: 'Poppins-SemiBold' },
    displaySmall: { fontFamily: 'Poppins-Medium' },
    
    headlineLarge: { fontFamily: 'Poppins-Bold' },
    headlineMedium: { fontFamily: 'Poppins-SemiBold' },
    headlineSmall: { fontFamily: 'Poppins-Medium' },
    
    titleLarge: { fontFamily: 'Poppins-SemiBold' },
    titleMedium: { fontFamily: 'Poppins-Medium' },
    titleSmall: { fontFamily: 'Poppins' },
    
    labelLarge: { fontFamily: 'Montserrat-SemiBold' },
    labelMedium: { fontFamily: 'Montserrat-Medium' },
    labelSmall: { fontFamily: 'Montserrat' },
    
    bodyLarge: { fontFamily: 'Montserrat-Medium' },
    bodyMedium: { fontFamily: 'Montserrat' },
    bodySmall: { fontFamily: 'Montserrat' },
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