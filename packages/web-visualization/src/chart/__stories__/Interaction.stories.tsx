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
import type { HighlightedItem } from '../utils';
import { useHighlightContext, useScrubberContext } from '../utils';

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
 * Basic highlighting with the new API
 */
export function BasicHighlighting() {
  const [highlight, setHighlight] = useState<HighlightedItem[]>([]);

  const accessibilityLabel = useCallback((item: HighlightedItem) => {
    if (item.dataIndex === null) return 'Interacting with chart';
    return `Day ${item.dataIndex + 1}: ${formatPrice(samplePrices[item.dataIndex])}`;
  }, []);

  return (
    <VStack gap={2}>
      <Text as="h2" font="title3">
        Basic Highlighting
      </Text>
      <Text as="p" color="fgMuted">
        Hover or touch the chart to see highlight state.
      </Text>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">
          Active:{' '}
          {highlight.length > 0 ? `dataIndex: ${highlight[0]?.dataIndex}` : 'Not interacting'}
        </Text>
      </Box>

      <LineChart
        showArea
        showYAxis
        accessibilityLabel={accessibilityLabel}
        height={250}
        onHighlightChange={setHighlight}
        series={[{ id: 'price', data: samplePrices }]}
      >
        <Scrubber />
      </LineChart>
    </VStack>
  );
}

/**
 * Controlled state - programmatically set the highlighted item
 */
export function ControlledState() {
  // null = controlled mode with no highlights
  // HighlightedItem[] = controlled mode with specific highlights
  const [highlight, setHighlight] = useState<HighlightedItem[] | undefined>(undefined);

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
        <Button compact onClick={() => setHighlight([{ dataIndex: 0, seriesId: null }])}>
          First
        </Button>
        <Button compact onClick={() => setHighlight([{ dataIndex: 14, seriesId: null }])}>
          Middle
        </Button>
        <Button compact onClick={() => setHighlight([{ dataIndex: 29, seriesId: null }])}>
          Last
        </Button>
        <Button compact onClick={() => setHighlight(undefined)} variant="secondary">
          Clear
        </Button>
      </HStack>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">
          Index: {highlight?.[0]?.dataIndex ?? 'none'}
          {highlight?.[0]?.dataIndex !== undefined &&
            highlight[0].dataIndex !== null &&
            ` (${formatPrice(samplePrices[highlight[0].dataIndex])})`}
        </Text>
      </Box>

      <LineChart
        showArea
        showYAxis
        height={250}
        highlight={highlight}
        series={[{ id: 'price', data: samplePrices }]}
      >
        <Scrubber />
      </LineChart>
    </VStack>
  );
}

/**
 * Highlighting disabled
 */
export function HighlightingDisabled() {
  return (
    <VStack gap={2}>
      <Text as="h2" font="title3">
        Highlighting Disabled
      </Text>
      <Text as="p" color="fgMuted">
        Set enableHighlighting=false to disable all highlighting.
      </Text>

      <LineChart
        showArea
        showYAxis
        accessibilityLabel="Bitcoin price chart - display only"
        enableHighlighting={false}
        height={250}
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
          accessibilityLabel={(item: HighlightedItem) =>
            item.dataIndex !== null
              ? `Day ${item.dataIndex + 1}: ${formatPrice(samplePrices[item.dataIndex])}`
              : 'Interacting with chart'
          }
          height={200}
          series={[{ id: 'price', data: samplePrices }]}
        >
          <Scrubber />
        </LineChart>
      </VStack>
    </VStack>
  );
}

/**
 * Multi-series chart with highlighting
 */
