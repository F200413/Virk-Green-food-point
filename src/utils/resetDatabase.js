import { firestore } from '../firebase';
import { 
    collection, 
    getDocs, 
    getDoc,
    doc, 
    deleteDoc, 
    addDoc,
    setDoc,
    writeBatch,
    query,
    orderBy,
    Timestamp
} from 'firebase/firestore';

/**
 * Reset database while preserving mahana gahak (customers) list
 * This will:
 * 1. Backup customers collection
 * 2. Clear all other collections (purchases, bills, advancePayments, suppliers)
 * 3. Reset settings/rates to defaults (but preserve monthly rates if they exist)
 * 4. Restore customers collection
 */
export const resetDatabasePreservingCustomers = async () => {
    try {
        console.log('Starting database reset...');
        
        // Helper function to delete documents in batches (max 500 per batch)
        const deleteInBatches = async (docs, collectionName) => {
            const BATCH_SIZE = 500;
            let count = 0;
            for (let i = 0; i < docs.length; i += BATCH_SIZE) {
                const batch = writeBatch(firestore);
                const batchDocs = docs.slice(i, i + BATCH_SIZE);
                batchDocs.forEach((doc) => {
                    batch.delete(doc.ref);
                    count++;
                });
                await batch.commit();
            }
            return count;
        };
        
        // Step 1: Backup customers collection
        console.log('Backing up customers...');
        const customersCollection = collection(firestore, 'customers');
        const customersSnapshot = await getDocs(customersCollection);
        const customersBackup = customersSnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data()
        }));
        console.log(`Backed up ${customersBackup.length} customers`);

        // Step 2: Backup monthly rates from settings (if they exist)
        console.log('Backing up monthly rates...');
        const ratesDoc = doc(firestore, 'settings', 'rates');
        const ratesSnapshot = await getDoc(ratesDoc);
        let monthlyRatesBackup = {};
        if (ratesSnapshot.exists()) {
            const ratesData = ratesSnapshot.data();
            monthlyRatesBackup = ratesData.monthlyRates || {};
            console.log(`Backed up monthly rates for ${Object.keys(monthlyRatesBackup).length} customer/month combinations`);
        }

        // Step 3: Clear purchases collection
        console.log('Clearing purchases...');
        const purchasesCollection = collection(firestore, 'purchases');
        const purchasesSnapshot = await getDocs(purchasesCollection);
        const purchaseCount = await deleteInBatches(purchasesSnapshot.docs, 'purchases');
        console.log(`Cleared ${purchaseCount} purchases`);

        // Step 4: Clear bills collection
        console.log('Clearing bills...');
        const billsCollection = collection(firestore, 'bills');
        const billsSnapshot = await getDocs(billsCollection);
        const billCount = await deleteInBatches(billsSnapshot.docs, 'bills');
        console.log(`Cleared ${billCount} bills`);

        // Step 5: Clear advancePayments collection
        console.log('Clearing advance payments...');
        const advanceCollection = collection(firestore, 'advancePayments');
        const advanceSnapshot = await getDocs(advanceCollection);
        const advanceCount = await deleteInBatches(advanceSnapshot.docs, 'advancePayments');
        console.log(`Cleared ${advanceCount} advance payments`);

        // Step 6: Clear suppliers collection
        console.log('Clearing suppliers...');
        const suppliersCollection = collection(firestore, 'suppliers');
        const suppliersSnapshot = await getDocs(suppliersCollection);
        const supplierCount = await deleteInBatches(suppliersSnapshot.docs, 'suppliers');
        console.log(`Cleared ${supplierCount} suppliers`);

        // Step 7: Clear customers collection (we'll restore from backup)
        console.log('Clearing customers (will restore from backup)...');
        await deleteInBatches(customersSnapshot.docs, 'customers');

        // Step 8: Restore customers collection
        console.log('Restoring customers...');
        for (const customer of customersBackup) {
            await addDoc(customersCollection, customer.data);
        }
        console.log(`Restored ${customersBackup.length} customers`);

        // Step 9: Reset settings/rates but preserve monthly rates
        console.log('Resetting rates (preserving monthly rates)...');
        const defaultRates = {
            milk: 120,
            yogurt: 140,
            monthlyRates: monthlyRatesBackup
        };
        await setDoc(ratesDoc, defaultRates);
        console.log('Rates reset with preserved monthly rates');

        console.log('Database reset completed successfully!');
        return {
            success: true,
            message: `Database reset successfully. Preserved ${customersBackup.length} customers and ${Object.keys(monthlyRatesBackup).length} monthly rate entries.`,
            stats: {
                customersPreserved: customersBackup.length,
                monthlyRatesPreserved: Object.keys(monthlyRatesBackup).length,
                purchasesCleared: purchaseCount,
                billsCleared: billCount,
                advancePaymentsCleared: advanceCount,
                suppliersCleared: supplierCount
            }
        };
    } catch (error) {
        console.error('Error resetting database:', error);
        return {
            success: false,
            message: `Error resetting database: ${error.message}`,
            error: error
        };
    }
};

