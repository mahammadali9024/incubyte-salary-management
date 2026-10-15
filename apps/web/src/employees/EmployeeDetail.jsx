import { Badge, Button, Group, Loader, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import { formatMoney, formatUsd } from '../lib/format.js';
import { useSalaryHistory } from './queries.js';

function Field({ label, children }) {
  return (
    <div>
      <Text size="xs" c="dimmed">{label}</Text>
      <Text size="sm">{children}</Text>
    </div>
  );
}

function change(current, previous) {
  if (!previous || previous.currency !== current.currency) return null;
  const pct = ((current.annualSalary - previous.annualSalary) / previous.annualSalary) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

export function EmployeeDetail({ employee, onEdit }) {
  const history = useSalaryHistory(employee.id);

  return (
    <Stack>
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={3}>{employee.fullName}</Title>
          <Text c="dimmed" size="sm">{employee.email}</Text>
        </div>
        <Badge variant="light">{employee.employmentType}</Badge>
      </Group>
      <SimpleGrid cols={2}>
        <Field label="Job title">{employee.jobTitle}</Field>
        <Field label="Department">{employee.department}</Field>
        <Field label="Country">{employee.country}</Field>
        <Field label="Joined">{employee.joiningDate}</Field>
        <Field label="Annual salary">{formatMoney(employee.annualSalary, employee.currency)}</Field>
        <Field label="In USD (fixed rate)">{formatUsd(employee.annualSalaryUsd)}</Field>
      </SimpleGrid>
      <Button variant="light" onClick={() => onEdit(employee)}>Edit employee</Button>

      <Title order={5} mt="md">Salary history</Title>
      {history.isPending ? (
        <Loader size="sm" />
      ) : (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Effective</Table.Th>
              <Table.Th ta="right">Salary</Table.Th>
              <Table.Th ta="right">Change</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {history.data?.map((entry, i, all) => (
              <Table.Tr key={entry.id}>
                <Table.Td>{entry.effectiveDate}</Table.Td>
                <Table.Td ta="right">{formatMoney(entry.annualSalary, entry.currency)}</Table.Td>
                <Table.Td ta="right">{change(entry, all[i + 1]) ?? (i === all.length - 1 ? 'Starting' : '—')}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
