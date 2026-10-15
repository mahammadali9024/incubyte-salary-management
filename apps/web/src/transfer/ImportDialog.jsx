import { useState } from 'react';
import {
  Alert,
  Anchor,
  Button,
  FileInput,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { IconFileSpreadsheet } from '@tabler/icons-react';
import { api, downloadUrl } from '../api/client.js';

const FIELD_LABELS = {
  fullName: 'Full Name',
  email: 'Email',
  jobTitle: 'Job Title',
  department: 'Department',
  country: 'Country',
  employmentType: 'Employment Type',
  joiningDate: 'Joining Date',
  annualSalary: 'Annual Salary',
};

/** Runs the import; a 422 still carries the row-level report we want to show. */
async function runImport(file, dryRun) {
  const form = new FormData();
  form.append('file', file);
  try {
    return await api.post('/employees/import', form, { dryRun });
  } catch (error) {
    if (error.status === 422) return error.body;
    throw error;
  }
}

function Summary({ report }) {
  const parts = [
    [report.created, 'new'],
    [report.updated, 'updated'],
    [report.unchanged, 'unchanged'],
  ].filter(([n]) => n > 0);
  return (
    <Text size="sm">
      {report.rows} rows: {parts.map(([n, label]) => `${n} ${label}`).join(', ')}.
    </Text>
  );
}

function ErrorTable({ errors }) {
  return (
    <ScrollArea.Autosize mah={260}>
      <Table striped fz="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={70}>Row</Table.Th>
            <Table.Th w={140}>Column</Table.Th>
            <Table.Th>Problem</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {errors.map((e, i) => (
            <Table.Tr key={i}>
              <Table.Td>{e.row ?? '—'}</Table.Td>
              <Table.Td>{FIELD_LABELS[e.field] ?? e.field ?? '—'}</Table.Td>
              <Table.Td>{e.message}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea.Autosize>
  );
}

/**
 * Two-step import: "Check file" runs a dry run that reports exactly what would
 * change (or every row error); "Import" then commits the same file.
 */
export function ImportDialog({ opened, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(null);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setFailure(null);
  };
  const close = () => {
    reset();
    onClose();
  };

  const run = async (dryRun) => {
    setBusy(true);
    setFailure(null);
    try {
      const report = await runImport(file, dryRun);
      if (dryRun || report.errors.length > 0) setPreview(report);
      else {
        await onImported(report);
        close();
      }
    } catch (error) {
      setFailure(error.message);
    } finally {
      setBusy(false);
    }
  };

  const changes = preview ? preview.created + preview.updated : 0;
  const canImport = preview && preview.errors.length === 0 && changes > 0;

  return (
    <Modal opened={opened} onClose={close} title="Import employees" size="lg">
      <Stack>
        <Text size="sm" c="dimmed">
          Upload a .xlsx or .csv file. Rows are matched to existing employees by email; new emails
          are added. Nothing is saved until you confirm, and a file with any invalid row changes
          nothing.{' '}
          <Anchor href={downloadUrl('/employees/import-template')} size="sm">
            Download the template
          </Anchor>
        </Text>
        <FileInput
          label="Spreadsheet"
          placeholder="Choose a file"
          accept=".xlsx,.csv"
          leftSection={<IconFileSpreadsheet size={16} />}
          value={file}
          onChange={(f) => {
            setFile(f);
            setPreview(null);
            setFailure(null);
          }}
          clearable
        />
        {failure && (
          <Alert color="red" role="alert">
            {failure}
          </Alert>
        )}
        {preview && preview.errors.length > 0 && (
          <Alert
            color="red"
            title={`${preview.errors.length} problem(s) found — nothing was imported`}
          >
            <Text size="sm" mb="xs">
              Fix these rows in your spreadsheet and check the file again.
            </Text>
            <ErrorTable errors={preview.errors} />
          </Alert>
        )}
        {preview && preview.errors.length === 0 && (
          <Alert color={changes > 0 ? 'blue' : 'gray'} title="Ready to import">
            <Summary report={preview} />
            {changes === 0 && (
              <Text size="sm">Everything in the file already matches — nothing to import.</Text>
            )}
          </Alert>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>
            Cancel
          </Button>
          {canImport ? (
            <Button loading={busy} onClick={() => run(false)}>
              Import {changes} {changes === 1 ? 'change' : 'changes'}
            </Button>
          ) : (
            <Button loading={busy} disabled={!file} onClick={() => run(true)}>
              Check file
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}
