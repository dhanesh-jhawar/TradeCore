/**
 * In-Memory Order Book (DSA Implementation)
 * Provides high-performance deterministic matching engine components.
 */

export interface OrderBookEntry {
  orderId: string;
  userId: string;
  companyId: string;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  sequenceNumber: number;
}

/**
 * Doubly Linked List Node representing a single order in the queue.
 */
export class OrderNode {
  public prev: OrderNode | null = null;
  public next: OrderNode | null = null;
  public priceLevel: PriceLevel | null = null;

  constructor(public readonly data: OrderBookEntry) {}
}

/**
 * A price level containing a FIFO queue (Doubly Linked List) of orders.
 */
export class PriceLevel {
  public price: number;
  public totalVolume: number = 0;
  
  public head: OrderNode | null = null;
  public tail: OrderNode | null = null;

  constructor(price: number) {
    this.price = price;
  }

  public append(node: OrderNode): void {
    if (this.tail === null) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail.next = node;
      node.prev = this.tail;
      this.tail = node;
    }
    node.priceLevel = this;
    this.totalVolume += node.data.quantity;
  }

  public remove(node: OrderNode): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      // Node is head
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      // Node is tail
      this.tail = node.prev;
    }

    node.prev = null;
    node.next = null;
    node.priceLevel = null;
    
    this.totalVolume -= node.data.quantity;
  }

  public isEmpty(): boolean {
    return this.head === null;
  }
}

/**
 * Represents the entire order book for a single company.
 * Maintains sorted price levels for fast O(1) best bid/ask and O(log N) insertions,
 * and a Hash Map for O(1) order cancellations.
 */
export class OrderBook {
  public companyId: string;
  
  // Sorted highest to lowest
  public buyLevels: PriceLevel[] = [];
  // Sorted lowest to highest
  public sellLevels: PriceLevel[] = [];
  
  // Fast lookup by OrderId
  public orders: Map<string, OrderNode> = new Map();

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  /**
   * Add a new order to the book.
   */
  public addOrder(order: OrderBookEntry): void {
    if (this.orders.has(order.orderId)) {
      throw new Error(`Order ${order.orderId} already exists in the book`);
    }

    if (order.companyId !== this.companyId) {
      throw new Error(`Order belongs to different company. Expected ${this.companyId}, got ${order.companyId}`);
    }

    const node = new OrderNode(order);
    this.orders.set(order.orderId, node);

    if (order.side === 'BUY') {
      this._insertLevel(this.buyLevels, node, true);
    } else {
      this._insertLevel(this.sellLevels, node, false);
    }
  }

  /**
   * Remove or cancel an order by ID in O(1) map + DLL time.
   */
  public removeOrder(orderId: string): OrderBookEntry | null {
    const node = this.orders.get(orderId);
    if (!node) return null;

    const level = node.priceLevel;
    if (level) {
      level.remove(node);

      if (level.isEmpty()) {
        if (node.data.side === 'BUY') {
          this._removeLevel(this.buyLevels, level.price, true);
        } else {
          this._removeLevel(this.sellLevels, level.price, false);
        }
      }
    }

    this.orders.delete(orderId);
    return node.data;
  }

  public cancelOrder(orderId: string): OrderBookEntry | null {
    return this.removeOrder(orderId);
  }

  /**
   * Update the quantity of an order (e.g., partial fill).
   * Note: This does NOT lose priority in Price-Time. 
   */
  public modifyQuantity(orderId: string, newQuantity: number): void {
    const node = this.orders.get(orderId);
    if (!node) throw new Error(`Order ${orderId} not found`);
    if (newQuantity <= 0) {
      this.removeOrder(orderId);
      return;
    }

    const diff = node.data.quantity - newQuantity;
    node.data.quantity = newQuantity;
    
    if (node.priceLevel) {
      node.priceLevel.totalVolume -= diff;
    }
  }

  public getBestBid(): PriceLevel | null {
    return this.buyLevels.length > 0 ? this.buyLevels[0] : null;
  }

  public getBestAsk(): PriceLevel | null {
    return this.sellLevels.length > 0 ? this.sellLevels[0] : null;
  }

  public getSpread(): number {
    const bid = this.getBestBid();
    const ask = this.getBestAsk();
    if (bid && ask) {
      return ask.price - bid.price;
    }
    return 0;
  }

  public getDepth(levels: number = 5) {
    const bids = this.buyLevels.slice(0, levels).map(l => ({ price: l.price, volume: l.totalVolume }));
    const asks = this.sellLevels.slice(0, levels).map(l => ({ price: l.price, volume: l.totalVolume }));
    return { bids, asks };
  }

  public getOrdersAtPrice(side: 'BUY' | 'SELL', price: number): OrderBookEntry[] {
    const arr = side === 'BUY' ? this.buyLevels : this.sellLevels;
    const isDesc = side === 'BUY';
    const idx = this._binarySearch(arr, price, isDesc);
    
    if (idx >= 0 && idx < arr.length && arr[idx].price === price) {
      const results: OrderBookEntry[] = [];
      let current = arr[idx].head;
      while (current) {
        results.push(current.data);
        current = current.next;
      }
      return results;
    }
    return [];
  }

  public getSnapshot() {
    return {
      companyId: this.companyId,
      bestBid: this.getBestBid()?.price || null,
      bestAsk: this.getBestAsk()?.price || null,
      spread: this.getSpread(),
      depth: this.getDepth(10),
      totalOrders: this.orders.size
    };
  }

  // --- Internals ---

  /**
   * Binary search insertion for price levels to maintain strict sorting.
   */
  private _insertLevel(arr: PriceLevel[], node: OrderNode, descending: boolean) {
    const price = node.data.price;
    let low = 0;
    let high = arr.length - 1;

    while (low <= high) {
      const mid = (low + high) >> 1;
      const midPrice = arr[mid].price;

      if (midPrice === price) {
        arr[mid].append(node);
        return;
      }

      if (descending) {
        if (price > midPrice) high = mid - 1;
        else low = mid + 1;
      } else {
        if (price < midPrice) high = mid - 1;
        else low = mid + 1;
      }
    }

    // Insert new level at `low` index
    const newLevel = new PriceLevel(price);
    newLevel.append(node);
    arr.splice(low, 0, newLevel);
  }

  /**
   * Binary search removal for empty price levels.
   */
  private _removeLevel(arr: PriceLevel[], price: number, descending: boolean) {
    const idx = this._binarySearch(arr, price, descending);
    if (idx >= 0 && idx < arr.length && arr[idx].price === price) {
      arr.splice(idx, 1);
    }
  }

  private _binarySearch(arr: PriceLevel[], price: number, descending: boolean): number {
    let low = 0;
    let high = arr.length - 1;

    while (low <= high) {
      const mid = (low + high) >> 1;
      const midPrice = arr[mid].price;

      if (midPrice === price) {
        return mid;
      }

      if (descending) {
        if (price > midPrice) high = mid - 1;
        else low = mid + 1;
      } else {
        if (price < midPrice) high = mid - 1;
        else low = mid + 1;
      }
    }
    return low;
  }
}

/**
 * Global Order Book Manager to isolate companies.
 */
export class OrderBookManager {
  private static books: Map<string, OrderBook> = new Map();

  static getBook(companyId: string): OrderBook {
    let book = this.books.get(companyId);
    if (!book) {
      book = new OrderBook(companyId);
      this.books.set(companyId, book);
    }
    return book;
  }

  static clearAll(): void {
    this.books.clear();
  }
}
