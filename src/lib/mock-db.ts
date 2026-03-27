export type User = {
  id: string;
  name: string;
  email: string;
  isSubscribed: boolean;
  plan: 'monthly' | 'yearly' | null;
  scores: number[];
  winnings: number;
  participationHistory: DrawResult[];
  charityId: string | null;
};

export type DrawResult = {
  drawId: string;
  date: string;
  userScoresUsed: number[];
  winningNumbers: number[];
  matches: number;
  prizeAmount: number;
};

export type Charity = {
  id: string;
  name: string;
  mission: string;
  description: string;
};

export type Prize = {
  id: string;
  name: string;
  value: string;
  description: string;
};

// Singleton Mock Store
class MockDB {
  private static instance: MockDB;
  public users: Record<string, User> = {
    'user-1': {
      id: 'user-1',
      name: 'Alex Pro',
      email: 'alex@example.com',
      isSubscribed: true,
      plan: 'monthly',
      scores: [36, 38, 34, 40, 32],
      winnings: 150,
      participationHistory: [
        {
          drawId: 'draw-prev-1',
          date: '2024-01-01',
          userScoresUsed: [32, 33, 34, 35, 36],
          winningNumbers: [32, 33, 34, 10, 15],
          matches: 3,
          prizeAmount: 50
        }
      ],
      charityId: 'charity-1'
    }
  };

  public charities: Charity[] = [
    { id: 'charity-1', name: 'Junior Golf Foundation', mission: 'Empowering youth through sports.', description: 'Providing equipment and coaching to underprivileged children.' },
    { id: 'charity-2', name: 'Green Fairways Project', mission: 'Protecting local environments.', description: 'Helping golf courses implement sustainable water management.' }
  ];

  public currentDraw: number[] | null = null;
  public winners: Array<{userId: string; matches: number; prize: number}> = [];

  private constructor() {}

  public static getInstance(): MockDB {
    if (!MockDB.instance) {
      MockDB.instance = new MockDB();
    }
    return MockDB.instance;
  }

  public addScore(userId: string, score: number) {
    const user = this.users[userId];
    if (user) {
      user.scores.push(score);
      if (user.scores.length > 5) {
        user.scores.shift();
      }
    }
  }

  public updateSubscription(userId: string, plan: 'monthly' | 'yearly' | null) {
    const user = this.users[userId];
    if (user) {
      user.isSubscribed = plan !== null;
      user.plan = plan;
    }
  }

  public runDraw() {
    const winningNumbers = Array.from({ length: 5 }, () => Math.floor(Math.random() * 45) + 1);
    this.currentDraw = winningNumbers;
    this.winners = [];

    Object.values(this.users).forEach(user => {
      if (user.isSubscribed && user.scores.length === 5) {
        const matches = user.scores.filter(s => winningNumbers.includes(s)).length;
        let prize = 0;
        if (matches === 3) prize = 50;
        if (matches === 4) prize = 500;
        if (matches === 5) prize = 5000;

        if (prize > 0) {
          user.winnings += prize;
          this.winners.push({ userId: user.id, matches, prize });
        }
        
        user.participationHistory.push({
          drawId: `draw-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          userScoresUsed: [...user.scores],
          winningNumbers,
          matches,
          prizeAmount: prize
        });
      }
    });

    return winningNumbers;
  }
}

export const db = MockDB.getInstance();