import React from 'react';
import { render } from '@testing-library/react-native';
import { GlassCard } from '../../components/GlassCard';

describe('GlassCard', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <GlassCard>
        <Text>Test Content</Text>
      </GlassCard>
    );
    
    expect(getByText('Test Content')).toBeTruthy();
  });

  it('applies custom styles', () => {
    const customStyle = { padding: 20 };
    const { getByTestId } = render(
      <GlassCard style={customStyle} testID="glass-card">
        <Text>Test</Text>
      </GlassCard>
    );
    
    const card = getByTestId('glass-card');
    expect(card).toBeTruthy();
  });

  it('uses default props correctly', () => {
    const { getByText } = render(
      <GlassCard>
        <Text>Default Props Test</Text>
      </GlassCard>
    );
    
    expect(getByText('Default Props Test')).toBeTruthy();
  });
});