/**
 * Get statistics about current database state
 */
export const getDatabaseStats = async () => {
    try {
        const stats = {};
        
        // Count customers
        const customersCollection = collection(firestore, 'customers');
        const customersSnapshot = await getDocs(customersCollection);
        stats.customers = customersSnapshot.size;

        // Count purchases
        const purchasesCollection = collection(firestore, 'purchases');
        const purchasesSnapshot = await getDocs(purchasesCollection);
        stats.purchases = purchasesSnapshot.size;

        // Count bills
        const billsCollection = collection(firestore, 'bills');
        const billsSnapshot = await getDocs(billsCollection);
        stats.bills = billsSnapshot.size;

        // Count advance payments
        const advanceCollection = collection(firestore, 'advancePayments');
        const advanceSnapshot = await getDocs(advanceCollection);
        stats.advancePayments = advanceSnapshot.size;

        // Count suppliers
        const suppliersCollection = collection(firestore, 'suppliers');
        const suppliersSnapshot = await getDocs(suppliersCollection);
        stats.suppliers = suppliersSnapshot.size;

        // Get rates info
        const ratesDoc = doc(firestore, 'settings', 'rates');
        const ratesSnapshot = await getDoc(ratesDoc);
        if (ratesSnapshot.exists()) {
            const ratesData = ratesSnapshot.data();
            stats.monthlyRates = Object.keys(ratesData.monthlyRates || {}).length;
        } else {
            stats.monthlyRates = 0;
        }

        return stats;
    } catch (error) {
        console.error('Error getting database stats:', error);
        throw error;
    }
};

/**
 * Helper function to convert Firestore Timestamp to ISO string
 */
const convertTimestamp = (value) => {
    if (value && typeof value.toDate === 'function') {
        return value.toDate().toISOString();
    }
    if (value && typeof value === 'object' && value.seconds) {
        return new Date(value.seconds * 1000).toISOString();
    }
    return value;
};

/**
 * Helper function to recursively convert all Timestamps in an object
 */
const convertTimestamps = (obj) => {
    if (obj === null || obj === undefined) {
        return obj;
    }
    
    if (obj && typeof obj.toDate === 'function') {
        return obj.toDate().toISOString();
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => convertTimestamps(item));
    }
    
    if (typeof obj === 'object') {
        const converted = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                converted[key] = convertTimestamps(obj[key]);
            }
        }
        return converted;
    }
    
    return obj;
};

/**
 * Export all database collections and their data to a JSON file
 * @param {string} filename - Optional filename (default: database_backup_YYYY-MM-DD_HH-MM-SS.json)
 * @returns {Promise<Object>} Export result with success status and filename
 */
