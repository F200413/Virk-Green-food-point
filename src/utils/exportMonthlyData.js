import { firestore } from '../firebase';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';

/**
 * Calculate actual rates from purchase data
 * @param {Object} purchase - Purchase object
 * @returns {Object} { milkRate, yogurtRate } or null if cannot calculate
 */
const calculateRatesFromPurchase = (purchase) => {
    const milk = parseFloat(purchase.milk) || 0;
    const yogurt = parseFloat(purchase.yogurt) || 0;
    const total = parseFloat(purchase.total) || 0;
    
    // If purchase has stored rates, use them (most accurate)
    if (purchase.milkRate && purchase.yogurtRate) {
        return {
            milkRate: parseFloat(purchase.milkRate),
            yogurtRate: parseFloat(purchase.yogurtRate)
        };
    }
    
    // If only milk is present, calculate milk rate
    if (milk > 0 && yogurt === 0 && total > 0) {
        return {
            milkRate: total / milk,
            yogurtRate: null
        };
    }
    
    // If only yogurt is present, calculate yogurt rate
    if (yogurt > 0 && milk === 0 && total > 0) {
        return {
            milkRate: null,
            yogurtRate: total / yogurt
        };
    }
    
    // If both are present, we can't determine individual rates from total alone
    // Return null to use fallback rates
    return null;
};

/**
 * Get all monthly user data with detailed information
 * @returns {Promise<Object>} Complete monthly data for all users
 */
