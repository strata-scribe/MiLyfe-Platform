import { describe, it, expect, beforeEach } from "vitest";
import { StakingService, StakingPool, Stake } from "./staking";

describe("StakingService", () => {
  let stakingService: StakingService;

  beforeEach(() => {
    stakingService = new StakingService();
  });

  describe("createPool", () => {
    it("should create a staking pool successfully", () => {
      const pool = stakingService.createPool("pool1", 0.001, 0.1, 1000);
      expect(pool).toBeDefined();
      expect(pool.id).toBe("pool1");
      expect(pool.rewardRate).toBe(0.001);
      expect(pool.lockupPenaltyRate).toBe(0.1);
      expect(pool.lockupHorizon).toBe(1000);
      expect(pool.totalStaked).toBe(0);

      const fetchedPool = stakingService.getPool("pool1");
      expect(fetchedPool).toEqual(pool);
    });

    it("should throw an error if pool already exists", () => {
      stakingService.createPool("pool1", 0.001, 0.1, 1000);
      expect(() => stakingService.createPool("pool1", 0.001, 0.1, 1000)).toThrow(
        "Pool pool1 already exists"
      );
    });
  });

  describe("stake", () => {
    it("should successfully stake user funds", () => {
      stakingService.createPool("pool1", 0.001, 0.1, 1000);
      const stake = stakingService.stake("pool1", "user1", 100);

      expect(stake).toBeDefined();
      expect(stake.poolId).toBe("pool1");
      expect(stake.accountId).toBe("user1");
      expect(stake.amount).toBe(100);

      const pool = stakingService.getPool("pool1");
      expect(pool?.totalStaked).toBe(100);
    });

    it("should throw error if amount is zero or negative", () => {
      stakingService.createPool("pool1", 0.001, 0.1, 1000);
      expect(() => stakingService.stake("pool1", "user1", 0)).toThrow(
        "Stake amount must be strictly positive"
      );
      expect(() => stakingService.stake("pool1", "user1", -10)).toThrow(
        "Stake amount must be strictly positive"
      );
    });

    it("should throw error if pool does not exist", () => {
      expect(() => stakingService.stake("nonexistent", "user1", 100)).toThrow(
        "Pool nonexistent not found"
      );
    });
  });

  describe("calculatePenalty", () => {
    it("should apply lockup penalty if withdrawn before horizon", () => {
      stakingService.createPool("pool1", 0.001, 0.1, 1000); // 1000ms horizon, 10% penalty
      const startTime = 10000;
      const stake = stakingService.stake("pool1", "user1", 100, startTime);

      const withdrawalTime = startTime + 500; // Withdrawing 500ms later (before 1000ms)
      const penalty = stakingService.calculatePenalty(stake.id, withdrawalTime);

      expect(penalty).toBe(10); // 100 * 0.1 = 10
    });

    it("should not apply lockup penalty if withdrawn after horizon", () => {
      stakingService.createPool("pool1", 0.001, 0.1, 1000); // 1000ms horizon, 10% penalty
      const startTime = 10000;
      const stake = stakingService.stake("pool1", "user1", 100, startTime);

      const withdrawalTime = startTime + 1500; // Withdrawing 1500ms later (after 1000ms)
      const penalty = stakingService.calculatePenalty(stake.id, withdrawalTime);

      expect(penalty).toBe(0);
    });
  });

  describe("calculateReward and distributeYield", () => {
    it("should calculate reward based on time elapsed", () => {
      // Reward rate 0.001 per ms. 100 principal.
      stakingService.createPool("pool1", 0.001, 0.1, 1000);
      const startTime = 10000;
      const stake = stakingService.stake("pool1", "user1", 100, startTime);

      const currentTime = startTime + 100; // 100ms later
      // Reward = 100 * 0.001 * 100 = 10
      const reward = stakingService.calculateReward(stake.id, currentTime);

      expect(reward).toBe(10);
    });

    it("should distribute yield and compound", () => {
      stakingService.createPool("pool1", 0.001, 0.1, 1000);
      const startTime = 10000;
      const stake = stakingService.stake("pool1", "user1", 100, startTime);

      const currentTime = startTime + 100; // 100ms later
      const distributed = stakingService.distributeYield(stake.id, currentTime);

      expect(distributed).toBe(10);

      const updatedStake = stakingService.getStake(stake.id);
      expect(updatedStake?.amount).toBe(110);
      expect(updatedStake?.lastYieldDistribution).toBe(currentTime);

      const pool = stakingService.getPool("pool1");
      expect(pool?.totalStaked).toBe(110);

      // Check compounding on next step
      const nextTime = currentTime + 100; // another 100ms later
      // Reward = 110 * 0.001 * 100 = 11
      const distributed2 = stakingService.distributeYield(stake.id, nextTime);
      expect(distributed2).toBe(11);

      const updatedStake2 = stakingService.getStake(stake.id);
      expect(updatedStake2?.amount).toBe(121);
      expect(updatedStake2?.lastYieldDistribution).toBe(nextTime);
    });

    it("should distribute yield for all stakes", () => {
      stakingService.createPool("pool1", 0.001, 0.1, 1000);
      const startTime = 10000;
      const stake1 = stakingService.stake("pool1", "user1", 100, startTime);
      const stake2 = stakingService.stake("pool1", "user2", 200, startTime);

      const currentTime = startTime + 100; // 100ms later
      stakingService.distributeYieldForAll(currentTime);

      const updatedStake1 = stakingService.getStake(stake1.id);
      const updatedStake2 = stakingService.getStake(stake2.id);

      // stake1 reward = 100 * 0.001 * 100 = 10 -> amount = 110
      expect(updatedStake1?.amount).toBe(110);

      // stake2 reward = 200 * 0.001 * 100 = 20 -> amount = 220
      expect(updatedStake2?.amount).toBe(220);
    });
  });

  describe("withdraw", () => {
    it("should withdraw properly before horizon (with penalty)", () => {
      stakingService.createPool("pool1", 0.001, 0.1, 1000);
      const startTime = 10000;
      const stake = stakingService.stake("pool1", "user1", 100, startTime);

      // 500ms later (before horizon 1000ms).
      // Yield = 100 * 0.001 * 500 = 50. Total amount = 150.
      // Penalty = 150 * 0.1 = 15. Principal = 150 - 15 = 135.
      const withdrawalTime = startTime + 500;

      const { principal, penalty } = stakingService.withdraw(stake.id, withdrawalTime);

      expect(penalty).toBe(15);
      expect(principal).toBe(135);

      const pool = stakingService.getPool("pool1");
      expect(pool?.totalStaked).toBe(0);

      const deletedStake = stakingService.getStake(stake.id);
      expect(deletedStake).toBeUndefined();
    });

    it("should withdraw properly after horizon (without penalty)", () => {
      stakingService.createPool("pool1", 0.001, 0.1, 1000);
      const startTime = 10000;
      const stake = stakingService.stake("pool1", "user1", 100, startTime);

      // 1500ms later (after horizon 1000ms).
      // Yield = 100 * 0.001 * 1500 = 150. Total amount = 250.
      // Penalty = 0. Principal = 250.
      const withdrawalTime = startTime + 1500;

      const { principal, penalty } = stakingService.withdraw(stake.id, withdrawalTime);

      expect(penalty).toBe(0);
      expect(principal).toBe(250);

      const pool = stakingService.getPool("pool1");
      expect(pool?.totalStaked).toBe(0);
    });
  });
});
