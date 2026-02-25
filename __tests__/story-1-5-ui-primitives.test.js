/* eslint-env jest */

const React = require('react');
const { StyleSheet, View } = require('react-native');
const { render } = require('@testing-library/react-native');

const createMockTheme = () => ({
  background: { val: '#f2f7f3' },
  backgroundHover: { val: '#eaf3ec' },
  borderColor: { val: '#d1d6d1' },
  color: { val: '#1c1c1e' },
  placeholderColor: { val: '#6d6d72' },
  surface: { val: '#ffffff' },
  textPrimary: { val: '#1c1c1e' },
  textSecondary: { val: '#6d6d72' },
  accentBackground: { val: '#34c759' },
  accentBorderColor: { val: '#34c759' },
  accentColor: { val: '#ffffff' },
  success: { val: '#34c759' },
  warning: { val: '#ffcc00' },
  danger: { val: '#ff3b30' },
  shadowColor: { val: '#00000022' },
});

let mockThemeValues = createMockTheme();

jest.mock('tamagui', () => ({
  createTokens: (tokens) => tokens,
  createFont: (font) => font,
  createTamagui: (cfg) => cfg,
  useTheme: () => mockThemeValues,
}));

const { Button, getButtonContainerStyle } = require('../src/components/ui/button');
const { Input } = require('../src/components/ui/input');
const { ListRow } = require('../src/components/ui/list-row');
const { Surface } = require('../src/components/ui/surface');
const { Text } = require('../src/components/ui/text');
const { typeScale } = require('../src/theme/tokens');

describe('Story 1.5 UI primitives', () => {
  beforeEach(() => {
    mockThemeValues = createMockTheme();
  });

  it('keeps dynamic type enabled by default in Text', () => {
    const { getByText } = render(React.createElement(Text, { variant: 'headline' }, 'Hello'));
    const textNode = getByText('Hello');

    expect(textNode.props.allowFontScaling).toBe(true);
    expect(textNode.props.children).toBe('Hello');
  });

  it('enforces minimum 44x44 tap targets and pressed feedback in Button', () => {
    const { getByTestId } = render(React.createElement(Button, { testID: 'save-button' }, 'Save'));
    const pressable = getByTestId('save-button');
    const idleStyle = StyleSheet.flatten(pressable.props.style);
    const pressedStyle = StyleSheet.flatten(
      getButtonContainerStyle({
        pressed: true,
        disabled: false,
        backgroundColor: '#34c759',
        borderColor: '#34c759',
      })
    );

    expect(idleStyle.minHeight).toBeGreaterThanOrEqual(44);
    expect(idleStyle.minWidth).toBeGreaterThanOrEqual(44);
    expect(pressedStyle.opacity).toBeLessThan(idleStyle.opacity ?? 1);
  });

  it('renders Input with token typography, visible labeling, and Dynamic Type enabled', () => {
    const { getByText, getByPlaceholderText } = render(
      React.createElement(Input, {
        label: 'Price',
        helperText: 'Enter dollars and cents',
        placeholder: '1.99',
      })
    );
    const input = getByPlaceholderText('1.99');
    const inputStyle = StyleSheet.flatten(input.props.style);

    expect(getByText('Price')).toBeTruthy();
    expect(getByText('Enter dollars and cents')).toBeTruthy();
    expect(input).toBeTruthy();
    expect(input.props.allowFontScaling).toBe(true);
    expect(inputStyle.fontSize).toBe(typeScale.body.fontSize);
    expect(inputStyle.lineHeight).toBe(typeScale.body.lineHeight);
  });

  it('renders ListRow missing state with explicit text label (not color only)', () => {
    const { getByText } = render(
      React.createElement(ListRow, {
        title: 'Whole Foods',
        subtitle: 'Last capture 2d ago',
        tone: 'missing',
        stateLabel: 'Missing',
        onPress: () => {},
      })
    );

    expect(getByText('Whole Foods')).toBeTruthy();
    expect(getByText('Missing')).toBeTruthy();
  });

  it('derives an accessible summary label for pressable ListRow content', () => {
    const { getByLabelText } = render(
      React.createElement(ListRow, {
        title: 'Store A',
        subtitle: 'Captured yesterday',
        meta: '2d ago',
        stateLabel: 'Available',
        onPress: () => {},
      })
    );

    expect(getByLabelText('Store A, Available, 2d ago, Captured yesterday')).toBeTruthy();
  });

  it('renders Surface with bordered container styling', () => {
    const { getByTestId } = render(
      React.createElement(
        Surface,
        { testID: 'surface-root' },
        React.createElement(View, { testID: 'child' })
      )
    );
    const view = getByTestId('surface-root');
    const style = StyleSheet.flatten(view.props.style);

    expect(style.borderRadius).toBeGreaterThan(0);
    expect(style.borderWidth).toBe(1);
  });

  it('applies theme colors in dark-mode-like values', () => {
    mockThemeValues = {
      ...createMockTheme(),
      background: { val: '#000000' },
      backgroundHover: { val: '#111113' },
      borderColor: { val: '#2c2c2e' },
      color: { val: '#ffffff' },
      surface: { val: '#1c1c1e' },
      textPrimary: { val: '#ffffff' },
      textSecondary: { val: '#a1a1a6' },
      shadowColor: { val: '#00000066' },
    };

    const { getByTestId, getByText } = render(
      React.createElement(
        View,
        null,
        React.createElement(Surface, { testID: 'dark-surface', variant: 'subtle' }),
        React.createElement(Button, { testID: 'dark-button' }, 'Save')
      )
    );

    const surfaceStyle = StyleSheet.flatten(getByTestId('dark-surface').props.style);
    const buttonStyle = StyleSheet.flatten(getByTestId('dark-button').props.style);
    const buttonLabel = getByText('Save');

    expect(surfaceStyle.backgroundColor).toBe('#111113');
    expect(surfaceStyle.borderColor).toBe('#2c2c2e');
    expect(buttonStyle.backgroundColor).toBe('#34c759');
    expect(buttonLabel.props.style[2].color).toBe('#ffffff');
    expect(buttonLabel.props.allowFontScaling).toBe(true);
  });
});
