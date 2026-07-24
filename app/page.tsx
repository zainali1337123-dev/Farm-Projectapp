'use client';

import React, { useState, useEffect } from 'react';
import { 
  Milk, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  UserCheck, 
  Users, 
  Truck, 
  PlusCircle, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  X, 
  ArrowUpRight, 
  ArrowDownRight, 
  Coins, 
  Layers,
  ChevronRight,
  Sparkles,
  RefreshCw,
  ArrowLeft,
  Printer,
  Download,
  Trash2,
  Receipt,
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  isSupabaseConfigured,
  fetchSupabaseData,
  saveProductionLogs,
  saveDispatches,
  saveCustomers,
  saveSales,
  deleteSaleFromDb,
  saveCustomerPayments,
  saveExpenses,
  saveActivities,
  saveMilkmen,
  saveMilkmanPayments,
  saveLivestockCounts
} from '../lib/supabase';

// Define Types for Danish Farm Management
interface ProductionLog {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  volumeLiters: number;
  qualityFat: number; // Fat percentage
  shift: 'Morning' | 'Evening';
  species?: 'All' | 'Cow' | 'Buffalo';
  notes?: string;
}

interface Dispatch {
  id: string;
  date: string;
  milkmanId: string;
  milkmanName: string;
  volumeLiters: number;
  ratePerLiter: number;
  cashCollected: number;
  status: 'Dispatched' | 'On Route' | 'Completed';
  notes?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  type: 'Cash' | 'Credit';
  ledgerBalance: number; // Positive means customer owes Danish Farm
  overdueAmount: number;
  openingBalance?: number; // Pre-existing ledger balance before system tracking
}

interface CustomerPayment {
  id: string;
  customerId?: string;
  customerName: string;
  date: string;
  time: string;
  amountPaid: number;
  paymentMethod: string;
  notes?: string;
}

interface Sale {
  id: string;
  date: string;
  time: string;
  customerName: string;
  type: 'Cash' | 'Credit';
  volumeLiters: number;
  ratePerLiter: number;
  totalAmount: number;
  paidAmount: number;
  // Extended fields for high-fidelity ledger
  billNumber?: string;
  productName?: string;
  driverRent?: number;
  driverName?: string;
}

interface Expense {
  id: string;
  date: string;
  category: 'Feed' | 'Veterinary' | 'Salaries' | 'Diesel/Fuel' | 'Utility' | 'Equipment' | 'Other';
  amount: number;
  description: string;
}

interface Activity {
  id: string;
  timestamp: string; // Full time string
  category: 'production' | 'dispatch' | 'sale' | 'expense' | 'payment';
  title: string;
  description: string;
  amount?: number;
  type: 'positive' | 'negative' | 'neutral';
}

interface Milkman {
  id: string;
  name: string;
  phone: string;
  status: 'Active' | 'On Route' | 'Completed' | 'Inactive';
  assignedLiters: number;
  cashCollected: number;
  outstandingCredit: number;
}

interface MilkmanPayment {
  id: string;
  milkmanId: string;
  milkmanName: string;
  date: string;
  time: string;
  amountPaid: number;
  notes?: string;
}

// Initial Mock Seed Data
const INITIAL_MILKMEN: Milkman[] = [
  { id: 'm-1', name: 'Bashir Ahmad', phone: '0300-1234567', status: 'On Route', assignedLiters: 120, cashCollected: 16000, outstandingCredit: 8000 },
  { id: 'm-2', name: 'Muhammad Irfan', phone: '0301-7654321', status: 'On Route', assignedLiters: 150, cashCollected: 22000, outstandingCredit: 8000 },
  { id: 'm-3', name: 'Sajid Ali', phone: '0312-9876543', status: 'Completed', assignedLiters: 100, cashCollected: 20000, outstandingCredit: 0 },
  { id: 'm-4', name: 'Tariq Mahmood', phone: '0345-4567890', status: 'Active', assignedLiters: 80, cashCollected: 10000, outstandingCredit: 6000 }
];

const INITIAL_MILKMAN_PAYMENTS: MilkmanPayment[] = [
  { id: 'mp-1', milkmanId: 'm-1', milkmanName: 'Bashir Ahmad', date: '2026-07-15', time: '12:00', amountPaid: 4000, notes: 'Settle partial credit' }
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c-1', name: 'Faisalabad Sweets & Bakers', phone: '0321-1112223', type: 'Credit', ledgerBalance: 45000, overdueAmount: 15000, openingBalance: 25000 },
  { id: 'c-2', name: 'Bilal Dairy Shop', phone: '0300-4445556', type: 'Credit', ledgerBalance: 28000, overdueAmount: 8000, openingBalance: 8000 },
  { id: 'c-3', name: 'Gourmet Bakery', phone: '0333-7778889', type: 'Credit', ledgerBalance: 62000, overdueAmount: 20000, openingBalance: 42000 },
  { id: 'c-4', name: 'Amjad Ali (House 14)', phone: '0315-9990001', type: 'Cash', ledgerBalance: 0, overdueAmount: 0, openingBalance: 0 },
  { id: 'c-5', name: 'Kamran Khan (House 89)', phone: '0322-8884442', type: 'Cash', ledgerBalance: 0, overdueAmount: 0, openingBalance: 0 },
  { id: 'c-6', name: 'Zaheer Abbas', phone: '0304-3331112', type: 'Credit', ledgerBalance: 12000, overdueAmount: 0, openingBalance: 12000 }
];

const INITIAL_PRODUCTION_LOGS: ProductionLog[] = [
  { id: 'p-1', date: '2026-07-16', time: '06:30', volumeLiters: 320, qualityFat: 4.2, shift: 'Morning', notes: 'Optimal cooler storage temperature maintained' },
  { id: 'p-2', date: '2026-07-16', time: '16:30', volumeLiters: 240, qualityFat: 4.4, shift: 'Evening', notes: 'Warm afternoon, fans active in barn' },
  { id: 'p-3', date: '2026-07-15', time: '06:15', volumeLiters: 310, qualityFat: 4.1, shift: 'Morning', notes: 'Routine morning shift' },
  { id: 'p-4', date: '2026-07-15', time: '16:45', volumeLiters: 235, qualityFat: 4.3, shift: 'Evening', notes: 'No power breakdown today' }
];

const INITIAL_SALES: Sale[] = [
  { id: 's-1', date: '2026-07-16', time: '08:15', customerName: 'Faisalabad Sweets & Bakers', type: 'Credit', volumeLiters: 150, ratePerLiter: 200, totalAmount: 30500, paidAmount: 500, billNumber: 'B-1004', productName: 'Whole Milk', driverRent: 500, driverName: 'Bashir Ahmad' },
  { id: 's-2', date: '2026-07-16', time: '09:00', customerName: 'Bilal Dairy Shop', type: 'Credit', volumeLiters: 100, ratePerLiter: 200, totalAmount: 20300, paidAmount: 300, billNumber: 'B-1003', productName: 'Buffalo Milk', driverRent: 300, driverName: 'Muhammad Irfan' },
  { id: 's-3', date: '2026-07-16', time: '11:30', customerName: 'Amjad Ali (House 14)', type: 'Cash', volumeLiters: 10, ratePerLiter: 220, totalAmount: 2200, paidAmount: 2200, billNumber: 'B-1002', productName: 'Cow Milk', driverRent: 0, driverName: 'Self Pickup' },
  { id: 's-4', date: '2026-07-16', time: '12:00', customerName: 'Kamran Khan (House 89)', type: 'Cash', volumeLiters: 5, ratePerLiter: 220, totalAmount: 1100, paidAmount: 1100, billNumber: 'B-1001', productName: 'Whole Milk', driverRent: 0, driverName: 'Self Pickup' },
  { id: 's-5', date: '2026-07-15', time: '08:30', customerName: 'Gourmet Bakery', type: 'Credit', volumeLiters: 200, ratePerLiter: 200, totalAmount: 41000, paidAmount: 11000, billNumber: 'B-1000', productName: 'Whole Milk', driverRent: 1000, driverName: 'Sajid Ali' },
  { id: 's-6', date: '2026-07-12', time: '08:00', customerName: 'Faisalabad Sweets & Bakers', type: 'Credit', volumeLiters: 100, ratePerLiter: 200, totalAmount: 20500, paidAmount: 10000, billNumber: 'B-0998', productName: 'Whole Milk', driverRent: 500, driverName: 'Bashir Ahmad' }
];

const INITIAL_PAYMENTS: CustomerPayment[] = [
  { id: 'pay-1', customerName: 'Faisalabad Sweets & Bakers', date: '2026-07-14', time: '14:30', amountPaid: 20500, paymentMethod: 'Cash', notes: 'Received by Cashier at Farm' },
  { id: 'pay-2', customerName: 'Gourmet Bakery', date: '2026-07-15', time: '18:00', amountPaid: 10000, paymentMethod: 'Cash', notes: 'Settle partial invoice' }
];

const INITIAL_EXPENSES: Expense[] = [
  { id: 'e-1', date: '2026-07-16', category: 'Feed', amount: 14000, description: 'Premium alfalfa hay and compound feed bags' },
  { id: 'e-2', date: '2026-07-16', category: 'Veterinary', amount: 3500, description: 'Periodic vaccination & deworming for 12 heifers' },
  { id: 'e-3', date: '2026-07-16', category: 'Diesel/Fuel', amount: 2200, description: 'Diesel for generator backup during load shedding' },
  { id: 'e-4', date: '2026-07-15', category: 'Salaries', amount: 25000, description: 'Weekly wages for farm workers' }
];

const INITIAL_DISPATCHES: Dispatch[] = [
  { id: 'd-1', date: '2026-07-16', milkmanId: 'm-1', milkmanName: 'Bashir Ahmad', volumeLiters: 120, ratePerLiter: 200, cashCollected: 16000, status: 'On Route', notes: 'G-11 & G-12 sectors' },
  { id: 'd-2', date: '2026-07-16', milkmanId: 'm-2', milkmanName: 'Muhammad Irfan', volumeLiters: 150, ratePerLiter: 200, cashCollected: 22000, status: 'On Route', notes: 'F-10 area delivery' },
  { id: 'd-3', date: '2026-07-16', milkmanId: 'm-3', milkmanName: 'Sajid Ali', volumeLiters: 100, ratePerLiter: 200, cashCollected: 20000, status: 'Completed', notes: 'I-8 & I-9 sectors complete' }
];

const INITIAL_ACTIVITIES: Activity[] = [
  { id: 'a-1', timestamp: '2026-07-16 16:30', category: 'production', title: 'Evening Production Logged', description: '240 Liters harvested (Fat: 4.4%)', amount: 240, type: 'neutral' },
  { id: 'a-2', timestamp: '2026-07-16 14:00', category: 'expense', title: 'Generator Fuel Logged', description: 'Diesel expense added: PKR 2,200', amount: 2200, type: 'negative' },
  { id: 'a-3', timestamp: '2026-07-16 11:30', category: 'sale', title: 'Cash Sale Recorded', description: 'Amjad Ali purchased 10L: PKR 22,000', amount: 22000, type: 'positive' },
  { id: 'a-4', timestamp: '2026-07-16 10:00', category: 'expense', title: 'Cattle Feed Purchased', description: 'Feed expense added: PKR 14,000', amount: 14000, type: 'negative' },
  { id: 'a-5', timestamp: '2026-07-16 08:15', category: 'sale', title: 'Credit Sale Logged', description: 'Faisalabad Sweets 150L: PKR 30,000 credit', amount: 30000, type: 'positive' },
  { id: 'a-6', timestamp: '2026-07-16 07:00', category: 'dispatch', title: 'Milkman Dispatch Active', description: 'Bashir Ahmad assigned 120 Liters', amount: 120, type: 'neutral' },
  { id: 'a-7', timestamp: '2026-07-16 06:30', category: 'production', title: 'Morning Production Logged', description: '320 Liters harvested (Fat: 4.2%)', amount: 320, type: 'neutral' },
  { id: 'a-8', timestamp: '2026-07-15 18:00', category: 'payment', title: 'Customer Credit Paid', description: 'Gourmet Bakery paid PKR 10,000 towards ledger', amount: 10000, type: 'positive' }
];

// Last 7 days production data for trend visualizer
const WEEKLY_PRODUCTION_DATA = [
  { day: 'Fri', liters: 520, sales: 490 },
  { day: 'Sat', liters: 540, sales: 510 },
  { day: 'Sun', liters: 535, sales: 520 },
  { day: 'Mon', liters: 550, sales: 540 },
  { day: 'Tue', liters: 545, sales: 530 },
  { day: 'Wed', liters: 545, sales: 525 },
  { day: 'Thu', liters: 560, sales: 555 } // Today
];

