import { createClient } from '@supabase/supabase-js';

// Load Supabase configuration safely
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = (): boolean => {
  return !!supabase;
};

// ----------------------------------------------------
// TRANSLATION MAPS (TypeScript camelCase <-> PostgreSQL snake_case)
// ----------------------------------------------------

export const mapProductionLogToDb = (log: any) => ({
  id: log.id,
  date: log.date,
  time: log.time,
  volume_liters: log.volumeLiters,
  quality_fat: log.qualityFat,
  shift: log.shift,
  species: log.species || 'All',
  notes: log.notes || ''
});

export const mapDbToProductionLog = (row: any) => ({
  id: row.id,
  date: row.date,
  time: row.time,
  volumeLiters: Number(row.volume_liters),
  qualityFat: Number(row.quality_fat),
  shift: row.shift,
  species: row.species,
  notes: row.notes
});

export const mapDispatchToDb = (dispatch: any) => ({
  id: dispatch.id,
  date: dispatch.date,
  milkman_id: dispatch.milkmanId,
  milkman_name: dispatch.milkmanName,
  volume_liters: dispatch.volumeLiters,
  rate_per_liter: dispatch.ratePerLiter,
  cash_collected: dispatch.cashCollected,
  status: dispatch.status,
  notes: dispatch.notes || ''
});

export const mapDbToDispatch = (row: any) => ({
  id: row.id,
  date: row.date,
  milkmanId: row.milkman_id,
  milkmanName: row.milkman_name,
  volumeLiters: Number(row.volume_liters),
  ratePerLiter: Number(row.rate_per_liter),
  cashCollected: Number(row.cash_collected),
  status: row.status,
  notes: row.notes
});

export const mapCustomerToDb = (customer: any) => ({
  id: customer.id,
  name: customer.name,
  phone: customer.phone,
  type: customer.type,
  ledger_balance: customer.ledgerBalance,
  overdue_amount: customer.overdueAmount,
  opening_balance: customer.openingBalance || 0
});

export const mapDbToCustomer = (row: any) => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  type: row.type,
  ledgerBalance: Number(row.ledger_balance),
  overdueAmount: Number(row.overdue_amount),
  openingBalance: Number(row.opening_balance)
});

export const mapSaleToDb = (sale: any) => ({
  id: sale.id,
  date: sale.date,
  time: sale.time,
  customer_name: sale.customerName,
  type: sale.type,
  volume_liters: sale.volumeLiters,
  rate_per_liter: sale.ratePerLiter,
  total_amount: sale.totalAmount,
  paid_amount: sale.paidAmount,
  bill_number: sale.billNumber || '',
  product_name: sale.productName || 'Whole Milk',
  driver_rent: sale.driverRent || 0,
  driver_name: sale.driverName || 'Self Pickup'
});

export const mapDbToSale = (row: any) => ({
  id: row.id,
  date: row.date,
  time: row.time,
  customerName: row.customer_name,
  type: row.type,
  volumeLiters: Number(row.volume_liters),
  ratePerLiter: Number(row.rate_per_liter),
  totalAmount: Number(row.total_amount),
  paidAmount: Number(row.paid_amount),
  billNumber: row.bill_number,
  productName: row.product_name,
  driverRent: Number(row.driver_rent),
  driverName: row.driver_name
});

export const mapCustomerPaymentToDb = (p: any) => ({
  id: p.id,
  customer_id: p.customerId || '',
  customer_name: p.customerName,
  date: p.date,
  time: p.time,
  amount_paid: p.amountPaid,
  payment_method: p.paymentMethod,
  notes: p.notes || ''
});

export const mapDbToCustomerPayment = (row: any) => ({
  id: row.id,
  customerId: row.customer_id,
  customerName: row.customer_name,
  date: row.date,
  time: row.time,
  amountPaid: Number(row.amount_paid),
  paymentMethod: row.payment_method,
  notes: row.notes
});

export const mapExpenseToDb = (e: any) => ({
  id: e.id,
  date: e.date,
  category: e.category,
  amount: e.amount,
  description: e.description
});

export const mapDbToExpense = (row: any) => ({
  id: row.id,
  date: row.date,
  category: row.category,
  amount: Number(row.amount),
  description: row.description
});

export const mapActivityToDb = (a: any) => ({
  id: a.id,
  timestamp: a.timestamp,
  category: a.category,
  title: a.title,
  description: a.description,
  amount: a.amount || null,
  type: a.type
});

export const mapDbToActivity = (row: any) => ({
  id: row.id,
  timestamp: row.timestamp,
  category: row.category,
  title: row.title,
  description: row.description,
  amount: row.amount ? Number(row.amount) : undefined,
  type: row.type
});

export const mapMilkmanToDb = (m: any) => ({
  id: m.id,
  name: m.name,
  phone: m.phone,
  status: m.status,
  assigned_liters: m.assignedLiters,
  cash_collected: m.cashCollected,
  outstanding_credit: m.outstandingCredit
});

