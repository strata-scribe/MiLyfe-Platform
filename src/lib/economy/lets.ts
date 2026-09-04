export interface Account {
  id: string;
  balance: number;
  creditLimit: number;
  debitLimit: number;
}

export interface Transaction {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  timestamp: number;
  description?: string;
}

export class MutualCreditLedger {
  private accounts: Map<string, Account> = new Map();
  private transactions: Transaction[] = [];

  public createAccount(id: string, creditLimit: number = -100, debitLimit: number = 100): Account {
    if (this.accounts.has(id)) {
      throw new Error(`Account ${id} already exists`);
    }
    const account: Account = {
      id,
      balance: 0,
      creditLimit, // e.g. -100 means the account can go down to -100 units
      debitLimit,  // e.g. 100 means the account can hold up to 100 units
    };
    this.accounts.set(id, account);
    return account;
  }

  public getAccount(id: string): Account | undefined {
    return this.accounts.get(id);
  }

  public recordTransaction(
    fromAccountId: string,
    toAccountId: string,
    amount: number, // Hourly equivalency units
    description?: string
  ): Transaction {
    if (amount <= 0) {
      throw new Error("Transaction amount must be strictly positive");
    }

    if (fromAccountId === toAccountId) {
      throw new Error("Cannot transact with the same account");
    }

    const fromAccount = this.accounts.get(fromAccountId);
    const toAccount = this.accounts.get(toAccountId);

    if (!fromAccount) {
      throw new Error(`Source account ${fromAccountId} not found`);
    }

    if (!toAccount) {
      throw new Error(`Destination account ${toAccountId} not found`);
    }

    // Verify limits
    // In mutual credit, the 'from' account (buyer/receiver of service) goes into debit (negative balance)
    // The 'to' account (seller/provider of service) goes into credit (positive balance)
    if (fromAccount.balance - amount < fromAccount.creditLimit) {
      throw new Error(`Transaction would exceed credit limit for account ${fromAccountId}`);
    }

    if (toAccount.balance + amount > toAccount.debitLimit) {
      throw new Error(`Transaction would exceed debit limit for account ${toAccountId}`);
    }

    // Double-entry posting
    fromAccount.balance -= amount;
    toAccount.balance += amount;

    const transaction: Transaction = {
      id: globalThis.crypto.randomUUID(),
      fromAccountId,
      toAccountId,
      amount,
      timestamp: Date.now(),
      description,
    };

    this.transactions.push(transaction);

    return transaction;
  }

  public verifyZeroSum(): boolean {
    const sum = Array.from(this.accounts.values()).reduce(
      (acc, account) => acc + account.balance,
      0
    );
    // Use an epsilon for floating point safety
    return Math.abs(sum) < 1e-10;
  }

  public getTransactions(): Transaction[] {
    return [...this.transactions];
  }
}
