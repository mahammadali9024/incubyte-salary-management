import { useState } from 'react';
import { Alert, Button, Group, NumberInput, Select, SimpleGrid, Stack, TextInput } from '@mantine/core';
import { z } from 'zod';
import {
  COUNTRY_NAMES,
  DEPARTMENTS,
  EMPLOYMENT_TYPES,
  JOB_TITLES,
  currencyFor,
  employeeUpdateSchema,
  toUsd,
} from '@acme/shared';
import { formatUsd, todayIso } from '../lib/format.js';

const EMPTY = {
  fullName: '',
  email: '',
  jobTitle: null,
  department: null,
  country: null,
  employmentType: 'Full-time',
  joiningDate: todayIso(),
  annualSalary: '',
};

/** Field-level messages from the shared schema, keyed by field (first message only). */
function validationErrors(values) {
  const result = employeeUpdateSchema.safeParse(values);
  if (result.success) return {};
  const fieldErrors = z.flattenError(result.error).fieldErrors;
  return Object.fromEntries(Object.entries(fieldErrors).map(([field, messages]) => [field, messages[0]]));
}

/** Server errors: 400 carries per-field details; 409 is a duplicate email. */
function serverErrors(error) {
  if (error?.status === 409) return { email: error.message };
  if (error?.status === 400 && error.body?.details) {
    return Object.fromEntries(Object.entries(error.body.details).map(([f, m]) => [f, m[0]]));
  }
  return {};
}

/**
 * Create/edit form validated with the same Zod schema the API uses.
 * @param {{ employee?: object, onSubmit(values: object): Promise<unknown>, onCancel(): void, submitting: boolean }} props
 */
export function EmployeeForm({ employee, onSubmit, onCancel, submitting }) {
  const [values, setValues] = useState(() => (employee ? pick(employee) : EMPTY));
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState(null);

  const set = (field) => (value) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };
  const text = (field) => (event) => set(field)(event.currentTarget.value);

  const currency = values.country ? currencyFor(values.country) : null;
  const salary = typeof values.annualSalary === 'number' ? values.annualSalary : null;
  const payChanged =
    employee && (salary !== employee.annualSalary || (currency && currency !== employee.currency));

  const submit = async (event) => {
    event.preventDefault();
    setFailure(null);
    const payload = { ...values, annualSalary: salary ?? values.annualSalary };
    if (!payChanged) delete payload.salaryEffectiveDate;
    const found = validationErrors(payload);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    try {
      await onSubmit(employeeUpdateSchema.parse(payload));
    } catch (error) {
      const fieldErrors = serverErrors(error);
      if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
      else setFailure(error.message);
    }
  };

  const select = (field, label, data) => (
    <Select label={label} data={data} value={values[field]} onChange={set(field)} error={errors[field]} searchable required allowDeselect={false} />
  );

  return (
    <form onSubmit={submit} noValidate>
      <Stack>
        {failure && <Alert color="red" role="alert">{failure}</Alert>}
        <TextInput label="Full name" value={values.fullName} onChange={text('fullName')} error={errors.fullName} required />
        <TextInput label="Email" type="email" value={values.email} onChange={text('email')} error={errors.email} required />
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {select('jobTitle', 'Job title', JOB_TITLES)}
          {select('department', 'Department', DEPARTMENTS)}
          {select('country', 'Country', COUNTRY_NAMES)}
          {select('employmentType', 'Employment type', EMPLOYMENT_TYPES)}
        </SimpleGrid>
        <TextInput label="Joining date" type="date" value={values.joiningDate} onChange={text('joiningDate')} error={errors.joiningDate} required />
        <NumberInput
          label="Annual gross salary"
          description={currency && salary ? `≈ ${formatUsd(toUsd(salary, currency))} at the fixed rate` : 'In the country’s currency'}
          value={values.annualSalary}
          onChange={set('annualSalary')}
          error={errors.annualSalary}
          thousandSeparator=","
          allowDecimal={false}
          allowNegative={false}
          rightSection={currency}
          rightSectionWidth={50}
          required
        />
        {payChanged && (
          <TextInput
            label="New salary effective from"
            description="Recorded in the salary history"
            type="date"
            value={values.salaryEffectiveDate ?? todayIso()}
            onChange={text('salaryEffectiveDate')}
            error={errors.salaryEffectiveDate}
          />
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel}>Cancel</Button>
          <Button type="submit" loading={submitting}>{employee ? 'Save changes' : 'Add employee'}</Button>
        </Group>
      </Stack>
    </form>
  );
}

function pick(employee) {
  const { fullName, email, jobTitle, department, country, employmentType, joiningDate, annualSalary } = employee;
  return { fullName, email, jobTitle, department, country, employmentType, joiningDate, annualSalary };
}
