import { useState } from 'react';
import { Alert, Button, Center, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { useAuth } from '../auth/AuthContext.jsx';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = (event) => {
    event.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <Center mih="100vh" bg="gray.0" px="md">
      <Paper component="form" onSubmit={submit} withBorder shadow="sm" p="xl" radius="md" w="100%" maw={400}>
        <Stack>
          <div>
            <Title order={2}>ACME Salary Management</Title>
            <Text c="dimmed" size="sm">Sign in as the HR manager</Text>
          </div>
          {login.isError && (
            <Alert color="red" variant="light" role="alert">
              {login.error.message}
            </Alert>
          )}
          <TextInput label="Email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
          <PasswordInput label="Password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
          <Button type="submit" loading={login.isPending}>
            Sign in
          </Button>
        </Stack>
      </Paper>
    </Center>
  );
}
