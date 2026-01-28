import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { ChartDataPoint, ChartScrubParams } from '@coinbase/cds-common';
import {
  sparklineInteractiveData,
  sparklineInteractiveHoverData,
} from '@coinbase/cds-common/internal/visualizations/SparklineInteractiveData';
import { Example, ExampleScreen } from '@coinbase/cds-web/__stories__/storybook';
import { Box, VStack } from '@coinbase/cds-web/layout';
import { css } from '@linaria/core';

import {
  SparklineInteractiveHeader,
  type SparklineInteractiveHeaderRef,
  type SparklineInteractiveSubHead,
} from '../../sparkline-interactive-header/SparklineInteractiveHeader';
import { SparklineInteractive } from '../SparklineInteractive';

export default {
  component: SparklineInteractive,
  title: 'Components/SparklineInteractive',
};

type SparklinePeriod = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
const DEFAULT_PERIOD = 'day';

const periods = [
  { label: '1H', value: 'hour' as const },
  { label: '1D', value: 'day' as const },
  { label: '1W', value: 'week' as const },
  { label: '1M', value: 'month' as const },
  { label: '1Y', value: 'year' as const },
  { label: 'All', value: 'all' as const },
];

const getFormattingConfigForPeriod = (period: SparklinePeriod) => {
  switch (period) {
    case 'hour':
    case 'day':
      return { hour: 'numeric', minute: 'numeric' } as const;
    case 'week':
    case 'month':
      return { month: 'numeric', day: 'numeric' } as const;
    case 'year':
    case 'all':
      return { month: 'numeric', year: 'numeric' } as const;
    default:
      return { month: 'numeric', day: 'numeric' } as const;
  }
};

const getDateHoverOptions = (period: SparklinePeriod) => {
  switch (period) {
    case 'hour':
    case 'day':
    case 'week':
    case 'month':
      return {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      } as const;
    default:
      return {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      } as const;
  }
};

