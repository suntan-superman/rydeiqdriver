import { db } from './firebase/config';
import { collection, query, where, orderBy, getDoc, getDocs, doc, addDoc, updateDoc, deleteDoc, limit } from 'firebase/firestore';

function getTimeRangeFilter(timeRange = '30d') {
  const now = new Date();
  switch (timeRange) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

class PaymentService {
  async getPaymentDashboard(userId = null, timeRange = '30d') {
    // Payment processing
    const paymentProcessing = await this.getPaymentProcessing(userId, timeRange);
    // Banking integration
    const bankingIntegration = await this.getBankingIntegration(userId);
    // Financial analytics
    const financialAnalytics = await this.getFinancialAnalytics(userId, timeRange);
    // Payment history
    const paymentHistory = await this.getPaymentHistory(userId, timeRange);
    // Transaction management
    const transactionManagement = await this.getTransactionManagement(userId, timeRange);
    // Financial reporting
    const financialReporting = await this.getFinancialReporting(userId, timeRange);
    // Payment methods
    const paymentMethods = await this.getPaymentMethods(userId);
    // Tax management
    const taxManagement = await this.getTaxManagement(userId, timeRange);
    
    return {
      paymentProcessing,
      bankingIntegration,
      financialAnalytics,
      paymentHistory,
      transactionManagement,
      financialReporting,
      paymentMethods,
      taxManagement,
      timestamp: Date.now()
    };
  }

  async getPaymentProcessing(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const paymentsRef = collection(db, 'payments');
    let paymentsQuery;
    
    if (userId) {
      paymentsQuery = query(
        paymentsRef,
        where('driverId', '==', userId),
        where('createdAt', '>=', timeFilter),
        orderBy('createdAt', 'desc')
      );
    } else {
      paymentsQuery = query(
        paymentsRef,
        where('createdAt', '>=', timeFilter),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
    }
    
    const paymentsSnapshot = await getDocs(paymentsQuery);
    const payments = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      recentPayments: payments,
      totalPayments: payments.length,
      paymentStats: {
        totalAmount: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
        averageAmount: payments.length > 0 ? payments.reduce((sum, payment) => sum + (payment.amount || 0), 0) / payments.length : 0,
        successfulPayments: payments.filter(p => p.status === 'completed').length,
        pendingPayments: payments.filter(p => p.status === 'pending').length
      },
      paymentMethods: ['Direct Deposit', 'Bank Transfer', 'PayPal', 'Stripe', 'Cash']
    };
  }

  async getBankingIntegration(userId) {
    // Mock banking integration data
    return {
      connectedAccounts: [
        { 
          bank: 'Chase Bank', 
          accountType: 'Checking', 
          last4: '1234', 
          status: 'Connected',
          balance: 2450.67,
          lastSync: '2024-01-25T10:30:00Z'
        },
        { 
          bank: 'Bank of America', 
          accountType: 'Savings', 
          last4: '5678', 
          status: 'Connected',
          balance: 12500.00,
          lastSync: '2024-01-25T10:30:00Z'
        }
      ],
      totalBalance: 14950.67,
      autoTransfer: {
        enabled: true,
        amount: 500,
        frequency: 'weekly',
        destination: 'Chase Bank ****1234'
      },
      bankSync: {
        lastSync: '2024-01-25T10:30:00Z',
        syncStatus: 'success',
        nextSync: '2024-01-26T10:30:00Z'
      }
    };
  }

  async getFinancialAnalytics(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const transactionsRef = collection(db, 'transactions');
    let transactionsQuery;
    
    if (userId) {
      transactionsQuery = query(
        transactionsRef,
        where('driverId', '==', userId),
        where('date', '>=', timeFilter),
        orderBy('date', 'desc')
      );
    } else {
      transactionsQuery = query(
        transactionsRef,
        where('date', '>=', timeFilter),
        orderBy('date', 'desc')
      );
    }
    
    const transactionsSnapshot = await getDocs(transactionsQuery);
    const transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      totalRevenue: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0),
      totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0),
      netIncome: transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount || 0), 0),
      averageDailyEarnings: this.calculateAverageDailyEarnings(transactions),
      revenueGrowth: '+15%',
      expenseBreakdown: {
        fuel: transactions.filter(t => t.category === 'fuel').reduce((sum, t) => sum + (t.amount || 0), 0),
        maintenance: transactions.filter(t => t.category === 'maintenance').reduce((sum, t) => sum + (t.amount || 0), 0),
        insurance: transactions.filter(t => t.category === 'insurance').reduce((sum, t) => sum + (t.amount || 0), 0),
        other: transactions.filter(t => !['fuel', 'maintenance', 'insurance'].includes(t.category)).reduce((sum, t) => sum + (t.amount || 0), 0)
      }
    };
  }

  async getPaymentHistory(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const historyRef = collection(db, 'paymentHistory');
    let historyQuery;
    
    if (userId) {
      historyQuery = query(
        historyRef,
        where('driverId', '==', userId),
        where('date', '>=', timeFilter),
        orderBy('date', 'desc'),
        limit(50)
      );
    } else {
      historyQuery = query(
        historyRef,
        where('date', '>=', timeFilter),
        orderBy('date', 'desc'),
        limit(20)
      );
    }
    
    const historySnapshot = await getDocs(historyQuery);
    const history = historySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      history,
      totalTransactions: history.length,
      transactionTypes: ['Payment', 'Transfer', 'Withdrawal', 'Deposit', 'Refund'],
      averageTransactionAmount: history.length > 0 ? history.reduce((sum, h) => sum + (h.amount || 0), 0) / history.length : 0
    };
  }

  async getTransactionManagement(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const transactionsRef = collection(db, 'transactions');
    let transactionsQuery;
    
    if (userId) {
      transactionsQuery = query(
        transactionsRef,
        where('driverId', '==', userId),
        where('date', '>=', timeFilter),
        orderBy('date', 'desc')
      );
    } else {
      transactionsQuery = query(
        transactionsRef,
        where('date', '>=', timeFilter),
        orderBy('date', 'desc'),
        limit(30)
      );
    }
    
    const transactionsSnapshot = await getDocs(transactionsQuery);
    const transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      transactions,
      totalTransactions: transactions.length,
      pendingTransactions: transactions.filter(t => t.status === 'pending').length,
      completedTransactions: transactions.filter(t => t.status === 'completed').length,
      failedTransactions: transactions.filter(t => t.status === 'failed').length,
      transactionCategories: ['Ride Earnings', 'Tips', 'Bonuses', 'Fuel', 'Maintenance', 'Insurance', 'Other']
    };
  }

  async getFinancialReporting(userId, timeRange) {
    // Mock financial reporting data
    return {
      monthlyReport: {
        totalEarnings: 3245.67,
        totalExpenses: 1250.45,
        netIncome: 1995.22,
        ridesCompleted: 156,
        averagePerRide: 20.81
      },
      quarterlyReport: {
        totalEarnings: 9875.34,
        totalExpenses: 3890.12,
        netIncome: 5985.22,
        growthRate: '+12%',
        topEarningMonth: 'December'
      },
      yearlyReport: {
        totalEarnings: 45678.90,
        totalExpenses: 18945.67,
        netIncome: 26733.23,
        taxOwed: 5346.65,
        savingsRate: '58%'
      },
      reportTypes: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']
    };
  }

  async getPaymentMethods(userId) {
    // Mock payment methods data
    return {
      savedMethods: [
        {
          id: 'pm_1',
          type: 'bank_account',
          bank: 'Chase Bank',
          last4: '1234',
          isDefault: true,
          status: 'active'
        },
        {
          id: 'pm_2',
          type: 'card',
          brand: 'Visa',
          last4: '5678',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: false,
          status: 'active'
        }
      ],
      defaultMethod: 'pm_1',
      totalMethods: 2,
      supportedMethods: ['Bank Account', 'Credit Card', 'Debit Card', 'PayPal']
    };
  }

  async getTaxManagement(userId, timeRange) {
    const timeFilter = getTimeRangeFilter(timeRange);
    const taxRef = collection(db, 'taxRecords');
    let taxQuery;
    
    if (userId) {
      taxQuery = query(
        taxRef,
        where('driverId', '==', userId),
        where('year', '==', new Date().getFullYear())
      );
    } else {
      taxQuery = query(taxRef, limit(10));
    }
    
    const taxSnapshot = await getDocs(taxQuery);
    const taxRecords = taxSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      currentYearTaxes: {
        totalEarnings: 45678.90,
        totalDeductions: 18945.67,
        taxableIncome: 26733.23,
        estimatedTax: 5346.65,
        taxWithheld: 3200.00,
        balanceDue: 2146.65
      },
      taxRecords,
      taxDeadlines: [
        { type: 'Quarterly Estimated Tax', date: '2024-04-15', status: 'Upcoming' },
        { type: 'Annual Tax Return', date: '2024-04-15', status: 'Upcoming' }
      ],
      taxDocuments: [
        { name: '1099-K', status: 'Available', year: 2023 },
        { name: 'W-2', status: 'Not Applicable', year: 2023 }
      ]
    };
  }

  calculateAverageDailyEarnings(transactions) {
    if (transactions.length === 0) return 0;
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const totalDays = this.getUniqueDays(transactions);
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    return totalDays > 0 ? totalIncome / totalDays : 0;
  }

  getUniqueDays(transactions) {
    const dates = transactions.map(t => new Date(t.date).toDateString());
    return new Set(dates).size;
  }

  // Additional methods for payment management
  async processPayment(paymentData) {
    const paymentsRef = collection(db, 'payments');
    return await addDoc(paymentsRef, {
      ...paymentData,
      createdAt: new Date(),
      status: 'pending'
    });
  }

  async addTransaction(transactionData) {
    const transactionsRef = collection(db, 'transactions');
    return await addDoc(transactionsRef, {
      ...transactionData,
      date: new Date(),
      createdAt: new Date()
    });
  }

  async updatePaymentStatus(paymentId, status) {
    const paymentRef = doc(db, 'payments', paymentId);
    await updateDoc(paymentRef, {
      status,
      updatedAt: new Date()
    });
  }

  async addPaymentMethod(methodData) {
    const methodsRef = collection(db, 'paymentMethods');
    return await addDoc(methodsRef, {
      ...methodData,
      createdAt: new Date(),
      status: 'active'
    });
  }

  async updateBankingInfo(bankingData) {
    const bankingRef = collection(db, 'bankingInfo');
    return await addDoc(bankingRef, {
      ...bankingData,
      updatedAt: new Date()
    });
  }
}

export const paymentService = new PaymentService();
export default paymentService; 