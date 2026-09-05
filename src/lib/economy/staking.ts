export interface StakingPool {
  id: string;
  totalStaked: number;
  rewardRate: number; // Rate per time unit (e.g. per millisecond for simplicity)
  lockupPenaltyRate: number; // Penalty rate (e.g. 0.1 for 10%)
  lockupHorizon: number; // Duration in milliseconds before penalty expires
}

export interface Stake {
  id: string;
  poolId: string;
  accountId: string;
  amount: number;
  timestamp: number;
  lastYieldDistribution: number;
}

export class StakingService {
  private pools: Map<string, StakingPool> = new Map();
  private stakes: Map<string, Stake> = new Map();

  public createPool(
    id: string,
    rewardRate: number,
    lockupPenaltyRate: number,
    lockupHorizon: number
  ): StakingPool {
    if (this.pools.has(id)) {
      throw new Error(`Pool ${id} already exists`);
    }
    const pool: StakingPool = {
      id,
      totalStaked: 0,
      rewardRate,
      lockupPenaltyRate,
      lockupHorizon,
    };
    this.pools.set(id, pool);
    return pool;
  }

  public getPool(id: string): StakingPool | undefined {
    return this.pools.get(id);
  }

  public stake(
    poolId: string,
    accountId: string,
    amount: number,
    timestamp: number = Date.now()
  ): Stake {
    if (amount <= 0) {
      throw new Error("Stake amount must be strictly positive");
    }

    const pool = this.pools.get(poolId);
    if (!pool) {
      throw new Error(`Pool ${poolId} not found`);
    }

    const stakeId = globalThis.crypto.randomUUID();
    const stake: Stake = {
      id: stakeId,
      poolId,
      accountId,
      amount,
      timestamp,
      lastYieldDistribution: timestamp,
    };

    pool.totalStaked += amount;
    this.stakes.set(stakeId, stake);

    return stake;
  }

  public getStake(id: string): Stake | undefined {
    return this.stakes.get(id);
  }

  public calculatePenalty(stakeId: string, withdrawalTime: number = Date.now()): number {
    const stake = this.stakes.get(stakeId);
    if (!stake) {
      throw new Error(`Stake ${stakeId} not found`);
    }

    const pool = this.pools.get(stake.poolId);
    if (!pool) {
      throw new Error(`Pool ${stake.poolId} not found`);
    }

    const timeElapsed = withdrawalTime - stake.timestamp;
    if (timeElapsed < pool.lockupHorizon) {
      return stake.amount * pool.lockupPenaltyRate;
    }
    return 0;
  }

  public calculateReward(stakeId: string, currentTime: number = Date.now()): number {
    const stake = this.stakes.get(stakeId);
    if (!stake) {
      throw new Error(`Stake ${stakeId} not found`);
    }

    const pool = this.pools.get(stake.poolId);
    if (!pool) {
      throw new Error(`Pool ${stake.poolId} not found`);
    }

    const timeElapsedMs = currentTime - stake.lastYieldDistribution;

    // Reward is calculated as (principal * rewardRate * timeElapsedMs)
    return stake.amount * pool.rewardRate * timeElapsedMs;
  }

  public distributeYield(stakeId: string, currentTime: number = Date.now()): number {
    const stake = this.stakes.get(stakeId);
    if (!stake) {
      throw new Error(`Stake ${stakeId} not found`);
    }

    const reward = this.calculateReward(stakeId, currentTime);

    // Compounding: add reward to stake amount
    stake.amount += reward;
    stake.lastYieldDistribution = currentTime;

    const pool = this.pools.get(stake.poolId);
    if (pool) {
      pool.totalStaked += reward;
    }

    return reward;
  }

  public distributeYieldForAll(currentTime: number = Date.now()): void {
    Array.from(this.stakes.keys()).forEach((stakeId) => {
      this.distributeYield(stakeId, currentTime);
    });
  }

  public withdraw(stakeId: string, withdrawalTime: number = Date.now()): { principal: number; penalty: number } {
    const stake = this.stakes.get(stakeId);
    if (!stake) {
      throw new Error(`Stake ${stakeId} not found`);
    }

    const pool = this.pools.get(stake.poolId);
    if (!pool) {
      throw new Error(`Pool ${stake.poolId} not found`);
    }

    // Distribute any pending yield before calculating penalty and withdrawing
    this.distributeYield(stakeId, withdrawalTime);

    const penalty = this.calculatePenalty(stakeId, withdrawalTime);
    const principal = stake.amount - penalty;

    pool.totalStaked -= stake.amount;
    this.stakes.delete(stakeId);

    return { principal, penalty };
  }
}
