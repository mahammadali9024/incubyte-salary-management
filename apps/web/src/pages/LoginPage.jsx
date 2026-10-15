import { useState } from 'react';
import { z } from 'zod';
import {
  Alert,
  Anchor,
  Button,
  Center,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { registerSchema } from '@acme/shared';
import { useAuth } from '../auth/AuthContext.jsx';

function SignInForm({ onSwitch }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = (event) => {
    event.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <Stack component="form" onSubmit={submit}>
      <div>
        <Title order={2}>ACME Salary Management</Title>
        <Text c="dimmed" size="sm">
          Sign in as an HR manager
        </Text>
      </div>
      {login.isError && (
        <Alert color="red" variant="light" role="alert">
          {login.error.message}
        </Alert>
      )}
      <TextInput
        label="Email"
        type="email"
        autoComplete="username"
        required
        value={email}
        onChange={(e) => setEmail(e.currentTarget.value)}
      />
      <PasswordInput
        label="Password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.currentTarget.value)}
      />
      <Button type="submit" loading={login.isPending}>
        Sign in
      </Button>
      <Text size="sm" ta="center">
        New here?{' '}
        <Anchor component="button" type="button" onClick={onSwitch}>
          Create an HR profile
        </Anchor>
      </Text>
    </Stack>
  );
}

function CreateProfileForm({ onSwitch }) {
  const { register } = useAuth();
  const [values, setValues] = useState({ email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});

  const set = (field) => (event) => {
    const value = event.currentTarget.value;
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const result = registerSchema.safeParse(values);
    const found = result.success
      ? {}
      : Object.fromEntries(
          Object.entries(z.flattenError(result.error).fieldErrors).map(([f, m]) => [f, m[0]]),
        );
    if (values.password !== values.confirm) found.confirm = 'Passwords do not match';
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    try {
      await register.mutateAsync(result.data);
    } catch (error) {
      if (error.status === 409) setErrors({ email: error.message });
    }
  };

  const failure = register.isError && register.error.status !== 409 ? register.error.message : null;

  return (
    <Stack component="form" onSubmit={submit} noValidate>
      <div>
        <Title order={2}>Create an HR profile</Title>
        <Text c="dimmed" size="sm">
          You will be signed in straight away
        </Text>
      </div>
      {failure && (
        <Alert color="red" variant="light" role="alert">
          {failure}
        </Alert>
      )}
      <TextInput
        label="Work email"
        type="email"
        autoComplete="username"
        required
        value={values.email}
        onChange={set('email')}
        error={errors.email}
      />
      <PasswordInput
        label="Password"
        description="At least 8 characters"
        autoComplete="new-password"
        required
        value={values.password}
        onChange={set('password')}
        error={errors.password}
      />
      <PasswordInput
        label="Confirm password"
        autoComplete="new-password"
        required
        value={values.confirm}
        onChange={set('confirm')}
        error={errors.confirm}
      />
      <Button type="submit" loading={register.isPending}>
        Create profile
      </Button>
      <Text size="sm" ta="center">
        Already have a profile?{' '}
        <Anchor component="button" type="button" onClick={onSwitch}>
          Sign in
        </Anchor>
      </Text>
    </Stack>
  );
}

export function LoginPage() {
  const [mode, setMode] = useState('sign-in');

  return (
    <Center mih="100dvh" bg="gray.0" px="md">
      <Paper withBorder shadow="sm" p="xl" radius="md" w="100%" maw={400}>
        {mode === 'sign-in' ? (
          <SignInForm onSwitch={() => setMode('create')} />
        ) : (
          <CreateProfileForm onSwitch={() => setMode('sign-in')} />
        )}
      </Paper>
    </Center>
  );
}
