import { Interaction } from '../../../../../src/clients/domain/entities/Interaction';
import { InteractionChannel } from '../../../../../src/clients/domain/enums/InteractionChannel';
import { OutcomeCategory } from '../../../../../src/clients/domain/entities/OutcomeCategory';

describe('Interaction Entity', () => {
  it('creates an interaction with an outcome category', () => {
    const outcome = OutcomeCategory.create({ id: 'out-1', tenantId: 'tenant-1', label: 'Positive' });
    
    const interaction = Interaction.create({
      id: 'int-1',
      tenantId: 'tenant-1',
      clientId: 'client-1',
      authorUserId: 'user-1',
      content: 'Met with client.',
      channel: InteractionChannel.MEETING,
      outcomeCategory: outcome,
      createdAt: new Date(),
    });

    expect(interaction.id).toBe('int-1');
    expect(interaction.channel).toBe(InteractionChannel.MEETING);
    expect(interaction.outcomeCategory?.label).toBe('Positive');
  });

  it('rejects outcome category if tenantId does not match interaction tenantId', () => {
    const outcome = OutcomeCategory.create({ id: 'out-2', tenantId: 'tenant-2', label: 'Positive' });
    
    expect(() => {
      Interaction.create({
        id: 'int-2',
        tenantId: 'tenant-1',
        clientId: 'client-1',
        authorUserId: 'user-1',
        content: 'Met with client.',
        channel: InteractionChannel.MEETING,
        outcomeCategory: outcome,
        createdAt: new Date(),
      });
    }).toThrow('Outcome category does not belong to this tenant.');
  });
});