export function MultiSeriesHighlighting() {
  const [highlight, setHighlight] = useState<HighlightedItem[]>([]);

  const series1Data = useMemo(() => samplePrices, []);
  const series2Data = useMemo(() => samplePrices.map((p) => p * 0.8 + Math.random() * 1000), []);

  return (
    <VStack gap={2}>
      <Text as="h2" font="title3">
        Multi-Series Highlighting
      </Text>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">
          Index: {highlight[0]?.dataIndex ?? 'none'}
          {highlight[0]?.dataIndex !== undefined && highlight[0].dataIndex !== null && (
            <>
              {' '}
              | BTC: {formatPrice(series1Data[highlight[0].dataIndex])} | ETH:{' '}
              {formatPrice(series2Data[highlight[0].dataIndex])}
            </>
          )}
        </Text>
      </Box>

      <CartesianChart
        height={250}
        onHighlightChange={setHighlight}
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
 * Highlight callback details
 */
export function HighlightCallbackDetails() {
  const [events, setEvents] = useState<string[]>([]);

  const handleHighlightChange = useCallback((items: HighlightedItem[]) => {
    const item = items[0];
    const event = item
      ? `{ dataIndex: ${item.dataIndex}, seriesId: ${item.seriesId ?? 'null'} }`
      : '[]';
    setEvents((prev) => [...prev.slice(-9), event]);
  }, []);

  return (
    <VStack gap={2}>
      <Text as="h2" font="title3">
        Highlight Callback Details
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
        onHighlightChange={handleHighlightChange}
        series={[{ id: 'price', data: samplePrices }]}
      >
        <Scrubber />
      </LineChart>
    </VStack>
  );
}

/**
 * Multi-touch highlighting with reference lines
 */
export function MultiTouchHighlighting() {
  const [highlight, setHighlight] = useState<HighlightedItem[]>([]);

  // Custom component that renders a ReferenceLine for each highlighted touch point
  const MultiTouchReferenceLines = memo(() => {
    const { highlight: items } = useHighlightContext();

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
        Multi-Touch Highlighting
      </Text>
      <Text as="p" color="fgMuted">
        Use multiple fingers on a touch device to see multiple reference lines. Each touch point
        gets a different color.
      </Text>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">
          Active touches: {highlight.length}
          {highlight.length > 0 &&
            ` (${highlight.map((item) => `Day ${(item.dataIndex ?? 0) + 1}`).join(', ')})`}
        </Text>
      </Box>

      <LineChart
        showArea
        showYAxis
        height={300}
        inset={{ top: 40 }}
        onHighlightChange={setHighlight}
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
 * Synchronized highlighting across multiple charts
 */
export function SynchronizedCharts() {
  const [highlight, setHighlight] = useState<HighlightedItem[] | undefined>(undefined);

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
            onClick={() => setHighlight([{ dataIndex: index, seriesId: null }])}
            variant={highlight?.[0]?.dataIndex === index ? 'primary' : 'secondary'}
          >
            {label}
          </Button>
        ))}
        <Button compact onClick={() => setHighlight(undefined)} variant="tertiary">
          Clear
        </Button>
      </HStack>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">
          Highlighted index: {highlight?.[0]?.dataIndex ?? 'none'}
          {highlight?.[0]?.dataIndex !== null &&
            highlight?.[0]?.dataIndex !== undefined &&
            ` (A: ${seriesA[highlight[0].dataIndex]}, B: ${seriesB[highlight[0].dataIndex]})`}
        </Text>
      </Box>

      <CartesianChart
        height={200}
        highlight={highlight}
        onHighlightChange={setHighlight}
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
        height={200}
        highlight={highlight}
        onHighlightChange={setHighlight}
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
 * Series highlighting - track which specific bar/series is being hovered
 */
export function SeriesHighlighting() {
  const [highlight, setHighlight] = useState<HighlightedItem[]>([]);

  const seriesColors: Record<string, string> = {
    A: 'var(--color-fgPrimary)',
    B: 'var(--color-fgPositive)',
    C: 'var(--color-fgWarning)',
  };

  return (
    <VStack gap={2}>
      <Text as="h2" font="title3">
        Series Highlighting
      </Text>
      <Text as="p" color="fgMuted">
        Hover over individual bars to see both dataIndex and seriesId tracked. Uses InteractiveBar
        component.
      </Text>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">
          {highlight.length > 0 ? (
            <>
              Index: {highlight[0]?.dataIndex ?? 'none'}
              {highlight[0]?.seriesId && (
                <>
                  {' '}
                  | Series:{' '}
                  <Text
                    as="span"
                    font="body"
                    style={{ color: seriesColors[highlight[0].seriesId] }}
                  >
                    {highlight[0].seriesId}
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
        highlightScope={{ dataIndex: true, series: true }}
        onHighlightChange={setHighlight}
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
  const [highlight, setHighlight] = useState<HighlightedItem[]>([]);
  const [eventLog, setEventLog] = useState<string[]>([]);

  const handleHighlightChange = useCallback((items: HighlightedItem[]) => {
    const item = items[0];
    setHighlight(items);

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
          {highlight.length > 0 ? (
            <>
              Index: {highlight[0]?.dataIndex ?? 'none'}
              {highlight[0]?.seriesId && (
                <>
                  {' '}
                  | Series:{' '}
                  <Text
                    as="span"
                    font="body"
                    style={{ color: seriesColors[highlight[0].seriesId] }}
                  >
                    {highlight[0].seriesId}
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
        highlightScope={{ dataIndex: true, series: true }}
        inset={{ top: 8, bottom: 8, left: 0, right: 0 }}
        onHighlightChange={handleHighlightChange}
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

// Custom line component that fades when another series is active, and grows when it's the active one
type FadeableLineProps = React.ComponentProps<typeof SolidLine> & {
  /** Stroke width when this line is the active series. Defaults to strokeWidth * 2 */
  activeStrokeWidth?: number;
};

const FadeableLine = memo<FadeableLineProps>(
  ({ seriesId, strokeWidth = 2, activeStrokeWidth, ...props }) => {
    const highlightContext = useHighlightContext();
    const activeSeriesId = highlightContext.highlight[0]?.seriesId ?? null;

    // Determine if this line is active, faded, or neutral
    const isActive = activeSeriesId === seriesId;
    const isFaded = activeSeriesId !== null && !isActive;

    // Active: larger stroke (default 2x), Faded: reduced opacity, Neutral: normal
    const effectiveActiveStrokeWidth = activeStrokeWidth ?? strokeWidth * 2;
    const effectiveStrokeWidth = isActive ? effectiveActiveStrokeWidth : strokeWidth;
    const effectiveOpacity = isFaded ? 0.2 : 1;

    return (
      <SolidLine
        {...props}
        seriesId={seriesId}
        strokeOpacity={effectiveOpacity}
        strokeWidth={effectiveStrokeWidth}
        style={{ transition: 'stroke-opacity 150ms ease-out, stroke-width 150ms ease-out' }}
      />
    );
  },
);

/**
 * Line series highlighting with interactionOffset for larger hit area
 */
export function LineSeriesHighlighting() {
  const [highlight, setHighlight] = useState<HighlightedItem[]>([]);
  const [interactionOffset, setInteractionOffset] = useState(8);
  const [enableFade, setEnableFade] = useState(true);

  const seriesColors: Record<string, string> = {
    btc: 'var(--color-fgPrimary)',
    eth: 'var(--color-fgPositive)',
    sol: 'var(--color-fgWarning)',
  };

  // Generate some sample data
  const btcData = useMemo(() => samplePrices.slice(0, 20), []);
  const ethData = useMemo(() => btcData.map((p) => p * 0.7 + Math.random() * 500), [btcData]);
  const solData = useMemo(() => btcData.map((p) => p * 0.4 + Math.random() * 300), [btcData]);

  return (
    <VStack gap={2}>
      <Text as="h2" font="title3">
        Line Series Highlighting
      </Text>
      <Text as="p" color="fgMuted">
        Hover over the lines to highlight a specific series. Other lines fade out when one is
        active.
      </Text>

      <HStack alignItems="center" gap={2}>
        <Text font="body">interactionOffset:</Text>
        {[0, 4, 8, 16].map((offset) => (
          <Button
            key={offset}
            compact
            onClick={() => setInteractionOffset(offset)}
            variant={interactionOffset === offset ? 'primary' : 'secondary'}
          >
            {offset}px
          </Button>
        ))}
      </HStack>

      <HStack alignItems="center" gap={2}>
        <Button compact onClick={() => setEnableFade(!enableFade)} variant="secondary">
          {enableFade ? 'Disable' : 'Enable'} fade effect
        </Button>
      </HStack>

      <Box background="bgSecondary" borderRadius={200} padding={2}>
        <Text font="body">
          {highlight.length > 0 ? (
            <>
              Index: {highlight[0]?.dataIndex ?? 'none'}
              {highlight[0]?.seriesId && (
                <>
                  {' '}
                  | Series:{' '}
                  <Text
                    as="span"
                    font="body"
                    style={{ color: seriesColors[highlight[0].seriesId] }}
                  >
                    {highlight[0].seriesId}
                  </Text>
                </>
              )}
            </>
          ) : (
            'Hover over a line...'
          )}
        </Text>
        <Text color="fgMuted" font="legal">
          Hit area = strokeWidth (2) + interactionOffset ({interactionOffset}) × 2 ={' '}
          {2 + interactionOffset * 2}px
        </Text>
      </Box>

      <CartesianChart
        height={300}
        highlightScope={{ dataIndex: true, series: true }}
        onHighlightChange={setHighlight}
        series={[
          { id: 'btc', data: btcData, color: seriesColors.btc },
          { id: 'eth', data: ethData, color: seriesColors.eth },
          { id: 'sol', data: solData, color: seriesColors.sol },
        ]}
      >
        <YAxis position="left" />
        <Line
          LineComponent={enableFade ? FadeableLine : undefined}
          interactionOffset={interactionOffset}
          seriesId="btc"
          strokeWidth={2}
        />
        <Line
          LineComponent={enableFade ? FadeableLine : undefined}
          interactionOffset={interactionOffset}
          seriesId="eth"
          strokeWidth={2}
        />
        <Line
          LineComponent={enableFade ? FadeableLine : undefined}
          interactionOffset={interactionOffset}
          seriesId="sol"
          strokeWidth={2}
        />
        {/* Wrap Scrubber with pointer-events: none so it doesn't block line interactions */}
        <g style={{ pointerEvents: 'none' }}>
          <Scrubber hideOverlay />
        </g>
      </CartesianChart>

      <HStack gap={2} justifyContent="center">
        {Object.entries(seriesColors).map(([id, color]) => (
          <HStack key={id} alignItems="center" gap={0.5}>
            <Box borderRadius={1000} height={10} style={{ background: color }} width={10} />
            <Text font="legal">{id.toUpperCase()}</Text>
          </HStack>
        ))}
      </HStack>
    </VStack>
  );
}
