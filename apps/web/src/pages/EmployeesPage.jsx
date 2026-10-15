import { useState } from 'react';
import { Alert, Button, Drawer, Group, Modal, Pagination, Paper, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { EmployeeDetail } from '../employees/EmployeeDetail.jsx';
import { EmployeeFilters } from '../employees/EmployeeFilters.jsx';
import { EmployeeForm } from '../employees/EmployeeForm.jsx';
import { EmployeeTable } from '../employees/EmployeeTable.jsx';
import { useDeleteEmployee, useEmployees, useSaveEmployee } from '../employees/queries.js';
import { useListParams } from '../employees/useListParams.js';
import { formatNumber } from '../lib/format.js';

export function EmployeesPage({ toolbar }) {
  const [params, updateParams] = useListParams();
  const employees = useEmployees(params);
  const save = useSaveEmployee();
  const remove = useDeleteEmployee();

  // panel: { mode: 'create' } | { mode: 'edit', employee } | { mode: 'view', employee } | null
  const [panel, setPanel] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const submit = async (values) => {
    const saved = await save.mutateAsync({ id: panel.employee?.id, values });
    notifications.show({ color: 'green', message: `${saved.fullName} saved` });
    setPanel(null);
  };

  const confirmDelete = async () => {
    await remove.mutateAsync(toDelete.id);
    notifications.show({ message: `${toDelete.fullName} deleted` });
    setToDelete(null);
    setPanel(null);
  };

  const data = employees.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Title order={2}>Employees</Title>
          <Text c="dimmed" size="sm">
            {data ? `${formatNumber(data.total)} employees` : 'Loading…'}
          </Text>
        </div>
        <Group gap="sm">
          {toolbar?.(params)}
          <Button leftSection={<IconPlus size={16} />} onClick={() => setPanel({ mode: 'create' })}>
            Add employee
          </Button>
        </Group>
      </Group>

      <EmployeeFilters params={params} onChange={updateParams} />

      {employees.isError && <Alert color="red">Could not load employees: {employees.error.message}</Alert>}

      <Paper withBorder radius="md" style={{ opacity: employees.isPlaceholderData ? 0.6 : 1 }}>
        {data?.items.length === 0 ? (
          <Text p="xl" ta="center" c="dimmed">No employees match these filters.</Text>
        ) : (
          <EmployeeTable
            employees={data?.items ?? []}
            params={params}
            onSort={updateParams}
            onOpen={(employee) => setPanel({ mode: 'view', employee })}
            onEdit={(employee) => setPanel({ mode: 'edit', employee })}
            onDelete={setToDelete}
          />
        )}
      </Paper>

      {pages > 1 && (
        <Group justify="center">
          <Pagination total={pages} value={params.page} onChange={(page) => updateParams({ page })} />
        </Group>
      )}

      <Drawer
        opened={Boolean(panel)}
        onClose={() => setPanel(null)}
        position="right"
        size="lg"
        title={panel?.mode === 'create' ? 'Add employee' : panel?.mode === 'edit' ? 'Edit employee' : 'Employee'}
      >
        {panel?.mode === 'view' && (
          <EmployeeDetail employee={panel.employee} onEdit={(employee) => setPanel({ mode: 'edit', employee })} />
        )}
        {(panel?.mode === 'create' || panel?.mode === 'edit') && (
          <EmployeeForm
            key={panel.employee?.id ?? 'new'}
            employee={panel.employee}
            onSubmit={submit}
            onCancel={() => setPanel(null)}
            submitting={save.isPending}
          />
        )}
      </Drawer>

      <Modal opened={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Delete employee?" centered>
        <Stack>
          <Text size="sm">
            This permanently removes <b>{toDelete?.fullName}</b> and their salary history.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button color="red" loading={remove.isPending} onClick={confirmDelete}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
