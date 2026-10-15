import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';

export function renderWithMantine(ui) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}
