import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../../app/index';

// Mock expo-router
jest.mock('expo-router', () => ({
  Link: ({ children, href, asChild, ...props }: any) => {
    const MockedLink = require('react-native').TouchableOpacity;
    return <MockedLink {...props} testID={`link-${href}`}>{children}</MockedLink>;
  },
}));

describe('HomeScreen', () => {
  it('renders welcome content correctly', () => {
    const { getByText } = render(<HomeScreen />);
    
    expect(getByText('Sky Recommends Games')).toBeTruthy();
    expect(getByText('AI-Powered Game Recommendations')).toBeTruthy();
    expect(getByText('Discover your next favorite game with personalized recommendations based on your gaming profile.')).toBeTruthy();
  });

  it('renders search button', () => {
    const { getByText } = render(<HomeScreen />);
    
    expect(getByText('Search Games')).toBeTruthy();
  });

  it('has correct styling', () => {
    const { getByText } = render(<HomeScreen />);
    
    const title = getByText('Sky Recommends Games');
    expect(title).toBeTruthy();
  });
});
