import { memo, useCallback, useMemo, useState } from 'react';
import { prices } from '@coinbase/cds-common/internal/data/prices';
import { Button } from '@coinbase/cds-web/buttons';
import { Box, HStack, VStack } from '@coinbase/cds-web/layout';
import { Text } from '@coinbase/cds-web/typography';

import { XAxis, YAxis } from '../axis';
import { BarChart, BarPlot } from '../bar';
import { CartesianChart } from '../CartesianChart';
import { useCartesianChartContext } from '../ChartProvider';
import { Line, LineChart, ReferenceLine, SolidLine } from '../line';
import { Scrubber } from '../scrubber';
import type { ActiveItem, ActiveItems, InteractionState } from '../utils';
import { useInteractionContext, useScrubberContext } from '../utils';

export default {
  title: 'Components/Chart/Interaction',
};

// Sample data - convert string prices to numbers
const samplePrices = prices.slice(0, 30).map(Number);

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);

/**
 * Basic interaction with the new API
 */
export function BasicInteraction() {
  const [activeItem, setActiveItem] = useState<ActiveItem | undefined>(undefined);

  const accessibilityLabel = useCallback((item: ActiveItem) => {
    if (item.dataIndex === null) return 'Interacting with chart';
    return `Day ${item.dataIndex + 1}: ${formatPrice(samplePrices[item.dataIndex])}`;
  }, []);

  return (
    <VStack gap={2}>
      <Text as="h2" font="title3">
        Basic Interaction (Single Mode)
      </Text>
      <Text as="p" color="fgMuted">
        Hover or touch the chart to see interaction state.
      </Text>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">
          Active: {activeItem ? `dataIndex: ${activeItem.dataIndex}` : 'Not interacting'}
        </Text>
      </Box>

      <LineChart
        showArea
        showYAxis
        accessibilityLabel={accessibilityLabel}
        height={250}
        interaction="single"
        onInteractionChange={(state) => setActiveItem(state as ActiveItem | undefined)}
        series={[{ id: 'price', data: samplePrices }]}
      >
        <Scrubber />
      </LineChart>
    </VStack>
  );
}

/**
 * Controlled state - programmatically set the active item
 */
export function ControlledState() {
  // null = controlled mode with no active item (ignores user input)
  // ActiveItem = controlled mode with specific active item
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);

  return (
    <VStack gap={2}>
      <Text as="h2" font="title3">
        Controlled State
      </Text>
      <Text as="p" color="fgMuted">
        Use buttons to programmatically select data points. Pass null to clear without listening to
        user input.
      </Text>

      <HStack gap={1}>
        <Button compact onClick={() => setActiveItem({ dataIndex: 0, seriesId: null })}>
          First
        </Button>
        <Button compact onClick={() => setActiveItem({ dataIndex: 14, seriesId: null })}>
          Middle
        </Button>
        <Button compact onClick={() => setActiveItem({ dataIndex: 29, seriesId: null })}>
          Last
        </Button>
        <Button compact onClick={() => setActiveItem(null)} variant="secondary">
          Clear
        </Button>
      </HStack>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">
          Index: {activeItem?.dataIndex ?? 'none'}
          {activeItem?.dataIndex !== undefined &&
            activeItem.dataIndex !== null &&
            ` (${formatPrice(samplePrices[activeItem.dataIndex])})`}
        </Text>
      </Box>

      <LineChart
        showArea
        showYAxis
        activeItem={activeItem}
        height={250}
        interaction="single"
        series={[{ id: 'price', data: samplePrices }]}
      >
        <Scrubber />
      </LineChart>
    </VStack>
  );
}

/**
 * Interaction disabled
 */
export function InteractionDisabled() {
  return (
    <VStack gap={2}>
      <Text as="h2" font="title3">
        Interaction Disabled
      </Text>
      <Text as="p" color="fgMuted">
        Set interaction=&quot;none&quot; to disable all interaction.
      </Text>

      <LineChart
        showArea
        showYAxis
        accessibilityLabel="Bitcoin price chart - display only"
        height={250}
        interaction="none"
        series={[{ id: 'price', data: samplePrices }]}
      />
    </VStack>
  );
}

