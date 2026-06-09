import { SearchContactUseCase } from '../contact/search-contact.use-case';
import { ContactRepository } from '../../ports/repositories/contact.repository';

describe('SearchContactUseCase', () => {
  let useCase: SearchContactUseCase;
  let contactRepo: jest.Mocked<ContactRepository>;

  beforeEach(() => {
    contactRepo = { search: jest.fn(), findById: jest.fn(), findByPhone: jest.fn(), create: jest.fn(), update: jest.fn() } as any;
    useCase = new SearchContactUseCase(contactRepo);
  });

  it('should delegate search to repository', async () => {
    const mockResults = [{ getId: () => 'c1' }];
    contactRepo.search.mockResolvedValue(mockResults as any);

    const result = await useCase.execute('t1', 'w1', 'John');
    expect(result).toBe(mockResults);
    expect(contactRepo.search).toHaveBeenCalledWith('t1', 'w1', 'John');
  });
});
