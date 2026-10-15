import { ActionIcon, Group, Menu, Table, Text, UnstyledButton } from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconDots, IconSelector } from '@tabler/icons-react';
import { formatMoney, formatUsd } from '../lib/format.js';

function SortHeader({ field, label, params, onSort, align }) {
  const active = params.sortBy === field;
  const Icon = !active ? IconSelector : params.sortDir === 'asc' ? IconChevronUp : IconChevronDown;
  const nextDir = active && params.sortDir === 'asc' ? 'desc' : 'asc';
  return (
    <Table.Th aria-sort={active ? (params.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'} ta={align}>
      <UnstyledButton onClick={() => onSort({ sortBy: field, sortDir: nextDir })}>
        <Group gap={4} wrap="nowrap" justify={align === 'right' ? 'flex-end' : 'flex-start'}>
          <Text fw={600} size="sm">{label}</Text>
          <Icon size={14} />
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

export function EmployeeTable({ employees, params, onSort, onOpen, onEdit, onDelete }) {
  const sortable = (field, label, align) => (
    <SortHeader field={field} label={label} params={params} onSort={onSort} align={align} />
  );

  return (
    <Table.ScrollContainer minWidth={900}>
      <Table highlightOnHover verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            {sortable('fullName', 'Name')}
            <Table.Th>Job title</Table.Th>
            <Table.Th>Department</Table.Th>
            {sortable('country', 'Country')}
            {sortable('joiningDate', 'Joined')}
            {sortable('annualSalary', 'Annual salary', 'right')}
            <Table.Th w={48} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {employees.map((e) => (
            <Table.Tr key={e.id} onClick={() => onOpen(e)} style={{ cursor: 'pointer' }}>
              <Table.Td>
                <Text size="sm" fw={500}>{e.fullName}</Text>
                <Text size="xs" c="dimmed">{e.email}</Text>
              </Table.Td>
              <Table.Td>{e.jobTitle}</Table.Td>
              <Table.Td>{e.department}</Table.Td>
              <Table.Td>{e.country}</Table.Td>
              <Table.Td>{e.joiningDate}</Table.Td>
              <Table.Td ta="right">
                <Text size="sm">{formatMoney(e.annualSalary, e.currency)}</Text>
                {e.currency !== 'USD' && <Text size="xs" c="dimmed">≈ {formatUsd(e.annualSalaryUsd)}</Text>}
              </Table.Td>
              <Table.Td onClick={(event) => event.stopPropagation()}>
                <Menu position="bottom-end">
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray" aria-label={`Actions for ${e.fullName}`}>
                      <IconDots size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item onClick={() => onEdit(e)}>Edit</Menu.Item>
                    <Menu.Item color="red" onClick={() => onDelete(e)}>Delete</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
