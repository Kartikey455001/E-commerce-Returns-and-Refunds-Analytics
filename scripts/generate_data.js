import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Seeded pseudorandom generator for deterministic, reproducible results
let seed = 42;
function random() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

function randInt(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function choice(arr) {
  return arr[Math.floor(random() * arr.length)];
}

function weightedChoice(items, weights) {
  const total = weights.reduce((acc, w) => acc + w, 0);
  let threshold = random() * total;
  for (let i = 0; i < items.length; i++) {
    threshold -= weights[i];
    if (threshold <= 0) return items[i];
  }
  return items[items.length - 1];
}

function pad(num, size = 4) {
  let s = num + '';
  while (s.length < size) s = '0' + s;
  return s;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 1. PRODUCTS DEFINITION (50 authentic Indian Fashion & Jewellery items across 8 categories)
const rawProducts = [
  // Earrings (7 items)
  { id: 'PRD-101', name: 'Royal Kundan Chandbali Earrings', cat: 'Earrings', price: 2899, cost: 1150, brand: 'Zariyah Luxe', supplier: 'Jaipur Gem Crafts', returnPropensity: 1.1 },
  { id: 'PRD-102', name: 'Traditional Meenakari Jhumkas', cat: 'Earrings', price: 1799, cost: 720, brand: 'Aura Jewels', supplier: 'Jaipur Gem Crafts', returnPropensity: 0.9 },
  { id: 'PRD-103', name: 'Polki Floral Stud Earrings', cat: 'Earrings', price: 1499, cost: 580, brand: 'Vedic Spark', supplier: 'Surat Diamond Arts', returnPropensity: 0.8 },
  { id: 'PRD-104', name: 'Antique Temple Drop Earrings', cat: 'Earrings', price: 2199, cost: 890, brand: 'Royal Heritage', supplier: 'Mumbai Goldsmiths Ltd', returnPropensity: 1.0 },
  { id: 'PRD-105', name: 'Rose Gold CZ Hoop Earrings', cat: 'Earrings', price: 1299, cost: 480, brand: 'Nirvana Gems', supplier: 'Surat Diamond Arts', returnPropensity: 0.7 },
  { id: 'PRD-106', name: 'Kashmiri Pearl Tassel Dangles', cat: 'Earrings', price: 1999, cost: 790, brand: 'Zariyah Luxe', supplier: 'Jaipur Gem Crafts', returnPropensity: 1.3 }, // delicate, higher transit damage
  { id: 'PRD-107', name: 'Oxidised Silver Boho Dome Jhumkis', cat: 'Earrings', price: 899, cost: 320, brand: 'Tarinika Craft', supplier: 'Rajkot Jewellery Hub', returnPropensity: 0.8 },

  // Necklaces (7 items)
  { id: 'PRD-108', name: 'Bridal Heritage Kundan Choker Set', cat: 'Necklaces', price: 7999, cost: 3400, brand: 'Zariyah Luxe', supplier: 'Jaipur Gem Crafts', returnPropensity: 1.4 }, // complex fit/expectation
  { id: 'PRD-109', name: 'Emerald Green Royal Rani Haar', cat: 'Necklaces', price: 9499, cost: 4100, brand: 'Royal Heritage', supplier: 'Jaipur Gem Crafts', returnPropensity: 1.2 },
  { id: 'PRD-110', name: 'Solitaire CZ Tennis Choker', cat: 'Necklaces', price: 3499, cost: 1400, brand: 'Nirvana Gems', supplier: 'Surat Diamond Arts', returnPropensity: 0.9 },
  { id: 'PRD-111', name: 'Temple Coin Lakshmi Long Haar', cat: 'Necklaces', price: 5999, cost: 2450, brand: 'Royal Heritage', supplier: 'Mumbai Goldsmiths Ltd', returnPropensity: 0.8 },
  { id: 'PRD-112', name: 'Layered Fresh Water Pearl Mala', cat: 'Necklaces', price: 2799, cost: 1100, brand: 'Aura Jewels', supplier: 'Hyderabad Pearl House', returnPropensity: 0.7 },
  { id: 'PRD-113', name: 'Gold Plated Hasli Tribal Collar', cat: 'Necklaces', price: 1999, cost: 780, brand: 'Tarinika Craft', supplier: 'Rajkot Jewellery Hub', returnPropensity: 1.2 }, // fit issues
  { id: 'PRD-114', name: 'American Diamond V-Collar Necklace', cat: 'Necklaces', price: 4299, cost: 1750, brand: 'Vedic Spark', supplier: 'Surat Diamond Arts', returnPropensity: 0.9 },

  // Rings (6 items)
  { id: 'PRD-115', name: 'Solitaire Cushion Cut CZ Ring', cat: 'Rings', price: 1599, cost: 620, brand: 'Nirvana Gems', supplier: 'Surat Diamond Arts', returnPropensity: 1.7 }, // high size/fit returns
  { id: 'PRD-116', name: 'Adjustable Polki Mirror Cocktail Ring', cat: 'Rings', price: 1299, cost: 480, brand: 'Aura Jewels', supplier: 'Jaipur Gem Crafts', returnPropensity: 0.9 }, // adjustable has lower fit issues
  { id: 'PRD-117', name: 'Navratna Multi-Gemstone Halo Ring', cat: 'Rings', price: 2499, cost: 980, brand: 'Royal Heritage', supplier: 'Jaipur Gem Crafts', returnPropensity: 1.6 }, // size issues
  { id: 'PRD-118', name: 'Rose Gold Eternity Band Ring', cat: 'Rings', price: 1899, cost: 720, brand: 'Nirvana Gems', supplier: 'Surat Diamond Arts', returnPropensity: 1.8 }, // fixed band size issues
  { id: 'PRD-119', name: 'Antique Brass Floral Statement Ring', cat: 'Rings', price: 999, cost: 360, brand: 'Tarinika Craft', supplier: 'Rajkot Jewellery Hub', returnPropensity: 1.1 },
  { id: 'PRD-120', name: 'Ruby Center Solitaire Accent Ring', cat: 'Rings', price: 2199, cost: 860, brand: 'Vedic Spark', supplier: 'Surat Diamond Arts', returnPropensity: 1.5 },

  // Bracelets (6 items)
  { id: 'PRD-121', name: 'Evil Eye Rose Gold Charm Bracelet', cat: 'Bracelets', price: 1399, cost: 510, brand: 'Nirvana Gems', supplier: 'Surat Diamond Arts', returnPropensity: 0.8 },
  { id: 'PRD-122', name: 'Classic CZ Tennis Link Bracelet', cat: 'Bracelets', price: 2299, cost: 920, brand: 'Vedic Spark', supplier: 'Surat Diamond Arts', returnPropensity: 1.1 },
  { id: 'PRD-123', name: 'Emerald Velvet Stone Cuff Bracelet', cat: 'Bracelets', price: 1899, cost: 740, brand: 'Aura Jewels', supplier: 'Jaipur Gem Crafts', returnPropensity: 1.2 },
  { id: 'PRD-124', name: 'Gold Plated Filigree Chain Bracelet', cat: 'Bracelets', price: 1599, cost: 600, brand: 'Royal Heritage', supplier: 'Mumbai Goldsmiths Ltd', returnPropensity: 0.7 },
  { id: 'PRD-125', name: 'Silver Charm Dual Strand Bracelet', cat: 'Bracelets', price: 1199, cost: 440, brand: 'Tarinika Craft', supplier: 'Rajkot Jewellery Hub', returnPropensity: 0.9 },
  { id: 'PRD-126', name: 'Kundan Embedded Open Cuff', cat: 'Bracelets', price: 2499, cost: 990, brand: 'Zariyah Luxe', supplier: 'Jaipur Gem Crafts', returnPropensity: 1.0 },

  // Bangles (6 items)
  { id: 'PRD-127', name: 'Bridal Chooda Red & White Set (Pack of 4)', cat: 'Bangles', price: 2999, cost: 1180, brand: 'Royal Heritage', supplier: 'Mumbai Goldsmiths Ltd', returnPropensity: 1.9 }, // high size/fit returns
  { id: 'PRD-128', name: 'Jaipuri Handmade Lac Bangle Set', cat: 'Bangles', price: 1199, cost: 420, brand: 'Tarinika Craft', supplier: 'Jaipur Gem Crafts', returnPropensity: 1.5 }, // fragile/size
  { id: 'PRD-129', name: 'Temple Gold Plated Carved Kada Pair', cat: 'Bangles', price: 3499, cost: 1380, brand: 'Royal Heritage', supplier: 'Mumbai Goldsmiths Ltd', returnPropensity: 1.3 },
  { id: 'PRD-130', name: 'Zircon Crystal Partywear Bangles (6 pcs)', cat: 'Bangles', price: 2199, cost: 840, brand: 'Vedic Spark', supplier: 'Surat Diamond Arts', returnPropensity: 1.6 },
  { id: 'PRD-131', name: 'Matte Finish Peacock Kada Pair', cat: 'Bangles', price: 2799, cost: 1090, brand: 'Aura Jewels', supplier: 'Rajkot Jewellery Hub', returnPropensity: 1.2 },
  { id: 'PRD-132', name: 'Antique Brass Floral Embossed Bangles', cat: 'Bangles', price: 1499, cost: 550, brand: 'Tarinika Craft', supplier: 'Rajkot Jewellery Hub', returnPropensity: 1.4 },

  // Pendants (6 items)
  { id: 'PRD-133', name: 'Lord Ganesha Solitaire Diamond Pendant', cat: 'Pendants', price: 3199, cost: 1250, brand: 'Royal Heritage', supplier: 'Mumbai Goldsmiths Ltd', returnPropensity: 0.6 }, // low returns
  { id: 'PRD-134', name: 'Evil Eye Mother of Pearl Amulet Pendant', cat: 'Pendants', price: 1499, cost: 540, brand: 'Nirvana Gems', supplier: 'Surat Diamond Arts', returnPropensity: 0.7 },
  { id: 'PRD-135', name: 'Peacock Meenakari Enamel Pendant Chain', cat: 'Pendants', price: 1899, cost: 710, brand: 'Aura Jewels', supplier: 'Jaipur Gem Crafts', returnPropensity: 0.8 },
  { id: 'PRD-136', name: 'Minimalist Freshwater Pearl Drop Pendant', cat: 'Pendants', price: 1299, cost: 460, brand: 'Vedic Spark', supplier: 'Hyderabad Pearl House', returnPropensity: 0.6 },
  { id: 'PRD-137', name: 'Zodiac Star Sign Constellation Pendant', cat: 'Pendants', price: 1099, cost: 380, brand: 'Nirvana Gems', supplier: 'Surat Diamond Arts', returnPropensity: 0.7 },
  { id: 'PRD-138', name: 'Ruby Solitaire Floral Halo Pendant', cat: 'Pendants', price: 2399, cost: 920, brand: 'Zariyah Luxe', supplier: 'Surat Diamond Arts', returnPropensity: 0.7 },

  // Watches (6 items)
  { id: 'PRD-139', name: 'Rose Gold Ceramic Mesh Dial Watch', cat: 'Watches', price: 4499, cost: 1800, brand: 'Nirvana Gems', supplier: 'Mumbai Goldsmiths Ltd', returnPropensity: 1.3 }, // defect/battery issues
  { id: 'PRD-140', name: 'Diamond Bezel Dress Analogue Watch', cat: 'Watches', price: 5499, cost: 2200, brand: 'Zariyah Luxe', supplier: 'Mumbai Goldsmiths Ltd', returnPropensity: 1.2 },
  { id: 'PRD-141', name: 'Royal Classic Midnight Leather Watch', cat: 'Watches', price: 3299, cost: 1280, brand: 'Royal Heritage', supplier: 'Mumbai Goldsmiths Ltd', returnPropensity: 0.9 },
  { id: 'PRD-142', name: 'Chronograph Minimalist Silver Watch', cat: 'Watches', price: 3999, cost: 1580, brand: 'Vedic Spark', supplier: 'Surat Diamond Arts', returnPropensity: 1.1 },
  { id: 'PRD-143', name: 'Vintage Emerald Dial Bracelet Watch', cat: 'Watches', price: 4899, cost: 1950, brand: 'Aura Jewels', supplier: 'Jaipur Gem Crafts', returnPropensity: 1.4 },
  { id: 'PRD-144', name: 'Champagne Gold Slimline Luxury Watch', cat: 'Watches', price: 3799, cost: 1480, brand: 'Nirvana Gems', supplier: 'Surat Diamond Arts', returnPropensity: 1.0 },

  // Fashion Accessories (6 items)
  { id: 'PRD-145', name: 'Zardozi Hand Embroidered Bridal Potli', cat: 'Fashion Accessories', price: 1999, cost: 750, brand: 'Royal Heritage', supplier: 'Jaipur Gem Crafts', returnPropensity: 1.0 },
  { id: 'PRD-146', name: 'Kundan Pearl Sheeshpatti Maang Tikka', cat: 'Fashion Accessories', price: 1799, cost: 680, brand: 'Zariyah Luxe', supplier: 'Jaipur Gem Crafts', returnPropensity: 1.3 },
  { id: 'PRD-147', name: 'Antique Gold Plated Kamarbandh Waist Belt', cat: 'Fashion Accessories', price: 2899, cost: 1120, brand: 'Royal Heritage', supplier: 'Mumbai Goldsmiths Ltd', returnPropensity: 1.5 }, // size/fit issues
  { id: 'PRD-148', name: 'Jadau Hair Pin Brooch (Set of 2)', cat: 'Fashion Accessories', price: 1199, cost: 430, brand: 'Aura Jewels', supplier: 'Jaipur Gem Crafts', returnPropensity: 0.8 },
  { id: 'PRD-149', name: 'Velvet Embellished Clutches with Chain', cat: 'Fashion Accessories', price: 2299, cost: 890, brand: 'Tarinika Craft', supplier: 'Rajkot Jewellery Hub', returnPropensity: 1.1 },
  { id: 'PRD-150', name: 'Traditional Floral Gota Patti Hathphool', cat: 'Fashion Accessories', price: 1399, cost: 510, brand: 'Vedic Spark', supplier: 'Jaipur Gem Crafts', returnPropensity: 1.2 }
];

// 2. INDIAN CITIES & STATES
const locations = [
  { city: 'Mumbai', state: 'Maharashtra', region: 'West', tier: 1 },
  { city: 'Pune', state: 'Maharashtra', region: 'West', tier: 1 },
  { city: 'Nagpur', state: 'Maharashtra', region: 'West', tier: 2 },
  { city: 'Delhi', state: 'Delhi', region: 'North', tier: 1 },
  { city: 'Bengaluru', state: 'Karnataka', region: 'South', tier: 1 },
  { city: 'Mysuru', state: 'Karnataka', region: 'South', tier: 2 },
  { city: 'Hyderabad', state: 'Telangana', region: 'South', tier: 1 },
  { city: 'Chennai', state: 'Tamil Nadu', region: 'South', tier: 1 },
  { city: 'Coimbatore', state: 'Tamil Nadu', region: 'South', tier: 2 },
  { city: 'Kolkata', state: 'West Bengal', region: 'East', tier: 1 },
  { city: 'Ahmedabad', state: 'Gujarat', region: 'West', tier: 1 },
  { city: 'Surat', state: 'Gujarat', region: 'West', tier: 2 },
  { city: 'Jaipur', state: 'Rajasthan', region: 'North', tier: 2 },
  { city: 'Udaipur', state: 'Rajasthan', region: 'North', tier: 2 },
  { city: 'Lucknow', state: 'Uttar Pradesh', region: 'North', tier: 2 },
  { city: 'Kanpur', state: 'Uttar Pradesh', region: 'North', tier: 2 },
  { city: 'Chandigarh', state: 'Punjab', region: 'North', tier: 2 },
  { city: 'Ludhiana', state: 'Punjab', region: 'North', tier: 2 },
  { city: 'Kochi', state: 'Kerala', region: 'South', tier: 2 },
  { city: 'Indore', state: 'Madhya Pradesh', region: 'Central', tier: 2 }
];

// First & Last Indian names
const firstNamesFemale = [
  'Priya', 'Ananya', 'Sneha', 'Kavita', 'Neha', 'Divya', 'Pooja', 'Riya', 'Shreya', 'Tanvi',
  'Meera', 'Aditi', 'Isha', 'Simran', 'Kritika', 'Swati', 'Preeti', 'Nandini', 'Payal', 'Aarohi',
  'Deepika', 'Rashmi', 'Pallavi', 'Sanjana', 'Anushka', 'Shruti', 'Bhavna', 'Roshni', 'Tara', 'Anjali'
];
const firstNamesMale = [
  'Aarav', 'Rohan', 'Vikram', 'Aditya', 'Rahul', 'Karan', 'Manish', 'Siddharth', 'Arjun', 'Varun',
  'Kunal', 'Abhishek', 'Gaurav', 'Naveen', 'Sameer', 'Vishal', 'Rajesh', 'Vivek', 'Harsh', 'Mayank',
  'Deepak', 'Sanjay', 'Kartik', 'Rishi', 'Pranav', 'Nikhil', 'Dev', 'Alok', 'Yash', 'Rajat'
];
const lastNames = [
  'Sharma', 'Patel', 'Iyer', 'Verma', 'Malhotra', 'Reddy', 'Joshi', 'Nair', 'Gupta', 'Kulkarni',
  'Mehta', 'Chopra', 'Singh', 'Deshmukh', 'Shah', 'Agarwal', 'Chatterjee', 'Bose', 'Rao', 'Pillai',
  'Menon', 'Bhatia', 'Kapoor', 'Saxena', 'Pandey', 'Mishra', 'Trivedi', 'Bhatt', 'Nambiar', 'Ghosh'
];

// Customer segments
const segments = ['VIP', 'Regular', 'Occasional', 'New', 'Frequent Returner'];
const segmentWeights = [0.12, 0.45, 0.25, 0.12, 0.06];

// Return reasons & mappings
const returnReasons = [
  { reason: 'Size or Fit Issues', category: 'Fit & Sizing', baseWeight: 0.30 },
  { reason: 'Damaged Product', category: 'Defect & Damage', baseWeight: 0.22 },
  { reason: 'Quality Issues', category: 'Defect & Damage', baseWeight: 0.18 },
  { reason: 'Product Not as Described', category: 'Buyer Preference', baseWeight: 0.12 },
  { reason: 'Customer Changed Mind', category: 'Buyer Preference', baseWeight: 0.09 },
  { reason: 'Wrong Product Delivered', category: 'Fulfillment Error', baseWeight: 0.05 },
  { reason: 'Late Delivery', category: 'Fulfillment Error', baseWeight: 0.04 }
];

console.log('Generating datasets...');

// 1. GENERATE CUSTOMERS (1,200 unique customers)
const customers = [];
for (let i = 1; i <= 1200; i++) {
  const isFemale = random() < 0.65; // fashion & jewellery leans female
  const firstName = isFemale ? choice(firstNamesFemale) : choice(firstNamesMale);
  const lastName = choice(lastNames);
  const loc = choice(locations);
  const segment = weightedChoice(segments, segmentWeights);
  const ageGroup = weightedChoice(['18-24', '25-34', '35-44', '45-54', '55+'], [0.20, 0.42, 0.24, 0.10, 0.04]);
  
  customers.push({
    Customer_ID: `CUST-${pad(i, 4)}`,
    Customer_Name: `${firstName} ${lastName}`,
    Gender: isFemale ? 'Female' : 'Male',
    Age_Group: ageGroup,
    City: loc.city,
    State: loc.state,
    Customer_Segment: segment
  });
}

// 2. GENERATE PRODUCTS
const products = rawProducts.map(p => ({
  Product_ID: p.id,
  Product_Name: p.name,
  Product_Category: p.cat,
  Product_Price: p.price,
  Product_Cost: p.cost,
  Brand: p.brand,
  Supplier_Name: p.supplier
}));

// Map product id to obj for quick lookup
const productMap = {};
rawProducts.forEach(p => { productMap[p.id] = p; });

const customerMap = {};
customers.forEach(c => { customerMap[c.Customer_ID] = c; });

// 3. GENERATE ORDERS (approx 7,500 records across 2024)
const orders = [];
const returns = [];
const refunds = [];

let orderCount = 7600;
let returnCounter = 1;
let refundCounter = 1;

// Date range: 2024-01-01 to 2024-12-31
const startDate = new Date(2024, 0, 1).getTime();
const endDate = new Date(2024, 11, 31).getTime();

// Payment methods and sales channels
const paymentMethods = ['UPI', 'Credit Card', 'Debit Card', 'Cash on Delivery', 'Net Banking'];
const paymentWeights = [0.44, 0.25, 0.12, 0.14, 0.05];

const salesChannels = ['Mobile App', 'Website', 'Instagram Shop', 'Marketplaces'];
const channelWeights = [0.55, 0.32, 0.08, 0.05];

for (let i = 1; i <= orderCount; i++) {
  const orderId = `ORD-2024-${pad(i, 5)}`;
  const cust = choice(customers);
  const prd = choice(rawProducts);
  
  // Date with realistic seasonality (festivals in Oct-Nov have higher volume)
  let orderTime = startDate + random() * (endDate - startDate);
  const orderDateObj = new Date(orderTime);
  const month = orderDateObj.getMonth();
  // Boost volume in festive season (Oct-Dec)
  if ((month === 9 || month === 10 || month === 11) && random() < 0.25) {
    // Keep it, boost occurred naturally
  }
  const orderDateStr = formatDate(orderDateObj);

  // Quantity
  const qty = weightedChoice([1, 2, 3, 4], [0.80, 0.15, 0.03, 0.02]);
  const orderAmount = qty * prd.price;
  const paymentMethod = weightedChoice(paymentMethods, paymentWeights);
  const salesChannel = weightedChoice(salesChannels, channelWeights);

  // Customer location can match customer's city/state with slight chance of gifting to another city
  let city = cust.City;
  let state = cust.State;
  if (random() < 0.08) {
    const giftLoc = choice(locations);
    city = giftLoc.city;
    state = giftLoc.state;
  }

  orders.push({
    Order_ID: orderId,
    Order_Date: orderDateStr,
    Customer_ID: cust.Customer_ID,
    Product_ID: prd.id,
    Product_Category: prd.cat,
    Product_Name: prd.name,
    Quantity: qty,
    Unit_Price: prd.price,
    Order_Amount: orderAmount,
    Payment_Method: paymentMethod,
    Sales_Channel: salesChannel,
    City: city,
    State: state
  });

  // Calculate return probability based on:
  // - Category & product propensity
  // - Customer segment (Frequent returner has higher rate)
  // - Payment method (COD has higher return rate ~24%)
  let baseReturnRate = 0.15; // 15% overall average
  baseReturnRate *= prd.returnPropensity;

  if (paymentMethod === 'Cash on Delivery') baseReturnRate *= 1.35;
  if (cust.Customer_Segment === 'Frequent Returner') baseReturnRate *= 2.0;
  if (cust.Customer_Segment === 'VIP') baseReturnRate *= 0.75;
  if (prd.cat === 'Rings' || prd.cat === 'Bangles') baseReturnRate *= 1.25; // Fit issues

  const willReturn = random() < baseReturnRate;

  if (willReturn) {
    const returnId = `RET-2024-${pad(returnCounter++, 5)}`;
    
    // Return date: 2 to 14 days after order date
    const returnDaysDelay = randInt(2, 14);
    const returnDateObj = new Date(orderDateObj.getTime() + returnDaysDelay * 86400000);
    const returnDateStr = formatDate(returnDateObj);

    // Pick return reason based on category
    let reasons = [...returnReasons];
    if (prd.cat === 'Rings' || prd.cat === 'Bangles' || prd.cat === 'Necklaces') {
      // Increase size/fit weight
      reasons[0].baseWeight = 0.45;
    } else if (prd.cat === 'Watches' || prd.cat === 'Earrings') {
      // Increase damaged / defect weight
      reasons[1].baseWeight = 0.32;
      reasons[2].baseWeight = 0.28;
    }
    const chosenReasonObj = weightedChoice(reasons, reasons.map(r => r.baseWeight));

    // Returned quantity (usually full quantity, occasionally partial if qty > 1)
    let returnedQty = qty;
    if (qty > 1 && random() < 0.3) {
      returnedQty = randInt(1, qty - 1);
    }

    // Condition
    let condition = weightedChoice(
      ['Opened - Resellable', 'Damaged / Defective', 'Unopened', 'Missing Parts / Accessories'],
      [0.48, 0.26, 0.18, 0.08]
    );
    if (chosenReasonObj.reason === 'Damaged Product' || chosenReasonObj.reason === 'Quality Issues') {
      condition = 'Damaged / Defective';
    } else if (chosenReasonObj.reason === 'Customer Changed Mind') {
      condition = random() < 0.6 ? 'Unopened' : 'Opened - Resellable';
    }

    // Return Status
    // Recent returns in late December might be Pending or Processing
    let status = 'Approved';
    const isLateDec = returnDateObj.getMonth() === 11 && returnDateObj.getDate() > 20;
    
    if (isLateDec) {
      status = weightedChoice(['Pending', 'Processing', 'Approved'], [0.45, 0.35, 0.20]);
    } else {
      if (condition === 'Damaged / Defective' && chosenReasonObj.reason === 'Customer Changed Mind') {
        status = 'Rejected';
      } else {
        status = weightedChoice(['Approved', 'Rejected', 'Pending', 'Processing'], [0.82, 0.10, 0.04, 0.04]);
      }
    }

    returns.push({
      Return_ID: returnId,
      Order_ID: orderId,
      Return_Date: returnDateStr,
      Return_Reason: chosenReasonObj.reason,
      Return_Category: chosenReasonObj.category,
      Returned_Quantity: returnedQty,
      Product_Condition: condition,
      Return_Status: status
    });

    // 4. REFUNDS
    // If Return is Approved (or some Processing), generate Refund record
    if (status === 'Approved' || (status === 'Processing' && random() < 0.3)) {
      const refundId = `REF-2024-${pad(refundCounter++, 5)}`;
      const procDays = randInt(1, 9);
      const refundDateObj = new Date(returnDateObj.getTime() + procDays * 86400000);
      const refundDateStr = formatDate(refundDateObj);
      const refundAmount = returnedQty * prd.price;

      // Method
      let refundMethod = 'Original Payment Method';
      if (paymentMethod === 'Cash on Delivery') {
        refundMethod = weightedChoice(['UPI Direct', 'Bank Transfer', 'Store Credit / Wallet'], [0.55, 0.25, 0.20]);
      } else {
        refundMethod = weightedChoice(
          ['Original Payment Method', 'UPI Direct', 'Store Credit / Wallet'],
          [0.65, 0.25, 0.10]
        );
      }

      // Refund status
      let refundStatus = 'Completed';
      if (isLateDec || (status === 'Processing')) {
        refundStatus = weightedChoice(['Completed', 'Pending', 'Approved', 'Rejected'], [0.30, 0.50, 0.15, 0.05]);
      } else {
        refundStatus = weightedChoice(['Completed', 'Pending', 'Approved', 'Rejected'], [0.91, 0.04, 0.03, 0.02]);
      }

      refunds.push({
        Refund_ID: refundId,
        Order_ID: orderId,
        Refund_Date: refundDateStr,
        Refund_Amount: refundAmount,
        Refund_Method: refundMethod,
        Refund_Status: refundStatus,
        Processing_Days: procDays
      });
    }
  }
}

console.log(`Generated:`);
console.log(`- Orders: ${orders.length}`);
console.log(`- Returns: ${returns.length} (${((returns.length / orders.length) * 100).toFixed(2)}% return rate)`);
console.log(`- Refunds: ${refunds.length}`);
console.log(`- Products: ${products.length}`);
console.log(`- Customers: ${customers.length}`);

// Ensure directories exist
const csvDir = path.join(__dirname, '../data/csv');
const jsonDir = path.join(__dirname, '../src/data');
const publicDataDir = path.join(__dirname, '../public/data');

[csvDir, jsonDir, publicDataDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Helper to convert array of objects to CSV
function toCSV(arr) {
  if (arr.length === 0) return '';
  const headers = Object.keys(arr[0]);
  const rows = arr.map(obj => 
    headers.map(h => {
      let val = obj[h];
      if (val === undefined || val === null) val = '';
      val = String(val);
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

// Write files
const datasets = [
  { name: 'orders', data: orders },
  { name: 'returns', data: returns },
  { name: 'refunds', data: refunds },
  { name: 'products', data: products },
  { name: 'customers', data: customers }
];

datasets.forEach(({ name, data }) => {
  // Save JSON
  const jsonStr = JSON.stringify(data, null, 2);
  fs.writeFileSync(path.join(jsonDir, `${name}.json`), jsonStr);
  fs.writeFileSync(path.join(publicDataDir, `${name}.json`), jsonStr);

  // Save CSV
  const csvStr = toCSV(data);
  fs.writeFileSync(path.join(csvDir, `${name}.csv`), csvStr);
  fs.writeFileSync(path.join(publicDataDir, `${name}.csv`), csvStr);
});

console.log('Successfully saved all CSV and JSON datasets to:');
console.log(`- CSV: ${csvDir}`);
console.log(`- JSON (src): ${jsonDir}`);
console.log(`- Public Data: ${publicDataDir}`);
