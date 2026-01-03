/**
 * Direct import function that can be called from browser console
 * Usage: Copy the JSON data and call importRatesDirectly(jsonData)
 */

import { firestore } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const importRatesDirectly = async (jsonData) => {
    try {
        console.log('Starting rate import...');
        
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
        
        const customers = jsonData.customers || [];
        let importedCount = 0;
        let skippedCount = 0;
        
        console.log(`Processing ${customers.length} customers...`);
        
        // Process each customer
        for (let i = 0; i < customers.length; i++) {
            const customer = customers[i];
            const customerId = customer.customerId;
            const monthlyData = customer.monthlyData || [];
            
            // Process each month for this customer
            monthlyData.forEach(monthData => {
                const { year, month, milkRate, yogurtRate } = monthData;
                
                if (milkRate != null && yogurtRate != null && 
                    typeof milkRate === 'number' && typeof yogurtRate === 'number' &&
                    milkRate > 0 && yogurtRate > 0) {
                    const key = `${customerId}_${year}_${month}`;
                    
                    // Set the monthly rate
                    currentRates.monthlyRates[key] = {
                        milkRate: milkRate,
                        yogurtRate: yogurtRate,
                        customerId: customerId,
                        month: month,
                        year: year,
                        importedAt: new Date().toISOString()
                    };
                    
                    importedCount++;
                } else {
                    skippedCount++;
                }
            });
            
            // Log progress every 10 customers
            if ((i + 1) % 10 === 0) {
                console.log(`Processed ${i + 1}/${customers.length} customers...`);
            }
        }
        
        console.log(`Importing ${Object.keys(currentRates.monthlyRates).length} total monthly rates...`);
        
        // Save all rates to Firestore
        await setDoc(ratesDoc, currentRates);
        
        console.log('✅ Import completed successfully!');
        console.log(`📊 Statistics:`);
        console.log(`   - Total customers processed: ${customers.length}`);
        console.log(`   - Monthly rates imported: ${importedCount}`);
        console.log(`   - Total monthly rate entries: ${Object.keys(currentRates.monthlyRates).length}`);
        
        return {
            success: true,
            importedCount,
            totalCustomers: customers.length,
            totalMonthlyRates: Object.keys(currentRates.monthlyRates).length
        };
    } catch (error) {
        console.error('❌ Error importing rates: ', error);
        throw error;
    }
};