export const getAllMonthlyUserData = async () => {
    try {
        // Fetch all customers
        const customersCollection = collection(firestore, 'customers');
        const customersSnapshot = await getDocs(customersCollection);
        const customers = customersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Fetch all purchases
        const purchasesCollection = collection(firestore, 'purchases');
        const q = query(purchasesCollection, orderBy('date', 'desc'));
        const purchasesSnapshot = await getDocs(q);
        const purchases = purchasesSnapshot.docs.map(doc => {
            const rawDate = doc.data().date;
            let date;
            if (rawDate && typeof rawDate.toDate === 'function') {
                date = rawDate.toDate();
            } else if (rawDate) {
                date = new Date(rawDate);
            } else {
                date = null;
            }
            return {
                id: doc.id,
                ...doc.data(),
                date
            };
        });

        // Fetch rates including monthly rates (for fallback)
        const ratesDoc = doc(firestore, 'settings', 'rates');
        const ratesSnapshot = await getDoc(ratesDoc);
        const rates = ratesSnapshot.exists() ? ratesSnapshot.data() : {
            milk: 120,
            yogurt: 140,
            monthlyRates: {}
        };

        // Helper function to get monthly rates for a customer (fallback only)
        const getMonthlyRates = (customerId, month, year) => {
            const key = `${customerId}_${year}_${month}`;
            if (!rates.monthlyRates) return null;
            
            const monthlyRate = rates.monthlyRates[key];
            if (monthlyRate &&
                typeof monthlyRate.milkRate === 'number' && monthlyRate.milkRate > 0 &&
                typeof monthlyRate.yogurtRate === 'number' && monthlyRate.yogurtRate > 0) {
                return monthlyRate;
            }
            
            return null;
        };

        // Process data for each customer
        const monthlyData = [];

        customers.forEach(customer => {
            const customerPurchases = purchases.filter(p => p.customerId === customer.id);
            
            // Group purchases by month and year
            const monthlyGroups = {};
            
            customerPurchases.forEach(purchase => {
                if (!purchase.date) return;
                
                const purchaseDate = new Date(purchase.date);
                const month = purchaseDate.getMonth();
                const year = purchaseDate.getFullYear();
                const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
                
                if (!monthlyGroups[monthKey]) {
                    monthlyGroups[monthKey] = {
                        year,
                        month,
                        monthName: purchaseDate.toLocaleString('en-US', { month: 'long' }),
                        purchases: [],
                        totalMilk: 0,
                        totalYogurt: 0,
                        totalAmount: 0,
                        milkRate: null,
                        yogurtRate: null,
                        rateSource: 'calculated',
                        purchaseRates: [] // Store rates from individual purchases
                    };
                }
                
                // Calculate actual rates from this purchase
                const purchaseRates = calculateRatesFromPurchase(purchase);
                if (purchaseRates) {
                    monthlyGroups[monthKey].purchaseRates.push(purchaseRates);
                }
                
                monthlyGroups[monthKey].purchases.push({
                    id: purchase.id,
                    date: purchase.date,
                    milk: parseFloat(purchase.milk) || 0,
                    yogurt: parseFloat(purchase.yogurt) || 0,
                    total: parseFloat(purchase.total) || 0,
                    milkRate: purchase.milkRate || null,
                    yogurtRate: purchase.yogurtRate || null
                });
                
                monthlyGroups[monthKey].totalMilk += parseFloat(purchase.milk) || 0;
                monthlyGroups[monthKey].totalYogurt += parseFloat(purchase.yogurt) || 0;
                monthlyGroups[monthKey].totalAmount += parseFloat(purchase.total) || 0;
            });
            
            // Calculate average rates for each month from actual purchase data
            Object.keys(monthlyGroups).forEach(monthKey => {
                const group = monthlyGroups[monthKey];
                const purchaseRates = group.purchaseRates;
                
                // Calculate average rates from actual purchases
                let milkRatesSum = 0;
                let milkRatesCount = 0;
                let yogurtRatesSum = 0;
                let yogurtRatesCount = 0;
                
                purchaseRates.forEach(rate => {
                    if (rate.milkRate != null) {
                        milkRatesSum += rate.milkRate;
                        milkRatesCount++;
                    }
                    if (rate.yogurtRate != null) {
                        yogurtRatesSum += rate.yogurtRate;
                        yogurtRatesCount++;
                    }
                });
                
                // Use calculated average rates if available
                if (milkRatesCount > 0) {
                    group.milkRate = milkRatesSum / milkRatesCount;
                    group.rateSource = 'calculated';
                } else {
                    // Fallback to monthly rates or global rates
                    const monthlyRates = getMonthlyRates(customer.id, group.month, group.year);
                    group.milkRate = monthlyRates ? monthlyRates.milkRate : rates.milk;
                    group.rateSource = monthlyRates ? 'monthly' : 'global';
                }
                
                if (yogurtRatesCount > 0) {
                    group.yogurtRate = yogurtRatesSum / yogurtRatesCount;
                    if (group.rateSource === 'global') {
                        group.rateSource = 'calculated';
                    }
                } else {
                    // Fallback to monthly rates or global rates
                    const monthlyRates = getMonthlyRates(customer.id, group.month, group.year);
                    group.yogurtRate = monthlyRates ? monthlyRates.yogurtRate : rates.yogurt;
                    if (group.rateSource === 'global' && !monthlyRates) {
                        group.rateSource = 'global';
                    } else if (group.rateSource === 'calculated' && monthlyRates) {
                        // Keep calculated if we have it
                    }
                }
            });
            
            // Convert to array and sort by year and month
            const monthlyArray = Object.values(monthlyGroups).sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return b.month - a.month;
            });
            
            if (monthlyArray.length > 0) {
                monthlyData.push({
                    customerId: customer.id,
                    customerName: customer.name || 'Unknown',
                    customerPhone: customer.phone || '',
                    customerAddress: customer.address || '',
                    monthlyData: monthlyArray,
                    totalMonths: monthlyArray.length,
                    totalMilkAllTime: monthlyArray.reduce((sum, m) => sum + m.totalMilk, 0),
                    totalYogurtAllTime: monthlyArray.reduce((sum, m) => sum + m.totalYogurt, 0),
                    totalAmountAllTime: monthlyArray.reduce((sum, m) => sum + m.totalAmount, 0)
                });
            }
        });
        
        // Create the final export object
        const exportData = {
            exportDate: new Date().toISOString(),
            exportInfo: {
                totalCustomers: customers.length,
                totalCustomersWithData: monthlyData.length,
                totalPurchases: purchases.length,
                globalRates: {
                    milk: rates.milk,
                    yogurt: rates.yogurt
                }
            },
            customers: monthlyData.sort((a, b) => a.customerName.localeCompare(b.customerName))
        };
        
        return exportData;
    } catch (error) {
        console.error("Error fetching monthly user data: ", error);
        throw error;
    }
};

/**
 * Export monthly user data to JSON file
 * @param {string} filename - Optional filename (default: monthly_user_data_YYYY-MM-DD.json)
 * @returns {Promise<void>}
 */
export const exportMonthlyDataToJSON = async (filename = null) => {
    try {
        const data = await getAllMonthlyUserData();
        
        // Create filename if not provided
        if (!filename) {
            const date = new Date();
            const dateStr = date.toISOString().split('T')[0];
            filename = `monthly_user_data_${dateStr}.json`;
        }
        
        // Convert to JSON string with pretty formatting
        const jsonString = JSON.stringify(data, null, 2);
        
        // Create blob and download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        return { success: true, filename, data };
    } catch (error) {
        console.error("Error exporting monthly data: ", error);
        throw error;
    }
};