export const mapDbToMilkman = (row: any) => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  status: row.status,
  assignedLiters: Number(row.assigned_liters),
  cashCollected: Number(row.cash_collected),
  outstandingCredit: Number(row.outstanding_credit)
});

export const mapMilkmanPaymentToDb = (p: any) => ({
  id: p.id,
  milkman_id: p.milkmanId,
  milkman_name: p.milkmanName,
  date: p.date,
  time: p.time,
  amount_paid: p.amountPaid,
  notes: p.notes || ''
});

export const mapDbToMilkmanPayment = (row: any) => ({
  id: row.id,
  milkmanId: row.milkman_id,
  milkmanName: row.milkman_name,
  date: row.date,
  time: row.time,
  amountPaid: Number(row.amount_paid),
  notes: row.notes
});

// ----------------------------------------------------
// DATABASE API SYNC OPERATIONS
// ----------------------------------------------------

export async function fetchSupabaseData() {
  if (!supabase) return null;

  try {
    const [
      { data: production },
      { data: dispatches },
      { data: customers },
      { data: sales },
      { data: customerPayments },
      { data: expenses },
      { data: activities },
      { data: milkmen },
      { data: milkmanPayments },
      { data: livestock }
    ] = await Promise.all([
      supabase.from('production_logs').select('*').order('date', { ascending: false }),
      supabase.from('dispatches').select('*').order('date', { ascending: false }),
      supabase.from('customers').select('*').order('name', { ascending: true }),
      supabase.from('sales').select('*').order('date', { ascending: false }),
      supabase.from('customer_payments').select('*').order('date', { ascending: false }),
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('activities').select('*').order('timestamp', { ascending: false }),
      supabase.from('milkmen').select('*').order('name', { ascending: true }),
      supabase.from('milkman_payments').select('*').order('date', { ascending: false }),
      supabase.from('livestock').select('*').eq('id', 'current').single()
    ]);

    return {
      productionLogs: production ? production.map(mapDbToProductionLog) : [],
      dispatches: dispatches ? dispatches.map(mapDbToDispatch) : [],
      customers: customers ? customers.map(mapDbToCustomer) : [],
      sales: sales ? sales.map(mapDbToSale) : [],
      customerPayments: customerPayments ? customerPayments.map(mapDbToCustomerPayment) : [],
      expenses: expenses ? expenses.map(mapDbToExpense) : [],
      activities: activities ? activities.map(mapDbToActivity) : [],
      milkmen: milkmen ? milkmen.map(mapDbToMilkman) : [],
      milkmanPayments: milkmanPayments ? milkmanPayments.map(mapDbToMilkmanPayment) : [],
      livestock: livestock ? { cows: livestock.cows, buffaloes: livestock.buffaloes, calves: livestock.calves } : null
    };
  } catch (err) {
    console.error('Error fetching data from Supabase:', err);
    return null;
  }
}

// Global batch upsert wrappers
export async function saveProductionLogs(logs: any[]) {
  if (!supabase) return;
  const dbRows = logs.map(mapProductionLogToDb);
  await supabase.from('production_logs').upsert(dbRows);
}

export async function saveDispatches(dispatches: any[]) {
  if (!supabase) return;
  const dbRows = dispatches.map(mapDispatchToDb);
  await supabase.from('dispatches').upsert(dbRows);
}

export async function saveCustomers(customers: any[]) {
  if (!supabase) return;
  const dbRows = customers.map(mapCustomerToDb);
  await supabase.from('customers').upsert(dbRows);
}

export async function saveSales(sales: any[]) {
  if (!supabase) return;
  const dbRows = sales.map(mapSaleToDb);
  await supabase.from('sales').upsert(dbRows);
}

export async function deleteSaleFromDb(saleId: string) {
  if (!supabase) return;
  await supabase.from('sales').delete().eq('id', saleId);
}

export async function saveCustomerPayments(payments: any[]) {
  if (!supabase) return;
  const dbRows = payments.map(mapCustomerPaymentToDb);
  await supabase.from('customer_payments').upsert(dbRows);
}

export async function saveExpenses(expenses: any[]) {
  if (!supabase) return;
  const dbRows = expenses.map(mapExpenseToDb);
  await supabase.from('expenses').upsert(dbRows);
}

export async function saveActivities(activities: any[]) {
  if (!supabase) return;
  const dbRows = activities.map(mapActivityToDb);
  await supabase.from('activities').upsert(dbRows);
}

export async function saveMilkmen(milkmen: any[]) {
  if (!supabase) return;
  const dbRows = milkmen.map(mapMilkmanToDb);
  await supabase.from('milkmen').upsert(dbRows);
}

export async function saveMilkmanPayments(payments: any[]) {
  if (!supabase) return;
  const dbRows = payments.map(mapMilkmanPaymentToDb);
  await supabase.from('milkman_payments').upsert(dbRows);
}

export async function saveLivestockCounts(cows: number, buffaloes: number, calves: number) {
  if (!supabase) return;
  await supabase.from('livestock').upsert({
    id: 'current',
    cows,
    buffaloes,
    calves,
    updated_at: new Date().toISOString()
  });
}