export const exportAllDatabaseData = async (filename = null) => {
    try {
        console.log('Starting database export...');
        const exportData = {
            exportDate: new Date().toISOString(),
            exportInfo: {
                version: '1.0',
                description: 'Complete database backup including all collections'
            },
            collections: {}
        };

        // Export customers collection
        console.log('Exporting customers...');
        const customersCollection = collection(firestore, 'customers');
        const customersSnapshot = await getDocs(customersCollection);
        exportData.collections.customers = customersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestamps(doc.data())
        }));
        console.log(`Exported ${exportData.collections.customers.length} customers`);

        // Export purchases collection
        console.log('Exporting purchases...');
        const purchasesCollection = collection(firestore, 'purchases');
        const purchasesQuery = query(purchasesCollection, orderBy('date', 'desc'));
        const purchasesSnapshot = await getDocs(purchasesQuery);
        exportData.collections.purchases = purchasesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestamps(doc.data())
        }));
        console.log(`Exported ${exportData.collections.purchases.length} purchases`);

        // Export bills collection
        console.log('Exporting bills...');
        const billsCollection = collection(firestore, 'bills');
        const billsQuery = query(billsCollection, orderBy('date', 'desc'));
        const billsSnapshot = await getDocs(billsQuery);
        exportData.collections.bills = billsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestamps(doc.data())
        }));
        console.log(`Exported ${exportData.collections.bills.length} bills`);

        // Export advancePayments collection
        console.log('Exporting advance payments...');
        const advanceCollection = collection(firestore, 'advancePayments');
        const advanceQuery = query(advanceCollection, orderBy('date', 'desc'));
        const advanceSnapshot = await getDocs(advanceQuery);
        exportData.collections.advancePayments = advanceSnapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestamps(doc.data())
        }));
        console.log(`Exported ${exportData.collections.advancePayments.length} advance payments`);

        // Export suppliers collection
        console.log('Exporting suppliers...');
        const suppliersCollection = collection(firestore, 'suppliers');
        const suppliersSnapshot = await getDocs(suppliersCollection);
        exportData.collections.suppliers = suppliersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestamps(doc.data())
        }));
        console.log(`Exported ${exportData.collections.suppliers.length} suppliers`);

        // Export settings (rates)
        console.log('Exporting settings...');
        const ratesDoc = doc(firestore, 'settings', 'rates');
        const ratesSnapshot = await getDoc(ratesDoc);
        if (ratesSnapshot.exists()) {
            exportData.collections.settings = {
                rates: convertTimestamps(ratesSnapshot.data())
            };
        } else {
            exportData.collections.settings = {
                rates: null
            };
        }
        console.log('Exported settings');

        // Export token counter if it exists
        try {
            const tokenDoc = doc(firestore, 'settings', 'tokenCounter');
            const tokenSnapshot = await getDoc(tokenDoc);
            if (tokenSnapshot.exists()) {
                if (!exportData.collections.settings) {
                    exportData.collections.settings = {};
                }
                exportData.collections.settings.tokenCounter = convertTimestamps(tokenSnapshot.data());
                console.log('Exported token counter');
            }
        } catch (error) {
            console.log('Token counter not found or error:', error);
        }

        // Add summary statistics
        exportData.summary = {
            totalCustomers: exportData.collections.customers.length,
            totalPurchases: exportData.collections.purchases.length,
            totalBills: exportData.collections.bills.length,
            totalAdvancePayments: exportData.collections.advancePayments.length,
            totalSuppliers: exportData.collections.suppliers.length,
            hasSettings: exportData.collections.settings !== undefined
        };

        // Create filename if not provided
        if (!filename) {
            const date = new Date();
            const dateStr = date.toISOString().replace(/[:.]/g, '-').slice(0, -5);
            filename = `database_backup_${dateStr}.json`;
        }

        // Convert to JSON string with pretty formatting
        const jsonString = JSON.stringify(exportData, null, 2);

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

        console.log('Database export completed successfully!');
        return {
            success: true,
            filename,
            summary: exportData.summary,
            message: `Database exported successfully. File: ${filename}`
        };
    } catch (error) {
        console.error('Error exporting database:', error);
        return {
            success: false,
            message: `Error exporting database: ${error.message}`,
            error: error
        };
    }
};

/**
 * Restore all database collections from a backup JSON file
 * @param {File} file - The backup JSON file to restore from
 * @param {Function} onProgress - Optional callback for progress updates
 * @returns {Promise<Object>} Restore result with success status and statistics
 */
