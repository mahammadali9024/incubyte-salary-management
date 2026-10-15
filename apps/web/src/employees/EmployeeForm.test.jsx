import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../api/client.js';
import { renderWithMantine } from '../test/render.jsx';
import { EmployeeForm } from './EmployeeForm.jsx';

const employee = {
  id: 7,
  fullName: 'Asha Rao',
  email: 'asha@acme.test',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  country: 'India',
  currency: 'INR',
  employmentType: 'Full-time',
  joiningDate: '2023-04-01',
  annualSalary: 1800000,
  annualSalaryUsd: 21600,
};

function renderForm(props = {}) {
  const onSubmit = props.onSubmit ?? vi.fn().mockResolvedValue({});
  renderWithMantine(
    <EmployeeForm onSubmit={onSubmit} onCancel={() => {}} submitting={false} {...props} />,
  );
  return { onSubmit, user: userEvent.setup() };
}

describe('EmployeeForm', () => {
  it('shows validation messages from the shared schema and does not submit', async () => {
    const { onSubmit, user } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Add employee' }));

    expect(await screen.findByText('Full name is required')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the currency and a USD estimate for the salary', () => {
    renderForm({ employee });

    expect(screen.getByText('INR')).toBeInTheDocument();
    expect(screen.getByText('≈ $21,600 at the fixed rate')).toBeInTheDocument();
  });

  it('asks for an effective date only when the salary changes', async () => {
    const { onSubmit, user } = renderForm({ employee });
    expect(screen.queryByLabelText('New salary effective from')).not.toBeInTheDocument();

    const salary = screen.getByRole('textbox', { name: /annual gross salary/i });
    await user.clear(salary);
    await user.type(salary, '2000000');
    const effective = screen.getByLabelText('New salary effective from');
    await user.clear(effective);
    await user.type(effective, '2026-11-01');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ annualSalary: 2000000, salaryEffectiveDate: '2026-11-01' }),
      ),
    );
  });

  it('submits an unchanged salary without an effective date', async () => {
    const { onSubmit, user } = renderForm({ employee });

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('salaryEffectiveDate');
  });

  it('shows a duplicate-email conflict from the server next to the email field', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(
        new ApiError(409, { error: 'An employee with email asha@acme.test already exists' }),
      );
    const { user } = renderForm({ employee, onSubmit });

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText('An employee with email asha@acme.test already exists'),
    ).toBeInTheDocument();
  });
});