function numToLocaleString(num: number) {
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function generateSubHead(
  point: ChartDataPoint,
  period: SparklinePeriod,
  data: Record<SparklinePeriod, ChartDataPoint[]>,
): SparklineInteractiveSubHead {
  const periodData = data[period];
  const firstPoint = periodData[0];
  const increase = point.value > firstPoint.value;
  return {
    percent: `${numToLocaleString(
      Math.abs((point.value - firstPoint.value) / firstPoint.value) * 100,
    )}%`,
    sign: increase ? 'upwardTrend' : 'downwardTrend',
    variant: increase ? 'positive' : 'negative',
    accessibilityLabel: `on ${new Intl.DateTimeFormat('en-US').format(point?.date)}, ${
      increase ? 'up' : 'down'
    }`,
    priceChange: `$${numToLocaleString(Math.abs(point.value - firstPoint.value))}`,
  };
}

const strokeColor = '#F7931A';
const rgbaStrokeColor = 'rgba(123, 1, 1, 5)';
const rgbStrokeColor = 'rgb(123, 1, 121)';
const autoStrokeColor = 'auto';

const SparklineInteractiveWrapper = (props: any) => {
  const timezoneObj = useMemo(() => ({ timeZone: 'America/New_York' }), []);

  const formatDateWithConfig = useCallback(
    (value: Date, period: SparklinePeriod) => {
      const config = getFormattingConfigForPeriod(period);
      return value.toLocaleString('en-US', { ...timezoneObj, ...config });
    },
    [timezoneObj],
  );

  const formatHoverDate = useCallback(
    (date: Date, period: SparklinePeriod) => {
      return date.toLocaleString('en-US', {
        ...timezoneObj,
        ...getDateHoverOptions(period),
      });
    },
    [timezoneObj],
  );

  return (
    <SparklineInteractive
      defaultPeriod={props.defaultPeriod ?? DEFAULT_PERIOD}
      formatDate={formatDateWithConfig}
      formatHoverDate={!props.hideHoverDate ? formatHoverDate : undefined}
      periods={periods}
      {...props}
    />
  );
};

const customPaddingCss = css`
  padding: var(--space-2);
`;

const centeredContainerCss = css`
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 100vw;
  background-color: var(--color-bgSecondary);
  padding: var(--space-4);
`;

const narrowSparklineCss = css`
  max-width: 750px;
  width: 100%;
  background-color: var(--color-bg);
  padding: var(--space-4);
  border-radius: var(--borderRadius-200);
`;

const formatHoverPrice = (price: number) => `$${price.toLocaleString('en-US')}`;

const WithHeaderNodeExample = () => {
  const [currentPeriod, setCurrentPeriod] = useState<SparklinePeriod>(DEFAULT_PERIOD);
  const headerRef = useRef<SparklineInteractiveHeaderRef>(null);
  const data = sparklineInteractiveData[currentPeriod];
  const lastPoint = data[data.length - 1];
  const timezoneObj = useMemo(() => ({ timeZone: 'America/New_York' }), []);

  const formatDateWithConfig = useCallback(
    (value: Date, period: SparklinePeriod) => {
      const config = getFormattingConfigForPeriod(period);
      return value.toLocaleString('en-US', { ...timezoneObj, ...config });
    },
    [timezoneObj],
  );

  const formatHoverDate = useCallback(
    (date: Date, period: SparklinePeriod) => {
      return date.toLocaleString('en-US', {
        ...timezoneObj,
        ...getDateHoverOptions(period),
      });
    },
    [timezoneObj],
  );

  const handleScrub = useCallback(({ point, period }: ChartScrubParams<SparklinePeriod>) => {
    headerRef.current?.update({
      title: `$${point.value.toLocaleString('en-US')}`,
      subHead: generateSubHead(point, period, sparklineInteractiveData),
    });
  }, []);

  const handleScrubEnd = useCallback(() => {
    headerRef.current?.update({
      title: `$${numToLocaleString(lastPoint.value)}`,
      subHead: generateSubHead(lastPoint, currentPeriod, sparklineInteractiveData),
    });
  }, [currentPeriod, lastPoint]);

  const handleOnPeriodChanged = useCallback((period: SparklinePeriod) => {
    setCurrentPeriod(period);
    const newData = sparklineInteractiveData[period];
    const newLastPoint = newData[newData.length - 1];
    headerRef.current?.update({
      title: `$${numToLocaleString(newLastPoint.value)}`,
      subHead: generateSubHead(newLastPoint, period, sparklineInteractiveData),
    });
  }, []);

  const header = (
    <SparklineInteractiveHeader
      ref={headerRef}
      defaultLabel="Bitcoin Price"
      defaultSubHead={generateSubHead(lastPoint, currentPeriod, sparklineInteractiveData)}
      defaultTitle={`$${numToLocaleString(lastPoint.value)}`}
    />
  );

  return (
    <SparklineInteractive
      data={sparklineInteractiveData}
      defaultPeriod={DEFAULT_PERIOD}
      formatDate={formatDateWithConfig}
      formatHoverDate={formatHoverDate}
      headerNode={header}
      onPeriodChanged={handleOnPeriodChanged}
      onScrub={handleScrub}
      onScrubEnd={handleScrubEnd}
      periods={periods}
      strokeColor="#F7931A"
    />
  );
};

const WithCustomStylesExample = () => {
  const [currentPeriod, setCurrentPeriod] = useState<SparklinePeriod>(DEFAULT_PERIOD);
  const headerRef = useRef<SparklineInteractiveHeaderRef>(null);
  const data = sparklineInteractiveData[currentPeriod];
  const lastPoint = data[data.length - 1];
  const timezoneObj = useMemo(() => ({ timeZone: 'America/New_York' }), []);

  const formatDateWithConfig = useCallback(
    (value: Date, period: SparklinePeriod) => {
      const config = getFormattingConfigForPeriod(period);
      return value.toLocaleString('en-US', { ...timezoneObj, ...config });
    },
    [timezoneObj],
  );

  const formatHoverDate = useCallback(
    (date: Date, period: SparklinePeriod) => {
      return date.toLocaleString('en-US', {
        ...timezoneObj,
        ...getDateHoverOptions(period),
      });
    },
    [timezoneObj],
  );

  const handleScrub = useCallback(({ point, period }: ChartScrubParams<SparklinePeriod>) => {
    headerRef.current?.update({
      title: `$${point.value.toLocaleString('en-US')}`,
      subHead: generateSubHead(point, period, sparklineInteractiveData),
    });
  }, []);

  const handleScrubEnd = useCallback(() => {
    headerRef.current?.update({
      title: `$${numToLocaleString(lastPoint.value)}`,
      subHead: generateSubHead(lastPoint, currentPeriod, sparklineInteractiveData),
    });
  }, [currentPeriod, lastPoint]);

  const handleOnPeriodChanged = useCallback((period: SparklinePeriod) => {
    setCurrentPeriod(period);
    const newData = sparklineInteractiveData[period];
    const newLastPoint = newData[newData.length - 1];
    headerRef.current?.update({
      title: `$${numToLocaleString(newLastPoint.value)}`,
      subHead: generateSubHead(newLastPoint, period, sparklineInteractiveData),
    });
  }, []);

  const header = (
    <SparklineInteractiveHeader
      ref={headerRef}
      defaultLabel="Bitcoin Price"
      defaultSubHead={generateSubHead(lastPoint, currentPeriod, sparklineInteractiveData)}
      defaultTitle={`$${numToLocaleString(lastPoint.value)}`}
    />
  );

  return (
    <SparklineInteractive
      classNames={{ root: customPaddingCss }}
      data={sparklineInteractiveData}
      defaultPeriod={DEFAULT_PERIOD}
      formatDate={formatDateWithConfig}
      formatHoverDate={formatHoverDate}
      headerNode={header}
      onPeriodChanged={handleOnPeriodChanged}
      onScrub={handleScrub}
      onScrubEnd={handleScrubEnd}
      periods={periods}
      strokeColor="#F7931A"
      styles={{ header: { paddingLeft: 0, paddingRight: 0 } }}
    />
  );
};

export const All = () => (
  <ExampleScreen>
    {/* Basic Variations */}
    <Example title="Default">
      <SparklineInteractiveWrapper data={sparklineInteractiveData} strokeColor={strokeColor} />
    </Example>

    <Example title="Compact">
      <SparklineInteractiveWrapper
        compact
        data={sparklineInteractiveData}
        strokeColor={strokeColor}
      />
    </Example>

    <Example title="Contained">
      <VStack borderColor="bgNegative" borderWidth={100}>
        <SparklineInteractiveWrapper data={sparklineInteractiveData} strokeColor={strokeColor} />
      </VStack>
    </Example>

    <Example title="Disable Scrubbing">
      <SparklineInteractiveWrapper
        disableScrubbing
        data={sparklineInteractiveData}
        strokeColor={strokeColor}
      />
    </Example>

    <Example title="Hide Period Selector">
      <SparklineInteractiveWrapper
        hidePeriodSelector
        data={sparklineInteractiveData}
        strokeColor={strokeColor}
      />
    </Example>

    <Example title="Y-Axis Scaling (0.1)">
      <SparklineInteractiveWrapper
        data={sparklineInteractiveData}
        strokeColor={strokeColor}
        yAxisScalingFactor={0.1}
      />
    </Example>

    {/* Stroke Colors */}
    <Example title="Auto Stroke Color">
      <SparklineInteractiveWrapper data={sparklineInteractiveData} strokeColor={autoStrokeColor} />
    </Example>

    <Example title="Custom RGB Stroke Color">
      <SparklineInteractiveWrapper data={sparklineInteractiveData} strokeColor={rgbStrokeColor} />
    </Example>

    <Example title="Custom RGBA Stroke Color">
      <SparklineInteractiveWrapper data={sparklineInteractiveData} strokeColor={rgbaStrokeColor} />
    </Example>

    {/* Fill Options */}
    <Example title="Fill Disabled">
      <SparklineInteractiveWrapper
        data={sparklineInteractiveData}
        fill={false}
        strokeColor={strokeColor}
      />
    </Example>

    <Example title="Dotted Fill Type">
      <SparklineInteractiveWrapper
        data={sparklineInteractiveData}
        fillType="dotted"
        strokeColor={strokeColor}
      />
    </Example>

    {/* Fallback States */}
    <Example title="Fallback Positive (excluded from Percy)">
      <SparklineInteractiveWrapper strokeColor={strokeColor} />
    </Example>

    <Example title="Fallback Negative (excluded from Percy)">
      <SparklineInteractiveWrapper fallbackType="negative" strokeColor={strokeColor} />
    </Example>

    <Example title="Fallback Compact (excluded from Percy)">
      <SparklineInteractiveWrapper compact strokeColor={strokeColor} />
    </Example>

    {/* Hover Features */}
    <Example title="Hover Price">
      <SparklineInteractiveWrapper
        fill
        data={sparklineInteractiveData}
        formatHoverPrice={formatHoverPrice}
        strokeColor={strokeColor}
      />
    </Example>

    <Example title="No Hover Date">
      <SparklineInteractiveWrapper
        fill
        hideHoverDate
        data={sparklineInteractiveData}
        strokeColor={strokeColor}
      />
    </Example>

    <Example title="Hover Data">
      <SparklineInteractiveWrapper
        data={sparklineInteractiveData}
        hoverData={sparklineInteractiveHoverData}
        strokeColor={strokeColor}
      />
    </Example>

    <Example title="Hover Data With Fill">
      <SparklineInteractiveWrapper
        fill
        data={sparklineInteractiveData}
        hoverData={sparklineInteractiveHoverData}
        strokeColor={strokeColor}
      />
    </Example>

    {/* Period Selector */}
    <Example title="Bottom Period Selector">
      <SparklineInteractiveWrapper
        data={sparklineInteractiveData}
        periodSelectorPlacement="below"
        strokeColor={strokeColor}
      />
    </Example>

    <Example title="Time Period Gutter (3)">
      <SparklineInteractiveWrapper
        data={sparklineInteractiveData}
        strokeColor={strokeColor}
        timePeriodGutter={3}
      />
    </Example>

    {/* Layout */}
    <Example title="VStacked Sparkline">
      <VStack width="100%">
        <Box width="100%">
          <SparklineInteractiveWrapper data={sparklineInteractiveData} strokeColor={strokeColor} />
        </Box>
        <Box background="bgSecondary" height={20} paddingTop={8} width="100%">
          This is an element below the sparkline
        </Box>
      </VStack>
    </Example>

    <Example title="Centered Narrow On Wide Screen">
      <div className={centeredContainerCss}>
        <div className={narrowSparklineCss}>
          <SparklineInteractiveWrapper data={sparklineInteractiveData} strokeColor={strokeColor} />
        </div>
      </div>
    </Example>

    {/* Edge Cases */}
    <Example title="No Data In Selected Period">
      <SparklineInteractiveWrapper
        data={{ ...sparklineInteractiveData, hour: [] }}
        strokeColor={strokeColor}
      />
    </Example>

    {/* With Header Node */}
    <Example title="With Header Node">
      <WithHeaderNodeExample />
    </Example>

    {/* Custom Styles */}
    <Example title="With Custom Styles">
      <WithCustomStylesExample />
    </Example>
  </ExampleScreen>
);

All.parameters = {
  percy: { enableJavaScript: true },
  a11y: {
    config: {
      rules: [{ id: 'color-contrast', enabled: false }],
    },
  },
};