/**
 * Backwards compatibility with legacy props
 */
export function BackwardsCompatibility() {
  const [scrubberPosition, setScrubberPosition] = useState<number | undefined>(undefined);

  return (
    <VStack gap={2}>
      <Text as="h2" font="title3">
        Backwards Compatibility
      </Text>
      <Text as="p" color="fgMuted">
        Legacy enableScrubbing and onScrubberPositionChange props still work.
      </Text>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">Scrubber Position: {scrubberPosition ?? 'none'}</Text>
      </Box>

      <LineChart
        enableScrubbing
        showArea
        showYAxis
        height={250}
        onScrubberPositionChange={setScrubberPosition}
        series={[{ id: 'price', data: samplePrices }]}
      >
        <Scrubber />
      </LineChart>
    </VStack>
  );
}

/**
 * Static vs Dynamic accessibility label
 */
export function AccessibilityLabels() {
  return (
    <VStack gap={4}>
      <VStack gap={2}>
        <Text as="h2" font="title3">
          Static Accessibility Label (string)
        </Text>
        <LineChart
          showArea
          accessibilityLabel="Bitcoin price chart showing 30 days"
          height={200}
          interaction="single"
          series={[{ id: 'price', data: samplePrices }]}
        >
          <Scrubber />
        </LineChart>
      </VStack>

      <VStack gap={2}>
        <Text as="h2" font="title3">
          Dynamic Accessibility Label (function)
        </Text>
        <LineChart
          showArea
          accessibilityLabel={(item: ActiveItem) =>
            item.dataIndex !== null
              ? `Day ${item.dataIndex + 1}: ${formatPrice(samplePrices[item.dataIndex])}`
              : 'Interacting with chart'
          }
          height={200}
          interaction="single"
          series={[{ id: 'price', data: samplePrices }]}
        >
          <Scrubber />
        </LineChart>
      </VStack>
    </VStack>
  );
}

/**
 * Multi-series chart with interaction
 */
export function MultiSeriesInteraction() {
  const [activeItem, setActiveItem] = useState<ActiveItem | undefined>(undefined);

  const series1Data = useMemo(() => samplePrices, []);
  const series2Data = useMemo(() => samplePrices.map((p) => p * 0.8 + Math.random() * 1000), []);

  return (
    <VStack gap={2}>
      <Text as="h2" font="title3">
        Multi-Series Interaction
      </Text>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">
          Index: {activeItem?.dataIndex ?? 'none'}
          {activeItem?.dataIndex !== undefined && activeItem.dataIndex !== null && (
            <>
              {' '}
              | BTC: {formatPrice(series1Data[activeItem.dataIndex])} | ETH:{' '}
              {formatPrice(series2Data[activeItem.dataIndex])}
            </>
          )}
        </Text>
      </Box>

      <CartesianChart
        height={250}
        interaction="single"
        onInteractionChange={(state) => setActiveItem(state as ActiveItem | undefined)}
        series={[
          { id: 'btc', data: series1Data, color: 'var(--color-fgPrimary)', label: 'BTC' },
          { id: 'eth', data: series2Data, color: 'var(--color-fgPositive)', label: 'ETH' },
        ]}
      >
        <YAxis position="left" />
        <Line seriesId="btc" />
        <Line seriesId="eth" />
        <Scrubber label={(dataIndex: number) => `Day ${dataIndex + 1}`} />
      </CartesianChart>
    </VStack>
  );
}

/**
 * Interaction callback details
 */
