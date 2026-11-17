/**
 * Core Analytics and Business Intelligence Calculation Engine.
 * Strictly implements defined e-commerce KPIs and rule-based insights generation.
 */

export function calculateKPIs(orders = [], returns = [], refunds = [], customers = []) {
  const totalOrders = orders.length;

  // Build sets and maps for fast O(1) lookups
  const returnOrderSet = new Set(returns.map(r => r.Order_ID));
  const returnedOrdersCount = returnOrderSet.size;

  const returnRate = totalOrders > 0 ? (returnedOrdersCount / totalOrders) * 100 : 0;

  // Refunds calculations (only Completed count towards actual financial payout loss)
  const completedRefunds = refunds.filter(r => r.Refund_Status === 'Completed');
  const totalRefundAmount = completedRefunds.reduce((sum, r) => sum + (Number(r.Refund_Amount) || 0), 0);
  const averageRefundAmount = completedRefunds.length > 0 ? totalRefundAmount / completedRefunds.length : 0;

  const refundCompletionRate = refunds.length > 0 
    ? (completedRefunds.length / refunds.length) * 100 
    : 0;

  const totalProcessingDays = completedRefunds.reduce((sum, r) => sum + (Number(r.Processing_Days) || 0), 0);
  const averageProcessingDays = completedRefunds.length > 0 ? totalProcessingDays / completedRefunds.length : 0;

  // Ordered vs Returned Quantities
  const totalOrderedQuantity = orders.reduce((sum, o) => sum + (Number(o.Quantity) || 0), 0);
  const totalReturnedQuantity = returns.reduce((sum, r) => sum + (Number(r.Returned_Quantity) || 0), 0);
  const productReturnRate = totalOrderedQuantity > 0 ? (totalReturnedQuantity / totalOrderedQuantity) * 100 : 0;

  // Gross Revenue & Net Revenue
  const grossRevenue = orders.reduce((sum, o) => sum + (Number(o.Order_Amount) || 0), 0);
  const netRevenue = grossRevenue - totalRefundAmount;

  // Customer Return Metrics
  const uniqueCustomerIDs = new Set(orders.map(o => o.Customer_ID));
  const totalCustomers = uniqueCustomerIDs.size || (customers.length || 1);

  // Customers who made returns
  const returnCustomerIDs = new Set();
  const customerReturnCounts = {};
  
  // Map Order_ID to Customer_ID
  const orderToCustomer = {};
  orders.forEach(o => { orderToCustomer[o.Order_ID] = o.Customer_ID; });

  returns.forEach(r => {
    const custId = orderToCustomer[r.Order_ID];
    if (custId) {
      returnCustomerIDs.add(custId);
      customerReturnCounts[custId] = (customerReturnCounts[custId] || 0) + 1;
    }
  });

  const customersWithReturns = returnCustomerIDs.size;
  const customerReturnRate = totalCustomers > 0 ? (customersWithReturns / totalCustomers) * 100 : 0;

  // Repeat returners (customers with more than 1 return)
  const repeatReturnCustomers = Object.values(customerReturnCounts).filter(count => count > 1).length;
  const repeatReturnRate = customersWithReturns > 0 ? (repeatReturnCustomers / customersWithReturns) * 100 : 0;

  // Return statuses breakdown
  const approvedReturns = returns.filter(r => r.Return_Status === 'Approved').length;
  const rejectedReturns = returns.filter(r => r.Return_Status === 'Rejected').length;
  const pendingReturns = returns.filter(r => r.Return_Status === 'Pending').length;
  const processingReturns = returns.filter(r => r.Return_Status === 'Processing').length;

  // Refund statuses breakdown
  const pendingRefunds = refunds.filter(r => r.Refund_Status === 'Pending').length;
  const approvedRefunds = refunds.filter(r => r.Refund_Status === 'Approved').length;
  const rejectedRefunds = refunds.filter(r => r.Refund_Status === 'Rejected').length;

  return {
    totalOrders,
    returnedOrdersCount,
    returnRate,
    totalRefundAmount,
    averageRefundAmount,
    refundCompletionRate,
    averageProcessingDays,
    totalOrderedQuantity,
    totalReturnedQuantity,
    productReturnRate,
    grossRevenue,
    netRevenue,
    totalCustomers,
    customersWithReturns,
    customerReturnRate,
    repeatReturnCustomers,
    repeatReturnRate,
    approvedReturns,
    rejectedReturns,
    pendingReturns,
    processingReturns,
    completedRefundsCount: completedRefunds.length,
    pendingRefunds,
    approvedRefunds,
    rejectedRefunds
  };
}

/**
 * Period comparison (e.g., comparing first half of selected range to second half, or estimating deltas)
 */
