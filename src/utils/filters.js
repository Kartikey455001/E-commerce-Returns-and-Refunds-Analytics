/**
 * Multi-criteria Filter Engine for Orders, Returns, and Refunds.
 */

export function applyFilters(orders = [], returns = [], refunds = [], filters = {}) {
  const {
    dateRange = { start: '', end: '' },
    category = 'All',
    product = 'All',
    returnReason = 'All',
    returnStatus = 'All',
    refundStatus = 'All',
    state = 'All',
    salesChannel = 'All',
    searchQuery = ''
  } = filters;

  // 1. Build lookup sets for fast matching
  const returnMap = {};
  returns.forEach(r => { returnMap[r.Order_ID] = r; });

  const refundMap = {};
  refunds.forEach(rf => { refundMap[rf.Order_ID] = rf; });

  // 2. Filter Orders
  const filteredOrders = orders.filter(order => {
    // Date filter
    if (dateRange.start && order.Order_Date < dateRange.start) return false;
    if (dateRange.end && order.Order_Date > dateRange.end) return false;

    // Category filter
    if (category !== 'All' && order.Product_Category !== category) return false;

    // Product filter
    if (product !== 'All' && order.Product_Name !== product && order.Product_ID !== product) return false;

    // State filter
    if (state !== 'All' && order.State !== state) return false;

    // Sales channel filter
    if (salesChannel !== 'All' && order.Sales_Channel !== salesChannel) return false;

    // Return reason filter (if filter selected, order MUST have return matching reason)
    const ret = returnMap[order.Order_ID];
    if (returnReason !== 'All') {
      if (!ret || ret.Return_Reason !== returnReason) return false;
    }

    // Return status filter
    if (returnStatus !== 'All') {
      if (!ret || ret.Return_Status !== returnStatus) return false;
    }

    // Refund status filter
    const ref = refundMap[order.Order_ID];
    if (refundStatus !== 'All') {
      if (!ref || ref.Refund_Status !== refundStatus) return false;
    }

    // Free text search
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match = 
        order.Order_ID.toLowerCase().includes(q) ||
        order.Product_Name.toLowerCase().includes(q) ||
        order.Customer_ID.toLowerCase().includes(q) ||
        order.City.toLowerCase().includes(q) ||
        order.State.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const validFilteredOrderIDs = new Set(filteredOrders.map(o => o.Order_ID));

  // 3. Filter Returns that belong to the filtered orders
  const filteredReturns = returns.filter(r => {
    if (!validFilteredOrderIDs.has(r.Order_ID)) return false;
    if (returnReason !== 'All' && r.Return_Reason !== returnReason) return false;
    if (returnStatus !== 'All' && r.Return_Status !== returnStatus) return false;
    return true;
  });

  // 4. Filter Refunds that belong to the filtered orders
  const filteredRefunds = refunds.filter(rf => {
    if (!validFilteredOrderIDs.has(rf.Order_ID)) return false;
    if (refundStatus !== 'All' && rf.Refund_Status !== refundStatus) return false;
    return true;
  });

  return {
    filteredOrders,
    filteredReturns,
    filteredRefunds
  };
}
