import { firestore } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
    
    // If both are present, try to solve the equation
    // total = (milk * milkRate) + (yogurt * yogurtRate)
    // We need at least one known rate or make an assumption
    // For now, if we can't determine, return null
    return null;
};

/**
 * Import rates for Abdullah customer only from JSON data
 * @param {Object} jsonData - The exported monthly user data JSON
 * @returns {Promise<Object>} Result with success count and errors
 */
export const importAbdullahRatesFromJSON = async (jsonData) => {
    try {
        console.log('Starting Abdullah rates import...');
        
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
            if (!currentRates.monthlyRates) {
                currentRates.monthlyRates = {};
            }
        }
        
        // Find Abdullah customer
        const customers = jsonData.customers || [];
        const abdullahCustomer = customers.find(c => 
            c.customerName && c.customerName.toLowerCase().includes('abdullah')
        );
        
        if (!abdullahCustomer) {
            throw new Error('Abdullah customer not found in JSON data');
        }
        
        console.log('Found Abdullah customer:', abdullahCustomer.customerName);
        console.log('Customer ID:', abdullahCustomer.customerId);
        
        const customerId = abdullahCustomer.customerId;
        const monthlyData = abdullahCustomer.monthlyData || [];
        
        let importedCount = 0;
        const rateDetails = [];
        
        // Process each month for Abdullah
        monthlyData.forEach(monthData => {
            const { year, month, purchases } = monthData;
            
            console.log(`\nProcessing ${monthData.monthName} ${year}:`);
            console.log(`  Purchases: ${purchases.length}`);
            
            // Calculate actual rates from purchases
            const purchaseRates = [];
            purchases.forEach(purchase => {
                const rates = calculateRatesFromPurchase(purchase);
                if (rates) {
                    purchaseRates.push(rates);
                    console.log(`    Purchase ${purchase.id}:`, {
                        milk: purchase.milk,
                        yogurt: purchase.yogurt,
                        total: purchase.total,
                        calculatedRates: rates
                    });
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
            
            // If we couldn't calculate from purchases, use the rate from JSON (but it might be wrong)
            if (milkRate == null) {
                milkRate = monthData.milkRate || currentRates.milk;
            }
            if (yogurtRate == null) {
                yogurtRate = monthData.yogurtRate || currentRates.yogurt;
            }
            
            console.log(`  Calculated rates: Milk=${milkRate}, Yogurt=${yogurtRate}`);
            
            // Set the monthly rate
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
                
                importedCount++;
                rateDetails.push({
                    month: monthData.monthName,
                    year: year,
                    milkRate: milkRate,
                    yogurtRate: yogurtRate,
                    purchasesCount: purchases.length
                });
            }
        });
        
        console.log(`\nSaving ${importedCount} monthly rates for Abdullah...`);
        
        // Save all rates to Firestore
        await setDoc(ratesDoc, currentRates);
        
        console.log('✅ Abdullah rates imported successfully!');
        console.log('\n📊 Summary:');
        rateDetails.forEach(detail => {
            console.log(`  ${detail.month} ${detail.year}: Milk=${detail.milkRate}, Yogurt=${detail.yogurtRate} (from ${detail.purchasesCount} purchases)`);
        });
        
        return {
            success: true,
            importedRatesCount: importedCount,
            customerId: customerId,
            customerName: abdullahCustomer.customerName,
            rateDetails: rateDetails
        };
    } catch (error) {
        console.error('❌ Error importing Abdullah rates: ', error);
        throw error;
    }
};

/**
 * Import Abdullah rates from a JSON file
 * @param {File} file - The JSON file to import
 * @returns {Promise<Object>} Result with success count and errors
 */
export const importAbdullahRatesFromFile = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                const result = await importAbdullahRatesFromJSON(jsonData);
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