export function InteractionCallbackDetails() {
  const [events, setEvents] = useState<string[]>([]);

  const handleInteractionChange = useCallback((state: InteractionState) => {
    const item = state as ActiveItem | undefined;
    const event = item
      ? `{ dataIndex: ${item.dataIndex}, seriesId: ${item.seriesId ?? 'null'} }`
      : 'undefined';
    setEvents((prev) => [...prev.slice(-9), event]);
  }, []);

  return (
    <VStack gap={2}>
      <Text as="h2" font="title3">
        Interaction Callback Details
      </Text>

      <Box background="bgSecondary" borderRadius={200} padding={2} style={{ minHeight: 150 }}>
        <Text color="fgMuted" font="caption">
          Recent events:
        </Text>
        {events.length === 0 ? (
          <Text color="fgMuted" font="body">
            Interact with the chart...
          </Text>
        ) : (
          events.map((event, i) => (
            <Text key={i} font="legal">
              {event}
            </Text>
          ))
        )}
      </Box>

      <LineChart
        showArea
        height={200}
        interaction="single"
        onInteractionChange={handleInteractionChange}
        series={[{ id: 'price', data: samplePrices }]}
      >
        <Scrubber />
      </LineChart>
    </VStack>
  );
}

/**
 * Multi-touch interaction with reference lines
 */
export function MultiTouchInteraction() {
  const [activeItems, setActiveItems] = useState<ActiveItems>([]);

  // Custom component that renders a ReferenceLine for each active touch point
  const MultiTouchReferenceLines = memo(() => {
    const { activeItem } = useInteractionContext();
    const items = (activeItem as ActiveItems) ?? [];

    // Different colors for each touch point
    const colors = [
      'var(--color-fgPrimary)',
      'var(--color-fgPositive)',
      'var(--color-fgNegative)',
      'var(--color-fgWarning)',
    ];

    return (
      <>
        {items.map((item, index) =>
          item.dataIndex !== null ? (
            <ReferenceLine
              key={index}
              labelElevated
              LineComponent={SolidLine}
              dataX={item.dataIndex}
              label={`Touch ${index + 1}: Day ${item.dataIndex + 1}`}
              stroke={colors[index % colors.length]}
            />
          ) : null,
        )}
      </>
    );
  });

  return (
    <VStack gap={2}>
      <Text as="h2" font="title3">
        Multi-Touch Interaction
      </Text>
      <Text as="p" color="fgMuted">
        Use multiple fingers on a touch device to see multiple reference lines. Each touch point
        gets a different color.
      </Text>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">
          Active touches: {activeItems.length}
          {activeItems.length > 0 &&
            ` (${activeItems.map((item) => `Day ${(item.dataIndex ?? 0) + 1}`).join(', ')})`}
        </Text>
      </Box>

      <LineChart
        showArea
        showYAxis
        height={300}
        inset={{ top: 40 }}
        interaction="multi"
        onInteractionChange={(state) => setActiveItems((state as ActiveItems) ?? [])}
        series={[{ id: 'price', data: samplePrices }]}
      >
        <MultiTouchReferenceLines />
      </LineChart>
    </VStack>
  );
}

// Shared data for synchronized charts example (from MUI example)
const xAxisData = ['0', '2', '5', '10', '20'];
const seriesA = [3, 4, 1, 6, 5];
const seriesB = [4, 3, 1, 5, 8];

// Custom component that highlights the entire bar bandwidth
const BandwidthHighlight = memo(() => {
  const { getXScale, drawingArea } = useCartesianChartContext();
  const { scrubberPosition } = useScrubberContext();
  const xScale = getXScale();

  if (!xScale || scrubberPosition === undefined || !drawingArea) return null;

  const xPos = xScale(scrubberPosition);
  // Type guard to check if scale has bandwidth (band scale)
  const bandwidth = 'bandwidth' in xScale ? xScale.bandwidth() : 0;

  if (xPos === undefined) return null;

  return (
    <rect
      fill="var(--color-bgPrimary)"
      fillOpacity={0.2}
      height={drawingArea.height}
      width={bandwidth}
      x={xPos}
      y={drawingArea.y}
    />
  );
});

/**
 * Synchronized interaction across multiple charts
 */
