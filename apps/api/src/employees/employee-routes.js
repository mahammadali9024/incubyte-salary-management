import { Router } from 'express';
import { employeeInputSchema, employeeListQuerySchema, employeeUpdateSchema } from '@acme/shared';
import { idParam, validate } from '../http/validate.js';

/** @param {ReturnType<typeof import('./employee-service.js').createEmployeeService>} service */
export function employeeRoutes(service) {
  const router = Router();

  router.get('/', (req, res) => {
    res.json(service.list(validate(employeeListQuerySchema, req.query)));
  });

  router.post('/', (req, res) => {
    const created = service.create(validate(employeeInputSchema, req.body));
    res.status(201).location(`/api/employees/${created.id}`).json(created);
  });

  router.get('/:id', (req, res) => {
    res.json(service.get(validate(idParam, req.params.id)));
  });

  router.put('/:id', (req, res) => {
    const id = validate(idParam, req.params.id);
    res.json(service.update(id, validate(employeeUpdateSchema, req.body)));
  });

  router.delete('/:id', (req, res) => {
    service.delete(validate(idParam, req.params.id));
    res.status(204).end();
  });

  router.get('/:id/salary-history', (req, res) => {
    const id = validate(idParam, req.params.id);
    service.get(id); // 404 for unknown employees rather than an empty list
    res.json(service.salaryHistory(id));
  });

  return router;
}
