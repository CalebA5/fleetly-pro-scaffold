import type { Example, InsertExample } from "@shared/schema";

export interface IStorage {
  getExamples(): Promise<Example[]>;
  getExample(id: number): Promise<Example | undefined>;
  createExample(example: InsertExample): Promise<Example>;
}

export class MemStorage implements IStorage {
  private examples: Example[] = [];
  private nextId = 1;

  async getExamples(): Promise<Example[]> {
    return this.examples;
  }

  async getExample(id: number): Promise<Example | undefined> {
    return this.examples.find((e) => e.id === id);
  }

  async createExample(example: InsertExample): Promise<Example> {
    const newExample: Example = {
      ...example,
      id: this.nextId++,
      createdAt: new Date(),
    };
    this.examples.push(newExample);
    return newExample;
  }
}
