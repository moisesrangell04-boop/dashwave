import { UpdateContactUseCase } from '../contact/update-contact.use-case';
import { ContactRepository } from '../../ports/repositories/contact.repository';

describe('UpdateContactUseCase', () => {
  let useCase: UpdateContactUseCase;
  let contactRepo: jest.Mocked<ContactRepository>;

  beforeEach(() => {
    contactRepo = { findById: jest.fn(), update: jest.fn(), findByPhone: jest.fn(), create: jest.fn(), search: jest.fn() } as any;
    useCase = new UpdateContactUseCase(contactRepo);
  });

  it('should throw if contact not found', async () => {
    contactRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute({ id: 'c1', tenantId: 't1' })).rejects.toThrow('Contato não encontrado');
  });

  it('should update contact', async () => {
    contactRepo.findById.mockResolvedValue({} as any);
    contactRepo.update.mockResolvedValue({ getId: () => 'c1' } as any);

    const result = await useCase.execute({ id: 'c1', tenantId: 't1', name: 'New Name', tags: ['vip'] });
    expect(result).toBeDefined();
    expect(contactRepo.update).toHaveBeenCalledWith('c1', { name: 'New Name', tags: ['vip'], notes: undefined });
  });
});
