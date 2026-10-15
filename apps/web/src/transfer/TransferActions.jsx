import { useState } from 'react';
import { Button, Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDownload, IconUpload } from '../icons.js';
import { downloadUrl } from '../api/client.js';
import { useInvalidateEmployeeData } from '../employees/queries.js';
import { ImportDialog } from './ImportDialog.jsx';

/** Export (respecting the current filters and sort) and Import buttons for the employee list. */
export function TransferActions({ params }) {
  const [importing, setImporting] = useState(false);
  const invalidate = useInvalidateEmployeeData();
  // eslint-disable-next-line no-unused-vars
  const { page, pageSize, ...filters } = params;

  const exportAs = (format) => {
    window.location.href = downloadUrl('/employees/export', { ...filters, format });
  };

  return (
    <>
      <Menu position="bottom-end">
        <Menu.Target>
          <Button variant="default" leftSection={<IconDownload size={16} />}>
            Export
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>Current filters apply</Menu.Label>
          <Menu.Item onClick={() => exportAs('xlsx')}>Excel (.xlsx)</Menu.Item>
          <Menu.Item onClick={() => exportAs('csv')}>CSV (.csv)</Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <Button
        variant="default"
        leftSection={<IconUpload size={16} />}
        onClick={() => setImporting(true)}
      >
        Import
      </Button>
      <ImportDialog
        opened={importing}
        onClose={() => setImporting(false)}
        onImported={async (report) => {
          await invalidate();
          notifications.show({
            color: 'green',
            message: `Imported: ${report.created} added, ${report.updated} updated`,
          });
        }}
      />
    </>
  );
}
