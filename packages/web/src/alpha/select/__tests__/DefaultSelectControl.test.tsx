import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ThemeConfig } from '../../../core/theme';
import { coinbaseTheme } from '../../../themes/coinbaseTheme';
import { DefaultThemeProvider } from '../../../utils/test';
import { DefaultSelectControl } from '../DefaultSelectControl';
import type { SelectControlProps, SelectOption } from '../Select';
import type { SelectOptionList } from '../types';

const mockOptions: SelectOption[] = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3', disabled: true },
];

const defaultProps: SelectControlProps<'single' | 'multi'> = {
  options: mockOptions,
  value: 'option1',
  placeholder: 'Select an option',
  onChange: jest.fn(),
  open: false,
  setOpen: jest.fn(),
  label: 'Test Select Control',
};

const denseSpacingTheme: ThemeConfig = {
  ...coinbaseTheme,
  id: 'coinbase-dense-test',
  space: {
    '0': 0,
    '0.25': 2,
    '0.5': 4,
    '0.75': 6,
    '1': 8,
    '1.5': 10,
    '2': 12,
    '3': 16,
    '4': 20,
    '5': 24,
    '6': 28,
    '7': 32,
    '8': 36,
    '9': 40,
    '10': 44,
  },
};

const largeScaleTheme: ThemeConfig = {
  ...coinbaseTheme,
  id: 'coinbase-large-scale-test',
  space: {
    '0': 0,
    '0.25': 3,
    '0.5': 5,
    '0.75': 8,
    '1': 10,
    '1.5': 15,
    '2': 20,
    '3': 30,
    '4': 40,
    '5': 50,
    '6': 60,
    '7': 72,
    '8': 80,
    '9': 90,
    '10': 100,
  },
  fontSize: {
    ...coinbaseTheme.fontSize,
    body: '1.125rem',
  },
  lineHeight: {
    ...coinbaseTheme.lineHeight,
    body: '1.75rem',
  },
};

