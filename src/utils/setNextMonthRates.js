import { firestore } from '../firebase';
import { collection, getDocs, query, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Get the last purchase for a customer
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object|null>} Last purchase or null
 */
const getLastPurchase = async (customerId) => {
    try {
        const purchasesRef = collection(firestore, 'purchases');
        // Get all purchases ordered by date descending
        const q = query(
            purchasesRef,
            orderBy('date', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        // Find the last purchase for this customer
        // Since we can't filter by customerId in the query (would need composite index),
        // we'll iterate through results (should be fast for reasonable data sizes)
        for (const docSnap of querySnapshot.docs) {
            const purchase = docSnap.data();
            if (purchase.customerId === customerId) {
                return { id: docSnap.id, ...purchase };
            }
        }
        
        return null;
    } catch (error) {
        console.error(`Error getting last purchase for customer ${customerId}:`, error);
        return null;
    }
};

/**
 * Get rates from purchase (stored rates or calculate from total)
 * @param {Object} purchase - Purchase object
 * @returns {Object|null} { milkRate, yogurtRate } or null
 */
const getRatesFromPurchase = (purchase) => {
    // Priority 1: Use stored rates if available (most accurate)
    if (purchase.milkRate && purchase.yogurtRate) {
        return {
            milkRate: parseFloat(purchase.milkRate),
            yogurtRate: parseFloat(purchase.yogurtRate)
        };
    }
    
    // Priority 2: Calculate from total and quantities
    const milk = parseFloat(purchase.milk) || 0;
    const yogurt = parseFloat(purchase.yogurt) || 0;
    const total = parseFloat(purchase.total) || 0;
    
    if (total <= 0) return null;
    
    // If only milk, calculate milk rate
    if (milk > 0 && yogurt === 0) {
        return {
            milkRate: total / milk,
            yogurtRate: null
        };
    }
    
    // If only yogurt, calculate yogurt rate
    if (yogurt > 0 && milk === 0) {
        return {
            milkRate: null,
            yogurtRate: total / yogurt
        };
    }
    
    // If both, we can't determine individual rates from total alone
    // Return null to use fallback
    return null;
};

/**
 * Set current month rates for all customers based on their last purchase rates
 * @param {Function} onProgress - Callback for progress (current, total, customerName)
 * @returns {Promise<Object>} Result with success count and details
 */
export const setCurrentMonthRatesFromLastPurchase = async (onProgress = null) => {
    try {
        console.log('Starting to set current month rates from last purchase...');
        
        // Get current date
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        console.log(`Setting rates for: Month ${currentMonth + 1}, Year ${currentYear}`);
        
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
        
        // Get all customers
        const customersRef = collection(firestore, 'customers');
        const customersSnapshot = await getDocs(customersRef);
        const customers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log(`Found ${customers.length} customers`);
        
        let successCount = 0;
        let skippedCount = 0;
        const details = [];
        
        // Process each customer
        for (let i = 0; i < customers.length; i++) {
            const customer = customers[i];
            
            if (onProgress) {
                onProgress(i + 1, customers.length, customer.name || customer.id);
            }
            
            // Get last purchase for this customer
            const lastPurchase = await getLastPurchase(customer.id);
            
            if (!lastPurchase) {
                console.log(`  No purchases found for customer: ${customer.name || customer.id}`);
                skippedCount++;
                continue;
            }
            
            // Get rates from last purchase
            const rates = getRatesFromPurchase(lastPurchase);
            
            if (!rates || (!rates.milkRate && !rates.yogurtRate)) {
                console.log(`  Could not determine rates from last purchase for: ${customer.name || customer.id}`);
                skippedCount++;
                continue;
            }
            
            // Use fallback rates if one is missing
            const milkRate = rates.milkRate || currentRates.milk;
            const yogurtRate = rates.yogurtRate || currentRates.yogurt;
            
            // Set monthly rate for current month
            const key = `${customer.id}_${currentYear}_${currentMonth}`;
            
            currentRates.monthlyRates[key] = {
                milkRate: milkRate,
                yogurtRate: yogurtRate,
                customerId: customer.id,
                month: currentMonth,
                year: currentYear,
                setAt: new Date().toISOString(),
                rateSource: 'from_last_purchase',
                note: `Set from last purchase on ${new Date(lastPurchase.date).toLocaleDateString()}`
            };
            
            successCount++;
            details.push({
                customerId: customer.id,
                customerName: customer.name || customer.id,
                milkRate: milkRate,
                yogurtRate: yogurtRate,
                lastPurchaseDate: new Date(lastPurchase.date).toLocaleDateString()
            });
            
            console.log(`  ✅ ${customer.name || customer.id}: Set rates ${milkRate}/${yogurtRate} from last purchase`);
        }
        
        console.log(`\nSaving rates for ${successCount} customers...`);
        
        // Save all rates to Firestore
        await setDoc(ratesDoc, currentRates);
        
        console.log('✅ Current month rates set successfully!');
        console.log(`   Success: ${successCount}, Skipped: ${skippedCount}`);
        
        return {
            success: true,
            successCount: successCount,
            skippedCount: skippedCount,
            totalCustomers: customers.length,
            month: currentMonth + 1,
            year: currentYear,
            details: details
        };
    } catch (error) {
        console.error('❌ Error setting next month rates: ', error);
        throw error;
    }
};

