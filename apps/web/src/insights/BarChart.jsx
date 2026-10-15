import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Paper, Text } from '@mantine/core';

// Single-series magnitude charts: one hue (reference palette slot 1), no legend —
// the card title names the measure.
const SERIES = '#2a78d6';
const GRID = '#e9e8e4';
const AXIS = { fontSize: 12, fill: '#52514e' };

function ChartTooltip({ active, payload, format, labelFormat }) {
  if (!active || !payload?.length) return null;
  const { payload: row, value } = payload[0];
  return (
    <Paper withBorder shadow="sm" px="sm" py={6}>
      <Text size="xs" c="dimmed">
        {labelFormat ? labelFormat(row) : row.label}
      </Text>
      <Text size="sm" fw={600}>
        {format(value)}
      </Text>
    </Paper>
  );
}

/**
 * Bars for one measure. Horizontal (default) suits long category names;
 * vertical suits ordered bins such as a histogram. `format` is used in the tooltip,
 * `axisFormat` (defaults to `format`) on the value axis.
 */
export function BarChart({
  data,
  dataKey,
  format,
  axisFormat = format,
  labelFormat,
  layout = 'horizontal',
  height,
}) {
  const horizontal = layout === 'horizontal';
  const rows = data.length;
  return (
    <ResponsiveContainer
      width="100%"
      height={height ?? (horizontal ? Math.max(160, rows * 34 + 30) : 260)}
    >
      <RBarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
        barCategoryGap={2}
      >
        <CartesianGrid stroke={GRID} horizontal={!horizontal} vertical={horizontal} />
        {horizontal ? (
          <>
            <XAxis
              type="number"
              tickFormatter={axisFormat}
              tick={AXIS}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={170}
              tick={AXIS}
              axisLine={false}
              tickLine={false}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey="label"
              tick={AXIS}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis tick={AXIS} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
          </>
        )}
        <Tooltip
          cursor={{ fill: 'rgba(42,120,214,0.08)' }}
          content={<ChartTooltip format={format} labelFormat={labelFormat} />}
        />
        <Bar
          dataKey={dataKey}
          fill={SERIES}
          maxBarSize={horizontal ? 22 : 48}
          radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          isAnimationActive={false}
        />
      </RBarChart>
    </ResponsiveContainer>
  );
}