describe('DefaultSelectControl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Theme spacing', () => {
    const renderWithTheme = (theme: ThemeConfig) => {
      const { container } = render(
        <DefaultThemeProvider theme={theme}>
          <DefaultSelectControl {...defaultProps} />
        </DefaultThemeProvider>,
      );
      return {
        button: screen.getByRole('button'),
        themeRoot: container.firstElementChild as HTMLElement,
        valueNode: screen.getByText('Option 1'),
      };
    };

    it('uses default theme spacing for min height', () => {
      const { button, themeRoot } = renderWithTheme(coinbaseTheme);
      expect(button.style.getPropertyValue('--minHeight')).toBe('var(--space-7)');
      expect(themeRoot.style.getPropertyValue('--space-7')).toBe(`${coinbaseTheme.space['7']}px`);
    });

    it('uses dense spacing for min height', () => {
      const { button, themeRoot } = renderWithTheme(denseSpacingTheme);
      expect(button.style.getPropertyValue('--minHeight')).toBe('var(--space-7)');
      expect(themeRoot.style.getPropertyValue('--space-7')).toBe(
        `${denseSpacingTheme.space['7']}px`,
      );
    });

    it('uses larger spacing and font size when provided', () => {
      const { button, themeRoot, valueNode } = renderWithTheme(largeScaleTheme);
      expect(button.style.getPropertyValue('--minHeight')).toBe('var(--space-7)');
      expect(themeRoot.style.getPropertyValue('--space-7')).toBe(`${largeScaleTheme.space['7']}px`);
      expect(themeRoot.style.getPropertyValue('--fontSize-body')).toBe(
        largeScaleTheme.fontSize.body,
      );
      expect(themeRoot.style.getPropertyValue('--lineHeight-body')).toBe(
        largeScaleTheme.lineHeight.body,
      );
      expect(valueNode).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(
        <DefaultThemeProvider>
          <DefaultSelectControl
            {...defaultProps}
            accessibilityLabel="Custom accessibility label"
            ariaHaspopup="listbox"
            testID="select-control-test"
          />
        </DefaultThemeProvider>,
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-haspopup', 'listbox');
      expect(button).toHaveAttribute('aria-label', 'Custom accessibility label');
    });

    it('renders with proper focus management', async () => {
      const user = userEvent.setup();
      render(
        <DefaultThemeProvider>
          <DefaultSelectControl {...defaultProps} />
        </DefaultThemeProvider>,
      );

      const button = screen.getByRole('button');
      await user.tab();
      expect(button).toHaveFocus();
    });
  });

  describe('Single Select Mode', () => {
    it('renders single select control correctly', () => {
      render(
        <DefaultThemeProvider>
          <DefaultSelectControl {...defaultProps} />
        </DefaultThemeProvider>,
      );

      expect(screen.getByText('Test Select Control')).toBeInTheDocument();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('displays selected value', () => {
      render(
        <DefaultThemeProvider>
          <DefaultSelectControl {...defaultProps} value="option1" />
        </DefaultThemeProvider>,
      );

      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('shows placeholder when no value selected', () => {
      render(
        <DefaultThemeProvider>
          <DefaultSelectControl {...defaultProps} value={null} />
        </DefaultThemeProvider>,
      );

      expect(screen.getByText('Select an option')).toBeInTheDocument();
    });

    it('calls setOpen when clicked', async () => {
      const setOpen = jest.fn();
      const user = userEvent.setup();
      render(
        <DefaultThemeProvider>
          <DefaultSelectControl {...defaultProps} setOpen={setOpen} />
        </DefaultThemeProvider>,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(setOpen).toHaveBeenCalledWith(expect.any(Function));
    });

    it('renders with start node', () => {
      render(
        <DefaultThemeProvider>
          <DefaultSelectControl
            {...defaultProps}
            startNode={<div data-testid="start-node">Start</div>}
          />
        </DefaultThemeProvider>,
      );

      expect(screen.getByTestId('start-node')).toBeInTheDocument();
    });
  });

  describe('Multi Select Mode', () => {
    const multiSelectProps: SelectControlProps<'single' | 'multi'> = {
      ...defaultProps,
      type: 'multi',
      value: [],
      onChange: jest.fn(),
    };

    it('renders multi select control correctly', () => {
      render(
        <DefaultThemeProvider>
          <DefaultSelectControl {...multiSelectProps} />
        </DefaultThemeProvider>,
      );

      expect(screen.getByText('Select an option')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('displays selected values as chips', () => {
      render(
        <DefaultThemeProvider>
          <DefaultSelectControl {...multiSelectProps} value={['option1', 'option2']} />
        </DefaultThemeProvider>,
      );

      expect(screen.getByRole('button', { name: 'Remove Option 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove Option 2' })).toBeInTheDocument();
    });

    it('handles chip removal', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();
      render(
        <DefaultThemeProvider>
          <DefaultSelectControl
            {...multiSelectProps}
            onChange={onChange}
            value={['option1', 'option2']}
          />
        </DefaultThemeProvider>,
      );

      const chipButton = screen.getByRole('button', { name: 'Remove Option 1' });
      await user.click(chipButton);
      expect(onChange).toHaveBeenCalledWith('option1');
    });

    it('shows overflow indicator when maxSelectedOptionsToShow is exceeded', () => {
      render(
        <DefaultThemeProvider>
          <DefaultSelectControl
            {...multiSelectProps}
            maxSelectedOptionsToShow={2}
            value={['option1', 'option2', 'option3', 'option4']}
          />
        </DefaultThemeProvider>,
      );

      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('handles disabled options in chips', () => {
      render(
        <DefaultThemeProvider>
          <DefaultSelectControl
            {...multiSelectProps}
            value={['option1', 'option3']} // option3 is disabled
          />
        </DefaultThemeProvider>,
      );

      const chip1 = screen.getByRole('button', { name: 'Remove Option 1' });
      const chip3 = screen.getByRole('button', { name: 'Remove Option 3' });

      expect(chip1).not.toHaveAttribute('disabled');
      expect(chip3).toHaveAttribute('disabled');
    });
  });

  describe('States and Variants', () => {
    it('renders disabled state correctly', () => {
      render(
        <DefaultThemeProvider>
          <DefaultSelectControl {...defaultProps} disabled />
        </DefaultThemeProvider>,
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });

    it('renders with helper text', () => {
      render(
        <DefaultThemeProvider>
          <DefaultSelectControl {...defaultProps} helperText="This is helper text" />
        </DefaultThemeProvider>,
      );

      expect(screen.getByText('This is helper text')).toBeInTheDocument();
    });
  });

  describe('Keyboard Interaction', () => {
    it('handles Enter key press', async () => {
      const setOpen = jest.fn();
      const user = userEvent.setup();
      render(
        <DefaultThemeProvider>
          <DefaultSelectControl {...defaultProps} setOpen={setOpen} />
        </DefaultThemeProvider>,
      );

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(setOpen).toHaveBeenCalled();
    });

    it('handles Space key press', async () => {
      const setOpen = jest.fn();
      const user = userEvent.setup();
      render(
        <DefaultThemeProvider>
          <DefaultSelectControl {...defaultProps} setOpen={setOpen} />
        </DefaultThemeProvider>,
      );

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');

      expect(setOpen).toHaveBeenCalled();
    });
  });

  describe('Focus Management in Multi-Select', () => {
    const multiSelectProps: SelectControlProps<'multi'> = {
      options: mockOptions,
      placeholder: 'Select an option',
      open: false,
      setOpen: jest.fn(),
      label: 'Test Select Control',
      type: 'multi',
      value: ['option1', 'option2'],
      onChange: jest.fn(),
    };

    it('focuses control when last chip is removed', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();
      render(
        <DefaultThemeProvider>
          <DefaultSelectControl
            {...multiSelectProps}
            onChange={onChange}
            testID="select-control-test"
            value={['option1']}
          />
        </DefaultThemeProvider>,
      );

      const chip = screen.getByRole('button', { name: 'Remove Option 1' });
      await user.click(chip);
      const control = screen.getByTestId('select-control-test');
      const controlInputNode = control.querySelector('button');
      expect(controlInputNode).toHaveFocus();
    });

    it('focuses next chip when middle chip is removed', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();
      render(
        <DefaultThemeProvider>
          <DefaultSelectControl
            {...multiSelectProps}
            onChange={onChange}
            value={['option1', 'option2', 'option3']}
          />
        </DefaultThemeProvider>,
      );

      // Remove the middle chip (option2)
      const chip2 = screen.getByRole('button', { name: 'Remove Option 2' });
      await user.click(chip2);
      expect(onChange).toHaveBeenCalledWith('option2');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <DefaultThemeProvider>
          <DefaultSelectControl {...defaultProps} ref={ref} />
        </DefaultThemeProvider>,
      );

      expect(ref.current).not.toBeNull();
    });
  });

  describe('Duplicate Option Values', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalWarn = console.warn;

    beforeEach(() => {
      console.warn = jest.fn();
    });

    afterEach(() => {
      console.warn = originalWarn;
      process.env.NODE_ENV = originalEnv;
    });

    it('warns about duplicate values in flat options and uses first occurrence', () => {
      process.env.NODE_ENV = 'development';
      const duplicateOptions: SelectOptionList<'single' | 'multi'> = [
        { value: 'duplicate', label: 'First Option' },
        { value: 'option2', label: 'Option 2' },
        { value: 'duplicate', label: 'Second Option' },
      ];

      render(
        <DefaultThemeProvider>
          <DefaultSelectControl {...defaultProps} options={duplicateOptions} value="duplicate" />
        </DefaultThemeProvider>,
      );

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[Select] Duplicate option value detected: "duplicate"'),
      );
      // First occurrence should be used for display
      expect(screen.getByText('First Option')).toBeInTheDocument();
      expect(screen.queryByText('Second Option')).not.toBeInTheDocument();
    });

    it('warns about duplicate values within option groups', () => {
      process.env.NODE_ENV = 'development';
      const optionsWithGroup: SelectControlProps<'single' | 'multi'>['options'] = [
        {
          label: 'Group 1',
          options: [
            { value: 'duplicate', label: 'First in Group' },
            { value: 'duplicate', label: 'Second in Group' },
          ],
        },
      ];

      render(
        <DefaultThemeProvider>
          <DefaultSelectControl {...defaultProps} options={optionsWithGroup} value="duplicate" />
        </DefaultThemeProvider>,
      );

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[Select] Duplicate option value detected: "duplicate"'),
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Found duplicate in group "Group 1"'),
      );
      // First occurrence should be used for display
      expect(screen.getByText('First in Group')).toBeInTheDocument();
      expect(screen.queryByText('Second in Group')).not.toBeInTheDocument();
    });

    it('warns about duplicate values across groups and flat options', () => {
      process.env.NODE_ENV = 'development';
      const mixedOptions: SelectControlProps<'single' | 'multi'>['options'] = [
        { value: 'duplicate', label: 'Flat Option' },
        {
          label: 'Group 1',
          options: [{ value: 'duplicate', label: 'Group Option' }],
        },
      ];

      render(
        <DefaultThemeProvider>
          <DefaultSelectControl {...defaultProps} options={mixedOptions} value="duplicate" />
        </DefaultThemeProvider>,
      );

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[Select] Duplicate option value detected: "duplicate"'),
      );
      // First occurrence (flat option) should be used for display
      expect(screen.getByText('Flat Option')).toBeInTheDocument();
      expect(screen.queryByText('Group Option')).not.toBeInTheDocument();
    });

    it('does not warn in production mode', () => {
      process.env.NODE_ENV = 'production';
      const duplicateOptions: SelectOption[] = [
        { value: 'duplicate', label: 'First Option' },
        { value: 'duplicate', label: 'Second Option' },
      ];

      render(
        <DefaultThemeProvider>
          <DefaultSelectControl {...defaultProps} options={duplicateOptions} value="duplicate" />
        </DefaultThemeProvider>,
      );

      expect(console.warn).not.toHaveBeenCalled();
      // Still uses first occurrence
      expect(screen.getByText('First Option')).toBeInTheDocument();
    });

    it('handles duplicate values in multi-select mode', () => {
      process.env.NODE_ENV = 'development';
      const duplicateOptions: SelectOptionList<'multi'> = [
        { value: 'duplicate', label: 'First Option' },
        { value: 'duplicate', label: 'Second Option' },
      ];

      const multiSelectProps: SelectControlProps<'multi'> = {
        ...defaultProps,
        type: 'multi',
        value: ['duplicate'],
        options: duplicateOptions,
      };

      render(
        <DefaultThemeProvider>
          <DefaultSelectControl {...multiSelectProps} />
        </DefaultThemeProvider>,
      );

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[Select] Duplicate option value detected: "duplicate"'),
      );
      // First occurrence should be used for display
      expect(screen.getByText('First Option')).toBeInTheDocument();
      expect(screen.queryByText('Second Option')).not.toBeInTheDocument();
    });
  });
});