export function calculateComparisonDeltas(orders = [], returns = [], refunds = []) {
  if (orders.length < 2) {
    return { ordersDelta: 0, returnsDelta: 0, returnRateDelta: 0, refundDelta: 0 };
  }

  // Sort orders by date
  const sortedOrders = [...orders].sort((a, b) => new Date(a.Order_Date) - new Date(b.Order_Date));
  const midIndex = Math.floor(sortedOrders.length / 2);
  const midDate = new Date(sortedOrders[midIndex].Order_Date);

  const prevOrders = sortedOrders.filter(o => new Date(o.Order_Date) < midDate);
  const currOrders = sortedOrders.filter(o => new Date(o.Order_Date) >= midDate);

  const prevOrderIDs = new Set(prevOrders.map(o => o.Order_ID));
  const currOrderIDs = new Set(currOrders.map(o => o.Order_ID));

  const prevReturns = returns.filter(r => prevOrderIDs.has(r.Order_ID));
  const currReturns = returns.filter(r => currOrderIDs.has(r.Order_ID));

  const prevReturnRate = prevOrders.length > 0 ? (prevReturns.length / prevOrders.length) * 100 : 0;
  const currReturnRate = currOrders.length > 0 ? (currReturns.length / currOrders.length) * 100 : 0;

  const prevRefunds = refunds.filter(rf => prevOrderIDs.has(rf.Order_ID) && rf.Refund_Status === 'Completed');
  const currRefunds = refunds.filter(rf => currOrderIDs.has(rf.Order_ID) && rf.Refund_Status === 'Completed');

  const prevRefundTotal = prevRefunds.reduce((sum, r) => sum + r.Refund_Amount, 0);
  const currRefundTotal = currRefunds.reduce((sum, r) => sum + r.Refund_Amount, 0);

  const pctChange = (curr, prev) => prev > 0 ? ((curr - prev) / prev) * 100 : 0;

  return {
    ordersDelta: pctChange(currOrders.length, prevOrders.length),
    returnsDelta: pctChange(currReturns.length, prevReturns.length),
    returnRateDelta: currReturnRate - prevReturnRate, // percentage point difference
    refundDelta: pctChange(currRefundTotal, prevRefundTotal)
  };
}

/**
 * Rule-based Dynamic Business Insights Generator.
 * Calculates insights strictly from the filtered datasets without hardcoded text.
 */