export function SynchronizedCharts() {
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);

  const handleInteractionChange = useCallback((state: InteractionState) => {
    setActiveItem((state as ActiveItem) ?? null);
  }, []);

  return (
    <VStack gap={2}>
      <Text as="h2" font="title3">
        Synchronized Charts
      </Text>
      <Text as="p" color="fgMuted">
        Interact with either chart and both will highlight the same data point. Similar to MUI
        highlightedAxis behavior.
      </Text>

      <HStack gap={1}>
        {xAxisData.map((label, index) => (
          <Button
            key={index}
            compact
            onClick={() => setActiveItem({ dataIndex: index, seriesId: null })}
            variant={activeItem?.dataIndex === index ? 'primary' : 'secondary'}
          >
            {label}
          </Button>
        ))}
        <Button compact onClick={() => setActiveItem(null)} variant="tertiary">
          Clear
        </Button>
      </HStack>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">
          Highlighted index: {activeItem?.dataIndex ?? 'none'}
          {activeItem?.dataIndex !== null &&
            activeItem?.dataIndex !== undefined &&
            ` (A: ${seriesA[activeItem.dataIndex]}, B: ${seriesB[activeItem.dataIndex]})`}
        </Text>
      </Box>

      <CartesianChart
        activeItem={activeItem}
        height={200}
        interaction="single"
        onInteractionChange={handleInteractionChange}
        series={[
          { id: 'A', data: seriesA, label: 'Series A', color: 'var(--color-fgPrimary)' },
          { id: 'B', data: seriesB, label: 'Series B', color: 'var(--color-fgPositive)' },
        ]}
        xAxis={{ scaleType: 'band', data: xAxisData }}
      >
        <YAxis />
        <XAxis />
        <BarPlot />
        <BandwidthHighlight />
      </CartesianChart>

      <CartesianChart
        activeItem={activeItem}
        height={200}
        interaction="single"
        onInteractionChange={handleInteractionChange}
        series={[
          { id: 'A', data: seriesA, label: 'Series A', color: 'var(--color-fgPrimary)' },
          { id: 'B', data: seriesB, label: 'Series B', color: 'var(--color-fgPositive)' },
        ]}
        xAxis={{ scaleType: 'band', data: xAxisData }}
      >
        <YAxis />
        <XAxis />
        <Line seriesId="A" />
        <Line seriesId="B" />
        <Scrubber />
      </CartesianChart>
    </VStack>
  );
}

/**
 * Series interaction - track which specific bar/series is being hovered
 */
export function SeriesInteraction() {
  const [activeItem, setActiveItem] = useState<ActiveItem | undefined>(undefined);

  const handleInteractionChange = useCallback((state: InteractionState) => {
    setActiveItem(state as ActiveItem | undefined);
  }, []);

  const seriesColors: Record<string, string> = {
    A: 'var(--color-fgPrimary)',
    B: 'var(--color-fgPositive)',
    C: 'var(--color-fgWarning)',
  };

  return (
    <VStack gap={2}>
      <Text as="h2" font="title3">
        Series Interaction
      </Text>
      <Text as="p" color="fgMuted">
        Hover over individual bars to see both dataIndex and seriesId tracked. Uses InteractiveBar
        component.
      </Text>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">
          {activeItem ? (
            <>
              Index: {activeItem.dataIndex ?? 'none'}
              {activeItem.seriesId && (
                <>
                  {' '}
                  | Series:{' '}
                  <Text as="span" font="body" style={{ color: seriesColors[activeItem.seriesId] }}>
                    {activeItem.seriesId}
                  </Text>
                </>
              )}
            </>
          ) : (
            'Hover over a bar...'
          )}
        </Text>
      </Box>

      <BarChart
        height={250}
        interaction="single"
        interactionScope={{ dataIndex: true, series: true }}
        onInteractionChange={handleInteractionChange}
        series={[
          { id: 'A', data: seriesA, label: 'Series A', color: seriesColors.A },
          { id: 'B', data: seriesB, label: 'Series B', color: seriesColors.B },
          { id: 'C', data: [2, 5, 3, 4, 6], label: 'Series C', color: seriesColors.C },
        ]}
        xAxis={{ scaleType: 'band', data: xAxisData }}
      />
    </VStack>
  );
}

/**
 * Test overlapping bars with separate BarPlots to verify z-order behavior
 */
