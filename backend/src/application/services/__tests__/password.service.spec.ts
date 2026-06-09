import { PasswordService } from '../password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  it('should hash a password', async () => {
    const hash = await service.hash('myPassword123');
    expect(hash).toBeDefined();
    expect(hash).not.toBe('myPassword123');
  });

  it('should compare correct password', async () => {
    const hash = await service.hash('myPassword123');
    const result = await service.compare('myPassword123', hash);
    expect(result).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const hash = await service.hash('myPassword123');
    const result = await service.compare('wrongPassword', hash);
    expect(result).toBe(false);
  });

  it('should generate temp password', () => {
    const password = service.generateTempPassword();
    expect(password).toBeDefined();
    expect(password.length).toBe(16);
  });

  it('should generate unique temp passwords', () => {
    const p1 = service.generateTempPassword();
    const p2 = service.generateTempPassword();
    expect(p1).not.toBe(p2);
  });
});
