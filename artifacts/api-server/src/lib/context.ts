export interface AccountContextProvider {
  getContext(userId: string): Promise<null>;
}

export class DemoAccountContextProvider implements AccountContextProvider {
  async getContext(_userId: string): Promise<null> {
    return null;
  }
}

export const accountContextProvider: AccountContextProvider = new DemoAccountContextProvider();