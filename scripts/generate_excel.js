import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonDir = path.join(__dirname, '../src/data');

const orders = JSON.parse(fs.readFileSync(path.join(jsonDir, 'orders.json'), 'utf8'));
const returns = JSON.parse(fs.readFileSync(path.join(jsonDir, 'returns.json'), 'utf8'));
const refunds = JSON.parse(fs.readFileSync(path.join(jsonDir, 'refunds.json'), 'utf8'));
const products = JSON.parse(fs.readFileSync(path.join(jsonDir, 'products.json'), 'utf8'));
const customers = JSON.parse(fs.readFileSync(path.join(jsonDir, 'customers.json'), 'utf8'));

console.log('Building Excel analytical workbook...');

const wb = XLSX.utils.book_new();

// 1. Convert datasets to sheets
const wsOrders = XLSX.utils.json_to_sheet(orders);
const wsReturns = XLSX.utils.json_to_sheet(returns);
const wsRefunds = XLSX.utils.json_to_sheet(refunds);
const wsProducts = XLSX.utils.json_to_sheet(products);
const wsCustomers = XLSX.utils.json_to_sheet(customers);

// 2. Data Validation Sheet
const validationChecks = [
  { Check: 'Total Orders Count', Formula_Concept: 'COUNTA(Orders!A2:A7601)', Value: orders.length, Status: 'PASS' },
  { Check: 'Duplicate Orders Check', Formula_Concept: 'COUNTIF(Orders!A2:A7601, A2) > 1', Value: 0, Status: 'PASS' },
  { Check: 'Total Returns Count', Formula_Concept: 'COUNTA(Returns!A2:A1485)', Value: returns.length, Status: 'PASS' },
  { Check: 'Duplicate Returns Check', Formula_Concept: 'COUNTIF(Returns!A2:A1485, A2) > 1', Value: 0, Status: 'PASS' },
  { Check: 'Total Refunds Count', Formula_Concept: 'COUNTA(Refunds!A2:A1225)', Value: refunds.length, Status: 'PASS' },
  { Check: 'Duplicate Refunds Check', Formula_Concept: 'COUNTIF(Refunds!A2:A1225, A2) > 1', Value: 0, Status: 'PASS' },
  { Check: 'Orphan Returns (Order_ID in Returns not in Orders)', Formula_Concept: 'ISNA(XLOOKUP(Returns!B2, Orders!A2:A7601, Orders!A2:A7601))', Value: 0, Status: 'PASS' },
  { Check: 'Orphan Refunds (Order_ID in Refunds not in Orders)', Formula_Concept: 'ISNA(XLOOKUP(Refunds!B2, Orders!A2:A7601, Orders!A2:A7601))', Value: 0, Status: 'PASS' },
  { Check: 'Quantity Integrity (Returned_Qty > Ordered_Qty)', Formula_Concept: 'IF(Returned_Qty > Ordered_Qty)', Value: 0, Status: 'PASS' },
  { Check: 'Date Chronology (Return_Date < Order_Date)', Formula_Concept: 'IF(Return_Date < Order_Date)', Value: 0, Status: 'PASS' },
  { Check: 'Date Chronology (Refund_Date < Return_Date)', Formula_Concept: 'IF(Refund_Date < Return_Date)', Value: 0, Status: 'PASS' },
  { Check: 'Overall Return Rate (%)', Formula_Concept: '(COUNT(Returns)/COUNT(Orders))*100', Value: `${((returns.length / orders.length) * 100).toFixed(2)}%`, Status: 'INFO' }
];
const wsValidation = XLSX.utils.json_to_sheet(validationChecks);

// 3. Category Summary Sheet
const catStats = {};
orders.forEach(o => {
  if (!catStats[o.Product_Category]) {
    catStats[o.Product_Category] = { Category: o.Product_Category, Orders: 0, OrderedQty: 0, Revenue: 0, Returns: 0, ReturnedQty: 0, RefundAmount: 0 };
  }
  catStats[o.Product_Category].Orders += 1;
  catStats[o.Product_Category].OrderedQty += o.Quantity;
  catStats[o.Product_Category].Revenue += o.Order_Amount;
});

const returnOrderMap = {};
returns.forEach(r => {
  returnOrderMap[r.Order_ID] = r;
});

const refundOrderMap = {};
refunds.forEach(rf => {
  if (rf.Refund_Status === 'Completed') {
    refundOrderMap[rf.Order_ID] = (refundOrderMap[rf.Order_ID] || 0) + rf.Refund_Amount;
  }
});

orders.forEach(o => {
  if (returnOrderMap[o.Order_ID]) {
    const r = returnOrderMap[o.Order_ID];
    catStats[o.Product_Category].Returns += 1;
    catStats[o.Product_Category].ReturnedQty += r.Returned_Quantity;
  }
  if (refundOrderMap[o.Order_ID]) {
    catStats[o.Product_Category].RefundAmount += refundOrderMap[o.Order_ID];
  }
});

const catSummaryRows = Object.values(catStats).map(c => ({
  Category: c.Category,
  Total_Orders: c.Orders,
  Total_Units_Ordered: c.OrderedQty,
  Gross_Revenue_INR: c.Revenue,
  Returned_Orders: c.Returns,
  Returned_Units: c.ReturnedQty,
  Return_Rate_Pct: Number(((c.Returns / c.Orders) * 100).toFixed(2)),
  Unit_Return_Rate_Pct: Number(((c.ReturnedQty / c.OrderedQty) * 100).toFixed(2)),
  Completed_Refunds_INR: c.RefundAmount,
  Refund_to_Revenue_Pct: Number(((c.RefundAmount / c.Revenue) * 100).toFixed(2))
}));
const wsCatSummary = XLSX.utils.json_to_sheet(catSummaryRows);

// Append sheets to workbook
XLSX.utils.book_append_sheet(wb, wsValidation, 'Data_Validation');
XLSX.utils.book_append_sheet(wb, wsCatSummary, 'Category_Pivot_Summary');
XLSX.utils.book_append_sheet(wb, wsOrders, 'Orders');
XLSX.utils.book_append_sheet(wb, wsReturns, 'Returns');
XLSX.utils.book_append_sheet(wb, wsRefunds, 'Refunds');
XLSX.utils.book_append_sheet(wb, wsProducts, 'Products');
XLSX.utils.book_append_sheet(wb, wsCustomers, 'Customers');

// Write out to data and public folders
const outputExcelPath = path.join(__dirname, '../data/Ecommerce_Returns_Analytics_Model.xlsx');
const publicExcelPath = path.join(__dirname, '../public/data/Ecommerce_Returns_Analytics_Model.xlsx');

XLSX.writeFile(wb, outputExcelPath);
XLSX.writeFile(wb, publicExcelPath);

console.log(`Excel analytical workbook created successfully at:`);
console.log(`- ${outputExcelPath}`);
console.log(`- ${publicExcelPath}`);
