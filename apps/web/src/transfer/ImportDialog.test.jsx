import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithMantine } from '../test/render.jsx';
import { ImportDialog } from './ImportDialog.jsx';

const json = (status, body) => ({ ok: status < 400, status, json: async () => body });
const report = (overrides) => ({ committed: false, rows: 3, created: 2, updated: 1, unchanged: 0, errors: [], ...overrides });

function setup(responses) {
  globalThis.fetch = vi.fn().mockImplementation(async () => responses.shift());
  const onImported = vi.fn();
  renderWithMantine(<ImportDialog opened onClose={() => {}} onImported={onImported} />);
  return { onImported, user: userEvent.setup() };
}

async function chooseFile(user) {
  const input = document.querySelector('input[type="file"]');
  await user.upload(input, new File(['a,b'], 'staff.csv', { type: 'text/csv' }));
}

describe('ImportDialog', () => {
  afterEach(() => vi.restoreAllMocks());

  it('checks the file with a dry run and shows what will change', async () => {
    const { user } = setup([json(200, report())]);
    await chooseFile(user);

    await user.click(screen.getByRole('button', { name: 'Check file' }));

    expect(await screen.findByText('3 rows: 2 new, 1 updated.')).toBeInTheDocument();
    expect(globalThis.fetch.mock.calls[0][0]).toBe('/api/employees/import?dryRun=true');
    expect(screen.getByRole('button', { name: 'Import 3 changes' })).toBeInTheDocument();
  });

  it('lists row errors with friendly column names and offers no import', async () => {
    const errors = [{ row: 4, field: 'annualSalary', message: 'Salary must be greater than zero' }];
    const { user } = setup([json(422, report({ errors }))]);
    await chooseFile(user);

    await user.click(screen.getByRole('button', { name: 'Check file' }));

    expect(await screen.findByText('Salary must be greater than zero')).toBeInTheDocument();
    expect(screen.getByText('Annual Salary')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Import/ })).not.toBeInTheDocument();
  });

  it('commits after a clean preview and reports back', async () => {
    const { user, onImported } = setup([json(200, report()), json(200, report({ committed: true }))]);
    await chooseFile(user);
    await user.click(screen.getByRole('button', { name: 'Check file' }));

    await user.click(await screen.findByRole('button', { name: 'Import 3 changes' }));

    expect(globalThis.fetch.mock.calls[1][0]).toBe('/api/employees/import?dryRun=false');
    expect(onImported).toHaveBeenCalledWith(expect.objectContaining({ committed: true }));
  });

  it('shows a file-level problem such as missing columns', async () => {
    const { user } = setup([json(400, { error: 'Missing columns: Email' })]);
    await chooseFile(user);

    await user.click(screen.getByRole('button', { name: 'Check file' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Missing columns: Email');
  });
});
