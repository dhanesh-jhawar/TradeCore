import { describe, it, expect, beforeEach } from 'vitest';
import { OrderBook, OrderBookManager, OrderBookEntry } from '../orderBook';
import crypto from 'crypto';

describe('OrderBook DSA Implementation', () => {
  const company1 = 'COMP1';
  const company2 = 'COMP2';

  let seq = 0;
  const createOrder = (
    companyId: string,
    side: 'BUY' | 'SELL',
    price: number,
    quantity: number = 100
  ): OrderBookEntry => ({
    orderId: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    companyId,
    side,
    price,
    quantity,
    sequenceNumber: ++seq,
  });

  beforeEach(() => {
    OrderBookManager.clearAll();
    seq = 0;
  });

  it('1. Higher buy price gets priority', () => {
    const book = OrderBookManager.getBook(company1);
    const order1 = createOrder(company1, 'BUY', 100);
    const order2 = createOrder(company1, 'BUY', 105);
    const order3 = createOrder(company1, 'BUY', 102);

    book.addOrder(order1);
    book.addOrder(order2);
    book.addOrder(order3);

    expect(book.getBestBid()?.price).toBe(105);
    expect(book.buyLevels[0].price).toBe(105);
    expect(book.buyLevels[1].price).toBe(102);
    expect(book.buyLevels[2].price).toBe(100);
  });

  it('2. Lower sell price gets priority', () => {
    const book = OrderBookManager.getBook(company1);
    const order1 = createOrder(company1, 'SELL', 105);
    const order2 = createOrder(company1, 'SELL', 100);
    const order3 = createOrder(company1, 'SELL', 102);

    book.addOrder(order1);
    book.addOrder(order2);
    book.addOrder(order3);

    expect(book.getBestAsk()?.price).toBe(100);
    expect(book.sellLevels[0].price).toBe(100);
    expect(book.sellLevels[1].price).toBe(102);
    expect(book.sellLevels[2].price).toBe(105);
  });

  it('3. Same price uses FIFO (via queue linkage)', () => {
    const book = OrderBookManager.getBook(company1);
    const order1 = createOrder(company1, 'BUY', 100);
    const order2 = createOrder(company1, 'BUY', 100);
    const order3 = createOrder(company1, 'BUY', 100);

    book.addOrder(order1);
    book.addOrder(order2);
    book.addOrder(order3);

    // Only 1 price level should exist
    expect(book.buyLevels.length).toBe(1);
    const level = book.buyLevels[0];
    expect(level.totalVolume).toBe(300);

    // FIFO Check
    expect(level.head?.data.orderId).toBe(order1.orderId);
    expect(level.head?.next?.data.orderId).toBe(order2.orderId);
    expect(level.tail?.data.orderId).toBe(order3.orderId);
  });

  it('4. Order cancellation (O(1) removal)', () => {
    const book = OrderBookManager.getBook(company1);
    const order1 = createOrder(company1, 'BUY', 100);
    const order2 = createOrder(company1, 'BUY', 100);
    const order3 = createOrder(company1, 'BUY', 100);

    book.addOrder(order1);
    book.addOrder(order2);
    book.addOrder(order3);

    // Cancel middle order
    book.cancelOrder(order2.orderId);

    const level = book.buyLevels[0];
    expect(level.totalVolume).toBe(200);
    expect(level.head?.data.orderId).toBe(order1.orderId);
    expect(level.head?.next?.data.orderId).toBe(order3.orderId); // order3 shifted up
    expect(level.tail?.data.orderId).toBe(order3.orderId);

    // Check Map is cleared
    expect(book.orders.has(order2.orderId)).toBe(false);
  });

  it('5. Partial quantity removal', () => {
    const book = OrderBookManager.getBook(company1);
    const order1 = createOrder(company1, 'BUY', 100, 500);

    book.addOrder(order1);
    expect(book.buyLevels[0].totalVolume).toBe(500);

    book.modifyQuantity(order1.orderId, 200); // Partially filled 300, remaining 200
    expect(book.buyLevels[0].totalVolume).toBe(200);
    expect(book.orders.get(order1.orderId)?.data.quantity).toBe(200);
  });

  it('6. Empty price level cleanup', () => {
    const book = OrderBookManager.getBook(company1);
    const order1 = createOrder(company1, 'SELL', 100);
    const order2 = createOrder(company1, 'SELL', 105);

    book.addOrder(order1);
    book.addOrder(order2);

    expect(book.sellLevels.length).toBe(2);

    // Cancel order 1 (which clears the 100 price level)
    book.cancelOrder(order1.orderId);

    expect(book.sellLevels.length).toBe(1);
    expect(book.sellLevels[0].price).toBe(105); // Only 105 remains
    expect(book.getBestAsk()?.price).toBe(105);
  });

  it('7. Best bid evaluation', () => {
    const book = OrderBookManager.getBook(company1);
    book.addOrder(createOrder(company1, 'BUY', 101));
    book.addOrder(createOrder(company1, 'BUY', 105));
    book.addOrder(createOrder(company1, 'BUY', 100));

    expect(book.getBestBid()?.price).toBe(105);
  });

  it('8. Best ask evaluation', () => {
    const book = OrderBookManager.getBook(company1);
    book.addOrder(createOrder(company1, 'SELL', 101));
    book.addOrder(createOrder(company1, 'SELL', 105));
    book.addOrder(createOrder(company1, 'SELL', 100));

    expect(book.getBestAsk()?.price).toBe(100);
  });

  it('9. Spread calculation', () => {
    const book = OrderBookManager.getBook(company1);
    book.addOrder(createOrder(company1, 'BUY', 99));
    book.addOrder(createOrder(company1, 'SELL', 101));

    expect(book.getSpread()).toBe(2);
  });

  it('10. Multiple companies remain isolated', () => {
    const book1 = OrderBookManager.getBook(company1);
    const book2 = OrderBookManager.getBook(company2);

    book1.addOrder(createOrder(company1, 'BUY', 100));
    book2.addOrder(createOrder(company2, 'BUY', 150));

    expect(book1.getBestBid()?.price).toBe(100);
    expect(book2.getBestBid()?.price).toBe(150);
  });

  it('11. No order appears in another company\'s book', () => {
    const book = OrderBookManager.getBook(company1);
    expect(() => {
      book.addOrder(createOrder(company2, 'BUY', 100));
    }).toThrow(/Order belongs to different company/);
  });

  it('12. No duplicate order references', () => {
    const book = OrderBookManager.getBook(company1);
    const order = createOrder(company1, 'BUY', 100);
    book.addOrder(order);

    expect(() => {
      book.addOrder(order);
    }).toThrow(/already exists/);
  });

  it('Benchmark: Throughput of 10,000 mixed operations', () => {
    const book = OrderBookManager.getBook('BENCHMARK');
    const orderIds: string[] = [];

    const start = performance.now();

    // 1. Insert 5000 random buy orders (simulating varying price levels)
    for (let i = 0; i < 5000; i++) {
      const price = Math.floor(Math.random() * 100) + 100;
      const order = createOrder('BENCHMARK', 'BUY', price);
      orderIds.push(order.orderId);
      book.addOrder(order);
    }

    // 2. Insert 5000 random sell orders
    for (let i = 0; i < 5000; i++) {
      const price = Math.floor(Math.random() * 100) + 105;
      const order = createOrder('BENCHMARK', 'SELL', price);
      orderIds.push(order.orderId);
      book.addOrder(order);
    }

    // 3. Cancel 5000 random orders (simulating high volatility/cancels)
    for (let i = 0; i < 5000; i++) {
      // Pick a random index
      const randIndex = Math.floor(Math.random() * orderIds.length);
      const id = orderIds[randIndex];
      book.cancelOrder(id);
      // Remove from tracking array for cleanliness (though O(n) operation in JS array, it's just for the bench loop)
      orderIds.splice(randIndex, 1);
    }

    const end = performance.now();
    const duration = end - start;
    
    // Log duration, we expect it to be well under 100ms in Node for 15k ops due to O(1) map and O(log N) price levels
    console.log(`[Benchmark] 15,000 Operations completed in ${duration.toFixed(2)}ms`);

    // Ensure state integrity
    expect(book.orders.size).toBe(5000);
    expect(duration).toBeLessThan(150); // It should easily be <150ms
  });
});
