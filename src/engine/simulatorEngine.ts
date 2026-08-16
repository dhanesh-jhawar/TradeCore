import { prisma } from '../lib/prisma';
import { OrderBookManager } from './orderBook';
import { EventBus } from './eventBus';
import { OrderStateMachine } from './orderStateMachine';
import { ExchangeQueue } from './exchangeQueue';
import { Money } from '../utils/money';
import crypto from 'crypto';

export interface SimulatorConfig {
  enabled: boolean;
  intensity: number; // 1 to 10 scale
  maxOrdersPerSec: number;
  volatilityMultiplier: number;
}

const DEFAULT_CONFIG: SimulatorConfig = {
  enabled: false,
  intensity: 5,
  maxOrdersPerSec: 200,
  volatilityMultiplier: 1.0,
};

// Represents an in-memory profile of a simulated trader
interface SimulatedTrader {
  id: string; // The User ID in the database
  role: 'RETAIL' | 'INSTITUTIONAL' | 'MARKET_MAKER' | 'MOMENTUM';
  orderSizeMultiplier: number;
}

export class SimulatorEngine {
  private static instance: SimulatorEngine;
  
  public config: SimulatorConfig = { ...DEFAULT_CONFIG };
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private bots: SimulatedTrader[] = [];
  
  // Track companies in memory to avoid DB hits on every tick
  private companies: { id: string; symbol: string; currentPrice: number; tickSize: number; avgOrderRate: number }[] = [];
  
  private activeInFlightOrders: number = 0;
  private readonly MAX_IN_FLIGHT = 10;

  private constructor() {}

  public static getInstance(): SimulatorEngine {
    // Next.js dev server hot-reload safety
    if (!(global as any).__simulatorEngine) {
      (global as any).__simulatorEngine = new SimulatorEngine();
    }
    return (global as any).__simulatorEngine;
  }