export const restoreDatabaseFromBackup = async (file, onProgress = null) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                
                // Validate backup file structure
                if (!jsonData.collections) {
                    throw new Error('Invalid backup file: missing collections');
                }

                console.log('Starting database restore...');
                
                // Helper to convert ISO strings to Timestamps
                const convertToTimestamp = (value) => {
                    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
                        return Timestamp.fromDate(new Date(value));
                    }
                    if (Array.isArray(value)) {
                        return value.map(convertToTimestamp);
                    }
                    if (value && typeof value === 'object' && value !== null) {
                        const converted = {};
                        for (const key in value) {
                            if (value.hasOwnProperty(key)) {
                                converted[key] = convertToTimestamp(value[key]);
                            }
                        }
                        return converted;
                    }
                    return value;
                };

                const stats = {
                    customers: 0,
                    purchases: 0,
                    bills: 0,
                    advancePayments: 0,
                    suppliers: 0,
                    settings: false
                };

                // Helper to add documents in batches
                const addInBatches = async (docs, collectionRef, collectionName) => {
                    const BATCH_SIZE = 500;
                    let count = 0;
                    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
                        const batch = writeBatch(firestore);
                        const batchDocs = docs.slice(i, i + BATCH_SIZE);
                        batchDocs.forEach((docData) => {
                            const { id, ...data } = docData;
                            const docRef = doc(collectionRef, id);
                            const convertedData = convertToTimestamp(data);
                            batch.set(docRef, convertedData);
                            count++;
                        });
                        await batch.commit();
                        if (onProgress) {
                            onProgress(count, docs.length, collectionName);
                        }
                    }
                    return count;
                };

                // Step 1: Clear existing data (optional - user might want to merge)
                // For now, we'll restore by replacing

                // Step 2: Restore customers
                if (jsonData.collections.customers && jsonData.collections.customers.length > 0) {
                    console.log(`Restoring ${jsonData.collections.customers.length} customers...`);
                    const customersCollection = collection(firestore, 'customers');
                    stats.customers = await addInBatches(jsonData.collections.customers, customersCollection, 'customers');
                    console.log(`Restored ${stats.customers} customers`);
                }

                // Step 3: Restore purchases
                if (jsonData.collections.purchases && jsonData.collections.purchases.length > 0) {
                    console.log(`Restoring ${jsonData.collections.purchases.length} purchases...`);
                    const purchasesCollection = collection(firestore, 'purchases');
                    stats.purchases = await addInBatches(jsonData.collections.purchases, purchasesCollection, 'purchases');
                    console.log(`Restored ${stats.purchases} purchases`);
                }

                // Step 4: Restore bills
                if (jsonData.collections.bills && jsonData.collections.bills.length > 0) {
                    console.log(`Restoring ${jsonData.collections.bills.length} bills...`);
                    const billsCollection = collection(firestore, 'bills');
                    stats.bills = await addInBatches(jsonData.collections.bills, billsCollection, 'bills');
                    console.log(`Restored ${stats.bills} bills`);
                }

                // Step 5: Restore advance payments
                if (jsonData.collections.advancePayments && jsonData.collections.advancePayments.length > 0) {
                    console.log(`Restoring ${jsonData.collections.advancePayments.length} advance payments...`);
                    const advanceCollection = collection(firestore, 'advancePayments');
                    stats.advancePayments = await addInBatches(jsonData.collections.advancePayments, advanceCollection, 'advancePayments');
                    console.log(`Restored ${stats.advancePayments} advance payments`);
                }

                // Step 6: Restore suppliers
                if (jsonData.collections.suppliers && jsonData.collections.suppliers.length > 0) {
                    console.log(`Restoring ${jsonData.collections.suppliers.length} suppliers...`);
                    const suppliersCollection = collection(firestore, 'suppliers');
                    stats.suppliers = await addInBatches(jsonData.collections.suppliers, suppliersCollection, 'suppliers');
                    console.log(`Restored ${stats.suppliers} suppliers`);
                }

                // Step 7: Restore settings
                if (jsonData.collections.settings) {
                    console.log('Restoring settings...');
                    if (jsonData.collections.settings.rates) {
                        const ratesDoc = doc(firestore, 'settings', 'rates');
                        const convertedRates = convertToTimestamp(jsonData.collections.settings.rates);
                        await setDoc(ratesDoc, convertedRates);
                        stats.settings = true;
                        console.log('Restored rates settings');
                    }
                    if (jsonData.collections.settings.tokenCounter) {
                        const tokenDoc = doc(firestore, 'settings', 'tokenCounter');
                        const convertedToken = convertToTimestamp(jsonData.collections.settings.tokenCounter);
                        await setDoc(tokenDoc, convertedToken);
                        console.log('Restored token counter');
                    }
                }

                console.log('Database restore completed successfully!');
                resolve({
                    success: true,
                    message: `Database restored successfully! Restored: ${stats.customers} customers, ${stats.purchases} purchases, ${stats.bills} bills, ${stats.advancePayments} advance payments, ${stats.suppliers} suppliers`,
                    stats: stats
                });
            } catch (error) {
                console.error('Error restoring database:', error);
                reject({
                    success: false,
                    message: `Error restoring database: ${error.message}`,
                    error: error
                });
            }
        };
        
        reader.onerror = () => {
            reject({
                success: false,
                message: 'Failed to read backup file',
                error: new Error('File read error')
            });
        };
        
        reader.readAsText(file);
    });
};

