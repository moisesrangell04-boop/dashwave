export class Phone {
  private readonly value: string;

  constructor(value: string) {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 10 || cleaned.length > 15) {
      throw new Error(`Invalid phone number: ${value}`);
    }
    this.value = cleaned;
  }

  getValue(): string {
    return this.value;
  }

  getFormatted(): string {
    if (this.value.length === 13) {
      return `+${this.value.slice(0, 2)} (${this.value.slice(2, 4)}) ${this.value.slice(4, 9)}-${this.value.slice(9)}`;
    }
    return this.value;
  }
}
