import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// ──────────────────────────────────────────────────────────
// 100 INDIAN-MARKET SIMULATED COMPANIES
// ──────────────────────────────────────────────────────────
// Fields: symbol, name, sector, industry, price, open, high, low, prevClose,
//         volume, capCr (market cap in ₹ Cr), pe, divYield,
//         volatility (σ), liquidity (relative), avgOrderRate (orders/sec),
//         avgOrderSize (shares), tickSize (₹ increment)
// ──────────────────────────────────────────────────────────

export const COMPANIES_DATA = [
  // ─── IT SERVICES (13) ────────────────────────────────────
  { symbol: 'TCS',        name: 'Tata Consultancy Services',    sector: 'IT Services',          industry: 'IT Consulting',         price: 3524.20, open: 3447.80, high: 3538.60, low: 3438.10, prevClose: 3447.80, volume: 1284500, capCr: 1280000, pe: 28.45, divYield: 1.40, volatility: 0.018, liquidity: 4.5, avgOrderRate: 5.0, avgOrderSize: 50,  tickSize: 0.05 },
  { symbol: 'INFY',       name: 'Infosys Limited',              sector: 'IT Services',          industry: 'IT Consulting',         price: 1590.40, open: 1615.00, high: 1612.00, low: 1579.20, prevClose: 1598.10, volume: 987300,  capCr: 663000,  pe: 24.10, divYield: 2.10, volatility: 0.020, liquidity: 4.0, avgOrderRate: 4.5, avgOrderSize: 80,  tickSize: 0.05 },
  { symbol: 'HCLTECH',    name: 'HCL Technologies',             sector: 'IT Services',          industry: 'IT Consulting',         price: 1472.80, open: 1455.00, high: 1480.50, low: 1450.00, prevClose: 1457.50, volume: 765400,  capCr: 399000,  pe: 22.80, divYield: 3.20, volatility: 0.019, liquidity: 3.0, avgOrderRate: 3.5, avgOrderSize: 60,  tickSize: 0.05 },
  { symbol: 'WIPRO',      name: 'Wipro Limited',                sector: 'IT Services',          industry: 'IT Consulting',         price: 485.60,  open: 482.00, high: 490.00, low: 480.10, prevClose: 482.50,  volume: 1450000, capCr: 254000,  pe: 20.15, divYield: 0.40, volatility: 0.022, liquidity: 3.5, avgOrderRate: 4.0, avgOrderSize: 200, tickSize: 0.05 },
  { symbol: 'LTIM',       name: 'LTIMindtree Limited',          sector: 'IT Services',          industry: 'IT Consulting',         price: 5120.50, open: 5050.00, high: 5150.00, low: 5020.00, prevClose: 5060.00, volume: 320000,  capCr: 151000,  pe: 31.20, divYield: 0.80, volatility: 0.025, liquidity: 1.5, avgOrderRate: 2.0, avgOrderSize: 20,  tickSize: 0.05 },
  { symbol: 'TECHM',      name: 'Tech Mahindra',                sector: 'IT Services',          industry: 'IT Consulting',         price: 1320.75, open: 1310.00, high: 1335.00, low: 1305.00, prevClose: 1312.00, volume: 540000,  capCr: 128000,  pe: 26.40, divYield: 1.80, volatility: 0.024, liquidity: 2.0, avgOrderRate: 2.5, avgOrderSize: 50,  tickSize: 0.05 },
  { symbol: 'PERSISTENT', name: 'Persistent Systems',           sector: 'IT Services',          industry: 'IT Products',           price: 3840.00, open: 3790.00, high: 3870.00, low: 3770.00, prevClose: 3795.00, volume: 210000,  capCr: 59000,   pe: 38.50, divYield: 0.50, volatility: 0.030, liquidity: 1.0, avgOrderRate: 1.5, avgOrderSize: 15,  tickSize: 0.05 },
  { symbol: 'COFORGE',    name: 'Coforge Limited',              sector: 'IT Services',          industry: 'IT Products',           price: 5430.00, open: 5380.00, high: 5480.00, low: 5350.00, prevClose: 5390.00, volume: 180000,  capCr: 33000,   pe: 35.80, divYield: 0.60, volatility: 0.028, liquidity: 0.8, avgOrderRate: 1.2, avgOrderSize: 10,  tickSize: 0.05 },
  { symbol: 'LTTS',       name: 'L&T Technology Services',      sector: 'IT Services',          industry: 'Engineering R&D',       price: 4920.00, open: 4890.00, high: 4960.00, low: 4860.00, prevClose: 4900.00, volume: 140000,  capCr: 52000,   pe: 36.20, divYield: 0.90, volatility: 0.026, liquidity: 0.8, avgOrderRate: 1.0, avgOrderSize: 10,  tickSize: 0.05 },
  { symbol: 'MPHASIS',    name: 'Mphasis Limited',              sector: 'IT Services',          industry: 'IT Consulting',         price: 2450.00, open: 2420.00, high: 2480.00, low: 2410.00, prevClose: 2430.00, volume: 290000,  capCr: 46000,   pe: 27.50, divYield: 2.20, volatility: 0.023, liquidity: 1.0, avgOrderRate: 1.5, avgOrderSize: 20,  tickSize: 0.05 },
  { symbol: 'TATAELXSI',  name: 'Tata Elxsi Limited',           sector: 'IT Services',          industry: 'Design Services',       price: 6850.00, open: 6800.00, high: 6920.00, low: 6780.00, prevClose: 6810.00, volume: 110000,  capCr: 42000,   pe: 48.20, divYield: 0.70, volatility: 0.032, liquidity: 0.6, avgOrderRate: 0.8, avgOrderSize: 8,   tickSize: 0.05 },
  { symbol: 'KPITTECH',   name: 'KPIT Technologies',            sector: 'IT Services',          industry: 'Embedded Systems',      price: 1420.00, open: 1395.00, high: 1435.00, low: 1390.00, prevClose: 1400.00, volume: 420000,  capCr: 39000,   pe: 42.10, divYield: 0.30, volatility: 0.035, liquidity: 1.2, avgOrderRate: 1.8, avgOrderSize: 40,  tickSize: 0.05 },
  { symbol: 'CYIENT',     name: 'Cyient Limited',               sector: 'IT Services',          industry: 'Engineering R&D',       price: 1840.00, open: 1820.00, high: 1860.00, low: 1810.00, prevClose: 1825.00, volume: 190000,  capCr: 20000,   pe: 25.30, divYield: 1.50, volatility: 0.027, liquidity: 0.7, avgOrderRate: 1.0, avgOrderSize: 15,  tickSize: 0.05 },

  // ─── BANKING (10) ────────────────────────────────────────
  { symbol: 'HDFCBANK',   name: 'HDFC Bank Limited',            sector: 'Banking',              industry: 'Private Banking',       price: 1678.90, open: 1654.00, high: 1702.00, low: 1654.20, prevClose: 1657.00, volume: 2132100, capCr: 1216000, pe: 18.50, divYield: 1.10, volatility: 0.015, liquidity: 5.0, avgOrderRate: 6.0, avgOrderSize: 100, tickSize: 0.05 },
  { symbol: 'ICICIBANK',  name: 'ICICI Bank Limited',           sector: 'Banking',              industry: 'Private Banking',       price: 1168.75, open: 1184.00, high: 1184.00, low: 1158.10, prevClose: 1177.25, volume: 1562400, capCr: 830000,  pe: 17.80, divYield: 0.80, volatility: 0.016, liquidity: 4.5, avgOrderRate: 5.5, avgOrderSize: 100, tickSize: 0.05 },
  { symbol: 'SBIN',       name: 'State Bank of India',          sector: 'Banking',              industry: 'Public Banking',        price: 812.45,  open: 805.00, high: 819.80, low: 803.10, prevClose: 806.15,  volume: 2041800, capCr: 728000,  pe: 10.50, divYield: 1.60, volatility: 0.020, liquidity: 5.0, avgOrderRate: 6.0, avgOrderSize: 150, tickSize: 0.05 },
  { symbol: 'KOTAKBANK',  name: 'Kotak Mahindra Bank',          sector: 'Banking',              industry: 'Private Banking',       price: 1785.00, open: 1770.00, high: 1795.00, low: 1765.00, prevClose: 1772.00, volume: 890000,  capCr: 355000,  pe: 21.40, divYield: 0.10, volatility: 0.017, liquidity: 3.0, avgOrderRate: 3.5, avgOrderSize: 50,  tickSize: 0.05 },
  { symbol: 'AXISBANK',   name: 'Axis Bank Limited',            sector: 'Banking',              industry: 'Private Banking',       price: 1145.00, open: 1135.00, high: 1155.00, low: 1130.00, prevClose: 1138.00, volume: 1250000, capCr: 353000,  pe: 13.90, divYield: 0.10, volatility: 0.019, liquidity: 3.5, avgOrderRate: 4.0, avgOrderSize: 80,  tickSize: 0.05 },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank',                sector: 'Banking',              industry: 'Private Banking',       price: 1380.00, open: 1365.00, high: 1395.00, low: 1360.00, prevClose: 1370.00, volume: 680000,  capCr: 107000,  pe: 12.80, divYield: 0.60, volatility: 0.025, liquidity: 2.0, avgOrderRate: 2.5, avgOrderSize: 40,  tickSize: 0.05 },
  { symbol: 'PNB',        name: 'Punjab National Bank',         sector: 'Banking',              industry: 'Public Banking',        price: 118.50,  open: 116.00, high: 120.00, low: 115.50, prevClose: 116.80,  volume: 3500000, capCr: 130000,  pe: 9.20,  divYield: 2.80, volatility: 0.028, liquidity: 4.0, avgOrderRate: 5.0, avgOrderSize: 500, tickSize: 0.05 },
  { symbol: 'BANKBARODA', name: 'Bank of Baroda',               sector: 'Banking',              industry: 'Public Banking',        price: 254.00,  open: 250.00, high: 257.00, low: 249.00, prevClose: 251.50,  volume: 2800000, capCr: 131000,  pe: 7.50,  divYield: 3.00, volatility: 0.024, liquidity: 3.5, avgOrderRate: 4.0, avgOrderSize: 300, tickSize: 0.05 },
  { symbol: 'IDFCFIRSTB', name: 'IDFC First Bank',              sector: 'Banking',              industry: 'Private Banking',       price: 78.20,   open: 77.00, high: 79.50, low: 76.80, prevClose: 77.50,   volume: 4200000, capCr: 55000,   pe: 18.20, divYield: 0.00, volatility: 0.030, liquidity: 4.0, avgOrderRate: 5.0, avgOrderSize: 800, tickSize: 0.05 },
  { symbol: 'CANBK',      name: 'Canara Bank',                  sector: 'Banking',              industry: 'Public Banking',        price: 112.00,  open: 110.00, high: 113.50, low: 109.50, prevClose: 110.50,  volume: 3100000, capCr: 101000,  pe: 6.80,  divYield: 3.20, volatility: 0.026, liquidity: 3.5, avgOrderRate: 4.0, avgOrderSize: 500, tickSize: 0.05 },

  // ─── FINANCIAL SERVICES (11) ─────────────────────────────
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Limited',        sector: 'Financial Services',   industry: 'NBFC',                  price: 6850.00, open: 6780.00, high: 6910.00, low: 6750.00, prevClose: 6800.00, volume: 480000,  capCr: 423000,  pe: 29.80, divYield: 0.40, volatility: 0.022, liquidity: 2.5, avgOrderRate: 3.0, avgOrderSize: 15,  tickSize: 0.05 },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Limited',        sector: 'Financial Services',   industry: 'Financial Holding',     price: 1620.00, open: 1600.00, high: 1635.00, low: 1595.00, prevClose: 1605.00, volume: 620000,  capCr: 258000,  pe: 32.10, divYield: 0.10, volatility: 0.021, liquidity: 2.0, avgOrderRate: 2.5, avgOrderSize: 30,  tickSize: 0.05 },
  { symbol: 'CHOLAFIN',   name: 'Cholamandalam Investment',     sector: 'Financial Services',   industry: 'NBFC',                  price: 1340.00, open: 1320.00, high: 1355.00, low: 1315.00, prevClose: 1325.00, volume: 390000,  capCr: 112000,  pe: 31.50, divYield: 0.20, volatility: 0.024, liquidity: 1.5, avgOrderRate: 2.0, avgOrderSize: 30,  tickSize: 0.05 },
  { symbol: 'MUTHOOTFIN', name: 'Muthoot Finance',              sector: 'Financial Services',   industry: 'Gold Finance',          price: 1720.00, open: 1700.00, high: 1740.00, low: 1690.00, prevClose: 1705.00, volume: 310000,  capCr: 69000,   pe: 14.80, divYield: 1.50, volatility: 0.020, liquidity: 1.2, avgOrderRate: 1.5, avgOrderSize: 20,  tickSize: 0.05 },
  { symbol: 'SHRIRAMFIN', name: 'Shriram Finance',              sector: 'Financial Services',   industry: 'NBFC',                  price: 2890.00, open: 2840.00, high: 2920.00, low: 2830.00, prevClose: 2850.00, volume: 410000,  capCr: 108000,  pe: 13.90, divYield: 1.00, volatility: 0.023, liquidity: 1.5, avgOrderRate: 2.0, avgOrderSize: 20,  tickSize: 0.05 },
  { symbol: 'REC',        name: 'REC Limited',                  sector: 'Financial Services',   industry: 'Power Finance',         price: 540.00,  open: 530.00, high: 548.00, low: 528.00, prevClose: 532.00,  volume: 2100000, capCr: 142000,  pe: 9.80,  divYield: 3.50, volatility: 0.028, liquidity: 3.0, avgOrderRate: 3.5, avgOrderSize: 200, tickSize: 0.05 },
  { symbol: 'PFC',        name: 'Power Finance Corp',           sector: 'Financial Services',   industry: 'Power Finance',         price: 485.00,  open: 478.00, high: 492.00, low: 475.00, prevClose: 480.00,  volume: 2400000, capCr: 160000,  pe: 8.50,  divYield: 3.80, volatility: 0.027, liquidity: 3.0, avgOrderRate: 3.5, avgOrderSize: 200, tickSize: 0.05 },
  { symbol: 'JIOFIN',     name: 'Jio Financial Services',       sector: 'Financial Services',   industry: 'Financial Holding',     price: 345.00,  open: 340.00, high: 350.00, low: 338.00, prevClose: 341.00,  volume: 3800000, capCr: 219000,  pe: 120.0, divYield: 0.00, volatility: 0.032, liquidity: 4.0, avgOrderRate: 4.5, avgOrderSize: 300, tickSize: 0.05 },
  { symbol: 'CDSL',       name: 'Central Depository Services',  sector: 'Financial Services',   industry: 'Capital Markets',       price: 2150.00, open: 2110.00, high: 2180.00, low: 2100.00, prevClose: 2120.00, volume: 450000,  capCr: 22000,   pe: 52.40, divYield: 0.50, volatility: 0.030, liquidity: 1.0, avgOrderRate: 1.5, avgOrderSize: 15,  tickSize: 0.05 },
  { symbol: 'BSE',        name: 'BSE Limited',                  sector: 'Financial Services',   industry: 'Capital Markets',       price: 2850.00, open: 2800.00, high: 2900.00, low: 2780.00, prevClose: 2810.00, volume: 380000,  capCr: 38000,   pe: 45.60, divYield: 0.80, volatility: 0.033, liquidity: 0.8, avgOrderRate: 1.2, avgOrderSize: 10,  tickSize: 0.05 },
  { symbol: 'ANGELONE',   name: 'Angel One Limited',            sector: 'Financial Services',   industry: 'Broking',               price: 2640.00, open: 2600.00, high: 2680.00, low: 2580.00, prevClose: 2610.00, volume: 290000,  capCr: 23000,   pe: 21.80, divYield: 1.20, volatility: 0.035, liquidity: 0.8, avgOrderRate: 1.0, avgOrderSize: 10,  tickSize: 0.05 },

  // ─── ENERGY & UTILITIES (11) ─────────────────────────────
  { symbol: 'RELIANCE',   name: 'Reliance Industries',          sector: 'Energy & Utilities',   industry: 'Petrochemicals',        price: 2914.35, open: 2865.10, high: 2945.00, low: 2865.10, prevClose: 2860.80, volume: 1845200, capCr: 1972000, pe: 26.80, divYield: 0.30, volatility: 0.017, liquidity: 5.0, avgOrderRate: 6.0, avgOrderSize: 50,  tickSize: 0.05 },
  { symbol: 'ONGC',       name: 'Oil & Natural Gas Corp',       sector: 'Energy & Utilities',   industry: 'Oil Exploration',       price: 318.00,  open: 312.00, high: 322.00, low: 310.00, prevClose: 313.50,  volume: 4500000, capCr: 400000,  pe: 8.20,  divYield: 4.50, volatility: 0.022, liquidity: 4.0, avgOrderRate: 4.5, avgOrderSize: 300, tickSize: 0.05 },
  { symbol: 'NTPC',       name: 'NTPC Limited',                 sector: 'Energy & Utilities',   industry: 'Power Generation',      price: 405.00,  open: 398.00, high: 410.00, low: 396.00, prevClose: 399.50,  volume: 3200000, capCr: 392000,  pe: 19.40, divYield: 2.20, volatility: 0.018, liquidity: 4.0, avgOrderRate: 4.5, avgOrderSize: 250, tickSize: 0.05 },
  { symbol: 'POWERGRID',  name: 'Power Grid Corp of India',     sector: 'Energy & Utilities',   industry: 'Power Transmission',    price: 335.00,  open: 330.00, high: 339.00, low: 328.00, prevClose: 331.00,  volume: 2900000, capCr: 311000,  pe: 18.90, divYield: 3.80, volatility: 0.016, liquidity: 3.5, avgOrderRate: 4.0, avgOrderSize: 300, tickSize: 0.05 },
  { symbol: 'BPCL',       name: 'Bharat Petroleum Corp',        sector: 'Energy & Utilities',   industry: 'Oil Refining',          price: 348.00,  open: 342.00, high: 352.00, low: 340.00, prevClose: 343.50,  volume: 2100000, capCr: 151000,  pe: 6.40,  divYield: 5.00, volatility: 0.024, liquidity: 3.0, avgOrderRate: 3.5, avgOrderSize: 200, tickSize: 0.05 },
  { symbol: 'IOC',        name: 'Indian Oil Corporation',       sector: 'Energy & Utilities',   industry: 'Oil Refining',          price: 172.00,  open: 169.00, high: 174.50, low: 168.00, prevClose: 170.00,  volume: 3800000, capCr: 243000,  pe: 7.10,  divYield: 7.00, volatility: 0.023, liquidity: 3.5, avgOrderRate: 4.0, avgOrderSize: 500, tickSize: 0.05 },
  { symbol: 'GAIL',       name: 'GAIL (India) Limited',         sector: 'Energy & Utilities',   industry: 'Natural Gas',           price: 228.00,  open: 224.00, high: 231.00, low: 222.00, prevClose: 225.00,  volume: 2800000, capCr: 150000,  pe: 14.20, divYield: 2.80, volatility: 0.022, liquidity: 3.0, avgOrderRate: 3.5, avgOrderSize: 300, tickSize: 0.05 },
  { symbol: 'COALINDIA',  name: 'Coal India Limited',           sector: 'Energy & Utilities',   industry: 'Mining',                price: 515.00,  open: 508.00, high: 522.00, low: 505.00, prevClose: 509.00,  volume: 3100000, capCr: 317000,  pe: 8.90,  divYield: 5.50, volatility: 0.021, liquidity: 3.5, avgOrderRate: 4.0, avgOrderSize: 200, tickSize: 0.05 },
  { symbol: 'TATAPOWER',  name: 'Tata Power Company',           sector: 'Energy & Utilities',   industry: 'Power Generation',      price: 440.00,  open: 432.00, high: 446.00, low: 430.00, prevClose: 433.00,  volume: 3600000, capCr: 140000,  pe: 38.50, divYield: 0.50, volatility: 0.028, liquidity: 4.0, avgOrderRate: 4.5, avgOrderSize: 250, tickSize: 0.05 },
  { symbol: 'ADANIGREEN', name: 'Adani Green Energy',           sector: 'Energy & Utilities',   industry: 'Renewable Energy',      price: 1780.00, open: 1750.00, high: 1810.00, low: 1740.00, prevClose: 1755.00, volume: 1200000, capCr: 282000,  pe: 180.0, divYield: 0.00, volatility: 0.040, liquidity: 2.5, avgOrderRate: 3.0, avgOrderSize: 30,  tickSize: 0.05 },
  { symbol: 'ADANIPOWER', name: 'Adani Power Limited',          sector: 'Energy & Utilities',   industry: 'Power Generation',      price: 685.00,  open: 670.00, high: 698.00, low: 665.00, prevClose: 672.00,  volume: 2200000, capCr: 264000,  pe: 18.20, divYield: 0.00, volatility: 0.035, liquidity: 3.0, avgOrderRate: 3.5, avgOrderSize: 100, tickSize: 0.05 },

  // ─── AUTOMOTIVE (10) ─────────────────────────────────────
  { symbol: 'TATAMOTORS', name: 'Tata Motors Limited',          sector: 'Automotive',           industry: 'Auto - Passenger',      price: 945.60,  open: 964.80, high: 964.80, low: 938.10, prevClose: 960.90,  volume: 1678200, capCr: 338000,  pe: 15.20, divYield: 0.30, volatility: 0.025, liquidity: 4.0, avgOrderRate: 4.5, avgOrderSize: 100, tickSize: 0.05 },
  { symbol: 'MARUTI',     name: 'Maruti Suzuki India',          sector: 'Automotive',           industry: 'Auto - Passenger',      price: 12125.50,open: 12040.0,high: 12220.0,low: 11980.0,prevClose: 12170.80,volume: 312900,  capCr: 382000,  pe: 27.40, divYield: 0.80, volatility: 0.018, liquidity: 1.5, avgOrderRate: 2.0, avgOrderSize: 8,   tickSize: 0.05 },
  { symbol: 'M&M',        name: 'Mahindra & Mahindra',          sector: 'Automotive',           industry: 'Auto - Multi',          price: 2850.00, open: 2810.00, high: 2880.00, low: 2790.00, prevClose: 2820.00, volume: 940000,  capCr: 342000,  pe: 28.50, divYield: 0.60, volatility: 0.020, liquidity: 3.0, avgOrderRate: 3.0, avgOrderSize: 30,  tickSize: 0.05 },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp',                sector: 'Automotive',           industry: 'Auto - Two-Wheeler',    price: 5320.00, open: 5260.00, high: 5370.00, low: 5240.00, prevClose: 5280.00, volume: 280000,  capCr: 106000,  pe: 24.10, divYield: 2.50, volatility: 0.019, liquidity: 1.2, avgOrderRate: 1.5, avgOrderSize: 15,  tickSize: 0.05 },
  { symbol: 'EICHERMOT',  name: 'Eicher Motors',                sector: 'Automotive',           industry: 'Auto - Two-Wheeler',    price: 4780.00, open: 4720.00, high: 4820.00, low: 4700.00, prevClose: 4735.00, volume: 340000,  capCr: 131000,  pe: 32.80, divYield: 0.60, volatility: 0.021, liquidity: 1.2, avgOrderRate: 1.5, avgOrderSize: 10,  tickSize: 0.05 },
  { symbol: 'TVSMOTOR',   name: 'TVS Motor Company',            sector: 'Automotive',           industry: 'Auto - Two-Wheeler',    price: 2420.00, open: 2380.00, high: 2450.00, low: 2370.00, prevClose: 2390.00, volume: 490000,  capCr: 115000,  pe: 48.20, divYield: 0.40, volatility: 0.024, liquidity: 1.5, avgOrderRate: 2.0, avgOrderSize: 20,  tickSize: 0.05 },
  { symbol: 'BHARATFORG', name: 'Bharat Forge Limited',         sector: 'Automotive',           industry: 'Auto Components',       price: 1580.00, open: 1550.00, high: 1600.00, low: 1540.00, prevClose: 1560.00, volume: 310000,  capCr: 74000,   pe: 42.00, divYield: 0.50, volatility: 0.028, liquidity: 1.0, avgOrderRate: 1.2, avgOrderSize: 20,  tickSize: 0.05 },
  { symbol: 'BALKRISIND', name: 'Balkrishna Industries',        sector: 'Automotive',           industry: 'Tyres',                 price: 3150.00, open: 3100.00, high: 3190.00, low: 3080.00, prevClose: 3110.00, volume: 180000,  capCr: 61000,   pe: 38.40, divYield: 0.60, volatility: 0.025, liquidity: 0.7, avgOrderRate: 1.0, avgOrderSize: 10,  tickSize: 0.05 },
  { symbol: 'SONACOMS',   name: 'Sona BLW Precision',           sector: 'Automotive',           industry: 'Auto Components',       price: 680.00,  open: 670.00, high: 692.00, low: 665.00, prevClose: 672.00,  volume: 520000,  capCr: 40000,   pe: 62.00, divYield: 0.30, volatility: 0.032, liquidity: 1.2, avgOrderRate: 1.5, avgOrderSize: 50,  tickSize: 0.05 },
  { symbol: 'BOSCHLTD',   name: 'Bosch Limited',                sector: 'Automotive',           industry: 'Auto Components',       price: 33400.0, open: 33000.0, high: 33800.0, low: 32800.0, prevClose: 33100.0, volume: 22000,   capCr: 98000,   pe: 44.50, divYield: 0.80, volatility: 0.020, liquidity: 0.3, avgOrderRate: 0.5, avgOrderSize: 2,   tickSize: 0.05 },

  // ─── TELECOMMUNICATIONS (4) ──────────────────────────────
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited',        sector: 'Telecommunications',   industry: 'Telecom Services',      price: 1562.30, open: 1540.20, high: 1584.00, low: 1540.20, prevClose: 1549.50, volume: 1128600, capCr: 914000,  pe: 58.20, divYield: 0.40, volatility: 0.016, liquidity: 4.0, avgOrderRate: 4.5, avgOrderSize: 50,  tickSize: 0.05 },
  { symbol: 'IDEA',       name: 'Vodafone Idea Limited',        sector: 'Telecommunications',   industry: 'Telecom Services',      price: 14.20,   open: 13.90, high: 14.60, low: 13.80, prevClose: 14.00,   volume: 45000000,capCr: 98000,   pe: -5.20, divYield: 0.00, volatility: 0.045, liquidity: 5.0, avgOrderRate: 8.0, avgOrderSize: 5000,tickSize: 0.05 },
  { symbol: 'TATACOMM',   name: 'Tata Communications',          sector: 'Telecommunications',   industry: 'Telecom Infra',         price: 2050.00, open: 2010.00, high: 2080.00, low: 2000.00, prevClose: 2020.00, volume: 380000,  capCr: 58000,   pe: 42.10, divYield: 0.90, volatility: 0.025, liquidity: 1.0, avgOrderRate: 1.5, avgOrderSize: 15,  tickSize: 0.05 },
  { symbol: 'INDUSTOWER', name: 'Indus Towers Limited',         sector: 'Telecommunications',   industry: 'Telecom Infra',         price: 415.00,  open: 408.00, high: 422.00, low: 405.00, prevClose: 410.00,  volume: 2900000, capCr: 112000,  pe: 16.80, divYield: 2.40, volatility: 0.023, liquidity: 3.0, avgOrderRate: 3.5, avgOrderSize: 200, tickSize: 0.05 },

  // ─── FMCG & CONSUMER (15) ────────────────────────────────
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever',           sector: 'FMCG & Consumer',      industry: 'FMCG',                  price: 2715.00, open: 2690.00, high: 2735.00, low: 2680.00, prevClose: 2700.00, volume: 820000,  capCr: 638000,  pe: 62.40, divYield: 1.60, volatility: 0.014, liquidity: 3.0, avgOrderRate: 3.0, avgOrderSize: 30,  tickSize: 0.05 },
  { symbol: 'ITC',        name: 'ITC Limited',                  sector: 'FMCG & Consumer',      industry: 'FMCG Diversified',      price: 434.60,  open: 429.30, high: 436.80, low: 429.30, prevClose: 432.35,  volume: 3012700, capCr: 536000,  pe: 27.10, divYield: 3.10, volatility: 0.013, liquidity: 5.0, avgOrderRate: 5.5, avgOrderSize: 200, tickSize: 0.05 },
  { symbol: 'NESTLEIND',  name: 'Nestle India Limited',         sector: 'FMCG & Consumer',      industry: 'FMCG - Food',           price: 2520.00, open: 2490.00, high: 2545.00, low: 2480.00, prevClose: 2500.00, volume: 340000,  capCr: 243000,  pe: 74.80, divYield: 1.30, volatility: 0.015, liquidity: 1.5, avgOrderRate: 1.5, avgOrderSize: 15,  tickSize: 0.05 },
  { symbol: 'BRITANNIA',  name: 'Britannia Industries',         sector: 'FMCG & Consumer',      industry: 'FMCG - Food',           price: 5780.00, open: 5710.00, high: 5830.00, low: 5690.00, prevClose: 5730.00, volume: 220000,  capCr: 139000,  pe: 64.20, divYield: 1.10, volatility: 0.016, liquidity: 1.0, avgOrderRate: 1.2, avgOrderSize: 10,  tickSize: 0.05 },
  { symbol: 'GODREJCP',   name: 'Godrej Consumer Products',     sector: 'FMCG & Consumer',      industry: 'Personal Care',         price: 1480.00, open: 1455.00, high: 1495.00, low: 1450.00, prevClose: 1460.00, volume: 410000,  capCr: 151000,  pe: 68.50, divYield: 0.80, volatility: 0.018, liquidity: 1.2, avgOrderRate: 1.5, avgOrderSize: 20,  tickSize: 0.05 },
  { symbol: 'DABUR',      name: 'Dabur India Limited',          sector: 'FMCG & Consumer',      industry: 'Personal Care',         price: 635.00,  open: 628.00, high: 642.00, low: 625.00, prevClose: 630.00,  volume: 920000,  capCr: 113000,  pe: 58.10, divYield: 1.00, volatility: 0.015, liquidity: 2.0, avgOrderRate: 2.0, avgOrderSize: 80,  tickSize: 0.05 },
  { symbol: 'MARICO',     name: 'Marico Limited',               sector: 'FMCG & Consumer',      industry: 'Personal Care',         price: 665.00,  open: 655.00, high: 672.00, low: 652.00, prevClose: 658.00,  volume: 880000,  capCr: 86000,   pe: 55.40, divYield: 1.40, volatility: 0.014, liquidity: 1.8, avgOrderRate: 2.0, avgOrderSize: 80,  tickSize: 0.05 },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products',       sector: 'FMCG & Consumer',      industry: 'FMCG - Food',           price: 1180.00, open: 1160.00, high: 1195.00, low: 1155.00, prevClose: 1165.00, volume: 780000,  capCr: 116000,  pe: 82.00, divYield: 0.70, volatility: 0.020, liquidity: 2.0, avgOrderRate: 2.0, avgOrderSize: 40,  tickSize: 0.05 },
  { symbol: 'VBL',        name: 'Varun Beverages',              sector: 'FMCG & Consumer',      industry: 'Beverages',             price: 1580.00, open: 1545.00, high: 1605.00, low: 1540.00, prevClose: 1555.00, volume: 1100000, capCr: 205000,  pe: 92.50, divYield: 0.20, volatility: 0.025, liquidity: 2.5, avgOrderRate: 2.5, avgOrderSize: 30,  tickSize: 0.05 },
  { symbol: 'TRENT',      name: 'Trent Limited',                sector: 'FMCG & Consumer',      industry: 'Retail',                price: 6850.00, open: 6680.00, high: 6940.00, low: 6650.00, prevClose: 6710.00, volume: 880000,  capCr: 243000,  pe: 145.0, divYield: 0.10, volatility: 0.030, liquidity: 2.0, avgOrderRate: 2.5, avgOrderSize: 10,  tickSize: 0.05 },
  { symbol: 'DMART',      name: 'Avenue Supermarts (DMart)',     sector: 'FMCG & Consumer',      industry: 'Retail',                price: 4920.00, open: 4850.00, high: 4980.00, low: 4820.00, prevClose: 4870.00, volume: 390000,  capCr: 320000,  pe: 110.0, divYield: 0.00, volatility: 0.018, liquidity: 1.5, avgOrderRate: 1.5, avgOrderSize: 10,  tickSize: 0.05 },
  { symbol: 'TITAN',      name: 'Titan Company Limited',        sector: 'FMCG & Consumer',      industry: 'Jewellery & Watches',   price: 3610.75, open: 3540.20, high: 3625.00, low: 3540.20, prevClose: 3575.15, volume: 456100,  capCr: 325000,  pe: 86.40, divYield: 0.30, volatility: 0.017, liquidity: 2.0, avgOrderRate: 2.5, avgOrderSize: 20,  tickSize: 0.05 },
  { symbol: 'NYKAA',      name: 'FSN E-Commerce (Nykaa)',       sector: 'FMCG & Consumer',      industry: 'E-Commerce',            price: 215.00,  open: 210.00, high: 219.00, low: 208.00, prevClose: 211.50,  volume: 4800000, capCr: 61000,   pe: 180.0, divYield: 0.00, volatility: 0.040, liquidity: 3.5, avgOrderRate: 4.0, avgOrderSize: 300, tickSize: 0.05 },
  { symbol: 'ZOMATO',     name: 'Zomato Limited',               sector: 'FMCG & Consumer',      industry: 'Food Delivery',         price: 265.00,  open: 258.00, high: 270.00, low: 256.00, prevClose: 260.00,  volume: 18500000,capCr: 234000,  pe: 130.0, divYield: 0.00, volatility: 0.035, liquidity: 5.0, avgOrderRate: 6.0, avgOrderSize: 400, tickSize: 0.05 },

  // ─── METALS & MINING (7) ─────────────────────────────────
  { symbol: 'TATASTEEL',  name: 'Tata Steel Limited',           sector: 'Metals & Mining',      industry: 'Steel',                 price: 164.50,  open: 161.80, high: 166.20, low: 160.50, prevClose: 162.00,  volume: 5420000, capCr: 205000,  pe: 42.80, divYield: 1.90, volatility: 0.028, liquidity: 5.0, avgOrderRate: 5.5, avgOrderSize: 500, tickSize: 0.05 },
  { symbol: 'JSWSTEEL',   name: 'JSW Steel Limited',            sector: 'Metals & Mining',      industry: 'Steel',                 price: 925.00,  open: 910.00, high: 934.00, low: 905.00, prevClose: 915.00,  volume: 1250000, capCr: 226000,  pe: 26.50, divYield: 0.80, volatility: 0.026, liquidity: 2.5, avgOrderRate: 3.0, avgOrderSize: 50,  tickSize: 0.05 },
  { symbol: 'HINDALCO',   name: 'Hindalco Industries',          sector: 'Metals & Mining',      industry: 'Aluminium',             price: 680.00,  open: 668.00, high: 688.00, low: 664.00, prevClose: 671.00,  volume: 2100000, capCr: 153000,  pe: 14.80, divYield: 0.60, volatility: 0.027, liquidity: 3.0, avgOrderRate: 3.5, avgOrderSize: 100, tickSize: 0.05 },
  { symbol: 'VEDL',       name: 'Vedanta Limited',              sector: 'Metals & Mining',      industry: 'Diversified Metals',    price: 445.00,  open: 435.00, high: 452.00, low: 432.00, prevClose: 438.00,  volume: 4800000, capCr: 165000,  pe: 12.40, divYield: 8.00, volatility: 0.032, liquidity: 4.0, avgOrderRate: 4.5, avgOrderSize: 200, tickSize: 0.05 },
  { symbol: 'NMDC',       name: 'NMDC Limited',                 sector: 'Metals & Mining',      industry: 'Iron Ore Mining',       price: 235.00,  open: 230.00, high: 239.00, low: 228.00, prevClose: 231.00,  volume: 3900000, capCr: 69000,   pe: 10.20, divYield: 4.00, volatility: 0.025, liquidity: 3.5, avgOrderRate: 4.0, avgOrderSize: 300, tickSize: 0.05 },
  { symbol: 'JINDALSTEL', name: 'Jindal Steel & Power',         sector: 'Metals & Mining',      industry: 'Steel',                 price: 980.00,  open: 965.00, high: 995.00, low: 958.00, prevClose: 968.00,  volume: 1100000, capCr: 100000,  pe: 17.50, divYield: 0.50, volatility: 0.030, liquidity: 2.0, avgOrderRate: 2.5, avgOrderSize: 50,  tickSize: 0.05 },
  { symbol: 'NATIONALUM', name: 'National Aluminium Co',        sector: 'Metals & Mining',      industry: 'Aluminium',             price: 195.00,  open: 190.00, high: 198.50, low: 189.00, prevClose: 191.50,  volume: 4200000, capCr: 36000,   pe: 12.80, divYield: 3.50, volatility: 0.028, liquidity: 3.5, avgOrderRate: 4.0, avgOrderSize: 400, tickSize: 0.05 },

  // ─── PHARMACEUTICALS (10) ────────────────────────────────
  { symbol: 'SUNPHARMA',  name: 'Sun Pharma Industries',        sector: 'Pharmaceuticals',      industry: 'Pharma - Large',        price: 1740.00, open: 1715.00, high: 1758.00, low: 1705.00, prevClose: 1720.00, volume: 1280000, capCr: 417000,  pe: 39.50, divYield: 0.50, volatility: 0.019, liquidity: 3.5, avgOrderRate: 3.5, avgOrderSize: 40,  tickSize: 0.05 },
  { symbol: 'CIPLA',      name: 'Cipla Limited',                sector: 'Pharmaceuticals',      industry: 'Pharma - Large',        price: 1540.00, open: 1515.00, high: 1555.00, low: 1510.00, prevClose: 1522.00, volume: 920000,  capCr: 124000,  pe: 29.80, divYield: 0.60, volatility: 0.020, liquidity: 2.5, avgOrderRate: 2.5, avgOrderSize: 30,  tickSize: 0.05 },
  { symbol: 'DRREDDY',    name: 'Dr Reddys Laboratories',       sector: 'Pharmaceuticals',      industry: 'Pharma - Large',        price: 6850.00, open: 6760.00, high: 6910.00, low: 6720.00, prevClose: 6790.00, volume: 380000,  capCr: 114000,  pe: 21.40, divYield: 0.50, volatility: 0.022, liquidity: 1.5, avgOrderRate: 1.5, avgOrderSize: 10,  tickSize: 0.05 },
  { symbol: 'DIVISLAB',   name: 'Divis Laboratories',           sector: 'Pharmaceuticals',      industry: 'Pharma - API',          price: 4950.00, open: 4880.00, high: 4990.00, low: 4850.00, prevClose: 4900.00, volume: 310000,  capCr: 131000,  pe: 72.00, divYield: 0.60, volatility: 0.021, liquidity: 1.2, avgOrderRate: 1.2, avgOrderSize: 10,  tickSize: 0.05 },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise',  sector: 'Pharmaceuticals',      industry: 'Hospitals',             price: 6720.00, open: 6640.00, high: 6780.00, low: 6600.00, prevClose: 6660.00, volume: 290000,  capCr: 97000,   pe: 95.00, divYield: 0.20, volatility: 0.023, liquidity: 1.0, avgOrderRate: 1.2, avgOrderSize: 8,   tickSize: 0.05 },
  { symbol: 'MANKIND',    name: 'Mankind Pharma',               sector: 'Pharmaceuticals',      industry: 'Pharma - Large',        price: 2380.00, open: 2340.00, high: 2410.00, low: 2320.00, prevClose: 2350.00, volume: 450000,  capCr: 95000,   pe: 48.00, divYield: 0.40, volatility: 0.024, liquidity: 1.2, avgOrderRate: 1.5, avgOrderSize: 15,  tickSize: 0.05 },
  { symbol: 'LUPIN',      name: 'Lupin Limited',                sector: 'Pharmaceuticals',      industry: 'Pharma - Large',        price: 1980.00, open: 1940.00, high: 2005.00, low: 1930.00, prevClose: 1950.00, volume: 820000,  capCr: 90000,   pe: 38.20, divYield: 0.50, volatility: 0.025, liquidity: 2.0, avgOrderRate: 2.0, avgOrderSize: 25,  tickSize: 0.05 },
  { symbol: 'TORNTPHARM', name: 'Torrent Pharmaceuticals',      sector: 'Pharmaceuticals',      industry: 'Pharma - Large',        price: 3150.00, open: 3100.00, high: 3190.00, low: 3080.00, prevClose: 3110.00, volume: 240000,  capCr: 106000,  pe: 62.40, divYield: 0.80, volatility: 0.020, liquidity: 1.0, avgOrderRate: 1.0, avgOrderSize: 10,  tickSize: 0.05 },
  { symbol: 'BIOCON',     name: 'Biocon Limited',               sector: 'Pharmaceuticals',      industry: 'Biopharma',             price: 365.00,  open: 358.00, high: 370.00, low: 355.00, prevClose: 360.00,  volume: 1900000, capCr: 44000,   pe: 42.10, divYield: 0.30, volatility: 0.028, liquidity: 2.5, avgOrderRate: 2.5, avgOrderSize: 150, tickSize: 0.05 },
  { symbol: 'ZYDUSLIFE',  name: 'Zydus Lifesciences',           sector: 'Pharmaceuticals',      industry: 'Pharma - Large',        price: 1180.00, open: 1155.00, high: 1198.00, low: 1150.00, prevClose: 1162.00, volume: 890000,  capCr: 119000,  pe: 31.00, divYield: 0.40, volatility: 0.023, liquidity: 2.0, avgOrderRate: 2.0, avgOrderSize: 40,  tickSize: 0.05 },

  // ─── INFRASTRUCTURE & REALTY (10) ────────────────────────
  { symbol: 'LT',         name: 'Larsen & Toubro',              sector: 'Infrastructure & Realty', industry: 'Engineering & Construction', price: 3245.15, open: 3210.00, high: 3258.00, low: 3210.00, prevClose: 3216.70, volume: 645300, capCr: 463000, pe: 34.20, divYield: 0.70, volatility: 0.016, liquidity: 3.0, avgOrderRate: 3.0, avgOrderSize: 25, tickSize: 0.05 },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement',             sector: 'Infrastructure & Realty', industry: 'Cement',                    price: 11250.0, open: 11080.0, high: 11340.0, low: 11020.0, prevClose: 11140.0, volume: 180000, capCr: 325000, pe: 46.50, divYield: 0.40, volatility: 0.018, liquidity: 1.0, avgOrderRate: 1.2, avgOrderSize: 5,  tickSize: 0.05 },
  { symbol: 'GRASIM',     name: 'Grasim Industries',            sector: 'Infrastructure & Realty', industry: 'Diversified',               price: 2680.00, open: 2640.00, high: 2710.00, low: 2630.00, prevClose: 2650.00, volume: 510000, capCr: 182000, pe: 28.90, divYield: 0.40, volatility: 0.019, liquidity: 1.5, avgOrderRate: 1.5, avgOrderSize: 20, tickSize: 0.05 },
  { symbol: 'AMBUJACEM',  name: 'Ambuja Cements',               sector: 'Infrastructure & Realty', industry: 'Cement',                    price: 645.00,  open: 635.00, high: 652.00, low: 632.00, prevClose: 638.00,  volume: 1450000,capCr: 159000, pe: 42.00, divYield: 0.50, volatility: 0.020, liquidity: 2.5, avgOrderRate: 3.0, avgOrderSize: 100,tickSize: 0.05 },
  { symbol: 'ADANIENT',   name: 'Adani Enterprises',            sector: 'Infrastructure & Realty', industry: 'Diversified Conglomerate',  price: 3180.00, open: 3120.00, high: 3220.00, low: 3100.00, prevClose: 3135.00, volume: 1850000,capCr: 362000, pe: 98.40, divYield: 0.10, volatility: 0.038, liquidity: 3.5, avgOrderRate: 4.0, avgOrderSize: 20, tickSize: 0.05 },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ',            sector: 'Infrastructure & Realty', industry: 'Ports & Logistics',         price: 1480.00, open: 1455.00, high: 1495.00, low: 1445.00, prevClose: 1462.00, volume: 1620000,capCr: 320000, pe: 36.20, divYield: 0.40, volatility: 0.025, liquidity: 3.0, avgOrderRate: 3.5, avgOrderSize: 40, tickSize: 0.05 },
  { symbol: 'ACC',        name: 'ACC Limited',                  sector: 'Infrastructure & Realty', industry: 'Cement',                    price: 2540.00, open: 2500.00, high: 2570.00, low: 2490.00, prevClose: 2515.00, volume: 290000, capCr: 48000,  pe: 24.50, divYield: 0.60, volatility: 0.021, liquidity: 1.0, avgOrderRate: 1.2, avgOrderSize: 15, tickSize: 0.05 },
  { symbol: 'SHREECEM',   name: 'Shree Cement',                 sector: 'Infrastructure & Realty', industry: 'Cement',                    price: 26800.0, open: 26400.0, high: 27100.0, low: 26300.0, prevClose: 26500.0, volume: 45000,  capCr: 97000,  pe: 41.20, divYield: 0.30, volatility: 0.019, liquidity: 0.3, avgOrderRate: 0.4, avgOrderSize: 2,  tickSize: 0.05 },
  { symbol: 'DLF',        name: 'DLF Limited',                  sector: 'Infrastructure & Realty', industry: 'Real Estate',               price: 865.00,  open: 850.00, high: 878.00, low: 845.00, prevClose: 854.00,  volume: 2100000,capCr: 214000, pe: 72.00, divYield: 0.50, volatility: 0.028, liquidity: 3.0, avgOrderRate: 3.5, avgOrderSize: 80, tickSize: 0.05 },
  { symbol: 'GODREJPROP', name: 'Godrej Properties',            sector: 'Infrastructure & Realty', industry: 'Real Estate',               price: 3120.00, open: 3060.00, high: 3170.00, low: 3040.00, prevClose: 3075.00, volume: 640000, capCr: 87000,  pe: 95.00, divYield: 0.20, volatility: 0.030, liquidity: 1.5, avgOrderRate: 1.5, avgOrderSize: 10, tickSize: 0.05 },
];