export function generateBusinessInsights(orders = [], returns = [], refunds = [], products = []) {
  const insights = [];

  if (!orders.length || !returns.length) {
    return insights;
  }

  // 1. Category with Highest Return Rate
  const catStats = {};
  orders.forEach(o => {
    if (!catStats[o.Product_Category]) {
      catStats[o.Product_Category] = { orders: 0, returns: 0, refundAmt: 0 };
    }
    catStats[o.Product_Category].orders += 1;
  });

  const returnOrderMap = {};
  returns.forEach(r => { returnOrderMap[r.Order_ID] = r; });

  const refundMap = {};
  refunds.forEach(rf => {
    if (rf.Refund_Status === 'Completed') {
      refundMap[rf.Order_ID] = (refundMap[rf.Order_ID] || 0) + rf.Refund_Amount;
    }
  });

  orders.forEach(o => {
    if (returnOrderMap[o.Order_ID]) {
      catStats[o.Product_Category].returns += 1;
    }
    if (refundMap[o.Order_ID]) {
      catStats[o.Product_Category].refundAmt += refundMap[o.Order_ID];
    }
  });

  let highestReturnCat = null;
  let maxCatReturnRate = -1;
  Object.entries(catStats).forEach(([cat, data]) => {
    const rate = data.orders > 0 ? (data.returns / data.orders) * 100 : 0;
    if (rate > maxCatReturnRate) {
      maxCatReturnRate = rate;
      highestReturnCat = cat;
    }
  });

  if (highestReturnCat) {
    insights.push({
      id: 'cat-highest-return',
      type: 'critical',
      title: `Highest Return Rate: ${highestReturnCat} (${maxCatReturnRate.toFixed(1)}%)`,
      description: `${highestReturnCat} demonstrates the highest proportion of returns across all categories, with ${catStats[highestReturnCat].returns} returned orders out of ${catStats[highestReturnCat].orders} total orders placed.`,
      recommendation: highestReturnCat === 'Rings' || highestReturnCat === 'Bangles'
        ? 'Implement an interactive ring/bangle size finder tool with printable sizing guides on product pages to reduce sizing miscalculations.'
        : 'Audit supplier craftsmanship specifications, packaging protection, and photographic accuracy for this category.'
    });
  }

  // 2. Product with Highest Number of Returns
  const prdReturnCounts = {};
  const prdOrderCounts = {};
  orders.forEach(o => {
    prdOrderCounts[o.Product_Name] = (prdOrderCounts[o.Product_Name] || 0) + 1;
  });
  returns.forEach(r => {
    const matchingOrder = orders.find(o => o.Order_ID === r.Order_ID);
    if (matchingOrder) {
      prdReturnCounts[matchingOrder.Product_Name] = (prdReturnCounts[matchingOrder.Product_Name] || 0) + 1;
    }
  });

  let topReturnedProduct = null;
  let maxPrdReturns = -1;
  Object.entries(prdReturnCounts).forEach(([name, count]) => {
    if (count > maxPrdReturns) {
      maxPrdReturns = count;
      topReturnedProduct = name;
    }
  });

  if (topReturnedProduct) {
    const prdOrders = prdOrderCounts[topReturnedProduct] || 0;
    const rate = prdOrders > 0 ? ((maxPrdReturns / prdOrders) * 100).toFixed(1) : '0';
    insights.push({
      id: 'top-returned-product',
      type: 'warning',
      title: `Top Return Offender: ${topReturnedProduct}`,
      description: `This product has accumulated ${maxPrdReturns} returns (${rate}% of its order volume).`,
      recommendation: 'Conduct quality control checks with the supplier and review customer feedback comments regarding sizing and physical finish.'
    });
  }

  // 3. Most Common Return Reason
  const reasonCounts = {};
  returns.forEach(r => {
    reasonCounts[r.Return_Reason] = (reasonCounts[r.Return_Reason] || 0) + 1;
  });

  let mostCommonReason = null;
  let maxReasonCount = -1;
  Object.entries(reasonCounts).forEach(([reason, count]) => {
    if (count > maxReasonCount) {
      maxReasonCount = count;
      mostCommonReason = reason;
    }
  });

  if (mostCommonReason) {
    const pct = ((maxReasonCount / returns.length) * 100).toFixed(1);
    insights.push({
      id: 'common-return-reason',
      type: 'info',
      title: `Dominant Return Reason: ${mostCommonReason} (${pct}%)`,
      description: `"${mostCommonReason}" constitutes ${maxReasonCount} out of ${returns.length} total return requests logged.`,
      recommendation: mostCommonReason === 'Size or Fit Issues'
        ? 'Provide augmented reality (AR) virtual try-on, precise millimeter dimensions, and customer body/fit testimonials.'
        : mostCommonReason === 'Damaged Product'
        ? 'Upgrade transit packaging with shock-absorbent multi-layer bubble cushioning and tamper-evident rigid jewelry gift boxes.'
        : 'Update product photography with 360-degree high-definition video clips under natural daylight.'
    });
  }

  // 4. Quality & Defect Concentration
  const defectReturns = returns.filter(r => r.Return_Reason === 'Damaged Product' || r.Return_Reason === 'Quality Issues');
  const defectPct = ((defectReturns.length / returns.length) * 100).toFixed(1);
  if (Number(defectPct) > 25) {
    insights.push({
      id: 'defect-alert',
      type: 'critical',
      title: `Quality & Transit Damage Alert: ${defectPct}% of Returns`,
      description: `${defectReturns.length} returns were initiated due to product defects or transit damage, directly impacting customer trust and logistics cost.`,
      recommendation: 'Impose penalty clauses and pre-dispatch inspection thresholds on primary suppliers with high defect return frequencies.'
    });
  }

  // 5. Geographic Concentration / State With Highest Returns
  const stateOrders = {};
  const stateReturns = {};
  orders.forEach(o => {
    stateOrders[o.State] = (stateOrders[o.State] || 0) + 1;
    if (returnOrderMap[o.Order_ID]) {
      stateReturns[o.State] = (stateReturns[o.State] || 0) + 1;
    }
  });

  let topReturnState = null;
  let maxStateRate = -1;
  Object.entries(stateOrders).forEach(([st, ordCount]) => {
    if (ordCount > 50) { // minimum threshold for statistical significance
      const retCount = stateReturns[st] || 0;
      const rate = (retCount / ordCount) * 100;
      if (rate > maxStateRate) {
        maxStateRate = rate;
        topReturnState = st;
      }
    }
  });

  if (topReturnState) {
    insights.push({
      id: 'state-return-hotspot',
      type: 'opportunity',
      title: `Highest Return Geography: ${topReturnState} (${maxStateRate.toFixed(1)}%)`,
      description: `${topReturnState} records an above-average return rate (${maxStateRate.toFixed(1)}% vs national average of ${((returns.length / orders.length) * 100).toFixed(1)}%).`,
      recommendation: 'Evaluate regional 3PL courier performance, COD delivery verification protocols, and transit duration to reduce return-to-origin (RTO) friction.'
    });
  }

  // 6. Refund Processing SLA Performance
  const completedRefunds = refunds.filter(r => r.Refund_Status === 'Completed');
  if (completedRefunds.length > 0) {
    const avgDays = (completedRefunds.reduce((sum, r) => sum + r.Processing_Days, 0) / completedRefunds.length).toFixed(1);
    insights.push({
      id: 'refund-sla',
      type: Number(avgDays) <= 4 ? 'positive' : 'warning',
      title: `Refund Processing Cycle: ${avgDays} Days Average`,
      description: `Customer refund payouts are completed in an average of ${avgDays} business days across all payment methods.`,
      recommendation: Number(avgDays) > 4
        ? 'Automate instant UPI and wallet refund disbursement upon warehouse quality scan to shorten turnaround times.'
        : 'Maintain efficient reverse pickup and fast settlement to encourage repurchases from returning shoppers.'
    });
  }

  return insights;
}