export function OverlappingBarsZOrder() {
  const [activeItem, setActiveItem] = useState<ActiveItem | undefined>(undefined);
  const [eventLog, setEventLog] = useState<string[]>([]);

  const handleInteractionChange = useCallback((state: InteractionState) => {
    const item = state as ActiveItem | undefined;
    setActiveItem(item);

    // Log the event
    if (item) {
      const logEntry = `${new Date().toLocaleTimeString()}: dataIndex=${item.dataIndex}, seriesId=${item.seriesId ?? 'null'}`;
      setEventLog((prev) => [logEntry, ...prev.slice(0, 9)]);
    }
  }, []);

  const seriesColors: Record<string, string> = {
    revenue: 'var(--color-fgWarning)',
    profitMargin: 'rgba(0, 255, 0, 0.25)',
  };

  return (
    <VStack gap={2}>
      <Text as="h2" font="title3">
        Overlapping Bars Z-Order Test
      </Text>
      <Text as="p" color="fgMuted">
        Two separate BarPlots with different y-axes. The bars overlap at the same x positions. Hover
        to see which series is detected. The second BarPlot (profitMargin/green) is rendered on top.
      </Text>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">
          {activeItem ? (
            <>
              Index: {activeItem.dataIndex ?? 'none'}
              {activeItem.seriesId && (
                <>
                  {' '}
                  | Series:{' '}
                  <Text as="span" font="body" style={{ color: seriesColors[activeItem.seriesId] }}>
                    {activeItem.seriesId}
                  </Text>
                </>
              )}
            </>
          ) : (
            'Hover over a bar...'
          )}
        </Text>
      </Box>

      <CartesianChart
        height={300}
        inset={{ top: 8, bottom: 8, left: 0, right: 0 }}
        interaction="single"
        interactionScope={{ dataIndex: true, series: true }}
        onInteractionChange={handleInteractionChange}
        series={[
          {
            id: 'revenue',
            data: [455, 520, 380, 455, 285, 235],
            yAxisId: 'revenue',
            color: seriesColors.revenue,
          },
          {
            id: 'profitMargin',
            data: [23, 20, 16, 38, 12, 9],
            yAxisId: 'profitMargin',
            color: seriesColors.profitMargin,
          },
        ]}
        xAxis={{
          data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          scaleType: 'band',
        }}
        yAxis={[
          {
            id: 'revenue',
            domain: { min: 0 },
          },
          {
            id: 'profitMargin',
            domain: { min: 0, max: 100 },
          },
        ]}
      >
        <XAxis showLine showTickMarks />
        <YAxis
          showGrid
          showLine
          showTickMarks
          axisId="revenue"
          position="left"
          requestedTickCount={5}
          tickLabelFormatter={(value) => `$${value}k`}
          width={60}
        />
        <YAxis
          showLine
          showTickMarks
          axisId="profitMargin"
          position="right"
          requestedTickCount={5}
          tickLabelFormatter={(value) => `${value}%`}
        />
        {/* First BarPlot - rendered first (underneath) */}
        <BarPlot seriesIds={['revenue']} />
        {/* Second BarPlot - rendered second (on top) */}
        <BarPlot seriesIds={['profitMargin']} />
      </CartesianChart>

      <HStack gap={2} justifyContent="center">
        <HStack alignItems="center" gap={0.5}>
          <Box
            borderRadius={1000}
            height={10}
            style={{ background: seriesColors.revenue }}
            width={10}
          />
          <Text font="legal">Revenue (rendered first - underneath)</Text>
        </HStack>
        <HStack alignItems="center" gap={0.5}>
          <Box
            borderRadius={1000}
            height={10}
            style={{ background: seriesColors.profitMargin }}
            width={10}
          />
          <Text font="legal">Profit Margin (rendered second - on top)</Text>
        </HStack>
      </HStack>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text color="fgMuted" font="caption">
          Event Log (most recent first):
        </Text>
        {eventLog.length === 0 ? (
          <Text color="fgMuted" font="legal">
            Interact with the chart...
          </Text>
        ) : (
          eventLog.map((log, i) => (
            <Text key={i} font="legal">
              {log}
            </Text>
          ))
        )}
      </Box>
    </VStack>
  );
}