// ──────────────────────────────────────────────────────────
// SEED LOGIC
// ──────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting TradeCore database seeding...\n');

  // Enable WAL mode (PRAGMAs return results, so use $queryRawUnsafe)
  await prisma.$queryRawUnsafe('PRAGMA journal_mode=WAL;');
  await prisma.$queryRawUnsafe('PRAGMA busy_timeout=5000;');
  await prisma.$queryRawUnsafe('PRAGMA foreign_keys=ON;');
  console.log('✅ SQLite WAL mode enabled');

  // Clean existing database records in FK-safe order
  console.log('⏳ Cleaning existing data...');
  await prisma.replayEvent.deleteMany();
  await prisma.replaySession.deleteMany();
  await prisma.marketEvent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.systemMetric.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.watchlistItem.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.portfolioHolding.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.trade.deleteMany();
  await prisma.orderEvent.deleteMany();
  await prisma.order.deleteMany();
  await prisma.marketStatistics.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Database cleaned\n');

  // ── 1. Create Users ──────────────────────────────────────
  const arjunUser = await prisma.user.create({
    data: {
      name: 'Arjun Reddy',
      email: 'arjun@tradecore.io',
      passwordHash: bcrypt.hashSync('password123', 10),
      role: 'USER',
      buyingPower: 85430.30,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      name: 'TradeCore Admin',
      email: 'admin@tradecore.io',
      passwordHash: bcrypt.hashSync('admin123', 10),
      role: 'ADMIN',
      buyingPower: 10000000.0,
    },
  });

  // System bot user for simulated orders
  const botUser = await prisma.user.create({
    data: {
      name: 'Exchange Bot',
      email: 'bot@tradecore.io',
      passwordHash: bcrypt.hashSync('system', 10),
      role: 'ADMIN',
      buyingPower: 999999999.0,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created 3 Users (Arjun, Admin, Bot)\n');

  // ── 2. Create Wallets ────────────────────────────────────
  await prisma.wallet.create({
    data: {
      userId: arjunUser.id,
      availableBalance: 85430.30,
      reservedBalance: 0,
      usedMargin: 384789.95,
      totalBalance: 470220.25,
      transactions: {
        create: [
          { type: 'DEPOSIT', amount: 500000.0, description: 'Initial Virtual Account Capital' },
          { type: 'TRADE_DEBIT', amount: 176000.0, description: 'BUY 50 TCS @ ₹3520.00' },
          { type: 'TRADE_DEBIT', amount: 33500.0, description: 'BUY 20 HDFCBANK @ ₹1675.00' },
        ],
      },
    },
  });

  await prisma.wallet.create({
    data: {
      userId: adminUser.id,
      availableBalance: 10000000.0,
      reservedBalance: 0,
      usedMargin: 0,
      totalBalance: 10000000.0,
    },
  });

  await prisma.wallet.create({
    data: {
      userId: botUser.id,
      availableBalance: 999999999.0,
      reservedBalance: 0,
      usedMargin: 0,
      totalBalance: 999999999.0,
    },
  });

  console.log('✅ Created Wallets\n');

  // ── 3. Create Portfolio for Arjun ────────────────────────
  const portfolio = await prisma.portfolio.create({
    data: {
      userId: arjunUser.id,
      totalValue: 482650.75,
      investedAmount: 470220.25,
      todayPnL: 12430.50,
      todayPnLPercent: 2.64,
    },
  });

  console.log('✅ Created Portfolio\n');

  // ── 4. Create 100 Companies ──────────────────────────────
  console.log('⏳ Creating 100 companies...');
  const companyRecords = [];
  for (const c of COMPANIES_DATA) {
    const created = await prisma.company.create({
      data: {
        symbol: c.symbol,
        companyName: c.name,
        sector: c.sector,
        industry: c.industry,
        currentPrice: c.price,
        openingPrice: c.open,
        previousClose: c.prevClose,
        dayHigh: c.high,
        dayLow: c.low,
        volume: c.volume,
        marketCap: c.capCr,
        peRatio: c.pe,
        dividendYield: c.divYield,
        volatility: c.volatility,
        liquidity: c.liquidity,
        avgOrderRate: c.avgOrderRate,
        avgOrderSize: c.avgOrderSize,
        tickSize: c.tickSize,
      },
    });
    companyRecords.push(created);
  }
  console.log(`✅ Created ${companyRecords.length} companies\n`);

  // Verify count
  const count = await prisma.company.count();
  if (count !== 100) {
    throw new Error(`Expected 100 companies, got ${count}`);
  }

  // Verify unique symbols
  const symbols = companyRecords.map((c) => c.symbol);
  const uniqueSymbols = new Set(symbols);
  if (uniqueSymbols.size !== 100) {
    throw new Error(`Duplicate symbols detected! ${symbols.length} total, ${uniqueSymbols.size} unique`);
  }
  console.log('✅ Verified: exactly 100 unique company symbols\n');

  // ── 5. Create Portfolio Holdings for Arjun ───────────────
  const companyMap = new Map(companyRecords.map((c) => [c.symbol, c]));

  const tcs = companyMap.get('TCS')!;
  const reliance = companyMap.get('RELIANCE')!;
  const infy = companyMap.get('INFY')!;
  const hdfc = companyMap.get('HDFCBANK')!;

  await prisma.portfolioHolding.createMany({
    data: [
      { portfolioId: portfolio.id, companyId: tcs.id, quantity: 50, averagePrice: 3410.00, currentPrice: 3524.20 },
      { portfolioId: portfolio.id, companyId: reliance.id, quantity: 30, averagePrice: 2720.00, currentPrice: 2914.35 },
      { portfolioId: portfolio.id, companyId: infy.id, quantity: 100, averagePrice: 1615.00, currentPrice: 1590.40 },
      { portfolioId: portfolio.id, companyId: hdfc.id, quantity: 40, averagePrice: 1620.00, currentPrice: 1678.90 },
    ],
  });

  console.log('✅ Created Portfolio Holdings\n');

  // ── 6. Create Watchlist ──────────────────────────────────
  const watchlist = await prisma.watchlist.create({
    data: { userId: arjunUser.id, name: 'Core Watchlist' },
  });

  const watchlistSymbols = ['TCS', 'RELIANCE', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN', 'BHARTIARTL', 'ITC', 'LT', 'MARUTI', 'TITAN', 'HCLTECH'];
  for (const sym of watchlistSymbols) {
    const comp = companyMap.get(sym);
    if (comp) {
      await prisma.watchlistItem.create({ data: { watchlistId: watchlist.id, companyId: comp.id } });
    }
  }

  console.log('✅ Created Watchlist with 12 items\n');

  // ── 7. Generate Intraday Price History ───────────────────
  console.log('⏳ Generating intraday price history...');
  for (const comp of companyRecords) {
    const basePrice = comp.currentPrice;
    const historyPoints = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const time = new Date(now.getTime() - (11 - i) * 25 * 60 * 1000);
      const delta = (Math.random() - 0.48) * (basePrice * 0.015);
      const closeP = Number((basePrice + delta).toFixed(2));
      historyPoints.push({
        companyId: comp.id,
        timestamp: time,
        open: Number((closeP - (Math.random() * 5)).toFixed(2)),
        high: Number((closeP + (Math.random() * 8)).toFixed(2)),
        low: Number((closeP - (Math.random() * 8)).toFixed(2)),
        close: closeP,
        volume: Math.floor(Math.random() * 50000 + 10000),
      });
    }

    await prisma.priceHistory.createMany({ data: historyPoints });
  }
  console.log('✅ Generated 1,200 price history candles (12 per company)\n');

  // ── 8. Seed Order Book Liquidity ─────────────────────────
  console.log('⏳ Seeding initial order book liquidity...');
  let totalOrders = 0;

  for (const comp of companyRecords) {
    const bids = [
      { price: Number((comp.currentPrice * 0.999).toFixed(2)), qty: 1200 },
      { price: Number((comp.currentPrice * 0.998).toFixed(2)), qty: 2450 },
      { price: Number((comp.currentPrice * 0.997).toFixed(2)), qty: 3150 },
      { price: Number((comp.currentPrice * 0.996).toFixed(2)), qty: 4600 },
      { price: Number((comp.currentPrice * 0.995).toFixed(2)), qty: 5800 },
    ];

    const asks = [
      { price: Number((comp.currentPrice * 1.001).toFixed(2)), qty: 900 },
      { price: Number((comp.currentPrice * 1.002).toFixed(2)), qty: 1800 },
      { price: Number((comp.currentPrice * 1.003).toFixed(2)), qty: 2900 },
      { price: Number((comp.currentPrice * 1.004).toFixed(2)), qty: 3700 },
      { price: Number((comp.currentPrice * 1.005).toFixed(2)), qty: 4300 },
    ];

    for (const bid of bids) {
      await prisma.order.create({
        data: {
          userId: botUser.id,
          companyId: comp.id,
          side: 'BUY',
          orderType: 'LIMIT',
          price: bid.price,
          quantity: bid.qty,
          remainingQuantity: bid.qty,
          filledQuantity: 0,
          clientOrderId: crypto.randomUUID(),
          status: 'OPEN',
          source: 'SIMULATED',
        },
      });
      totalOrders++;
    }

    for (const ask of asks) {
      await prisma.order.create({
        data: {
          userId: botUser.id,
          companyId: comp.id,
          side: 'SELL',
          orderType: 'LIMIT',
          price: ask.price,
          quantity: ask.qty,
          remainingQuantity: ask.qty,
          filledQuantity: 0,
          clientOrderId: crypto.randomUUID(),
          status: 'OPEN',
          source: 'SIMULATED',
        },
      });
      totalOrders++;
    }
  }
  console.log(`✅ Seeded ${totalOrders} initial liquidity orders (10 per company)\n`);

  // ── 9. Create Demo Orders for Arjun ──────────────────────
  await prisma.order.create({
    data: {
      userId: arjunUser.id,
      companyId: tcs.id,
      side: 'BUY',
      orderType: 'LIMIT',
      price: 3520.00,
      quantity: 50,
      remainingQuantity: 0,
      filledQuantity: 50,
      clientOrderId: crypto.randomUUID(),
      status: 'FILLED',
      source: 'USER',
      events: {
        create: [
          { eventType: 'ORDER_CREATED', price: 3520.00, quantity: 50, remainingQuantity: 50 },
          { eventType: 'ORDER_FILLED', price: 3520.00, quantity: 50, remainingQuantity: 0 },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      userId: arjunUser.id,
      companyId: infy.id,
      side: 'SELL',
      orderType: 'LIMIT',
      price: 1595.00,
      quantity: 30,
      remainingQuantity: 30,
      filledQuantity: 0,
      clientOrderId: crypto.randomUUID(),
      status: 'OPEN',
      source: 'USER',
      events: {
        create: [
          { eventType: 'ORDER_CREATED', price: 1595.00, quantity: 30, remainingQuantity: 30 },
        ],
      },
    },
  });

  console.log('✅ Created 2 demo orders for Arjun\n');

  // ── 10. Seed Market Events ───────────────────────────────
  await prisma.marketEvent.createMany({
    data: [
      { companyId: tcs.id, eventType: 'EARNINGS', title: 'TCS Q2 Results Announced', description: 'Q2 Net Profit up 12.4% YoY', impact: 'HIGH' },
      { eventType: 'POLICY', title: 'RBI Policy Announcement', description: 'Repo Rate unchanged at 6.50%', impact: 'MEDIUM' },
      { eventType: 'GLOBAL', title: 'Global Market Rally', description: 'US Markets close higher after strong jobs data', impact: 'HIGH' },
      { companyId: reliance.id, eventType: 'CORPORATE_ACTION', title: 'Reliance Announces Bonus Issue', description: '1:1 bonus shares to existing shareholders', impact: 'HIGH' },
      { companyId: infy.id, eventType: 'NEWS', title: 'Infosys Large Deal Pipeline Strong', description: 'Reported $4.5B in large deal TCV for the quarter', impact: 'MEDIUM' },
    ],
  });

  console.log('✅ Seeded 5 market events\n');

  // ── Final Summary ────────────────────────────────────────
  const finalCount = await prisma.company.count();
  const orderCount = await prisma.order.count();
  const priceHistoryCount = await prisma.priceHistory.count();
  const userCount = await prisma.user.count();

  console.log('═══════════════════════════════════════');
  console.log('  🚀 TradeCore Database Seed Complete  ');
  console.log('═══════════════════════════════════════');
  console.log(`  Companies:     ${finalCount}`);
  console.log(`  Users:         ${userCount}`);
  console.log(`  Orders:        ${orderCount}`);
  console.log(`  Price Candles: ${priceHistoryCount}`);
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
