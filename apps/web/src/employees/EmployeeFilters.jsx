import { useEffect, useState } from 'react';
import { Button, Group, Select, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { COUNTRY_NAMES, DEPARTMENTS, JOB_TITLES } from '@acme/shared';

export function EmployeeFilters({ params, onChange }) {
  const [search, setSearch] = useState(params.search ?? '');
  const [debounced] = useDebouncedValue(search, 300);

  useEffect(() => {
    if ((params.search ?? '') !== debounced) onChange({ search: debounced });
    // Only react to the debounced text; params changes are driven by this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const hasFilters = params.search || params.country || params.department || params.jobTitle;
  const select = (key, label, data) => (
    <Select
      aria-label={label}
      placeholder={label}
      data={data}
      value={params[key] ?? null}
      onChange={(value) => onChange({ [key]: value ?? undefined })}
      clearable
      searchable
      w={{ base: '100%', sm: 200 }}
    />
  );

  return (
    <Group gap="sm" align="flex-end">
      <TextInput
        aria-label="Search by name or email"
        placeholder="Search name or email"
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        w={{ base: '100%', sm: 260 }}
      />
      {select('country', 'Country', COUNTRY_NAMES)}
      {select('department', 'Department', DEPARTMENTS)}
      {select('jobTitle', 'Job title', JOB_TITLES)}
      {hasFilters && (
        <Button
          variant="subtle"
          onClick={() => {
            setSearch('');
            onChange({
              search: undefined,
              country: undefined,
              department: undefined,
              jobTitle: undefined,
            });
          }}
        >
          Clear filters
        </Button>
      )}
    </Group>
  );
}
