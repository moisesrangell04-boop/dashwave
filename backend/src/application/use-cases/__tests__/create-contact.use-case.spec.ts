import { CreateContactUseCase } from '../contact/create-contact.use-case';
import { ContactRepository } from '../../ports/repositories/contact.repository';

describe('CreateContactUseCase', () => {
  let useCase: CreateContactUseCase;
  let contactRepo: jest.Mocked<ContactRepository>;

  beforeEach(() => {
    contactRepo = { create: jest.fn(), findByPhone: jest.fn(), findById: jest.fn(), update: jest.fn(), search: jest.fn() } as any;
    useCase = new CreateContactUseCase(contactRepo);
  });

  it('should throw if phone already exists', async () => {
    contactRepo.findByPhone.mockResolvedValue({} as any);
    await expect(
      useCase.execute({ tenantId: 't1', workspaceId: 'w1', name: 'John', phone: '5511999999999' }),
    ).rejects.toThrow('Já existe um contato com este telefone');
  });

  it('should create contact', async () => {
    contactRepo.findByPhone.mockResolvedValue(null);
    contactRepo.create.mockResolvedValue({ getId: () => 'contact-1' } as any);

    const result = await useCase.execute({
      tenantId: 't1', workspaceId: 'w1', name: 'John', phone: '5511999999999', tags: ['vip'],
    });
    expect(result).toBeDefined();
    expect(contactRepo.create).toHaveBeenCalled();
  });
});
