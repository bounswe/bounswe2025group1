import * as React from 'react';
import renderer from 'react-test-renderer';

import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColor: jest.fn(),
}));

it(`renders correctly`, () => {
  (useThemeColor as jest.Mock).mockReturnValue('#000000');
  const tree = renderer.create(<ThemedText>Snapshot test!</ThemedText>).toJSON();

  expect(tree).toMatchSnapshot();
});