export default function Dashboard() {
  // Safe Client state hook initialization
  const [mounted, setMounted] = useState(false);
  
  // Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // App States
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>([]);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [milkmen, setMilkmen] = useState<Milkman[]>([]);

  // Selected Customer Ledger Details
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  
  // Selected Milkman Ledger Details
  const [selectedMilkmanId, setSelectedMilkmanId] = useState<string>('');
  const [milkmanPayments, setMilkmanPayments] = useState<MilkmanPayment[]>([]);

  // Animal Inventory Counts
  const [cowCount, setCowCount] = useState<number>(45);
  const [buffaloCount, setBuffaloCount] = useState<number>(32);
  const [calfCount, setCalfCount] = useState<number>(18);

  // Edit fields for Animal Inventory
  const [editCows, setEditCows] = useState('');
  const [editBuffalo, setEditBuffalo] = useState('');
  const [editCalf, setEditCalf] = useState('');

  // Active Action Modals
  const [activeModal, setActiveModal] = useState<'production' | 'dispatch' | 'sale' | 'expense' | 'payment' | 'milkman_reconcile' | 'animals' | 'milkman_payment' | 'customer' | null>(null);
  
  // Selected Customer or Milkman for payments
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [reconcileMilkmanId, setReconcileMilkmanId] = useState<string>('');
  const [reconcileCash, setReconcileCash] = useState<string>('');
  const [reconcileCredit, setReconcileCredit] = useState<string>('');

  // Search & Filter state for activity feed
  const [activitySearch, setActivitySearch] = useState('');
  const [activityFilter, setActivityFilter] = useState<'all' | 'production' | 'dispatch' | 'sale' | 'expense'>('all');
  
  // Active section tab for layout
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'milkmen' | 'customers' | 'production' | 'sales'>('overview');

  // Species filter for Average Milk per Animal KPI card
  const [avgAnimalFilter, setAvgAnimalFilter] = useState<'All' | 'Cow' | 'Buffalo'>('All');

  // Search state for Today's Sales
  const [salesSearch, setSalesSearch] = useState('');
  const [selectedSalesDate, setSelectedSalesDate] = useState('2026-07-16');
  const [selectedExpenseDate, setSelectedExpenseDate] = useState('2026-07-16');

  // Success Toast message
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form Inputs
  const [prodLiters, setProdLiters] = useState('');
  const [prodFat, setProdFat] = useState('4.2');
  const [prodShift, setProdShift] = useState<'Morning' | 'Evening'>('Morning');
  const [prodSpecies, setProdSpecies] = useState<'All' | 'Cow' | 'Buffalo'>('All');
  const [prodNotes, setProdNotes] = useState('');

  const [dispMilkmanId, setDispMilkmanId] = useState('');
  const [dispLiters, setDispLiters] = useState('');
  const [dispRate, setDispRate] = useState('200');
  const [dispNotes, setDispNotes] = useState('');

  const [saleCustName, setSaleCustName] = useState('');
  const [saleType, setSaleType] = useState<'Cash' | 'Credit'>('Cash');
  const [saleLiters, setSaleLiters] = useState('');
  const [saleRate, setSaleRate] = useState('200');
  const [saleAmountPaid, setSaleAmountPaid] = useState('');

  // Extended Sale Inputs for high-fidelity ledger
  const [saleBillNumber, setSaleBillNumber] = useState('');
  const [saleProduct, setSaleProduct] = useState('Whole Milk');
  const [saleDriverRent, setSaleDriverRent] = useState('');
  const [saleDriverName, setSaleDriverName] = useState('');

  const [expCategory, setExpCategory] = useState<Expense['category']>('Feed');
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');

  // Customer Form States
  const [editingCustomerId, setEditingCustomerId] = useState<string>('');
  const [custFormName, setCustFormName] = useState<string>('');
  const [custFormPhone, setCustFormPhone] = useState<string>('');
  const [custFormType, setCustFormType] = useState<'Cash' | 'Credit'>('Credit');
  const [custFormOpeningBalance, setCustFormOpeningBalance] = useState<string>('0');

  // Load state from local storage or Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      let loadedProd = null;
      let loadedDisp = null;
      let loadedCust = null;
      let loadedSales = null;
      let loadedPayments = null;
      let loadedExp = null;
      let loadedAct = null;
      let loadedMilk = null;
      let loadedMilkPayments = null;
      let loadedCows = null;
      let loadedBuffaloes = null;
      let loadedCalves = null;

      // Try fetching from Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          const dbData = await fetchSupabaseData();
          if (dbData) {
            loadedProd = dbData.productionLogs;
            loadedDisp = dbData.dispatches;
            loadedCust = dbData.customers;
            loadedSales = dbData.sales;
            loadedPayments = dbData.customerPayments;
            loadedExp = dbData.expenses;
            loadedAct = dbData.activities;
            loadedMilk = dbData.milkmen;
            loadedMilkPayments = dbData.milkmanPayments;
            if (dbData.livestock) {
              loadedCows = dbData.livestock.cows;
              loadedBuffaloes = dbData.livestock.buffaloes;
              loadedCalves = dbData.livestock.calves;
            }
            console.log("Successfully loaded state from Supabase!");
          }
        } catch (err) {
          console.error("Failed to load state from Supabase, using local state instead:", err);
        }
      }

      const localProd = localStorage.getItem('df_production');
      const localDisp = localStorage.getItem('df_dispatches');
      const localCust = localStorage.getItem('df_customers');
      const localSales = localStorage.getItem('df_sales');
      const localPayments = localStorage.getItem('df_payments');
      const localExp = localStorage.getItem('df_expenses');
      const localAct = localStorage.getItem('df_activities');
      const localMilk = localStorage.getItem('df_milkmen');
      const localMilkPayments = localStorage.getItem('df_milkman_payments');
      const localCows = localStorage.getItem('df_cows');
      const localBuffaloes = localStorage.getItem('df_buffaloes');
      const localCalves = localStorage.getItem('df_calves');
      const localAuth = localStorage.getItem('df_authenticated');

      setProductionLogs(loadedProd !== null ? loadedProd : (localProd ? JSON.parse(localProd) : INITIAL_PRODUCTION_LOGS));
      setDispatches(loadedDisp !== null ? loadedDisp : (localDisp ? JSON.parse(localDisp) : INITIAL_DISPATCHES));
      setCustomers(loadedCust !== null ? loadedCust : (localCust ? JSON.parse(localCust) : INITIAL_CUSTOMERS));
      setSales(loadedSales !== null ? loadedSales : (localSales ? JSON.parse(localSales) : INITIAL_SALES));
      setCustomerPayments(loadedPayments !== null ? loadedPayments : (localPayments ? JSON.parse(localPayments) : INITIAL_PAYMENTS));
      setExpenses(loadedExp !== null ? loadedExp : (localExp ? JSON.parse(localExp) : INITIAL_EXPENSES));
      setActivities(loadedAct !== null ? loadedAct : (localAct ? JSON.parse(localAct) : INITIAL_ACTIVITIES));
      setMilkmen(loadedMilk !== null ? loadedMilk : (localMilk ? JSON.parse(localMilk) : INITIAL_MILKMEN));
      setMilkmanPayments(loadedMilkPayments !== null ? loadedMilkPayments : (localMilkPayments ? JSON.parse(localMilkPayments) : INITIAL_MILKMAN_PAYMENTS));
      
      setCowCount(loadedCows !== null ? loadedCows : (localCows ? Number(localCows) : 45));
      setBuffaloCount(loadedBuffaloes !== null ? loadedBuffaloes : (localBuffaloes ? Number(localBuffaloes) : 32));
      setCalfCount(loadedCalves !== null ? loadedCalves : (localCalves ? Number(localCalves) : 18));
      setIsAuthenticated(localAuth === 'true');

      setMounted(true);
    };

    loadData();
  }, []);

  // Save to local storage and Supabase helper
  const saveState = (
    updatedProd?: ProductionLog[], 
    updatedDisp?: Dispatch[], 
    updatedCust?: Customer[], 
    updatedSales?: Sale[], 
    updatedExp?: Expense[], 
    updatedAct?: Activity[],
    updatedMilk?: Milkman[],
    updatedPayments?: CustomerPayment[],
    updatedMilkmanPayments?: MilkmanPayment[]
  ) => {
    if (updatedProd) {
      setProductionLogs(updatedProd);
      localStorage.setItem('df_production', JSON.stringify(updatedProd));
      if (isSupabaseConfigured()) {
        saveProductionLogs(updatedProd).catch(e => console.error("Supabase Sync Error:", e));
      }
    }
    if (updatedDisp) {
      setDispatches(updatedDisp);
      localStorage.setItem('df_dispatches', JSON.stringify(updatedDisp));
      if (isSupabaseConfigured()) {
        saveDispatches(updatedDisp).catch(e => console.error("Supabase Sync Error:", e));
      }
    }
    if (updatedCust) {
      setCustomers(updatedCust);
      localStorage.setItem('df_customers', JSON.stringify(updatedCust));
      if (isSupabaseConfigured()) {
        saveCustomers(updatedCust).catch(e => console.error("Supabase Sync Error:", e));
      }
    }
    if (updatedSales) {
      setSales(updatedSales);
      localStorage.setItem('df_sales', JSON.stringify(updatedSales));
      if (isSupabaseConfigured()) {
        saveSales(updatedSales).catch(e => console.error("Supabase Sync Error:", e));
      }
    }
    if (updatedPayments) {
      setCustomerPayments(updatedPayments);
      localStorage.setItem('df_payments', JSON.stringify(updatedPayments));
      if (isSupabaseConfigured()) {
        saveCustomerPayments(updatedPayments).catch(e => console.error("Supabase Sync Error:", e));
      }
    }
    if (updatedExp) {
      setExpenses(updatedExp);
      localStorage.setItem('df_expenses', JSON.stringify(updatedExp));
      if (isSupabaseConfigured()) {
        saveExpenses(updatedExp).catch(e => console.error("Supabase Sync Error:", e));
      }
    }
    if (updatedAct) {
      setActivities(updatedAct);
      localStorage.setItem('df_activities', JSON.stringify(updatedAct));
      if (isSupabaseConfigured()) {
        saveActivities(updatedAct).catch(e => console.error("Supabase Sync Error:", e));
      }
    }
    if (updatedMilk) {
      setMilkmen(updatedMilk);
      localStorage.setItem('df_milkmen', JSON.stringify(updatedMilk));
      if (isSupabaseConfigured()) {
        saveMilkmen(updatedMilk).catch(e => console.error("Supabase Sync Error:", e));
      }
    }
    if (updatedMilkmanPayments) {
      setMilkmanPayments(updatedMilkmanPayments);
      localStorage.setItem('df_milkman_payments', JSON.stringify(updatedMilkmanPayments));
      if (isSupabaseConfigured()) {
        saveMilkmanPayments(updatedMilkmanPayments).catch(e => console.error("Supabase Sync Error:", e));
      }
    }
  };

  const updateAnimals = (cows: number, buffaloes: number, calves: number) => {
    setCowCount(cows);
    setBuffaloCount(buffaloes);
    setCalfCount(calves);
    localStorage.setItem('df_cows', cows.toString());
    localStorage.setItem('df_buffaloes', buffaloes.toString());
    localStorage.setItem('df_calves', calves.toString());
    if (isSupabaseConfigured()) {
      saveLivestockCounts(cows, buffaloes, calves).catch(e => console.error("Supabase Sync Error:", e));
    }
  };

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Reset helper helper
  const resetAppToDefault = () => {
    if (window.confirm("Are you sure you want to restore the Danish Farm Dashboard to its original seed data? This will overwrite your local changes.")) {
      localStorage.clear();
      setProductionLogs(INITIAL_PRODUCTION_LOGS);
      setDispatches(INITIAL_DISPATCHES);
      setCustomers(INITIAL_CUSTOMERS);
      setSales(INITIAL_SALES);
      setCustomerPayments(INITIAL_PAYMENTS);
      setExpenses(INITIAL_EXPENSES);
      setActivities(INITIAL_ACTIVITIES);
      setMilkmen(INITIAL_MILKMEN);
      setMilkmanPayments(INITIAL_MILKMAN_PAYMENTS);
      setCowCount(45);
      setBuffaloCount(32);
      setCalfCount(18);
      setSelectedCustomerId('');
      setSelectedMilkmanId('');
      showToastMessage("Danish Farm Dashboard restored to original seed data!");
    }
  };

  // ----------------------------------------------------
  // METRICS COMPUTATIONS (Calculated Dynamically from State)
  // ----------------------------------------------------
  const todayStr = '2026-07-16';
  const yesterdayStr = '2026-07-15';

  // 1. Total Milk Production (Today)
  const todayProduction = productionLogs
    .filter(log => log.date === todayStr)
    .reduce((sum, log) => sum + log.volumeLiters, 0);

  const yesterdayProduction = productionLogs
    .filter(log => log.date === yesterdayStr)
    .reduce((sum, log) => sum + log.volumeLiters, 0);

  const productionTrendPercent = yesterdayProduction > 0 
    ? Math.round(((todayProduction - yesterdayProduction) / yesterdayProduction) * 100) 
    : 0;

  // 1b. Average Milk per Animal (Cows + Buffaloes)
  const totalAnimals = cowCount + buffaloCount;
  
  // Get volume harvested specifically by species today
  const todayCowVolume = productionLogs
    .filter(log => log.date === todayStr && log.species === 'Cow')
    .reduce((sum, log) => sum + log.volumeLiters, 0);

  const todayBuffaloVolume = productionLogs
    .filter(log => log.date === todayStr && log.species === 'Buffalo')
    .reduce((sum, log) => sum + log.volumeLiters, 0);

  const todayMixedVolume = productionLogs
    .filter(log => log.date === todayStr && (log.species === 'All' || !log.species))
    .reduce((sum, log) => sum + log.volumeLiters, 0);

  // Proportional share logic for mixed logs or seed data
  const cowProportion = totalAnimals > 0 ? cowCount / totalAnimals : 0;
  const buffaloProportion = totalAnimals > 0 ? buffaloCount / totalAnimals : 0;

  const totalCowMilkToday = todayCowVolume + (todayMixedVolume * cowProportion);
  const totalBuffaloMilkToday = todayBuffaloVolume + (todayMixedVolume * buffaloProportion);

  const avgMilkPerAnimal = totalAnimals > 0 ? (todayProduction / totalAnimals) : 0;
  const avgMilkPerCow = cowCount > 0 ? (totalCowMilkToday / cowCount) : 0;
  const avgMilkPerBuffalo = buffaloCount > 0 ? (totalBuffaloMilkToday / buffaloCount) : 0;

  // 2. Total Revenue (Today & Month)
  const todaySalesRevenue = sales
    .filter(sale => sale.date === todayStr)
    .reduce((sum, sale) => sum + sale.totalAmount, 0);

  // Month starts with 2026-07
  const monthSalesRevenue = sales
    .filter(sale => sale.date.startsWith('2026-07'))
    .reduce((sum, sale) => sum + sale.totalAmount, 0);

  // 3. Total Expenses (Today & Month)
  const todayExpensesAmount = expenses
    .filter(exp => exp.date === todayStr)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const monthExpensesAmount = expenses
    .filter(exp => exp.date.startsWith('2026-07'))
    .reduce((sum, exp) => sum + exp.amount, 0);

  // 4. Net Profit / Margin
  const todayNetProfit = todaySalesRevenue - todayExpensesAmount;
  const monthNetProfit = monthSalesRevenue - monthExpensesAmount;
  const monthProfitMargin = monthSalesRevenue > 0 
    ? Math.round((monthNetProfit / monthSalesRevenue) * 100) 
    : 0;

  // 5. Outstanding Credits (Owed to Farm)
  const outstandingCustomerCredit = customers.reduce((sum, c) => sum + c.ledgerBalance, 0);
  const outstandingMilkmanCredit = milkmen.reduce((sum, m) => sum + m.outstandingCredit, 0);
  const totalOutstandingCredit = outstandingCustomerCredit + outstandingMilkmanCredit;

  // 6. Cash Customers Stats
  const todayCashSales = sales.filter(sale => sale.date === todayStr && sale.type === 'Cash');
  const todayCashSalesLiters = todayCashSales.reduce((sum, s) => sum + s.volumeLiters, 0);
  const todayCashSalesRevenue = todayCashSales.reduce((sum, s) => sum + s.totalAmount, 0);

  // 7. Dispatched volume Today
  const todayDispatchedVolume = dispatches
    .filter(d => d.date === todayStr)
    .reduce((sum, d) => sum + d.volumeLiters, 0);

  // ----------------------------------------------------
  // ACTION HANDLERS
  // ----------------------------------------------------
  
  // Submit Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword;

    if (!email) {
      setLoginError('Email address is required.');
      return;
    }
    if (!password) {
      setLoginError('Password is required.');
      return;
    }

    // Accept both admin@danishfarm.com and your@email.com with password 'admin' (or simple password)
    if ((email === 'admin@danishfarm.com' || email === 'your@email.com') && password === 'admin') {
      setIsAuthenticated(true);
      localStorage.setItem('df_authenticated', 'true');
      showToastMessage('Logged in successfully!');
    } else {
      setLoginError('Invalid email address or password.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('df_authenticated');
    setLoginEmail('');
    setLoginPassword('');
    showToastMessage('Logged out successfully.');
  };

  // Submit Production
  const handleAddProduction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodLiters || isNaN(Number(prodLiters)) || Number(prodLiters) <= 0) {
      showToastMessage('Please enter a valid milk volume.', 'error');
      return;
    }

    const volume = Number(prodLiters);
    const fat = Number(prodFat);
    
    const newLog: ProductionLog = {
      id: `p-${Date.now()}`,
      date: todayStr,
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      volumeLiters: volume,
      qualityFat: fat,
      shift: prodShift,
      species: prodSpecies,
      notes: prodNotes || 'Logged on Dashboard'
    };

    const newActivity: Activity = {
      id: `a-${Date.now()}`,
      timestamp: `${todayStr} ${newLog.time}`,
      category: 'production',
      title: `${prodShift} Shift Production Logged`,
      description: `${volume}L harvested with ${fat}% fat ratio (${prodSpecies === 'All' ? 'Mixed' : prodSpecies})`,
      amount: volume,
      type: 'neutral'
    };

    saveState(
      [newLog, ...productionLogs],
      undefined,
      undefined,
      undefined,
      undefined,
      [newActivity, ...activities],
      undefined
    );

    setProdLiters('');
    setProdSpecies('All');
    setProdNotes('');
    setActiveModal(null);
    showToastMessage(`Successfully recorded ${volume}L production!`);
  };

  // Submit Dispatch to Milkman
  const handleAddDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispMilkmanId) {
      showToastMessage('Please select a distributor milkman.', 'error');
      return;
    }
    if (!dispLiters || isNaN(Number(dispLiters)) || Number(dispLiters) <= 0) {
      showToastMessage('Please enter a valid milk volume to dispatch.', 'error');
      return;
    }

    const selectedMilkman = milkmen.find(m => m.id === dispMilkmanId);
    if (!selectedMilkman) return;

    const liters = Number(dispLiters);
    const rate = Number(dispRate);
    const cost = liters * rate;

    // Create dispatch
    const newDispatch: Dispatch = {
      id: `d-${Date.now()}`,
      date: todayStr,
      milkmanId: dispMilkmanId,
      milkmanName: selectedMilkman.name,
      volumeLiters: liters,
      ratePerLiter: rate,
      cashCollected: 0,
      status: 'On Route',
      notes: dispNotes || 'Route Dispatch'
    };

    // Update Milkman status & stats
    const updatedMilkmen = milkmen.map(m => {
      if (m.id === dispMilkmanId) {
        return {
          ...m,
          status: 'On Route' as const,
          assignedLiters: m.assignedLiters + liters,
          outstandingCredit: m.outstandingCredit + cost
        };
      }
      return m;
    });

    const newActivity: Activity = {
      id: `a-${Date.now()}`,
      timestamp: `${todayStr} ${new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}`,
      category: 'dispatch',
      title: `Route Dispatch: ${selectedMilkman.name}`,
      description: `Assigned ${liters}L milk at PKR ${rate}/L (Outstanding: PKR ${cost.toLocaleString()})`,
      amount: liters,
      type: 'neutral'
    };

    saveState(
      undefined,
      [newDispatch, ...dispatches],
      undefined,
      undefined,
      undefined,
      [newActivity, ...activities],
      updatedMilkmen
    );

    setDispLiters('');
    setDispNotes('');
    setActiveModal(null);
    showToastMessage(`Dispatched ${liters}L milk to ${selectedMilkman.name}!`);
  };

  // Submit Sale (Cash / Credit)
  const handleAddSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleCustName.trim()) {
      showToastMessage('Please enter or select a customer name.', 'error');
      return;
    }
    if (!saleLiters || isNaN(Number(saleLiters)) || Number(saleLiters) <= 0) {
      showToastMessage('Please enter a valid volume.', 'error');
      return;
    }

    const liters = Number(saleLiters);
    const rate = Number(saleRate);
    const rent = Number(saleDriverRent) || 0;
    const totalAmount = liters * rate + rent;
    const paidAmount = saleType === 'Cash' ? totalAmount : (Number(saleAmountPaid) || 0);
    const creditOwed = totalAmount - paidAmount;
    const billNo = saleBillNumber.trim() || `B-${1000 + sales.length + 1}`;
    const prodName = saleProduct;
    const driver = saleDriverName.trim() || 'Self Pickup';

    // Log the sale
    const newSale: Sale = {
      id: `s-${Date.now()}`,
      date: todayStr,
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      customerName: saleCustName.trim(),
      type: saleType,
      volumeLiters: liters,
      ratePerLiter: rate,
      totalAmount,
      paidAmount,
      billNumber: billNo,
      productName: prodName,
      driverRent: rent,
      driverName: driver
    };

    // Update customer lists if it's credit or existing customer
    let updatedCust = [...customers];
    const existingCust = customers.find(c => c.name.toLowerCase() === saleCustName.trim().toLowerCase());

    if (existingCust) {
      updatedCust = customers.map(c => {
        if (c.id === existingCust.id) {
          return {
            ...c,
            ledgerBalance: c.ledgerBalance + creditOwed,
            overdueAmount: creditOwed > 0 ? c.overdueAmount + (creditOwed * 0.3) : c.overdueAmount // simulate slight overdue contribution
          };
        }
        return c;
      });
    } else if (saleType === 'Credit') {
      // Create new credit customer profile automatically
      const newCust: Customer = {
        id: `c-${Date.now()}`,
        name: saleCustName.trim(),
        phone: '0300-0000000',
        type: 'Credit',
        ledgerBalance: creditOwed,
        overdueAmount: 0
      };
      updatedCust.push(newCust);
    }

    const newActivity: Activity = {
      id: `a-${Date.now()}`,
      timestamp: `${todayStr} ${newSale.time}`,
      category: 'sale',
      title: `${saleType} Sale logged (Bill #${billNo})`,
      description: `${saleCustName} bought ${liters}L ${prodName} via ${driver}. Total: PKR ${totalAmount.toLocaleString()} (${paidAmount > 0 ? `Paid PKR ${paidAmount.toLocaleString()}` : 'Unpaid'})`,
      amount: totalAmount,
      type: 'positive'
    };

    saveState(
      undefined,
      undefined,
      updatedCust,
      [newSale, ...sales],
      undefined,
      [newActivity, ...activities],
      undefined
    );

    setSaleCustName('');
    setSaleLiters('');
    setSaleAmountPaid('');
    setSaleBillNumber('');
    setSaleProduct('Whole Milk');
    setSaleDriverRent('');
    setSaleDriverName('');
    setActiveModal(null);
    showToastMessage(`Logged ${saleType} Sale (Bill #${billNo}) for ${liters}L successfully!`);
  };

  // Submit Expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount || isNaN(Number(expAmount)) || Number(expAmount) <= 0) {
      showToastMessage('Please enter a valid expense amount.', 'error');
      return;
    }
    if (!expDesc.trim()) {
      showToastMessage('Please write a short description of the expense.', 'error');
      return;
    }

    const amount = Number(expAmount);

    const newExpense: Expense = {
      id: `e-${Date.now()}`,
      date: todayStr,
      category: expCategory,
      amount,
      description: expDesc.trim()
    };

    const newActivity: Activity = {
      id: `a-${Date.now()}`,
      timestamp: `${todayStr} ${new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}`,
      category: 'expense',
      title: `Expense logged: ${expCategory}`,
      description: `${expDesc.trim()} - PKR ${amount.toLocaleString()}`,
      amount,
      type: 'negative'
    };

    saveState(
      undefined,
      undefined,
      undefined,
      undefined,
      [newExpense, ...expenses],
      [newActivity, ...activities],
      undefined
    );

    setExpAmount('');
    setExpDesc('');
    setActiveModal(null);
    showToastMessage(`Successfully logged ${expCategory} expense of PKR ${amount.toLocaleString()}!`);
  };

  // Record Ledger Payment (Customer)
  const handleReceivePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntityId) {
      showToastMessage('Please select a customer account.', 'error');
      return;
    }
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      showToastMessage('Please enter a valid payment amount.', 'error');
      return;
    }

    const amount = Number(paymentAmount);
    const selectedCust = customers.find(c => c.id === selectedEntityId);
    if (!selectedCust) return;

    const updatedCust = customers.map(c => {
      if (c.id === selectedEntityId) {
        const remainingBalance = Math.max(0, c.ledgerBalance - amount);
        const remainingOverdue = Math.max(0, c.overdueAmount - amount);
        return {
          ...c,
          ledgerBalance: remainingBalance,
          overdueAmount: remainingOverdue
        };
      }
      return c;
    });

    const newPayment: CustomerPayment = {
      id: `pay-${Date.now()}`,
      customerId: selectedEntityId,
      customerName: selectedCust.name,
      date: todayStr,
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      amountPaid: amount,
      paymentMethod: 'Cash',
      notes: 'Received via Ledger Receive Settle Dialog'
    };

    const newActivity: Activity = {
      id: `a-${Date.now()}`,
      timestamp: `${todayStr} ${newPayment.time}`,
      category: 'payment',
      title: `Ledger Payment Received`,
      description: `${selectedCust.name} paid PKR ${amount.toLocaleString()} towards outstanding ledger.`,
      amount,
      type: 'positive'
    };

    saveState(
      undefined,
      undefined,
      updatedCust,
      undefined,
      undefined,
      [newActivity, ...activities],
      undefined,
      [newPayment, ...customerPayments]
    );

    setSelectedEntityId('');
    setPaymentAmount('');
    setActiveModal(null);
    showToastMessage(`Successfully recorded payment of PKR ${amount.toLocaleString()} from ${selectedCust.name}!`);
  };

  // Reconcile / Close Route for Milkman
  const handleMilkmanReconcile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcileMilkmanId) return;

    const selectedMilkman = milkmen.find(m => m.id === reconcileMilkmanId);
    if (!selectedMilkman) return;

    const collected = Number(reconcileCash) || 0;
    const unpaid = Number(reconcileCredit) || 0;

    const updatedMilkmen = milkmen.map(m => {
      if (m.id === reconcileMilkmanId) {
        return {
          ...m,
          status: 'Completed' as const,
          cashCollected: m.cashCollected + collected,
          outstandingCredit: Math.max(0, m.outstandingCredit - collected - unpaid),
          assignedLiters: 0 // clear shift load
        };
      }
      return m;
    });

    const updatedDispatches = dispatches.map(d => {
      if (d.milkmanId === reconcileMilkmanId && d.status !== 'Completed') {
        return {
          ...d,
          status: 'Completed' as const,
          cashCollected: collected
        };
      }
      return d;
    });

    // Also register cash sale for Danish farm accounting and log any credit to corresponding credit ledger
    const newActivity: Activity = {
      id: `a-${Date.now()}`,
      timestamp: `${todayStr} ${new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}`,
      category: 'dispatch',
      title: `Milkman Route Reconciled: ${selectedMilkman.name}`,
      description: `Reconciled Route: PKR ${collected.toLocaleString()} Cash collected. PKR ${unpaid.toLocaleString()} added to credits.`,
      amount: collected,
      type: 'positive'
    };

    saveState(
      undefined,
      updatedDispatches,
      undefined,
      undefined,
      undefined,
      [newActivity, ...activities],
      updatedMilkmen
    );

    setActiveModal(null);
    setReconcileMilkmanId('');
    setReconcileCash('');
    setReconcileCredit('');
    showToastMessage(`Successfully reconciled route logs for ${selectedMilkman.name}!`);
  };

  // Direct Settlement Payment from Milkman
  const [milkmanPaymentNotes, setMilkmanPaymentNotes] = useState('');
  
  const handleMilkmanPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const mid = selectedEntityId || selectedMilkmanId;
    if (!mid) return;

    const selectedMilkman = milkmen.find(m => m.id === mid);
    if (!selectedMilkman) return;

    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      showToastMessage('Please enter a valid payment amount.', 'error');
      return;
    }

    const newPayment: MilkmanPayment = {
      id: `mp-${Date.now()}`,
      milkmanId: mid,
      milkmanName: selectedMilkman.name,
      date: todayStr,
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      amountPaid: amount,
      notes: milkmanPaymentNotes || 'Direct cash received for ledger settlement'
    };

    const updatedMilkmen = milkmen.map(m => {
      if (m.id === mid) {
        return {
          ...m,
          cashCollected: m.cashCollected + amount,
          outstandingCredit: Math.max(0, m.outstandingCredit - amount)
        };
      }
      return m;
    });

    const newActivity: Activity = {
      id: `a-${Date.now()}`,
      timestamp: `${todayStr} ${newPayment.time}`,
      category: 'payment',
      title: `Milkman Payment: ${selectedMilkman.name}`,
      description: `Received PKR ${amount.toLocaleString()} from milkman ${selectedMilkman.name} to settle balance.`,
      amount,
      type: 'positive'
    };

    saveState(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      [newActivity, ...activities],
      updatedMilkmen,
      undefined,
      [newPayment, ...milkmanPayments]
    );

    setSelectedEntityId('');
    setPaymentAmount('');
    setMilkmanPaymentNotes('');
    setActiveModal(null);
    showToastMessage(`Recorded settlement payment of PKR ${amount.toLocaleString()} from ${selectedMilkman.name}!`);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custFormName.trim()) {
      showToastMessage('Please enter a customer name.', 'error');
      return;
    }

    const openingBalanceNum = Number(custFormOpeningBalance) || 0;
    let updatedCust = [...customers];

    if (editingCustomerId) {
      // Editing existing customer
      const existing = customers.find(c => c.id === editingCustomerId);
      const oldOpening = existing?.openingBalance || 0;
      const diff = openingBalanceNum - oldOpening;

      updatedCust = customers.map(c => {
        if (c.id === editingCustomerId) {
          return {
            ...c,
            name: custFormName.trim(),
            phone: custFormPhone.trim() || '0300-0000000',
            type: custFormType,
            openingBalance: openingBalanceNum,
            ledgerBalance: c.ledgerBalance + diff
          };
        }
        return c;
      });

      const newAct: Activity = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        category: 'sale',
        title: 'Customer Profile Updated',
        description: `Updated customer ${custFormName.trim()} with opening balance PKR ${openingBalanceNum.toLocaleString()}`,
        type: 'neutral'
      };

      saveState(
        undefined,
        undefined,
        updatedCust,
        undefined,
        undefined,
        [newAct, ...activities]
      );
      showToastMessage('Customer account updated successfully.', 'success');
    } else {
      // Check if duplicate name
      const duplicate = customers.find(c => c.name.toLowerCase() === custFormName.trim().toLowerCase());
      if (duplicate) {
        showToastMessage('A customer with this name already exists.', 'error');
        return;
      }

      // Add new customer
      const newCust: Customer = {
        id: `c-${Date.now()}`,
        name: custFormName.trim(),
        phone: custFormPhone.trim() || '0300-0000000',
        type: custFormType,
        ledgerBalance: openingBalanceNum,
        overdueAmount: 0,
        openingBalance: openingBalanceNum
      };
      updatedCust.push(newCust);

      const newAct: Activity = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        category: 'sale',
        title: 'New Customer Created',
        description: `Registered ${custFormName.trim()} with opening balance PKR ${openingBalanceNum.toLocaleString()}`,
        type: 'positive'
      };

      saveState(
        undefined,
        undefined,
        updatedCust,
        undefined,
        undefined,
        [newAct, ...activities]
      );
      showToastMessage('New customer account created successfully.', 'success');
    }

    setActiveModal(null);
  };

  const handleUpdateAnimals = (e: React.FormEvent) => {
    e.preventDefault();
    const cows = Number(editCows) || 0;
    const buffaloes = Number(editBuffalo) || 0;
    const calves = Number(editCalf) || 0;

    updateAnimals(cows, buffaloes, calves);
    setActiveModal(null);
    showToastMessage("Danish Farm livestock counts updated successfully!");
  };

  const handleDeleteSale = (saleId: string) => {
    if (window.confirm("Are you sure you want to delete this sale record? This will revert the customer's ledger balance if it was a credit sale.")) {
      const saleToDelete = sales.find(s => s.id === saleId);
      if (!saleToDelete) return;

      // If it was credit, we need to subtract the credit from customer's ledger balance
      let updatedCust = [...customers];
      if (saleToDelete.type === 'Credit') {
        const creditOwed = saleToDelete.totalAmount - saleToDelete.paidAmount;
        updatedCust = customers.map(c => {
          if (c.name.toLowerCase() === saleToDelete.customerName.toLowerCase()) {
            const newBal = Math.max(0, c.ledgerBalance - creditOwed);
            return {
              ...c,
              ledgerBalance: newBal,
              overdueAmount: Math.max(0, c.overdueAmount - (creditOwed * 0.3))
            };
          }
          return c;
        });
      }

      const updatedSales = sales.filter(s => s.id !== saleId);
      if (isSupabaseConfigured()) {
        deleteSaleFromDb(saleId).catch(e => console.error("Supabase Sync Error:", e));
      }
      
      /* eslint-disable-next-line react-hooks/purity */
      const deletedAt = Date.now();
      const deletedTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

      const newActivity: Activity = {
        id: `a-${deletedAt}`,
        timestamp: `${todayStr} ${deletedTime}`,
        category: 'sale',
        title: `Sale Deleted (Bill #${saleToDelete.billNumber})`,
        description: `Deleted sale for ${saleToDelete.customerName} (${saleToDelete.volumeLiters}L ${saleToDelete.productName}). Ledger reverted.`,
        amount: saleToDelete.totalAmount,
        type: 'negative'
      };

      saveState(
        undefined,
        undefined,
        updatedCust,
        updatedSales,
        undefined,
        [newActivity, ...activities],
        undefined
      );
      showToastMessage(`Successfully deleted Bill #${saleToDelete.billNumber}!`);
    }
  };

  // Filter activities
  const filteredActivities = activities.filter(act => {
    const matchesSearch = act.title.toLowerCase().includes(activitySearch.toLowerCase()) || 
                          act.description.toLowerCase().includes(activitySearch.toLowerCase());
    
    if (activityFilter === 'all') return matchesSearch;
    return act.category === activityFilter && matchesSearch;
  });

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-display font-medium text-lg text-emerald-800">Starting Danish Farm Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800 p-4 relative overflow-hidden">
        {/* Subtle decorative background gradients */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl"></div>

        <div 
          className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full border border-slate-100 flex flex-col items-center relative z-10"
        >
          {/* Logo Icon */}
          <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6 border border-emerald-400/20">
            <Milk className="w-10 h-10 text-white stroke-[2.5]" />
          </div>

          {/* Titles */}
          <h2 className="font-display font-black text-3xl tracking-tight text-slate-900 text-center">
            Danish Cattle Feed
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1 text-center">
            Customer Portal — Login to continue
          </p>

          {/* Form */}
          <form onSubmit={handleLogin} className="w-full mt-8 space-y-5">
            {loginError && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-rose-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                required
                value={loginEmail}
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                  setLoginError('');
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    setLoginError('');
                  }}
                  className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/15 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <span className="text-base font-semibold">→]</span>
              <span>Sign In</span>
            </button>
          </form>

          {/* Divider */}
          <div className="w-full border-t border-slate-100 my-6"></div>

          {/* Helper details */}
          <p className="text-[10px] text-slate-400 font-medium text-center leading-relaxed">
            Login credentials are provided by admin. Subscription must be active.
          </p>
          <div className="mt-3 bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-[10px] text-slate-500 font-mono text-center w-full">
            <span className="font-bold text-slate-600">Demo Access:</span><br />
            Email: <span className="font-bold text-emerald-600">admin@danishfarm.com</span><br />
            Password: <span className="font-bold text-emerald-600">admin</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 font-sans relative">
      
      {/* Dynamic Toast Success Notifications */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl border ${
            toast.type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
          )}
          <div>
            <p className="font-display font-semibold text-sm">System Update</p>
            <p className="text-xs text-slate-600 mt-0.5">{toast.message}</p>
          </div>
          <button 
            onClick={() => setToast(null)} 
            className="text-slate-400 hover:text-slate-700 ml-4 p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Greet & Navigation Area */}
      <header className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500 via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            
            {/* Business Logo & Greet */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg border border-emerald-400/30">
                <Milk className="w-8 h-8 text-white stroke-[2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-extrabold text-2xl tracking-tight bg-gradient-to-r from-emerald-300 via-teal-100 to-white bg-clip-text text-transparent">
                    Danish Farm
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full">
                    Control Panel
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-sans mt-0.5">
                  Welcome back, Farm Manager • Islamabad, Pakistan
                </p>
              </div>
            </div>

            {/* Live Data Widgets */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 px-3.5 py-2 rounded-xl backdrop-blur-sm">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-200">Thursday, July 16, 2026</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 px-3.5 py-2 rounded-xl backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-slate-200 font-mono">Offline-First Synced</span>
              </div>
              <button 
                onClick={resetAppToDefault}
                title="Restore original seed data"
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3.5 py-2 rounded-xl text-slate-200 hover:text-white transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400 hover:animate-spin" />
                <span>Reset Demo</span>
              </button>
              <button 
                onClick={handleLogout}
                title="Sign out from session"
                className="flex items-center gap-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 px-3.5 py-2 rounded-xl text-rose-200 hover:text-white transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Sign Out</span>
              </button>
            </div>

          </div>

          {/* Quick Stats Summary Bar & Section Navigation tabs */}
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-slate-800/80 pt-6 gap-4">
            
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setDashboardTab('overview')}
                className={`px-4 py-2.5 rounded-xl font-display font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
                  dashboardTab === 'overview' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setDashboardTab('production')}
                className={`px-4 py-2.5 rounded-xl font-display font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
                  dashboardTab === 'production' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                Milk Production ({todayProduction} L)
              </button>
              <button
                onClick={() => setDashboardTab('milkmen')}
                className={`px-4 py-2.5 rounded-xl font-display font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
                  dashboardTab === 'milkmen' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                Milkmen Route ({milkmen.filter(m => m.status === 'On Route').length} Active)
              </button>
              <button
                onClick={() => setDashboardTab('customers')}
                className={`px-4 py-2.5 rounded-xl font-display font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
                  dashboardTab === 'customers' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                Ledger Accounts
              </button>
              <button
                onClick={() => setDashboardTab('sales')}
                className={`px-4 py-2.5 rounded-xl font-display font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
                  dashboardTab === 'sales' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {"Today's Sales"} ({sales.filter(s => s.date === todayStr).length})
              </button>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs hidden lg:inline font-medium">Quick Operations:</span>
              <div className="grid grid-cols-2 lg:flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setActiveModal('production')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Production</span>
                </button>
                <button
                  onClick={() => setActiveModal('dispatch')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Route Log</span>
                </button>
                <button
                  onClick={() => setActiveModal('sale')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Sale</span>
                </button>
                <button
                  onClick={() => setActiveModal('expense')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-500 hover:bg-rose-400 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Expense</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {dashboardTab === 'overview' && (
          <div className="space-y-8">
            
            {/* 1. KEY METRICS CARDS (KPIs) */}
            <section id="kpis-section">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
                
                {/* PRODUCTION CARD */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">{"Today's Milk Production"}</span>
                    <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <Milk className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-display tracking-tight text-slate-900">
                        {todayProduction} L
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2.5">
                      {productionTrendPercent >= 0 ? (
                        <span className="flex items-center gap-0.5 text-emerald-600 text-xs font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-md">
                          <TrendingUp className="w-3.5 h-3.5" />
                          +{productionTrendPercent}%
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-rose-600 text-xs font-semibold bg-rose-50 px-1.5 py-0.5 rounded-md">
                          <TrendingDown className="w-3.5 h-3.5" />
                          {productionTrendPercent}%
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">vs yesterday ({yesterdayProduction}L)</span>
                    </div>
                  </div>
                </div>

                {/* AVERAGE MILK PER ANIMAL CARD */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all group flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Avg Milk Per Animal</span>
                      <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                        <Milk className="w-5 h-5 text-emerald-600" />
                      </div>
                    </div>
                    
                    {/* Species Filter Tabs */}
                    <div className="flex gap-1 mt-2.5 bg-slate-50 p-0.5 rounded-lg text-[9px] font-bold border border-slate-100">
                      <button
                        onClick={() => setAvgAnimalFilter('All')}
                        className={`flex-1 py-1 rounded-md transition-all cursor-pointer ${
                          avgAnimalFilter === 'All' 
                            ? 'bg-white text-slate-800 shadow-sm border border-slate-100' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        All ({totalAnimals})
                      </button>
                      <button
                        onClick={() => setAvgAnimalFilter('Cow')}
                        className={`flex-1 py-1 rounded-md transition-all cursor-pointer ${
                          avgAnimalFilter === 'Cow' 
                            ? 'bg-white text-slate-800 shadow-sm border border-slate-100' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Cows ({cowCount})
                      </button>
                      <button
                        onClick={() => setAvgAnimalFilter('Buffalo')}
                        className={`flex-1 py-1 rounded-md transition-all cursor-pointer ${
                          avgAnimalFilter === 'Buffalo' 
                            ? 'bg-white text-slate-800 shadow-sm border border-slate-100' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Buffs ({buffaloCount})
                      </button>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold font-display tracking-tight text-slate-900">
                          {avgAnimalFilter === 'All' && `${avgMilkPerAnimal.toFixed(1)} L`}
                          {avgAnimalFilter === 'Cow' && `${avgMilkPerCow.toFixed(1)} L`}
                          {avgAnimalFilter === 'Buffalo' && `${avgMilkPerBuffalo.toFixed(1)} L`}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">/ animal / day</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex flex-col gap-1 text-[10px] text-slate-500 font-medium">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Cow Avg:</span>
                      <span className="font-bold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded">{avgMilkPerCow.toFixed(1)} L/cow</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Buffalo Avg:</span>
                      <span className="font-bold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded">{avgMilkPerBuffalo.toFixed(1)} L/buf</span>
                    </div>
                  </div>
                </div>

                {/* TOTAL REVENUE CARD */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Total Sales Revenue</span>
                    <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400">TODAY</span>
                      <span className="text-2xl font-bold font-display tracking-tight text-slate-900 mt-0.5">
                        PKR {todaySalesRevenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">MONTH TOTAL:</span>
                      <span className="text-xs font-semibold text-emerald-700">PKR {monthSalesRevenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* EXPENSES CARD */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-rose-200 hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Operational Expenses</span>
                    <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                      <ArrowUpRight className="w-5 h-5 text-rose-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-rose-500 font-medium">TODAY</span>
                      <span className="text-2xl font-bold font-display tracking-tight text-slate-900 mt-0.5">
                        PKR {todayExpensesAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">MONTH TOTAL:</span>
                      <span className="text-xs font-semibold text-slate-700">PKR {monthExpensesAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* NET PROFIT CARD */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-violet-200 hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Net Profit / Margin</span>
                    <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                      <Coins className="w-5 h-5 text-violet-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400">TODAY NET</span>
                      <span className={`text-2xl font-bold font-display tracking-tight mt-0.5 ${todayNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        PKR {todayNetProfit.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">MONTH MARGIN:</span>
                      <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">
                        {monthProfitMargin}% ({monthNetProfit >= 0 ? '+' : ''}PKR {monthNetProfit.toLocaleString()})
                      </span>
                    </div>
                  </div>
                </div>

                {/* OUTSTANDING CREDITS CARD */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-amber-200 hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Outstanding Ledger Credits</span>
                    <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-display tracking-tight text-amber-800">
                        PKR {totalOutstandingCredit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-50">
                      <span>CUSTOMERS: PKR {outstandingCustomerCredit.toLocaleString()}</span>
                      <span>MILKMEN: PKR {outstandingMilkmanCredit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* GRID LAYOUT FOR CHART & LIVESTOCK CARD */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* WEEKLY TREND ANALYTICS (SVG custom chart - stunning, high contrast!) */}
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:col-span-2">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-emerald-600" />
                      Milk Production & Sales Trend
                    </h3>
                    <p className="text-xs text-slate-500">Weekly dairy statistics comparison (Liters per day)</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 bg-emerald-600 rounded-full"></span>
                      <span className="text-slate-600">Production Volume</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 bg-slate-300 rounded-full"></span>
                      <span className="text-slate-600">Dispatched Sales</span>
                    </div>
                  </div>
                </div>

                {/* Native SVG Chart */}
                <div className="h-64 w-full mt-4 relative">
                  <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                    {/* Grid Lines */}
                    <line x1="0" y1="50" x2="1000" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="125" x2="1000" y2="125" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="200" x2="1000" y2="200" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="275" x2="1000" y2="275" stroke="#e2e8f0" strokeWidth="1" />

                    {/* Production SVG Line Chart */}
                    <path
                      d="M 50,180 L 200,165 L 350,170 L 500,150 L 650,155 L 800,155 L 950,130"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Fill Area for Production */}
                    <path
                      d="M 50,180 L 200,165 L 350,170 L 500,150 L 650,155 L 800,155 L 950,130 L 950,275 L 50,275 Z"
                      fill="url(#productionGrad)"
                      opacity="0.1"
                    />

                    {/* Sales/Dispatch SVG Line Chart */}
                    <path
                      d="M 50,210 L 200,195 L 350,185 L 500,165 L 650,175 L 800,180 L 950,140"
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="4 4"
                    />

                    {/* Nodes on points */}
                    <circle cx="50" cy="180" r="5" fill="#059669" stroke="#fff" strokeWidth="2" />
                    <circle cx="200" cy="165" r="5" fill="#059669" stroke="#fff" strokeWidth="2" />
                    <circle cx="350" cy="170" r="5" fill="#059669" stroke="#fff" strokeWidth="2" />
                    <circle cx="500" cy="150" r="5" fill="#059669" stroke="#fff" strokeWidth="2" />
                    <circle cx="650" cy="155" r="5" fill="#059669" stroke="#fff" strokeWidth="2" />
                    <circle cx="800" cy="155" r="5" fill="#059669" stroke="#fff" strokeWidth="2" />
                    <circle cx="950" cy="130" r="6" fill="#10b981" stroke="#fff" strokeWidth="2.5" />

                    {/* Gradients */}
                    <defs>
                      <linearGradient id="productionGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Day Labels */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 pt-2 text-[10px] font-bold text-slate-400 tracking-wider">
                    <span>FRI (520L)</span>
                    <span>SAT (540L)</span>
                    <span>SUN (535L)</span>
                    <span>MON (550L)</span>
                    <span>TUE (545L)</span>
                    <span>WED (545L)</span>
                    <span>TODAY ({todayProduction}L)</span>
                  </div>
                </div>
              </section>

              {/* LIVESTOCK INVENTORY CARD */}
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:col-span-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4.5 h-4.5 text-emerald-600 animate-pulse" />
                      Livestock Inventory
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Active count
                    </span>
                  </div>

                  <div className="space-y-3.5 my-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100/60 hover:border-emerald-200 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center text-base">🐄</div>
                        <div>
                          <span className="font-bold text-xs text-slate-700 block">Cows</span>
                          <span className="text-[9px] text-slate-400">Milk Cattle</span>
                        </div>
                      </div>
                      <span className="font-display font-bold text-sm text-slate-900 bg-white border border-slate-100 px-3 py-1 rounded-lg shadow-sm">
                        Cows - {cowCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100/60 hover:border-emerald-200 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center text-base">🐃</div>
                        <div>
                          <span className="font-bold text-xs text-slate-700 block">Buffaloes</span>
                          <span className="text-[9px] text-slate-400">High Fat Milk</span>
                        </div>
                      </div>
                      <span className="font-display font-bold text-sm text-slate-900 bg-white border border-slate-100 px-3 py-1 rounded-lg shadow-sm">
                        Buffalo - {buffaloCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100/60 hover:border-emerald-200 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-rose-50 rounded-lg flex items-center justify-center text-sm">🍼</div>
                        <div>
                          <span className="font-bold text-xs text-slate-700 block">Calves</span>
                          <span className="text-[9px] text-slate-400">Young Ones</span>
                        </div>
                      </div>
                      <span className="font-display font-bold text-sm text-slate-900 bg-white border border-slate-100 px-3 py-1 rounded-lg shadow-sm">
                        {"Calf's"} - {calfCount}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditCows(cowCount.toString());
                    setEditBuffalo(buffaloCount.toString());
                    setEditCalf(calfCount.toString());
                    setActiveModal('animals');
                  }}
                  className="w-full mt-2 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm text-center"
                >
                  Add or Update Animals
                </button>
              </section>
            </div>

            {/* 2 & 3. TWO-COLUMN WIDGET SECTION: CUSTOMERS & MILKMAN DISTRIBUTIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* CUSTOMER SUMMARY WIDGET */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-600" />
                      Customer Sales Ledger
                    </h3>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                      {customers.filter(c => c.type === 'Credit').length} Ledgers Active
                    </span>
                  </div>

                  {/* Cash Sales Summary Card inside widget */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/50 rounded-xl p-4 mb-5 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-800">Counter Cash Sales Today</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold font-display text-emerald-950">{todayCashSalesLiters} Liters Sold</span>
                        <span className="text-xs text-emerald-700">| PKR {todayCashSalesRevenue.toLocaleString()} Collected</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-emerald-500/15 rounded-lg flex items-center justify-center text-emerald-700">
                      <Coins className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Top Credit Customer Overdue Alerts */}
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Overdue Credit Ledgers</h4>
                  <div className="space-y-3">
                    {customers
                      .filter(c => c.type === 'Credit' && c.ledgerBalance > 0)
                      .sort((a, b) => b.ledgerBalance - a.ledgerBalance)
                      .slice(0, 3)
                      .map(cust => (
                        <div key={cust.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl hover:bg-slate-100/70 transition-colors border border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-slate-800">{cust.name}</span>
                              {cust.overdueAmount > 0 && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
                                  <AlertCircle className="w-2.5 h-2.5" />
                                  Overdue
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400">{cust.phone}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold font-display text-sm text-slate-900">PKR {cust.ledgerBalance.toLocaleString()}</p>
                            {cust.overdueAmount > 0 ? (
                              <p className="text-[10px] font-medium text-rose-500">Min due: PKR {cust.overdueAmount.toLocaleString()}</p>
                            ) : (
                              <p className="text-[10px] font-medium text-emerald-600">Balance OK</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Total ledger assets: PKR {outstandingCustomerCredit.toLocaleString()}</span>
                  <button
                    onClick={() => {
                      setSelectedEntityId(customers[0]?.id || '');
                      setActiveModal('payment');
                    }}
                    className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold hover:text-emerald-800 cursor-pointer"
                  >
                    <span>Receive Ledger Payment</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* DISTRIBUTION & MILKMAN LEDGER OVERVIEW */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-emerald-600" />
                      Distribution & Routes Board
                    </h3>
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                      {todayDispatchedVolume}L Dispatched Today
                    </span>
                  </div>

                  {/* Active Route overview */}
                  <div className="grid grid-cols-3 gap-4 mb-5">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">On Route</span>
                      <p className="text-lg font-bold font-display text-amber-600 mt-1">
                        {milkmen.filter(m => m.status === 'On Route').length}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Completed</span>
                      <p className="text-lg font-bold font-display text-emerald-600 mt-1">
                        {milkmen.filter(m => m.status === 'Completed').length}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Standby</span>
                      <p className="text-lg font-bold font-display text-slate-600 mt-1">
                        {milkmen.filter(m => m.status === 'Active').length}
                      </p>
                    </div>
                  </div>

                  {/* Milkman list with status & balances */}
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Distributor Ledgers</h4>
                  <div className="space-y-3">
                    {milkmen.map(man => (
                      <div key={man.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100/70 transition-colors border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${
                            man.status === 'On Route' ? 'bg-amber-400 animate-pulse' : 
                            man.status === 'Completed' ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}></div>
                          <div>
                            <span className="font-semibold text-sm text-slate-800 block">{man.name}</span>
                            <span className="text-[11px] text-slate-400">Load: {man.assignedLiters}L assigned</span>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <p className="text-xs font-bold text-slate-800">PKR {man.cashCollected.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">recvd</span></p>
                            <p className="text-[10px] font-medium text-amber-700">Due: PKR {man.outstandingCredit.toLocaleString()}</p>
                          </div>
                          {man.status === 'On Route' && (
                            <button
                              onClick={() => {
                                setReconcileMilkmanId(man.id);
                                setReconcileCash(man.outstandingCredit.toString());
                                setReconcileCredit('0');
                                setActiveModal('milkman_reconcile');
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-sm transition-colors cursor-pointer"
                            >
                              Settle
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">All milkmen credits: PKR {outstandingMilkmanCredit.toLocaleString()}</span>
                  <button
                    onClick={() => setDashboardTab('milkmen')}
                    className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold hover:text-emerald-800 cursor-pointer"
                  >
                    <span>Manage Distribution Routes</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* 4. RECENT TRANSACTIONS & ACTIVITY FEED */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Transaction Logs & Recent Farm Activity
                  </h3>
                  <p className="text-xs text-slate-500">Live feed of production, sales, expenses, and ledger payments</p>
                </div>

                {/* Filter & Search controls */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full md:w-auto">
                  {/* Search bar */}
                  <div className="relative flex-1 sm:w-60">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-800"
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-none">
                    {(['all', 'production', 'dispatch', 'sale', 'expense'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setActivityFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                          activityFilter === f 
                            ? 'bg-white text-emerald-950 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Transactions list */}
              <div className="overflow-x-auto">
                {filteredActivities.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-600">No matching activities found</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting the search filters or add a new transaction.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Transaction / Activity</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Time & Shift</th>
                        <th className="py-3 px-4 text-right">Economic Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700 text-sm">
                      {filteredActivities.map((act) => (
                        <tr key={act.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-semibold text-slate-800">{act.title}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{act.description}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              act.category === 'production' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                              act.category === 'dispatch' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              act.category === 'sale' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              act.category === 'payment' ? 'bg-violet-50 text-violet-700 border border-violet-100' :
                              'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              {act.category}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{act.timestamp}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right font-display font-bold">
                            {act.type === 'positive' && (
                              <span className="text-emerald-700 font-semibold flex items-center justify-end gap-0.5">
                                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                                + PKR {act.amount?.toLocaleString()}
                              </span>
                            )}
                            {act.type === 'negative' && (
                              <span className="text-rose-700 font-semibold flex items-center justify-end gap-0.5">
                                <ArrowDownRight className="w-4 h-4 text-rose-400" />
                                - PKR {act.amount?.toLocaleString()}
                              </span>
                            )}
                            {act.type === 'neutral' && (
                              <span className="text-slate-600 font-semibold flex items-center justify-end gap-1">
                                {act.category === 'production' ? `${act.amount} Liters` : `Route Load`}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

          </div>
        )}

        {/* ----------------- TAB: PRODUCTION DETAILS ----------------- */}
        {dashboardTab === 'production' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 mb-5 gap-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900">Milk Production Records</h3>
                  <p className="text-xs text-slate-500">Detailed logs of milk harvested in morning and evening shifts</p>
                </div>
                <button
                  onClick={() => setActiveModal('production')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Log Shift Production</span>
                </button>
              </div>

              {/* List of production */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Date & Shift</th>
                      <th className="py-3 px-4">Harvest Volume</th>
                      <th className="py-3 px-4">Fat Content (%)</th>
                      <th className="py-3 px-4">Barn Notes / Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {productionLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-4">
                          <div>
                            <span className="font-semibold text-slate-800 block">{log.date}</span>
                            <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              log.shift === 'Morning' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                            }`}>{log.shift} Shift</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-display font-bold text-base text-slate-800">
                          {log.volumeLiters} Liters
                        </td>
                        <td className="py-4 px-4 text-sm font-semibold text-slate-600">
                          {log.qualityFat}%
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-400">
                          {log.notes || 'Routine logging'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB: MILKMEN DISTRIBUTION ----------------- */}
        {dashboardTab === 'milkmen' && (
          <div className="space-y-6">
            {selectedMilkmanId ? (() => {
              const activeMilkman = milkmen.find(m => m.id === selectedMilkmanId);
              if (!activeMilkman) return <div className="text-slate-500">Milkman not found.</div>;

              const activeDispatches = dispatches.filter(d => d.milkmanId === selectedMilkmanId);
              const activePayments = milkmanPayments.filter(p => p.milkmanId === selectedMilkmanId);

              // Map dispatches and payments into combined chronologically sorted Khata rows
              interface CombinedMilkmanRow {
                id: string;
                date: string;
                time: string;
                type: 'dispatch' | 'payment';
                qty: number;
                rate: number;
                totalAmount: number;
                cashReceived: number;
                cashRemained: number;
                notes: string;
              }

              const rows: CombinedMilkmanRow[] = [
                ...activeDispatches.map(d => {
                  const amt = d.volumeLiters * d.ratePerLiter;
                  return {
                    id: d.id,
                    date: d.date,
                    time: '07:00', // standard shift morning
                    type: 'dispatch' as const,
                    qty: d.volumeLiters,
                    rate: d.ratePerLiter,
                    totalAmount: amt,
                    cashReceived: d.cashCollected,
                    cashRemained: Math.max(0, amt - d.cashCollected),
                    notes: d.notes || 'Milk Delivery Load'
                  };
                }),
                ...activePayments.map(p => {
                  return {
                    id: p.id,
                    date: p.date,
                    time: p.time,
                    type: 'payment' as const,
                    qty: 0,
                    rate: 0,
                    totalAmount: 0,
                    cashReceived: p.amountPaid,
                    cashRemained: -p.amountPaid,
                    notes: p.notes || 'Ledger Credit Settlement'
                  };
                })
              ];

              // Sort chronological ascending
              rows.sort((a, b) => {
                const dateTimeA = `${a.date} ${a.time}`;
                const dateTimeB = `${b.date} ${b.time}`;
                return dateTimeA.localeCompare(dateTimeB);
              });

              // Running credit calculation
              let running = 0;
              const ledgerRows = rows.map(r => {
                if (r.type === 'dispatch') {
                  running += r.cashRemained;
                } else {
                  running -= r.cashReceived;
                }
                return {
                  ...r,
                  runningBalance: Math.max(0, running)
                };
              });

              const totalLitersDelivered = activeDispatches.reduce((sum, d) => sum + d.volumeLiters, 0);
              const totalMilkValue = activeDispatches.reduce((sum, d) => sum + (d.volumeLiters * d.ratePerLiter), 0);
              const totalCashCollected = activeDispatches.reduce((sum, d) => sum + d.cashCollected, 0) + activePayments.reduce((sum, p) => sum + p.amountPaid, 0);
              const currentOutstanding = activeMilkman.outstandingCredit;

              return (
                <div className="space-y-6">
                  {/* Khata Header */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSelectedMilkmanId('')}
                        className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-800 cursor-pointer"
                        title="Back to Milkmen List"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-xl text-slate-900">{activeMilkman.name}</h3>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            activeMilkman.status === 'On Route' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {activeMilkman.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Phone: <span className="font-semibold text-slate-700">{activeMilkman.phone}</span> • Milkman Khata Ledger Statement
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <button 
                        onClick={() => {
                          setSelectedEntityId(activeMilkman.id);
                          setPaymentAmount('');
                          setMilkmanPaymentNotes('');
                          setActiveModal('milkman_payment');
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <Coins className="w-4 h-4" />
                        <span>Receive Settle Payment</span>
                      </button>

                      <button 
                        onClick={() => window.print()}
                        className="px-3.5 py-2 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border border-slate-200"
                      >
                        <Printer className="w-4 h-4 text-slate-500" />
                        <span>Print Statement</span>
                      </button>

                      <button 
                        onClick={() => {
                          const headers = "Date,Type,Qty (Liters),Rate,Total Cost (PKR),Cash Received (PKR),Cash Remained (PKR),Ledger Balance (PKR),Notes\n";
                          const csvRows = ledgerRows.map(row => 
                            `"${row.date}","${row.type === 'dispatch' ? 'Dispatch' : 'Payment'}","${row.qty || 0}","${row.rate || 0}","${row.totalAmount}","${row.cashReceived}","${row.cashRemained}","${row.runningBalance}","${row.notes}"`
                          ).join("\n");
                          const blob = new Blob([headers + csvRows], { type: 'text/csv' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.setAttribute('href', url);
                          a.setAttribute('download', `Khata_${activeMilkman.name.replace(/\s+/g, '_')}_Statement.csv`);
                          a.click();
                        }}
                        className="px-3.5 py-2 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border border-slate-200"
                      >
                        <Download className="w-4 h-4 text-slate-500" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Widgets */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Quantity Handled</span>
                      <span className="font-display font-extrabold text-xl text-slate-800 mt-1 block">{totalLitersDelivered.toLocaleString()} Liters</span>
                      <span className="text-[9px] text-slate-400 mt-1 block">Accumulated lifetime route loads</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Dispatched Value</span>
                      <span className="font-display font-extrabold text-xl text-slate-800 mt-1 block">PKR {totalMilkValue.toLocaleString()}</span>
                      <span className="text-[9px] text-slate-400 mt-1 block">Total billing value of dispatched milk</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Cash Received</span>
                      <span className="font-display font-extrabold text-xl text-emerald-700 mt-1 block">PKR {totalCashCollected.toLocaleString()}</span>
                      <span className="text-[9px] text-slate-400 mt-1 block">Route collection + direct settlement payments</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Current Ledger Credit</span>
                      <span className="font-display font-extrabold text-xl text-amber-700 mt-1 block">PKR {currentOutstanding.toLocaleString()}</span>
                      <span className="text-[9px] text-slate-400 mt-1 block">Total remaining outstanding credit amount</span>
                    </div>
                  </div>

                  {/* Khata Statement Table */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h4 className="font-display font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      Detailed Khata Transaction Ledger
                    </h4>

                    <div className="overflow-x-auto">
                      {ledgerRows.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                          <p className="text-sm font-semibold text-slate-600">No ledger transactions found</p>
                          <p className="text-xs text-slate-400 mt-1">This milkman does not have any dispatches or payments recorded.</p>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                              <th className="py-3 px-4">Date & Time</th>
                              <th className="py-3 px-4">Transaction / Type</th>
                              <th className="py-3 px-4 text-center">Milk Qty (Liters)</th>
                              <th className="py-3 px-4 text-right">Rate/L</th>
                              <th className="py-3 px-4 text-right">Total Cost (PKR)</th>
                              <th className="py-3 px-4 text-right">Cash Received (PKR)</th>
                              <th className="py-3 px-4 text-right">Cash Remained (PKR)</th>
                              <th className="py-3 px-4 text-right">Ledger Balance (PKR)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-slate-700 text-xs">
                            {ledgerRows.map(row => (
                              <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-3.5 px-4">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-800">{row.date}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">{row.time}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="flex flex-col">
                                    <span className={`font-semibold ${row.type === 'dispatch' ? 'text-blue-700' : 'text-emerald-700'}`}>
                                      {row.type === 'dispatch' ? 'Dispatched Load' : 'Settle Payment'}
                                    </span>
                                    <span className="text-[10px] text-slate-400">{row.notes}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-center font-bold">
                                  {row.qty > 0 ? `${row.qty} L` : '-'}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  {row.rate > 0 ? `PKR ${row.rate}` : '-'}
                                </td>
                                <td className="py-3.5 px-4 text-right font-semibold">
                                  {row.totalAmount > 0 ? `PKR ${row.totalAmount.toLocaleString()}` : '-'}
                                </td>
                                <td className="py-3.5 px-4 text-right text-emerald-700 font-bold">
                                  PKR {row.cashReceived.toLocaleString()}
                                </td>
                                <td className="py-3.5 px-4 text-right font-semibold">
                                  <span className={row.cashRemained > 0 ? 'text-amber-700' : row.cashRemained < 0 ? 'text-emerald-700' : 'text-slate-400'}>
                                    PKR {row.cashRemained.toLocaleString()}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right font-display font-extrabold text-slate-950">
                                  PKR {row.runningBalance.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 mb-5 gap-4">
                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-900">Distributor Milkman Board</h3>
                    <p className="text-xs text-slate-500">Track current milk supply loads, active delivery sectors, and pending balances</p>
                  </div>
                  <button
                    onClick={() => setActiveModal('dispatch')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Dispatch New Route Load</span>
                  </button>
                </div>

                {/* Milkman details grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {milkmen.map(man => {
                    const onRouteDispatches = dispatches.filter(d => d.milkmanId === man.id && d.date === todayStr);
                    return (
                      <div key={man.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-display font-bold text-base text-slate-900 block">{man.name}</span>
                              <span className="text-xs text-slate-400">{man.phone}</span>
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                              man.status === 'On Route' ? 'bg-amber-100 text-amber-800' :
                              man.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {man.status}
                            </span>
                          </div>

                          <div className="mt-4 space-y-2 border-t border-slate-150 pt-3">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Assigned Load (Today):</span>
                              <span className="font-semibold text-slate-800">{man.assignedLiters} L</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Cash Accounted:</span>
                              <span className="font-bold text-emerald-700">PKR {man.cashCollected.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Outstanding Balance:</span>
                              <span className="font-bold text-amber-800">PKR {man.outstandingCredit.toLocaleString()}</span>
                            </div>
                          </div>

                          {onRouteDispatches.length > 0 && (
                            <div className="mt-3 bg-white p-2.5 rounded-lg border border-slate-150">
                              <p className="text-[10px] font-bold text-slate-500 uppercase">Current active sector</p>
                              <p className="text-xs text-slate-600 mt-0.5">{onRouteDispatches[0].notes || 'Regular Delivery Route'}</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex gap-2 pt-3 border-t border-slate-150">
                          <button
                            onClick={() => setSelectedMilkmanId(man.id)}
                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs text-center cursor-pointer transition-colors"
                          >
                            View Khata
                          </button>
                          {man.status === 'On Route' && (
                            <button
                              onClick={() => {
                                setReconcileMilkmanId(man.id);
                                setReconcileCash(man.outstandingCredit.toString());
                                setReconcileCredit('0');
                                setActiveModal('milkman_reconcile');
                              }}
                              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs text-center cursor-pointer transition-all shadow-sm"
                            >
                              Settle
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB: CUSTOMER LEDGERS ----------------- */}
        {dashboardTab === 'customers' && (
          <div className="space-y-6">
            {selectedCustomerId ? (() => {
              const activeCustomer = customers.find(c => c.id === selectedCustomerId);
              if (!activeCustomer) return <div className="text-slate-500">Customer not found.</div>;

              const customerSales = sales.filter(s => s.customerName.toLowerCase() === activeCustomer.name.toLowerCase());
              const customerPaymentsForLedger = customerPayments.filter(p => p.customerName.toLowerCase() === activeCustomer.name.toLowerCase());
              
              // Dynamic starting balance calculation for ledger integrity
              const transactionDelta = customerSales.reduce((sum, s) => sum + (s.totalAmount - s.paidAmount), 0) - customerPaymentsForLedger.reduce((sum, p) => sum + p.amountPaid, 0);
              const startingBalance = activeCustomer.ledgerBalance - transactionDelta;
              
              interface CombinedLedgerEntry {
                id: string;
                date: string;
                time: string;
                type: 'sale' | 'payment';
                billNumber: string;
                productName: string;
                qty?: number;
                rate?: number;
                driverRent?: number;
                driverName?: string;
                billAmount: number;
                cashPaid: number;
                description: string;
              }
              
              const entries: CombinedLedgerEntry[] = [
                ...customerSales.map(s => ({
                  id: s.id,
                  date: s.date,
                  time: s.time,
                  type: 'sale' as const,
                  billNumber: s.billNumber || 'B-Auto',
                  productName: s.productName || 'Whole Milk',
                  qty: s.volumeLiters,
                  rate: s.ratePerLiter,
                  driverRent: s.driverRent || 0,
                  driverName: s.driverName || 'Self Pickup',
                  billAmount: s.totalAmount,
                  cashPaid: s.paidAmount,
                  description: `${s.volumeLiters}L ${s.productName || 'Whole Milk'} @ PKR ${s.ratePerLiter}`
                })),
                ...customerPaymentsForLedger.map(p => ({
                  id: p.id,
                  date: p.date,
                  time: p.time,
                  type: 'payment' as const,
                  billNumber: p.id.startsWith('pay-') ? `R-${p.id.substring(p.id.length - 4)}` : p.id,
                  productName: 'Ledger Settle',
                  qty: undefined,
                  rate: undefined,
                  driverRent: undefined,
                  driverName: undefined,
                  billAmount: 0,
                  cashPaid: p.amountPaid,
                  description: p.notes || 'Settle Payment Received'
                }))
              ];
              
              // Sort chronological ascending
              entries.sort((a, b) => {
                const dateTimeA = `${a.date} ${a.time}`;
                const dateTimeB = `${b.date} ${b.time}`;
                return dateTimeA.localeCompare(dateTimeB);
              });
              
              // Calculate running balances
              let running = startingBalance;
              const ledgerRows = entries.map(entry => {
                if (entry.type === 'sale') {
                  running += (entry.billAmount - entry.cashPaid);
                } else {
                  running -= entry.cashPaid;
                }
                return {
                  ...entry,
                  runningBalance: running
                };
              });
              
              const totalQty = customerSales.reduce((sum, s) => sum + s.volumeLiters, 0);
              const totalBilled = customerSales.reduce((sum, s) => sum + s.totalAmount, 0);
              const totalPaid = customerSales.reduce((sum, s) => sum + s.paidAmount, 0) + customerPaymentsForLedger.reduce((sum, p) => sum + p.amountPaid, 0);

              return (
                <div className="space-y-6">
                  {/* Ledger Header */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSelectedCustomerId('')}
                        className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-800 cursor-pointer"
                        title="Back to Customer List"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-xl text-slate-900">{activeCustomer.name}</h3>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            {activeCustomer.type} Account
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Phone: <span className="font-semibold text-slate-700">{activeCustomer.phone}</span> • Comprehensive Ledger Report
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start md:self-center">
                      <button 
                        onClick={() => window.print()}
                        className="px-3.5 py-2 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border border-slate-200"
                      >
                        <Printer className="w-4 h-4 text-slate-500" />
                        <span>Print Statement</span>
                      </button>
                      <button 
                        onClick={() => {
                          const headers = "Bill #,Date,Time,Product,Qty,Rate,Driver Rent,Driver,Bill Amount,Paid,Balance\n";
                          const rows = ledgerRows.map(row => 
                            `"${row.billNumber}","${row.date}","${row.time}","${row.productName}","${row.qty ?? ''}","${row.rate ?? ''}","${row.driverRent ?? ''}","${row.driverName ?? ''}","${row.billAmount}","${row.cashPaid}","${row.runningBalance}"`
                          ).join("\n");
                          const blob = new Blob([headers + rows], { type: 'text/csv' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.setAttribute('href', url);
                          a.setAttribute('download', `DanishFarm_Ledger_${activeCustomer.name.replace(/\s+/g, '_')}.csv`);
                          a.click();
                        }}
                        className="px-3.5 py-2 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border border-slate-200"
                      >
                        <Download className="w-4 h-4 text-slate-500" />
                        <span>Export CSV</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingCustomerId(activeCustomer.id);
                          setCustFormName(activeCustomer.name);
                          setCustFormPhone(activeCustomer.phone);
                          setCustFormType(activeCustomer.type);
                          setCustFormOpeningBalance((activeCustomer.openingBalance || 0).toString());
                          setActiveModal('customer');
                        }}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs border border-indigo-100 transition-colors cursor-pointer"
                      >
                        Edit Profile
                      </button>
                      <button
                        onClick={() => {
                          setSelectedEntityId(activeCustomer.id);
                          setPaymentAmount(activeCustomer.ledgerBalance.toString());
                          setActiveModal('payment');
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Receive Settle Payment
                      </button>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Current Outstanding</p>
                      <h4 className="text-2xl font-black text-slate-900 mt-2">PKR {activeCustomer.ledgerBalance.toLocaleString()}</h4>
                      <p className="text-[10px] text-amber-600 mt-1">Pending collection</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Supplied</p>
                      <h4 className="text-2xl font-black text-slate-900 mt-2">{totalQty.toLocaleString()} Liters</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Net delivery volume</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Billing</p>
                      <h4 className="text-2xl font-black text-slate-900 mt-2">PKR {totalBilled.toLocaleString()}</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Includes driver rents</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Paid</p>
                      <h4 className="text-2xl font-black text-emerald-700 mt-2">PKR {totalPaid.toLocaleString()}</h4>
                      <p className="text-[10px] text-emerald-600 mt-1">Direct + settlement payments</p>
                    </div>
                  </div>

                  {/* Comprehensive Ledger Table Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h4 className="font-display font-bold text-base text-slate-900">Ledger History Log</h4>
                        <p className="text-xs text-slate-500">Continuous statement ledger of deliveries and receipts</p>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        Showing {ledgerRows.length + 1} records
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                            <th className="py-3 px-3">Bill / Rec #</th>
                            <th className="py-3 px-3">Date & Time</th>
                            <th className="py-3 px-3">Product / Detail</th>
                            <th className="py-3 px-3 text-right">Qty (L)</th>
                            <th className="py-3 px-3 text-right">Rate</th>
                            <th className="py-3 px-3 text-right">Driver Rent</th>
                            <th className="py-3 px-3">Driver / Courier</th>
                            <th className="py-3 px-3 text-right">Bill Amt</th>
                            <th className="py-3 px-3 text-right">Paid Amt</th>
                            <th className="py-3 px-3 text-right bg-slate-50 font-bold text-slate-800">Remaining Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                          {/* Starting Balance row */}
                          <tr className="bg-slate-50/40">
                            <td className="py-3.5 px-3 font-semibold text-slate-400">-</td>
                            <td className="py-3.5 px-3 text-slate-400">-</td>
                            <td className="py-3.5 px-3 font-medium text-slate-500 italic">Pre-existing Opening Balance</td>
                            <td className="py-3.5 px-3 text-right text-slate-400">-</td>
                            <td className="py-3.5 px-3 text-right text-slate-400">-</td>
                            <td className="py-3.5 px-3 text-right text-slate-400">-</td>
                            <td className="py-3.5 px-3 text-slate-400 italic">Manual Entry</td>
                            <td className="py-3.5 px-3 text-right text-slate-400">-</td>
                            <td className="py-3.5 px-3 text-right text-slate-400">-</td>
                            <td className="py-3.5 px-3 text-right bg-slate-50 font-bold text-slate-900">
                              PKR {startingBalance.toLocaleString()}
                            </td>
                          </tr>

                          {ledgerRows.map(row => (
                            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3.5 px-3 font-bold text-slate-900">
                                {row.billNumber}
                              </td>
                              <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                                {row.date} <span className="text-[10px] text-slate-400">({row.time})</span>
                              </td>
                              <td className="py-3.5 px-3 font-medium">
                                <span className={row.type === 'payment' ? 'text-emerald-700 font-semibold' : 'text-slate-800'}>
                                  {row.productName}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-right font-medium">
                                {row.qty !== undefined ? `${row.qty} L` : '-'}
                              </td>
                              <td className="py-3.5 px-3 text-right text-slate-500">
                                {row.rate !== undefined ? `PKR ${row.rate}` : '-'}
                              </td>
                              <td className="py-3.5 px-3 text-right text-slate-500">
                                {row.driverRent ? `PKR ${row.driverRent}` : '-'}
                              </td>
                              <td className="py-3.5 px-3 text-slate-600">
                                {row.driverName || '-'}
                              </td>
                              <td className="py-3.5 px-3 text-right font-bold text-slate-800">
                                {row.billAmount > 0 ? `PKR ${row.billAmount.toLocaleString()}` : '-'}
                              </td>
                              <td className="py-3.5 px-3 text-right font-bold text-emerald-700">
                                {row.cashPaid > 0 ? `PKR ${row.cashPaid.toLocaleString()}` : '0'}
                              </td>
                              <td className="py-3.5 px-3 text-right bg-slate-50 font-black text-slate-900">
                                PKR {row.runningBalance.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 mb-5 gap-4">
                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-900">Customer Ledgers Accounts</h3>
                    <p className="text-xs text-slate-500">Track direct credit buyers, overall credit statuses, and outstanding invoice balances</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedEntityId(customers[0]?.id || '');
                        setActiveModal('payment');
                      }}
                      className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Receive Payment
                    </button>
                    <button
                      onClick={() => {
                        setEditingCustomerId('');
                        setCustFormName('');
                        setCustFormPhone('');
                        setCustFormType('Credit');
                        setCustFormOpeningBalance('0');
                        setActiveModal('customer');
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add Customer</span>
                    </button>
                    <button
                      onClick={() => {
                        setSaleType('Credit');
                        setActiveModal('sale');
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>New Credit Log</span>
                    </button>
                  </div>
                </div>

                {/* Customer table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Customer Name</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4 text-right">Ledger Outstanding</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                      {customers.map(cust => (
                        <tr key={cust.id} className="hover:bg-slate-50/50">
                          <td className="py-4 px-4">
                            <button
                              onClick={() => setSelectedCustomerId(cust.id)}
                              className="font-bold text-slate-900 hover:text-emerald-700 hover:underline text-left cursor-pointer transition-colors block"
                            >
                              {cust.name}
                            </button>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              cust.type === 'Credit' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                            }`}>{cust.type} Customer</span>
                          </td>
                          <td className="py-4 px-4 text-xs text-slate-500">
                            {cust.phone}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="inline-block text-right">
                              <span className="font-display font-bold text-slate-900 block">PKR {cust.ledgerBalance.toLocaleString()}</span>
                              {cust.overdueAmount > 0 && (
                                <span className="text-[10px] text-rose-500 font-medium">Overdue: PKR {cust.overdueAmount.toLocaleString()}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedCustomerId(cust.id)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                              >
                                View Ledger
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCustomerId(cust.id);
                                  setCustFormName(cust.name);
                                  setCustFormPhone(cust.phone);
                                  setCustFormType(cust.type);
                                  setCustFormOpeningBalance((cust.openingBalance || 0).toString());
                                  setActiveModal('customer');
                                }}
                                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                              >
                                Edit Profile
                              </button>
                              {cust.ledgerBalance > 0 && (
                                <button
                                  onClick={() => {
                                    setSelectedEntityId(cust.id);
                                    setPaymentAmount(cust.ledgerBalance.toString());
                                    setActiveModal('payment');
                                  }}
                                  className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                                >
                                  Receive Settle
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB: TODAY'S SALES ----------------- */}
        {dashboardTab === 'sales' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              
              {/* Header with Title, Search, and Download Button */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-slate-900">{"Today's Sales"}</h3>
                    <p className="text-xs text-slate-500">Track and manage sales completed on {todayStr}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Date Picker */}
                  <div className="flex flex-col">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Filter Date</label>
                    <input
                      type="date"
                      value={selectedSalesDate}
                      onChange={(e) => setSelectedSalesDate(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-800 font-medium"
                    />
                  </div>

                  {/* Search bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by customer name..."
                      value={salesSearch}
                      onChange={(e) => setSalesSearch(e.target.value)}
                      className="w-full sm:w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-800 font-medium"
                    />
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={() => {
                      const todaySalesList = sales.filter(s => s.date === todayStr);
                      const headers = "Customer,Type,Product,Qty,Rate,Rickshaw,Bill,Cash,Remaining,Date,Time\n";
                      const rows = todaySalesList.map(s => 
                        `"${s.customerName}","${s.type}","${s.productName}","${s.volumeLiters}","${s.ratePerLiter}","${s.driverRent}","${s.totalAmount}","${s.paidAmount}","${s.totalAmount - s.paidAmount}","${s.date}","${s.time}"`
                      ).join("\n");
                      const blob = new Blob([headers + rows], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.setAttribute('href', url);
                      a.setAttribute('download', `DanishFarm_TodaySales_${todayStr}.csv`);
                      a.click();
                    }}
                    className="px-4 py-2 hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>Download Excel (All)</span>
                  </button>
                </div>
              </div>

              {/* Regular Sales Section */}
              <div className="mb-4">
                <h4 className="font-display font-extrabold text-sm text-slate-800 mb-3 uppercase tracking-wider">Regular Sales</h4>
                
                {/* Table */}
                <div className="overflow-x-auto border border-slate-100 rounded-xl shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
                        <th className="py-3.5 px-4 font-black">Customer</th>
                        <th className="py-3.5 px-4 font-black">Type</th>
                        <th className="py-3.5 px-4 font-black">Product</th>
                        <th className="py-3.5 px-4 font-black text-center">Qty</th>
                        <th className="py-3.5 px-4 font-black text-right">Rate</th>
                        <th className="py-3.5 px-4 font-black text-center">Rickshaw</th>
                        <th className="py-3.5 px-4 font-black text-right">Bill</th>
                        <th className="py-3.5 px-4 font-black text-right">Cash</th>
                        <th className="py-3.5 px-4 font-black text-right">Remaining</th>
                        <th className="py-3.5 px-4 font-black text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                      {(() => {
                        const todaySales = sales.filter(s => s.date === selectedSalesDate);
                        const filteredTodaySales = todaySales.filter(s => 
                          s.customerName.toLowerCase().includes(salesSearch.toLowerCase())
                        );

                        if (filteredTodaySales.length === 0) {
                          return (
                            <tr>
                              <td colSpan={10} className="py-12 text-center bg-slate-50 text-slate-400 font-medium italic">
                                No sales transactions found for today.
                              </td>
                            </tr>
                          );
                        }

                        return filteredTodaySales.map(sale => {
                          const remaining = sale.totalAmount - sale.paidAmount;
                          return (
                            <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-4 font-bold text-slate-900">
                                {sale.customerName}
                              </td>
                              <td className="py-4 px-4">
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                                  sale.type === 'Credit' 
                                    ? 'bg-amber-100 text-amber-800' 
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {sale.type.toLowerCase()}
                                </span>
                              </td>
                              <td className="py-4 px-4 font-semibold text-slate-600">
                                {sale.productName || 'Whole Milk'}
                              </td>
                              <td className="py-4 px-4 text-center font-bold text-slate-800">
                                {sale.volumeLiters}
                              </td>
                              <td className="py-4 px-4 text-right font-medium text-slate-800">
                                {sale.ratePerLiter.toLocaleString()}
                              </td>
                              <td className="py-4 px-4 text-center font-semibold text-slate-400">
                                {(sale.driverRent !== undefined && sale.driverRent > 0) ? sale.driverRent.toLocaleString() : '—'}
                              </td>
                              <td className="py-4 px-4 text-right font-bold text-slate-950">
                                {sale.totalAmount.toLocaleString()}
                              </td>
                              <td className="py-4 px-4 text-right font-bold text-slate-800">
                                {sale.paidAmount > 0 ? sale.paidAmount.toLocaleString() : '—'}
                              </td>
                              <td className="py-4 px-4 text-right font-black text-rose-600">
                                {remaining > 0 ? remaining.toLocaleString() : '—'}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center justify-center">
                                  <button
                                    onClick={() => handleDeleteSale(sale.id)}
                                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Sale"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Metrics Row */}
              {(() => {
                const todaySales = sales.filter(s => s.date === selectedSalesDate);
                const filteredTodaySales = todaySales.filter(s => 
                  s.customerName.toLowerCase().includes(salesSearch.toLowerCase())
                );
                
                const itemsOnPage = filteredTodaySales.length;
                const totalRecords = todaySales.length;
                const totalBilled = filteredTodaySales.reduce((sum, s) => sum + s.totalAmount, 0);
                const totalCash = filteredTodaySales.reduce((sum, s) => sum + s.paidAmount, 0);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Items On Page</p>
                      <h4 className="text-2xl font-black text-slate-800 mt-2">{itemsOnPage}</h4>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Records</p>
                      <h4 className="text-2xl font-black text-slate-800 mt-2">{totalRecords}</h4>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Billed (Page)</p>
                      <h4 className="text-2xl font-black text-slate-900 mt-2">Rs. {totalBilled.toLocaleString()}</h4>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Cash Collected (Page)</p>
                      <h4 className="text-2xl font-black text-emerald-600 mt-2">Rs. {totalCash.toLocaleString()}</h4>
                    </div>
                  </div>
                );
              })()}

              {/* TODAY'S EXPENSES SECTION */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mt-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-orange-100 rounded-xl flex items-center justify-center">
                      <Receipt className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-xl text-slate-900">{"Today's Expenses"}</h3>
                      <p className="text-xs text-slate-500">Track and manage expenses recorded on {selectedExpenseDate}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
                  {/* Date Picker */}
                  <div className="flex flex-col">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Filter Date</label>
                    <input
                      type="date"
                      value={selectedExpenseDate}
                      onChange={(e) => setSelectedExpenseDate(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all text-slate-800 font-medium"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-xl shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
                        <th className="py-3.5 px-4 font-black">Date</th>
                        <th className="py-3.5 px-4 font-black">Category</th>
                        <th className="py-3.5 px-4 font-black">Description</th>
                        <th className="py-3.5 px-4 font-black text-right">Amount (PKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                      {(() => {
                        const todayExpenses = expenses.filter(e => e.date === selectedExpenseDate);
                        if (todayExpenses.length === 0) {
                          return (
                            <tr>
                              <td colSpan={4} className="py-12 text-center bg-slate-50 text-slate-400 font-medium italic">
                                No expenses recorded for {selectedExpenseDate}.
                              </td>
                            </tr>
                          );
                        }
                        return todayExpenses.map(expense => (
                          <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-4 font-semibold text-slate-800">
                              {expense.date}
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                                {expense.category}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-600">
                              {expense.description || '—'}
                            </td>
                            <td className="py-4 px-4 text-right font-bold text-rose-600">
                              PKR {expense.amount.toLocaleString()}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Expenses Summary */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  {(() => {
                    const todayExpenses = expenses.filter(e => e.date === selectedExpenseDate);
                    const totalExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
                    const avgExpense = todayExpenses.length > 0 ? Math.round(totalExpenses / todayExpenses.length) : 0;
                    return (
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1">Total Expenses</p>
                          <p className="font-display font-bold text-2xl text-slate-900">
                            PKR {totalExpenses.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1">Count</p>
                          <p className="font-display font-bold text-2xl text-slate-900">
                            {todayExpenses.length}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1">Average</p>
                          <p className="font-display font-bold text-2xl text-slate-900">
                            PKR {avgExpense.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* ----------------------------------------------------
          MODAL SYSTEM (Animated backdrop, sleek forms)
         ---------------------------------------------------- */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100"
          >
              
              {/* Modal Header */}
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    {activeModal === 'production' && 'Log Shift Production'}
                    {activeModal === 'dispatch' && 'Dispatch Route to Milkman'}
                    {activeModal === 'sale' && 'Record New Customer Sale'}
                    {activeModal === 'expense' && 'Log Operational Expense'}
                    {activeModal === 'payment' && 'Receive Ledger Payment'}
                    {activeModal === 'milkman_reconcile' && 'Settle Milkman Route'}
                    {activeModal === 'animals' && 'Update Livestock Headcount'}
                    {activeModal === 'milkman_payment' && 'Receive Distributor Settlement'}
                    {activeModal === 'customer' && (editingCustomerId ? 'Edit Customer Account' : 'Add New Customer Account')}
                  </h3>
                  <p className="text-[10px] text-slate-400">All fields must be recorded accurately</p>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Forms */}
              <div className="p-6">
                
                {/* 1. Production Form */}
                {activeModal === 'production' && (
                  <form onSubmit={handleAddProduction} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Harvested Volume (Liters)</label>
                      <input
                        type="number"
                        placeholder="e.g. 250"
                        required
                        value={prodLiters}
                        onChange={(e) => setProdLiters(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Source Animal Species</label>
                      <select
                        value={prodSpecies}
                        onChange={(e) => setProdSpecies(e.target.value as 'All' | 'Cow' | 'Buffalo')}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                      >
                        <option value="All">All / Mixed Herd</option>
                        <option value="Cow">Cows Only</option>
                        <option value="Buffalo">Buffaloes Only</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fat Content (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 4.2"
                          required
                          value={prodFat}
                          onChange={(e) => setProdFat(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Shift</label>
                        <select
                          value={prodShift}
                          onChange={(e) => setProdShift(e.target.value as 'Morning' | 'Evening')}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                        >
                          <option value="Morning">Morning</option>
                          <option value="Evening">Evening</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Shift Notes (Optional)</label>
                      <textarea
                        placeholder="e.g. Temperature conditions, barn feedback..."
                        value={prodNotes}
                        onChange={(e) => setProdNotes(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm text-slate-800 h-20 resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer mt-2"
                    >
                      Save Shift Harvest
                    </button>
                  </form>
                )}

                {/* 2. Dispatch Form */}
                {activeModal === 'dispatch' && (
                  <form onSubmit={handleAddDispatch} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Milkman / Distributor</label>
                      <select
                        required
                        value={dispMilkmanId}
                        onChange={(e) => setDispMilkmanId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                      >
                        <option value="">-- Choose Distributor --</option>
                        {milkmen.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dispatched Liters</label>
                        <input
                          type="number"
                          placeholder="e.g. 120"
                          required
                          value={dispLiters}
                          onChange={(e) => setDispLiters(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rate per Liter (PKR)</label>
                        <input
                          type="number"
                          placeholder="200"
                          required
                          value={dispRate}
                          onChange={(e) => setDispRate(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Route notes (Sectors / Streets)</label>
                      <input
                        type="text"
                        placeholder="e.g. G-11/3 Sector delivery"
                        value={dispNotes}
                        onChange={(e) => setDispNotes(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm text-slate-800"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer mt-2"
                    >
                      Dispatch Load
                    </button>
                  </form>
                )}

                {/* 3. Sale Form */}
                {activeModal === 'sale' && (
                  <form onSubmit={handleAddSale} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer Name / shop</label>
                      <input
                        type="text"
                        placeholder="Enter client or store name"
                        required
                        value={saleCustName}
                        onChange={(e) => setSaleCustName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                        list="custNames"
                      />
                      <datalist id="custNames">
                        {customers.map(c => <option key={c.id} value={c.name} />)}
                      </datalist>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sales Type</label>
                        <select
                          value={saleType}
                          onChange={(e) => {
                            setSaleType(e.target.value as 'Cash' | 'Credit');
                            if (e.target.value === 'Cash') setSaleAmountPaid('');
                          }}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                        >
                          <option value="Cash">Cash Sale</option>
                          <option value="Credit">Credit Ledger</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Volume (Liters)</label>
                        <input
                          type="number"
                          placeholder="e.g. 50"
                          required
                          value={saleLiters}
                          onChange={(e) => setSaleLiters(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rate Per Liter (PKR)</label>
                        <input
                          type="number"
                          placeholder="200"
                          required
                          value={saleRate}
                          onChange={(e) => setSaleRate(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                        />
                      </div>
                      {saleType === 'Credit' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount Paid Today (PKR)</label>
                          <input
                            type="number"
                            placeholder="Optional"
                            value={saleAmountPaid}
                            onChange={(e) => setSaleAmountPaid(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                          />
                        </div>
                      )}
                    </div>

                    {/* Extended Details for High Fidelity Ledger */}
                    <div className="border-t border-slate-100 pt-4 mt-4 space-y-4">
                      <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Extended Delivery & Ledger Details</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bill / Invoice #</label>
                          <input
                            type="text"
                            placeholder="e.g. B-1005 (Auto)"
                            value={saleBillNumber}
                            onChange={(e) => setSaleBillNumber(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Product Name</label>
                          <select
                            value={saleProduct}
                            onChange={(e) => setSaleProduct(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                          >
                            <option value="Whole Milk">Whole Milk</option>
                            <option value="Buffalo Milk">Buffalo Milk</option>
                            <option value="Cow Milk">Cow Milk</option>
                            <option value="Yogurt">Yogurt</option>
                            <option value="Butter">Butter</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Driver Rent (PKR)</label>
                          <input
                            type="number"
                            placeholder="e.g. 500"
                            value={saleDriverRent}
                            onChange={(e) => setSaleDriverRent(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Driver Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Bashir Ahmad"
                            value={saleDriverName}
                            onChange={(e) => setSaleDriverName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                            list="driverNames"
                          />
                          <datalist id="driverNames">
                            {milkmen.map(m => <option key={m.id} value={m.name} />)}
                            <option value="Self Pickup" />
                          </datalist>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer mt-2"
                    >
                      Record Sale Entry
                    </button>
                  </form>
                )}

                {/* 4. Expense Form */}
                {activeModal === 'expense' && (
                  <form onSubmit={handleAddExpense} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                        <select
                          value={expCategory}
                          onChange={(e) => setExpCategory(e.target.value as Expense['category'])}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                        >
                          <option value="Feed">Cattle Feed</option>
                          <option value="Veterinary">Veterinary/Medicine</option>
                          <option value="Salaries">Worker Salary</option>
                          <option value="Diesel/Fuel">Generator Fuel/Diesel</option>
                          <option value="Utility">Farm Utility Bills</option>
                          <option value="Equipment">Farm Equipment</option>
                          <option value="Other">Other Expenses</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expense Amount (PKR)</label>
                        <input
                          type="number"
                          placeholder="e.g. 5000"
                          required
                          value={expAmount}
                          onChange={(e) => setExpAmount(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description / Memo</label>
                      <textarea
                        placeholder="Identify items or labor description..."
                        required
                        value={expDesc}
                        onChange={(e) => setExpDesc(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm text-slate-800 h-24 resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer mt-2"
                    >
                      Log Expense Entry
                    </button>
                  </form>
                )}

                {/* 5. Ledger Payment Form */}
                {activeModal === 'payment' && (
                  <form onSubmit={handleReceivePayment} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Choose Outstanding Customer</label>
                      <select
                        required
                        value={selectedEntityId}
                        onChange={(e) => {
                          setSelectedEntityId(e.target.value);
                          const cust = customers.find(c => c.id === e.target.value);
                          if (cust) setPaymentAmount(cust.ledgerBalance.toString());
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                      >
                        <option value="">-- Choose Account --</option>
                        {customers.filter(c => c.ledgerBalance > 0).map(c => (
                          <option key={c.id} value={c.id}>{c.name} (PKR {c.ledgerBalance.toLocaleString()} due)</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Amount Received (PKR)</label>
                      <input
                        type="number"
                        placeholder="e.g. 10000"
                        required
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer mt-2"
                    >
                      Receive Payment
                    </button>
                  </form>
                )}

                {/* 6. Milkman Route Reconcile Form */}
                {activeModal === 'milkman_reconcile' && (
                  <form onSubmit={handleMilkmanReconcile} className="space-y-4">
                    <p className="text-xs text-slate-500 bg-amber-50 p-3 rounded-lg border border-amber-100">
                      You are closing shift routes and settling collected accounts for <strong>{milkmen.find(m => m.id === reconcileMilkmanId)?.name}</strong>. Please enter the final counts returned.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cash Collected (PKR)</label>
                        <input
                          type="number"
                          placeholder="e.g. 15000"
                          required
                          value={reconcileCash}
                          onChange={(e) => setReconcileCash(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unpaid / Unsold (PKR)</label>
                        <input
                          type="number"
                          placeholder="e.g. 2000"
                          required
                          value={reconcileCredit}
                          onChange={(e) => setReconcileCredit(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer mt-2"
                    >
                      Settle & Close Shift Route
                    </button>
                  </form>
                )}

                {/* 7. Animal Inventory Form */}
                {activeModal === 'animals' && (
                  <form onSubmit={handleUpdateAnimals} className="space-y-4">
                    <p className="text-xs text-slate-500 bg-amber-50/70 p-3 rounded-lg border border-amber-100">
                      Update the total number of live animals present on the farm. Enter the simple head counts.
                    </p>
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cows Headcount</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={editCows}
                          onChange={(e) => setEditCows(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Buffalo Headcount</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={editBuffalo}
                          onChange={(e) => setEditBuffalo(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Calves Headcount</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={editCalf}
                          onChange={(e) => setEditCalf(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer mt-4"
                    >
                      Update Headcount Inventory
                    </button>
                  </form>
                )}

                {/* 8. Milkman Settlement Payment Form */}
                {activeModal === 'milkman_payment' && (
                  <form onSubmit={handleMilkmanPayment} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Distributor / Milkman</label>
                      <select
                        required
                        value={selectedEntityId || selectedMilkmanId}
                        onChange={(e) => {
                          setSelectedEntityId(e.target.value);
                          const man = milkmen.find(m => m.id === e.target.value);
                          if (man) setPaymentAmount(man.outstandingCredit.toString());
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                      >
                        <option value="">-- Choose Account --</option>
                        {milkmen.map(m => (
                          <option key={m.id} value={m.id}>{m.name} (PKR {m.outstandingCredit.toLocaleString()} outstanding)</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Amount (PKR)</label>
                      <input
                        type="number"
                        placeholder="e.g. 5000"
                        required
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes / Remarks</label>
                      <input
                        type="text"
                        placeholder="e.g. Received partial cash against route balance"
                        value={milkmanPaymentNotes}
                        onChange={(e) => setMilkmanPaymentNotes(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm text-slate-800"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer mt-2"
                    >
                      Receive Settle Payment
                    </button>
                  </form>
                )}

                {/* 9. Customer Form (Add/Edit with Opening Balance) */}
                {activeModal === 'customer' && (
                  <form onSubmit={handleSaveCustomer} className="space-y-4">
                    <p className="text-xs text-slate-500 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                      {editingCustomerId 
                        ? "Edit this customer's name, phone, type, and opening balance." 
                        : "Register a new customer account directly and set their initial opening balance."}
                    </p>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer Name / Shop</label>
                      <input
                        type="text"
                        placeholder="e.g. Faisalabad Sweets & Bakers"
                        required
                        value={custFormName}
                        onChange={(e) => setCustFormName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                        <input
                          type="text"
                          placeholder="e.g. 0321-1112223"
                          value={custFormPhone}
                          onChange={(e) => setCustFormPhone(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer Type</label>
                        <select
                          value={custFormType}
                          onChange={(e) => setCustFormType(e.target.value as 'Cash' | 'Credit')}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                        >
                          <option value="Credit">Credit Ledger (Khata)</option>
                          <option value="Cash">Cash Customer</option>
                        </select>
                      </div>
                    </div>
                    {custFormType === 'Credit' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Opening Balance (PKR)</label>
                        <input
                          type="number"
                          placeholder="e.g. 25000"
                          value={custFormOpeningBalance}
                          onChange={(e) => setCustFormOpeningBalance(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Pre-existing ledger balance before system tracking. Positive value means the customer owes you.</p>
                      </div>
                    )}
                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer mt-2"
                    >
                      {editingCustomerId ? 'Update Customer Profile' : 'Create Customer Account'}
                    </button>
                  </form>
                )}

              </div>
          </div>
        </div>
      )}

    </div>
  );
}
