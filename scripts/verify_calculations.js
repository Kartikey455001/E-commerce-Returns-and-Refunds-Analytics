import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonDir = path.join(__dirname, '../src/data');

const orders = JSON.parse(fs.readFileSync(path.join(jsonDir, 'orders.json'), 'utf8'));
const returns = JSON.parse(fs.readFileSync(path.join(jsonDir, 'returns.json'), 'utf8'));
const refunds = JSON.parse(fs.readFileSync(path.join(jsonDir, 'refunds.json'), 'utf8'));
const products = JSON.parse(fs.readFileSync(path.join(jsonDir, 'products.json'), 'utf8'));
const customers = JSON.parse(fs.readFileSync(path.join(jsonDir, 'customers.json'), 'utf8'));

console.log('=====================================================');
console.log('   DATA INTEGRITY & KPI CALCULATION VALIDATION TEST   ');
console.log('=====================================================');

let testFailures = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
  } else {
    console.error(`[FAIL] ${message}`);
    testFailures++;
  }
}

// 1. Uniqueness Checks
const orderIds = new Set();
orders.forEach(o => orderIds.add(o.Order_ID));
assert(orderIds.size === orders.length, `Order_ID uniqueness: ${orderIds.size} unique vs ${orders.length} total rows`);

const returnIds = new Set();
returns.forEach(r => returnIds.add(r.Return_ID));
assert(returnIds.size === returns.length, `Return_ID uniqueness: ${returnIds.size} unique vs ${returns.length} total rows`);

const refundIds = new Set();
refunds.forEach(rf => refundIds.add(rf.Refund_ID));
assert(refundIds.size === refunds.length, `Refund_ID uniqueness: ${refundIds.size} unique vs ${refunds.length} total rows`);

// 2. Referential Integrity
let orphanReturns = 0;
returns.forEach(r => {
  if (!orderIds.has(r.Order_ID)) orphanReturns++;
});
assert(orphanReturns === 0, `Returns referential integrity: ${orphanReturns} orphan records`);

let orphanRefunds = 0;
refunds.forEach(rf => {
  if (!orderIds.has(rf.Order_ID)) orphanRefunds++;
});
assert(orphanRefunds === 0, `Refunds referential integrity: ${orphanRefunds} orphan records`);

// 3. Chronology Checks
let chronologyErrors = 0;
const orderDateMap = {};
orders.forEach(o => { orderDateMap[o.Order_ID] = o.Order_Date; });

returns.forEach(r => {
  const oDate = orderDateMap[r.Order_ID];
  if (r.Return_Date < oDate) chronologyErrors++;
});
assert(chronologyErrors === 0, `Return Date >= Order Date: ${chronologyErrors} timeline anomalies`);

const returnDateMap = {};
returns.forEach(r => { returnDateMap[r.Order_ID] = r.Return_Date; });

let refundChronologyErrors = 0;
refunds.forEach(rf => {
  const rDate = returnDateMap[rf.Order_ID];
  if (rDate && rf.Refund_Date < rDate) refundChronologyErrors++;
});
assert(refundChronologyErrors === 0, `Refund Date >= Return Date: ${refundChronologyErrors} timeline anomalies`);

// 4. Quantity and Value Bounds
let qtyErrors = 0;
const orderQtyMap = {};
orders.forEach(o => { orderQtyMap[o.Order_ID] = o.Quantity; });

returns.forEach(r => {
  const oQty = orderQtyMap[r.Order_ID] || 0;
  if (r.Returned_Quantity > oQty || r.Returned_Quantity <= 0) qtyErrors++;
});
assert(qtyErrors === 0, `Returned Quantity <= Ordered Quantity: ${qtyErrors} violations`);

// 5. KPI Calculations
const totalOrders = orders.length;
const returnedOrdersSet = new Set(returns.map(r => r.Order_ID));
const returnedOrders = returnedOrdersSet.size;
const returnRate = (returnedOrders / totalOrders) * 100;

assert(totalOrders === 7600, `Total Orders count = 7,600 (Actual: ${totalOrders})`);
assert(returnRate >= 10 && returnRate <= 30, `Realistic Return Rate: ${returnRate.toFixed(2)}% (Target: 10%-30%)`);

const completedRefunds = refunds.filter(rf => rf.Refund_Status === 'Completed');
const totalRefundAmount = completedRefunds.reduce((sum, rf) => sum + rf.Refund_Amount, 0);
const avgRefundAmount = totalRefundAmount / completedRefunds.length;
const completionRate = (completedRefunds.length / refunds.length) * 100;

assert(totalRefundAmount > 0, `Total Refund Amount: ₹${totalRefundAmount.toLocaleString('en-IN')}`);
assert(avgRefundAmount > 0, `Average Refund Ticket: ₹${Math.round(avgRefundAmount).toLocaleString('en-IN')}`);
assert(completionRate >= 80, `Refund Completion Rate: ${completionRate.toFixed(1)}%`);

console.log('=====================================================');
if (testFailures === 0) {
  console.log('✅ ALL AUDIT TESTS PASSED WITH ZERO ANOMALIES (100% HEALTH)');
} else {
  console.error(`❌ ${testFailures} TEST(S) FAILED`);
  process.exit(1);
}
console.log('=====================================================');