  /**
   * Initialize bots, wallets, and portfolio holdings.
   */
  public async init() {
    if (this.bots.length > 0) return; // Already initialized

    console.log('[SimulatorEngine] Initializing Simulator...');
    
    // Fetch all companies
    const allCompanies = await prisma.company.findMany();
    this.companies = allCompanies.map(c => ({
      id: c.id,
      symbol: c.symbol,
      currentPrice: c.currentPrice,
      tickSize: c.tickSize,
      avgOrderRate: c.avgOrderRate,
    }));

    const botEmails = [
      'retail_bot@tradecore.sim',
      'inst_bot@tradecore.sim',
      'mm_bot_1@tradecore.sim',
      'mm_bot_2@tradecore.sim',
      'momentum_bot@tradecore.sim',
    ];

    const roles: ('RETAIL' | 'INSTITUTIONAL' | 'MARKET_MAKER' | 'MOMENTUM')[] = [
      'RETAIL', 'INSTITUTIONAL', 'MARKET_MAKER', 'MARKET_MAKER', 'MOMENTUM'
    ];
    
    const sizeMultipliers = [1, 50, 10, 10, 5];

    for (let i = 0; i < botEmails.length; i++) {
      const email = botEmails[i];
      let user = await prisma.user.findUnique({ where: { email }, include: { portfolio: true } });
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: `Bot_${roles[i]}`,
            passwordHash: 'SIMULATOR',
            role: 'SIMULATOR',
            wallet: {
              create: {
                availableBalance: 1000000000, // 1 Billion cash
                totalBalance: 1000000000,
              }
            },
            portfolio: {
              create: {
                totalValue: 0,
              }
            }
          },
          include: { portfolio: true }
        });

        // Seed holdings for all companies so they can sell
        console.log(`[SimulatorEngine] Seeding holdings for ${user.name}...`);
        for (const comp of allCompanies) {
          await prisma.portfolioHolding.create({
            data: {
              portfolioId: user.portfolio!.id,
              companyId: comp.id,
              quantity: 500000,
              averagePrice: comp.currentPrice,
              currentPrice: comp.currentPrice,
            }
          });
        }
      }

      this.bots.push({
        id: user.id,
        role: roles[i],
        orderSizeMultiplier: sizeMultipliers[i],
      });
    }
    
    console.log(`[SimulatorEngine] Initialized ${this.bots.length} simulated traders.`);
  }

  public async start() {
    if (this.isRunning) return;
    if (this.bots.length === 0) {
      await this.init();
    }
    
    // Ensure the exchange queue is recovered before simulator starts trading
    const { RecoveryEngine } = require('./recoveryEngine');
    await RecoveryEngine.ensureRecovered();
    
    this.isRunning = true;
    this.config.enabled = true;
    console.log('[SimulatorEngine] Simulator STARTED');

    // Run tick every 1 second
    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  public stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.config.enabled = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('[SimulatorEngine] Simulator STOPPED');
  }

  public updateConfig(newConfig: Partial<SimulatorConfig>) {
    this.config = { ...this.config, ...newConfig };
    console.log('[SimulatorEngine] Config updated:', this.config);
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      activeBots: this.bots.length,
      inFlightOrders: this.activeInFlightOrders,
    };
  }

  /**
   * Main simulation tick. Called every second.
   */
  private async tick() {
    if (!this.isRunning) return;

    // Backpressure check - general system
    if (this.activeInFlightOrders >= this.MAX_IN_FLIGHT) {
      console.warn(`[SimulatorEngine] Backpressure threshold reached (${this.activeInFlightOrders} active). Skipping tick.`);
      return;
    }

    // Determine total number of orders to generate this second based on intensity
    // Intensity 5 = roughly 50 orders/sec across the market
    const targetOrders = Math.floor(Math.random() * (this.config.intensity * 10)) + 5;
    const actualOrders = Math.min(targetOrders, this.config.maxOrdersPerSec);

    // Distribute orders across random companies and bots
    const promises: Promise<void>[] = [];

    for (let i = 0; i < actualOrders; i++) {
      if (this.activeInFlightOrders >= this.MAX_IN_FLIGHT) break;
      
      const comp = this.companies[Math.floor(Math.random() * this.companies.length)];
      
      // Strict per-company backpressure
      if (ExchangeQueue.getDepth(comp.id) > 1000) {
        continue;
      }

      const bot = this.bots[Math.floor(Math.random() * this.bots.length)];
      
      this.activeInFlightOrders++;

      // Occasionally broadcast simulator status to Admin
      if (Math.random() < 0.1) {
        EventBus.broadcast('ADMIN', 'SIMULATOR_UPDATED', this.getStatus());
      }

      promises.push(this.generateAndSubmitOrder(bot, comp).finally(() => {
        this.activeInFlightOrders--;
      }));
    }
    
    // We don't await the promises here because we want the engine to fire-and-forget 
    // and let Node's event loop process them asynchronously, restricted by activeInFlightOrders.
  }

  private async generateAndSubmitOrder(bot: SimulatedTrader, company: any) {
    try {
      const book = OrderBookManager.getBook(company.id);
      const snapshot = book.getSnapshot();
      
      let side: 'BUY' | 'SELL' = Math.random() > 0.5 ? 'BUY' : 'SELL';
      let orderType: 'MARKET' | 'LIMIT' = 'LIMIT';
      
      // Determine price and side based on bot profile
      let price = company.currentPrice;
      const spread = snapshot.spread || (company.currentPrice * 0.001);
      const halfSpread = spread / 2;
      
      if (bot.role === 'MARKET_MAKER') {
        // MMs post passive limit orders
        if (side === 'BUY') {
          price = snapshot.bestBid ? snapshot.bestBid : company.currentPrice - halfSpread;
        } else {
          price = snapshot.bestAsk ? snapshot.bestAsk : company.currentPrice + halfSpread;
        }
      } else if (bot.role === 'RETAIL') {
        // Retail often crosses the spread (MARKET) or places aggressive limits
        if (Math.random() > 0.6) {
          orderType = 'MARKET';
        } else {
          if (side === 'BUY') {
            price = snapshot.bestAsk ? snapshot.bestAsk : company.currentPrice + halfSpread;
          } else {
            price = snapshot.bestBid ? snapshot.bestBid : company.currentPrice - halfSpread;
          }
        }
      } else if (bot.role === 'INSTITUTIONAL') {
        // Institutions hide slightly behind best prices
        if (side === 'BUY') {
          price = snapshot.bestBid ? snapshot.bestBid - (company.tickSize * 2) : company.currentPrice - spread;
        } else {
          price = snapshot.bestAsk ? snapshot.bestAsk + (company.tickSize * 2) : company.currentPrice + spread;
        }
      }

      // Add volatility noise
      const maxNoise = company.currentPrice * 0.005 * this.config.volatilityMultiplier; // 0.5% max noise
      const noise = (Math.random() * maxNoise * 2) - maxNoise;
      price = Money.round(price + noise);
      
      // Ensure tick size compliance
      const remainder = price % company.tickSize;
      if (remainder !== 0) {
        price = Money.round(price - remainder);
      }
      
      // Safety check
      if (price <= 0) price = company.tickSize;

      // Determine Quantity
      let quantity = Math.floor((Math.random() * 50 + 10) * bot.orderSizeMultiplier);
      
      // Execute through standard pipeline
      const submitted = await OrderStateMachine.submitOrder({
        clientOrderId: crypto.randomUUID(),
        userId: bot.id,
        companyId: company.id,
        side,
        orderType,
        price,
        quantity,
        source: 'SIMULATOR',
      });

      const validated = await OrderStateMachine.validateOrder(submitted.id);
      
      if (validated.status !== 'REJECTED') {
        const receivedAt = Date.now();
        const validatedAt = Date.now();
        await ExchangeQueue.enqueueAndWait(company.id, validated.id, { receivedAt, validatedAt });
      }
      
    } catch (e: any) {
      // Intentionally swallow individual order generation errors to keep simulator running,
      // but you might want to log them in debug mode.
      // console.error('[SimulatorEngine] Order Error:', e.message);
    }
  }
}
