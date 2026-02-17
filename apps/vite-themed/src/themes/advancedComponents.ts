import type { ComponentsConfig } from '@coinbase/cds-web/core/theme';

export const advancedComponents: ComponentsConfig = {
  Button: (props) => ({
    borderRadius: 200,
    ...(props.compact
      ? {
          paddingX: 2,
          paddingY: props.loading ? 1 : 1.5,
          font: props.loading ? 'headline' : 'label1',
        }
      : {
          paddingX: 4,
          paddingY: 2,
          font: 'headline',
        }),
  }),

  IconButton: (props) => ({
    borderRadius: 200,
    borderWidth: 0,
    padding: props.compact ? 1.5 : 2,
  }),

  TextInput: {
    inputBackground: 'bgAlternate',
    bordered: false,
  },

  Switch: {
    background: 'bgTertiary',
  },

  Tooltip: {
    invertColorScheme: false,
  },

  TooltipContent: {
    background: 'bgSecondary',
  },
};
