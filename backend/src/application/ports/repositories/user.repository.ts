import { User, UserProps } from '../../../@core/entities/user';

export interface UserRepository {
  create(user: User): Promise<User>;
  update(id: string, data: Partial<UserProps>): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByTenantId(tenantId: string): Promise<User[]>;
  delete(id: string): Promise<void>;
}
