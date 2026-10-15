import { useState } from 'react';
import {
  Alert,
  Card,
  Group,
  Loader,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { COUNTRY_NAMES, FX_RATES_AS_OF, currencyFor } from '@acme/shared';
import { BarChart } from '../insights/BarChart.jsx';
import {
  useByCountry,
  useByDepartment,
  useByJobTitle,
  useDistribution,
  useOverview,
} from '../insights/queries.js';
import { formatCompact, formatMoney, formatNumber, formatUsd } from '../lib/format.js';

function Section({ title, description, action, query, children }) {
  return (
    <Card withBorder radius="md" padding="lg">
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Title order={4}>{title}</Title>
          {description && (
            <Text size="sm" c="dimmed">
              {description}
            </Text>
          )}
        </div>
        {action}
      </Group>
      {query?.isError && <Alert color="red">Could not load: {query.error.message}</Alert>}
      {query?.isPending ? <Loader size="sm" /> : children}
    </Card>
  );
}

function StatTile({ label, value, hint }) {
  return (
    <Paper withBorder radius="md" p="md">
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Text fz={28} fw={700} lh={1.2}>
        {value ?? '—'}
      </Text>
      {hint && (
        <Text size="xs" c="dimmed">
          {hint}
        </Text>
      )}
    </Paper>
  );
}

function Overview() {
  const { data } = useOverview();
  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }}>
      <StatTile label="Employees" value={data && formatNumber(data.headcount)} />
      <StatTile
        label="Annual payroll"
        value={data && `$${formatCompact(data.totalPayrollUsd)}`}
        hint="Gross base salary, in USD"
      />
      <StatTile label="Countries" value={data?.countries} />
    </SimpleGrid>
  );
}

function ByCountry() {
  const query = useByCountry();
  const [view, setView] = useState('chart');
  const rows = query.data ?? [];
  const chartData = [...rows]
    .sort((a, b) => b.medianUsd - a.medianUsd)
    .map((r) => ({ ...r, label: r.country }));

  return (
    <Section
      title="Pay by country"
      description="Median is the typical salary; the average is pulled up by a few high earners."
      query={query}
      action={
        <SegmentedControl
          size="xs"
          value={view}
          onChange={setView}
          data={[
            { label: 'Chart', value: 'chart' },
            { label: 'Table', value: 'table' },
          ]}
        />
      }
    >
      {view === 'chart' ? (
        <>
          <Text size="sm" fw={500} mb={4}>
            Median annual salary (USD)
          </Text>
          <BarChart
            data={chartData}
            dataKey="medianUsd"
            format={formatUsd}
            axisFormat={(v) => `$${formatCompact(v)}`}
            labelFormat={(r) =>
              `${r.country} · ${formatNumber(r.headcount)} people · ${formatMoney(r.median, r.currency)} local`
            }
          />
        </>
      ) : (
        <Table.ScrollContainer minWidth={760}>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Country</Table.Th>
                <Table.Th ta="right">People</Table.Th>
                <Table.Th ta="right">Min</Table.Th>
                <Table.Th ta="right">Median</Table.Th>
                <Table.Th ta="right">Average</Table.Th>
                <Table.Th ta="right">Max</Table.Th>
                <Table.Th ta="right">Median (USD)</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((r) => (
                <Table.Tr key={r.country}>
                  <Table.Td>{r.country}</Table.Td>
                  <Table.Td ta="right">{formatNumber(r.headcount)}</Table.Td>
                  <Table.Td ta="right">{formatMoney(r.min, r.currency)}</Table.Td>
                  <Table.Td ta="right" fw={600}>
                    {formatMoney(r.median, r.currency)}
                  </Table.Td>
                  <Table.Td ta="right">{formatMoney(r.average, r.currency)}</Table.Td>
                  <Table.Td ta="right">{formatMoney(r.max, r.currency)}</Table.Td>
                  <Table.Td ta="right">{formatUsd(r.medianUsd)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Section>
  );
}

function ByJobTitle({ country }) {
  const query = useByJobTitle(country);
  const rows = query.data ?? [];
  const currency = rows[0]?.currency;
  return (
    <Section
      title={`Average salary by job title in ${country}`}
      description={currency && `In ${currency}`}
      query={query}
    >
      {rows.length === 0 ? (
        <Text c="dimmed" size="sm">
          No employees in {country}.
        </Text>
      ) : (
        <BarChart
          data={rows.map((r) => ({ ...r, label: r.jobTitle }))}
          dataKey="average"
          format={(v) => formatMoney(v, currency)}
          axisFormat={formatCompact}
          labelFormat={(r) =>
            `${r.jobTitle} · ${r.headcount} people · median ${formatMoney(r.median, currency)} · ≈ ${formatUsd(r.averageUsd)} avg`
          }
        />
      )}
    </Section>
  );
}

function Distribution({ country }) {
  const query = useDistribution(country);
  const bins = query.data ?? [];
  const currency = currencyFor(country);
  return (
    <Section
      title={`Salary distribution in ${country}`}
      description="Number of employees in each salary band"
      query={query}
    >
      <BarChart
        layout="vertical"
        data={bins.map((b) => ({ ...b, label: formatCompact(b.from) }))}
        dataKey="count"
        format={(v) => `${formatNumber(v)} people`}
        labelFormat={(b) => `${formatMoney(b.from, currency)} – ${formatMoney(b.to, currency)}`}
      />
    </Section>
  );
}

function ByDepartment() {
  const query = useByDepartment();
  const rows = (query.data ?? []).map((r) => ({ ...r, label: r.department }));
  return (
    <Section title="Annual payroll by department" description="USD at fixed rates" query={query}>
      <BarChart
        data={rows}
        dataKey="totalPayrollUsd"
        format={formatUsd}
        axisFormat={(v) => `$${formatCompact(v)}`}
        labelFormat={(r) =>
          `${r.department} · ${formatNumber(r.headcount)} people · avg ${formatUsd(r.averageUsd)}`
        }
      />
    </Section>
  );
}

export function InsightsPage() {
  const [country, setCountry] = useState('India');

  return (
    <Stack>
      <div>
        <Title order={2}>Pay insights</Title>
        <Text c="dimmed" size="sm">
          Cross-country figures use fixed exchange rates as of {FX_RATES_AS_OF}.
        </Text>
      </div>
      <Overview />
      <ByCountry />
      <ByDepartment />
      <Group justify="space-between" mt="sm">
        <Title order={3}>Country deep dive</Title>
        <Select
          aria-label="Country"
          data={COUNTRY_NAMES}
          value={country}
          onChange={(v) => v && setCountry(v)}
          allowDeselect={false}
          w={220}
        />
      </Group>
      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <ByJobTitle country={country} />
        <Distribution country={country} />
      </SimpleGrid>
    </Stack>
  );
}
