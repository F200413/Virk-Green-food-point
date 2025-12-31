import { firestore } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Calculate actual rates from purchase data (same as Abdullah function)
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
 * Import monthly rates from JSON data and update Firestore
 * Calculates rates from actual purchase data (same as Abdullah function)
 * @param {Object} jsonData - The exported monthly user data JSON
 * @param {Function} onProgress - Callback function for progress updates (customerIndex, totalCustomers)
 * @returns {Promise<Object>} Result with success count and errors
 */
export const importMonthlyRatesFromJSON = async (jsonData, onProgress = null) => {
    try {
        console.log('Starting rates import for all customers...');
        
        // Get current rates document
        const ratesDoc = doc(firestore, 'settings', 'rates');
        const ratesSnapshot = await getDoc(ratesDoc);
        
        let currentRates = {
            milk: 120,
            yogurt: 140,
            monthlyRates: {}
        };
        
        if (ratesSnapshot.exists()) {
            currentRates = ratesSnapshot.data();
            // Ensure monthlyRates exists
            if (!currentRates.monthlyRates) {
                currentRates.monthlyRates = {};
            }
        }
        
        const customers = jsonData.customers || [];
        let successCount = 0;
        const errors = [];
        
        // Process each customer (same logic as Abdullah function)
        for (let i = 0; i < customers.length; i++) {
            const customer = customers[i];
            const customerId = customer.customerId;
            const monthlyData = customer.monthlyData || [];
            
            // Process each month for this customer
            monthlyData.forEach(monthData => {
                const { year, month, purchases } = monthData;
                
                // Calculate actual rates from purchases (same as Abdullah)
                const purchaseRates = [];
                purchases.forEach(purchase => {
                    const rates = calculateRatesFromPurchase(purchase);
                    if (rates) {
                        purchaseRates.push(rates);
                    }
                });
                
                // Calculate average rates for this month
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
                
                // Calculate average rates
                let milkRate = null;
                let yogurtRate = null;
                
                if (milkRatesCount > 0) {
                    milkRate = milkRatesSum / milkRatesCount;
                }
                
                if (yogurtRatesCount > 0) {
                    yogurtRate = yogurtRatesSum / yogurtRatesCount;
                }
                
                // If we couldn't calculate from purchases, use the rate from JSON as fallback
                if (milkRate == null) {
                    milkRate = monthData.milkRate || currentRates.milk;
                }
                if (yogurtRate == null) {
                    yogurtRate = monthData.yogurtRate || currentRates.yogurt;
                }
                
                // Set the monthly rate with calculated rates from purchases
                if (milkRate > 0 && yogurtRate > 0) {
                    const key = `${customerId}_${year}_${month}`;
                    
                    currentRates.monthlyRates[key] = {
                        milkRate: milkRate,
                        yogurtRate: yogurtRate,
                        customerId: customerId,
                        month: month,
                        year: year,
                        importedAt: new Date().toISOString(),
                        rateSource: 'calculated_from_purchases',
                        note: `Calculated from ${purchases.length} purchases in ${monthData.monthName} ${year}`
                    };
                    
                    successCount++;
                }
            });
            
            // Update progress
            if (onProgress) {
                onProgress(i + 1, customers.length);
            }
        }
        
        console.log(`Saving ${Object.keys(currentRates.monthlyRates).length} monthly rates...`);
        
        // Save all rates to Firestore
        await setDoc(ratesDoc, currentRates);
        
        console.log('✅ All rates imported successfully!');
        
        return {
            success: true,
            importedRatesCount: successCount,
            totalCustomers: customers.length,
            totalMonthlyRates: Object.keys(currentRates.monthlyRates).length,
            errors: errors.length > 0 ? errors : null
        };
    } catch (error) {
        console.error("Error importing monthly rates: ", error);
        throw error;
    }
};

/**
 * Import monthly rates from a JSON file
 * @param {File} file - The JSON file to import
 * @param {Function} onProgress - Callback function for progress updates
 * @returns {Promise<Object>} Result with success count and errors
 */
export const importMonthlyRatesFromFile = async (file, onProgress = null) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                const result = await importMonthlyRatesFromJSON(jsonData, onProgress);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
    });
};

