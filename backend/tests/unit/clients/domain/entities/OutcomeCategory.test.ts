import { OutcomeCategory } from '../../../../../src/clients/domain/entities/OutcomeCategory';

describe('OutcomeCategory Entity', () => {
  it('creates an outcome category successfully', () => {
    const outcome = OutcomeCategory.create({
      id: 'out-1',
      tenantId: 'tenant-123',
      label: 'Closed Won',
    });

    expect(outcome.id).toBe('out-1');
    expect(outcome.tenantId).toBe('tenant-123');
    expect(outcome.label).toBe('Closed Won');
  });

  it('rejects an empty label', () => {
    expect(() => {
      OutcomeCategory.create({
        id: 'out-2',
        tenantId: 'tenant-123',
        label: '',
      });
    }).toThrow('Outcome category label cannot be empty.');
  });
});
