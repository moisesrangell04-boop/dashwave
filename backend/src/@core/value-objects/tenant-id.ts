import { v4 as uuid } from 'uuid';

export class TenantId {
  private readonly value: string;

  constructor(value?: string) {
    this.value = value ?? uuid();
  }

  getValue(): string {
    return this.value;
  }

  equals(other: TenantId): boolean {
    return this.value === other.getValue();
  }
}
