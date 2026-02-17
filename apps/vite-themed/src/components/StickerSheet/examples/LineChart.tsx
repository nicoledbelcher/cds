import { useMemo, useState, memo } from 'react';
import { LineChart, Scrubber } from '@coinbase/cds-web-visualization';

export const LineChartBasicExample = memo(() => {
  const [scrubIndex, setScrubIndex] = useState<number | undefined>(undefined);

  const yData = [2, 5.5, 2, 8.5, 1.5, 5];
  const xData = [1, 2, 3, 5, 8, 10];

  const accessibilityLabel = useMemo(() => {
    if (scrubIndex === undefined) return undefined;
    return `X: ${xData[scrubIndex]}, Y: ${yData[scrubIndex]} at point ${scrubIndex + 1}`;
  }, [scrubIndex, xData, yData]);

  return (
    <LineChart
      enableScrubbing
      onScrubberPositionChange={setScrubIndex}
      series={[
        {
          id: 'line',
          data: yData,
        },
      ]}
      height={150}
      showArea
      points
      curve="natural"
      showXAxis
      xAxis={{
        data: xData,
        showLine: true,
        showTickMarks: true,
        showGrid: true,
      }}
      showYAxis
      yAxis={{
        domain: { min: 0 },
        position: 'left',
        showLine: true,
        showTickMarks: true,
        showGrid: true,
      }}
      inset={{ top: 16, right: 16, bottom: 0, left: 0 }}
      accessibilityLabel={accessibilityLabel}
    >
      <Scrubber hideOverlay />
    </LineChart>
  );
});
