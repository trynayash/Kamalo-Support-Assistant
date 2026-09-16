export type EngineName = "transaction" | "coins" | "commission" | "fincado" | "notification";

export type EngineProviderContext = {
  requestId: string;
  userId: string;
  tenantId: string;
  permissions: readonly string[];
};

export type EngineProviderResult = {
  sourceType: "live" | "demo";
  synthetic: boolean;
  data: Record<string, unknown>;
};

export interface EngineProvider {
  readonly name: EngineName;
  readonly version: string;
  read(operation: string, input: Record<string, unknown>, context: EngineProviderContext): Promise<EngineProviderResult>;
}

export class EngineProviderRegistry {
  private readonly providers = new Map<EngineName, EngineProvider>();

  register(provider: EngineProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: EngineName): EngineProvider | null {
    return this.providers.get(name) || null;
  }

  list(): Array<{ name: EngineName; version: string }> {
    return [...this.providers.values()].map((provider) => ({ name: provider.name, version: provider.version }));
  }
}

export const engineProviders = new EngineProviderRegistry();