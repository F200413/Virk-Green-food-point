import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { 
    collection, 
    getDocs, 
    doc, 
    query, 
    orderBy,
    getDoc,
    setDoc
} from 'firebase/firestore';
import PeopleIcon from '@mui/icons-material/People';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { resetDatabasePreservingCustomers, getDatabaseStats, exportAllDatabaseData, restoreDatabaseFromBackup } from '../utils/resetDatabase';

const Dashboard = () => {
    // State variables
    const [customers, setCustomers] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showPasswordVerification, setShowPasswordVerification] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [deleteAction, setDeleteAction] = useState(null);
    const [deleteParams, setDeleteParams] = useState(null);
    const [todaySales, setTodaySales] = useState(0);
    const [salesGrowth, setSalesGrowth] = useState(0);
    const [databaseStats, setDatabaseStats] = useState(null);
    const [resettingDatabase, setResettingDatabase] = useState(false);
    const [exportingDatabase, setExportingDatabase] = useState(false);
    const [restoringDatabase, setRestoringDatabase] = useState(false);
    const [restoreProgress, setRestoreProgress] = useState({ current: 0, total: 0, collection: '' });

    // Loading spinner component
    const LoadingSpinner = () => (
        <div className="spinner"></div>
    );

    // Add spinner styles
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            .spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                margin-left: 10px;
                border: 3px solid rgba(255,255,255,.3);
                border-radius: 50%;
                border-top-color: #fff;
                animation: spin 1s ease-in-out infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Fetch data on component mount
    useEffect(() => {
        fetchCustomers();
        fetchSuppliers();
        fetchBills();
        loadDatabaseStats();
    }, []);

    const loadDatabaseStats = async () => {
        try {
            const stats = await getDatabaseStats();
            setDatabaseStats(stats);
        } catch (error) {
            console.error("Error loading database stats:", error);
        }
    };

    // Calculate today's sales when bills change
    useEffect(() => {
        const fetchSales = async () => {
            if (bills.length >= 0) { // Even if 0 bills, we should calculate (result will be 0)
                await calculateTodaySales();
            }
        };
        fetchSales();
    }, [bills]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const customersCollection = collection(firestore, 'customers');
            const customersSnapshot = await getDocs(customersCollection);
            const customersList = customersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCustomers(customersList);
        } catch (error) {
            console.error("Error fetching customers: ", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const suppliersCollection = collection(firestore, 'suppliers');
            const suppliersSnapshot = await getDocs(suppliersCollection);
            const suppliersList = suppliersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSuppliers(suppliersList);
        } catch (error) {
            console.error("Error fetching suppliers: ", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBills = async () => {
        try {
            const billsCollection = collection(firestore, 'bills');
            const q = query(billsCollection, orderBy('date', 'desc'));
            const billsSnapshot = await getDocs(q);
            const billsList = billsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date.toDate().toISOString()
            }));
            setBills(billsList);
        } catch (error) {
            console.error("Error fetching bills: ", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTodaySales = async () => {
        try {
            // Calculate today's revenue
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todayBills = bills.filter(bill => {
                if (!bill.date) return false;
                const billDate = new Date(bill.date);
                // Compare only the date part (year, month, day)
                return billDate.getFullYear() === today.getFullYear() &&
                    billDate.getMonth() === today.getMonth() &&
                    billDate.getDate() === today.getDate();
            });

            const todayTotal = todayBills.reduce((sum, bill) => {
                const grandTotal = parseFloat(bill.grandTotal) || 0;
                console.log('Bill:', bill.id, 'Grand Total:', grandTotal);
                return sum + grandTotal;
            }, 0);
            
            console.log('Today Bills Count:', todayBills.length, 'Today Total:', todayTotal);
            setTodaySales(todayTotal || 0);

            // Calculate growth (comparing with previous day)
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const yesterdayBills = bills.filter(bill => {
                if (!bill.date) return false;
                const billDate = new Date(bill.date);
                return billDate.getFullYear() === yesterday.getFullYear() &&
                    billDate.getMonth() === yesterday.getMonth() &&
                    billDate.getDate() === yesterday.getDate();
            });

            const yesterdayTotal = yesterdayBills.reduce((sum, bill) => sum + (parseFloat(bill.grandTotal) || 0), 0);

            if (yesterdayTotal > 0) {
                const growth = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;
                setSalesGrowth(growth);
            } else {
                setSalesGrowth(0);
            }
        } catch (error) {
            console.error("Error calculating today's sales: ", error);
            setTodaySales(0);
            setSalesGrowth(0);
        }
    };

    const requestPasswordForDelete = (action, params = null) => {
        setDeleteAction(() => action);
        setDeleteParams(params);
        setPasswordInput('');
        setPasswordError('');
        setShowPasswordVerification(true);
    };

    const handlePasswordVerification = () => {
        if (passwordInput === 'virk0912') {
            setShowPasswordVerification(false);
            setPasswordInput('');
            
            if (deleteAction) {
                deleteAction(deleteParams);
            }
        } else {
            setPasswordError('غلط پاس ورڈ! براہ کرم دوبارہ کوشش کریں۔');
        }
    };

    const clearDailyRevenue = async () => {
        requestPasswordForDelete(async () => {
            setLoading(true);
            try {
                // Reset the daily sales to 0
                setTodaySales(0);
                setSalesGrowth(0);

                // Reset token number to 0
                const tokenDoc = doc(firestore, 'settings', 'tokenCounter');
                await setDoc(tokenDoc, { currentToken: 0 });

                setSuccessMessage('روزانہ کی آمدنی کامیابی سے صاف کر دی گئی ہے');
                setShowSuccessPopup(true);
            } catch (error) {
                console.error("Error clearing daily revenue: ", error);
                setSuccessMessage("روزانہ کی آمدنی کو صاف کرنے میں خرابی");
                setShowSuccessPopup(true);
            } finally {
                setLoading(false);
            }
        });
    };

    const handleClearDailyRevenue = () => {
        clearDailyRevenue();
    };

    const handleResetDatabase = () => {
        requestPasswordForDelete(async () => {
            setResettingDatabase(true);
            try {
                const result = await resetDatabasePreservingCustomers();
                if (result.success) {
                    setSuccessMessage(result.message);
                    // Refresh all data
                    await fetchCustomers();
                    await fetchSuppliers();
                    await fetchBills();
                    await loadDatabaseStats();
                } else {
                    setSuccessMessage(result.message);
                }
                setShowSuccessPopup(true);
            } catch (error) {
                console.error("Error resetting database:", error);
                setSuccessMessage("ڈیٹا بیس کو ری سیٹ کرنے میں خرابی");
                setShowSuccessPopup(true);
            } finally {
                setResettingDatabase(false);
            }
        });
    };

    const handleExportDatabase = async () => {
        setExportingDatabase(true);
        try {
            const result = await exportAllDatabaseData();
            if (result.success) {
                setSuccessMessage(`ڈیٹا بیس کامیابی سے ڈاؤن لوڈ ہو گیا: ${result.filename}`);
            } else {
                setSuccessMessage(result.message || "ڈیٹا بیس کو ڈاؤن لوڈ کرنے میں خرابی");
            }
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error exporting database:", error);
            setSuccessMessage("ڈیٹا بیس کو ڈاؤن لوڈ کرنے میں خرابی");
            setShowSuccessPopup(true);
        } finally {
            setExportingDatabase(false);
        }
    };

    const handleRestoreDatabase = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            setSuccessMessage('براہ کرم صرف JSON فائل منتخب کریں');
            setShowSuccessPopup(true);
            return;
        }

        // Ask for confirmation
        const confirmed = window.confirm(
            'کیا آپ واقعی ڈیٹا بیس کو بحال کرنا چاہتے ہیں؟ یہ موجودہ تمام ڈیٹا کو تبدیل کر دے گا۔'
        );
        if (!confirmed) {
            event.target.value = '';
            return;
        }

        setRestoringDatabase(true);
        setRestoreProgress({ current: 0, total: 0, collection: '' });

        try {
            const result = await restoreDatabaseFromBackup(file, (current, total, collection) => {
                setRestoreProgress({ current, total, collection });
            });

            if (result.success) {
                setSuccessMessage(result.message);
                // Refresh all data
                await fetchCustomers();
                await fetchSuppliers();
                await fetchBills();
                await loadDatabaseStats();
            } else {
                setSuccessMessage(result.message || "ڈیٹا بیس کو بحال کرنے میں خرابی");
            }
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error restoring database:", error);
            setSuccessMessage(error.message || "ڈیٹا بیس کو بحال کرنے میں خرابی");
            setShowSuccessPopup(true);
        } finally {
            setRestoringDatabase(false);
            setRestoreProgress({ current: 0, total: 0, collection: '' });
            // Reset file input
            event.target.value = '';
        }
    };

    // Get today's bills count
    const getTodayBillsCount = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return bills.filter(bill => {
            const billDate = new Date(bill.date);
            return billDate.getFullYear() === today.getFullYear() &&
                billDate.getMonth() === today.getMonth() &&
                billDate.getDate() === today.getDate();
        }).length;
    };

    return (
        <div className="main-content">
            <section id="dashboard" className="active">
                <h2>ڈیش بورڈ</h2>
                <div className="dashboard-container">
                    <div className="dashboard-grid">
                        {/* Total Revenue Card */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <span className="card-title">Total Revenue</span>
                                <span className="card-currency">PKR</span>
                            </div>
                            <div className="card-body">
                                <div className="card-value">Rs.{(todaySales !== undefined && !isNaN(todaySales) ? todaySales.toFixed(2) : '0.00')}</div>
                                <button
                                    onClick={handleClearDailyRevenue}
                                    className="clear-revenue-btn"
                                    disabled={loading}
                                    style={{
                                        marginTop: '10px',
                                        padding: '5px 10px',
                                        backgroundColor: '#f44336',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    Clear Revenue
                                    {loading && <LoadingSpinner />}
                                </button>
                            </div>
                        </div>

                        {/* Daily Customers Card */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <span className="card-title">Daily Customers</span>
                                <span className="card-icon"><PeopleIcon fontSize="small" /></span>
                            </div>
                            <div className="card-body">
                                <div className="card-value">{getTodayBillsCount()}</div>
                                <div className="card-subtitle">Total customers today</div>
                            </div>
                        </div>

                        {/* Total Customers Card */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <span className="card-title">کل گاہک</span>
                                <span className="card-unit">تعداد</span>
                            </div>
                            <div className="card-body">
                                <div className="card-value">{customers.length}</div>
                                <div className="card-subtitle">Total Customers</div>
                            </div>
                        </div>

                        {/* Supplier Summary Card */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <span className="card-title">سپلائرز کا خلاصہ</span>
                                <span className="card-unit">تعداد</span>
                            </div>
                            <div className="card-body">
                                <div className="card-value">{suppliers.length}</div>
                                <div className="card-subtitle">کل سپلائرز</div>
                            </div>
                        </div>

                        {/* Total Supplied Milk */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <span className="card-title">سپلائی شدہ دودھ</span>
                                <span className="card-unit">لیٹر</span>
                            </div>
                            <div className="card-body">
                                <div className="card-value">
                                    {suppliers.reduce((sum, supplier) => sum + (parseFloat(supplier.milkQuantity) || 0), 0).toFixed(1)}
                                </div>
                                <div className="card-subtitle">کل سپلائی شدہ دودھ</div>
                            </div>
                        </div>

                        {/* Total Supplied Yogurt */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <span className="card-title">سپلائی شدہ دہی</span>
                                <span className="card-unit">کلو</span>
                            </div>
                            <div className="card-body">
                                <div className="card-value">
                                    {suppliers.reduce((sum, supplier) => sum + (parseFloat(supplier.yogurtQuantity) || 0), 0).toFixed(1)}
                                </div>
                                <div className="card-subtitle">کل سپلائی شدہ دہی</div>
                            </div>
                        </div>

                        {/* Database Export Card */}
                        <div className="dashboard-card" style={{ borderLeftColor: '#3498db' }}>
                            <div className="card-header">
                                <span className="card-title">ڈیٹا بیس بیک اپ</span>
                                <span className="card-icon"><DownloadIcon fontSize="small" /></span>
                            </div>
                            <div className="card-body">
                                <div className="card-subtitle" style={{ marginBottom: '15px' }}>
                                    تمام کالیکشنز اور ڈیٹا کو JSON فائل میں ڈاؤن لوڈ کریں
                                </div>
                                {databaseStats && (
                                    <div style={{ 
                                        fontSize: '12px', 
                                        color: '#666', 
                                        marginBottom: '15px',
                                        textAlign: 'right',
                                        direction: 'rtl'
                                    }}>
                                        <div>گاہک: {databaseStats.customers}</div>
                                        <div>خریدیں: {databaseStats.purchases}</div>
                                        <div>بلز: {databaseStats.bills}</div>
                                        <div>ادائیگیاں: {databaseStats.advancePayments}</div>
                                        <div>سپلائرز: {databaseStats.suppliers}</div>
                                    </div>
                                )}
                                <button
                                    onClick={handleExportDatabase}
                                    className="export-database-btn"
                                    disabled={exportingDatabase || loading}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#3498db',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {exportingDatabase ? (
                                        <>
                                            <LoadingSpinner />
                                            ڈاؤن لوڈ ہو رہا ہے...
                                        </>
                                    ) : (
                                        <>
                                            <DownloadIcon fontSize="small" />
                                            ڈیٹا بیس ڈاؤن لوڈ کریں
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Database Restore Card */}
                        <div className="dashboard-card" style={{ borderLeftColor: '#27ae60' }}>
                            <div className="card-header">
                                <span className="card-title">ڈیٹا بیس بحال کریں</span>
                                <span className="card-icon"><CloudUploadIcon fontSize="small" /></span>
                            </div>
                            <div className="card-body">
                                <div className="card-subtitle" style={{ marginBottom: '15px' }}>
                                    بیک اپ فائل سے تمام ڈیٹا بحال کریں
                                </div>
                                {restoringDatabase && restoreProgress.total > 0 && (
                                    <div style={{ 
                                        fontSize: '12px', 
                                        color: '#666', 
                                        marginBottom: '15px',
                                        textAlign: 'center',
                                        direction: 'rtl'
                                    }}>
                                        <div>{restoreProgress.collection}: {restoreProgress.current} / {restoreProgress.total}</div>
                                        <div style={{ 
                                            width: '100%', 
                                            height: '8px', 
                                            backgroundColor: '#e0e0e0', 
                                            borderRadius: '4px',
                                            marginTop: '8px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${(restoreProgress.current / restoreProgress.total) * 100}%`,
                                                height: '100%',
                                                backgroundColor: '#27ae60',
                                                transition: 'width 0.3s ease'
                                            }}></div>
                                        </div>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleRestoreDatabase}
                                    disabled={restoringDatabase || loading}
                                    id="restore-file-input"
                                    style={{ display: 'none' }}
                                />
                                <label
                                    htmlFor="restore-file-input"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: restoringDatabase ? '#95a5a6' : '#27ae60',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: restoringDatabase ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s ease',
                                        textAlign: 'center'
                                    }}
                                >
                                    {restoringDatabase ? (
                                        <>
                                            <LoadingSpinner />
                                            بحال ہو رہا ہے...
                                        </>
                                    ) : (
                                        <>
                                            <CloudUploadIcon fontSize="small" />
                                            بیک اپ فائل منتخب کریں
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* Database Reset Card */}
                        <div className="dashboard-card" style={{ borderLeftColor: '#e74c3c' }}>
                            <div className="card-header">
                                <span className="card-title">ڈیٹا بیس ری سیٹ</span>
                                <span className="card-icon"><RefreshIcon fontSize="small" /></span>
                            </div>
                            <div className="card-body">
                                <div className="card-subtitle" style={{ marginBottom: '15px' }}>
                                    تمام ڈیٹا صاف کریں لیکن مہینہ گاہک کی فہرست محفوظ رکھیں
                                </div>
                                {databaseStats && (
                                    <div style={{ 
                                        fontSize: '12px', 
                                        color: '#666', 
                                        marginBottom: '15px',
                                        textAlign: 'right',
                                        direction: 'rtl'
                                    }}>
                                        <div>خریدیں: {databaseStats.purchases}</div>
                                        <div>بلز: {databaseStats.bills}</div>
                                        <div>ادائیگیاں: {databaseStats.advancePayments}</div>
                                        <div>سپلائرز: {databaseStats.suppliers}</div>
                                    </div>
                                )}
                                <button
                                    onClick={handleResetDatabase}
                                    className="reset-database-btn"
                                    disabled={resettingDatabase || loading}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#e74c3c',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {resettingDatabase ? (
                                        <>
                                            <LoadingSpinner />
                                            ری سیٹ ہو رہا ہے...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshIcon fontSize="small" />
                                            ڈیٹا بیس ری سیٹ کریں
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Success Popup */}
            {showSuccessPopup && (
                <div className="popup-overlay">
                    <div className="popup-content">
                        <p>{successMessage}</p>
                        <button onClick={() => setShowSuccessPopup(false)}>بند کریں</button>
                    </div>
                </div>
            )}

            {/* Password Verification Modal */}
            {showPasswordVerification && (
                <div className="popup-overlay">
                    <div className="popup-content">
                        <h3>پاس ورڈ کی تصدیق</h3>
                        <p>براہ کرم تصدیق کے لیے اپنا پاس ورڈ درج کریں:</p>
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="پاس ورڈ درج کریں"
                            style={{
                                width: '100%',
                                padding: '10px',
                                margin: '10px 0',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                direction: 'ltr'
                            }}
                        />
                        {passwordError && (
                            <p style={{ color: 'red', fontSize: '14px' }}>{passwordError}</p>
                        )}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button 
                                onClick={handlePasswordVerification}
                                style={{
                                    backgroundColor: '#2d6a4f',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                تصدیق کریں
                            </button>
                            <button 
                                onClick={() => setShowPasswordVerification(false)}
                                style={{
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                منسوخ کریں
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .main-content {
                    flex: 1;
                    padding: 20px;
                    background-color: #f8f9fa;
                    direction: rtl;
                }

                .main-content section {
                    display: none;
                }

                .main-content section.active {
                    display: block;
                }

                h2 {
                    color: #2d6a4f;
                    margin-bottom: 30px;
                    font-size: 32px;
                    text-align: center;
                    font-weight: 700;
                }

                .dashboard-container {
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .dashboard-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 25px;
                    padding: 20px 0;
                }

                .dashboard-card {
                    background: white;
                    border-radius: 16px;
                    padding: 25px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                    border-left: 5px solid #52b788;
                    position: relative;
                    overflow: hidden;
                }

                .dashboard-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #52b788, #2d6a4f);
                }

                .dashboard-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
                }

                .dashboard-card:nth-child(1) {
                    border-left-color: #3498db;
                }

                .dashboard-card:nth-child(2) {
                    border-left-color: #e74c3c;
                }

                .dashboard-card:nth-child(3) {
                    border-left-color: #f39c12;
                }

                .dashboard-card:nth-child(4) {
                    border-left-color: #9b59b6;
                }

                .dashboard-card:nth-child(5) {
                    border-left-color: #1abc9c;
                }

                .dashboard-card:nth-child(6) {
                    border-left-color: #34495e;
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .card-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #2d6a4f;
                }

                .card-currency,
                .card-unit {
                    font-size: 12px;
                    color: #666;
                    background: #f8f9fa;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-weight: 500;
                }

                .card-icon {
                    color: #2d6a4f;
                    opacity: 0.8;
                }

                .card-body {
                    text-align: center;
                }

                .card-value {
                    font-size: 32px;
                    font-weight: 700;
                    color: #1b4332;
                    margin-bottom: 8px;
                    line-height: 1.2;
                }

                .card-subtitle {
                    color: #666;
                    font-size: 14px;
                    font-weight: 500;
                }

                .clear-revenue-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    transition: all 0.2s ease;
                }

                .clear-revenue-btn:hover:not(:disabled) {
                    background-color: #d32f2f !important;
                    transform: translateY(-1px);
                }

                .clear-revenue-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .reset-database-btn:hover:not(:disabled) {
                    background-color: #c0392b !important;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
                }

                .reset-database-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .export-database-btn:hover:not(:disabled) {
                    background-color: #2980b9 !important;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
                }

                .export-database-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                label[for="restore-file-input"]:hover:not(:has(input:disabled)) {
                    background-color: #229954 !important;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
                }

                label[for="restore-file-input"]:has(input:disabled) {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .popup-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }

                .popup-content {
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }

                .popup-content h3 {
                    color: #2d6a4f;
                    margin-bottom: 15px;
                }

                .popup-content p {
                    color: #666;
                    margin-bottom: 20px;
                    line-height: 1.5;
                }

                .popup-content button {
                    background-color: #2d6a4f;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                    transition: background-color 0.3s ease;
                }

                .popup-content button:hover {
                    background-color: #1b4332;
                }

                @media (max-width: 768px) {
                    .main-content {
                        padding: 15px;
                    }

                    .dashboard-grid {
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 20px;
                        padding: 15px 0;
                    }

                    .dashboard-card {
                        padding: 20px;
                    }

                    .card-value {
                        font-size: 28px;
                    }

                    h2 {
                        font-size: 28px;
                        margin-bottom: 20px;
                    }
                }

                @media (max-width: 480px) {
                    .dashboard-grid {
                        grid-template-columns: 1fr;
                        gap: 15px;
                    }

                    .dashboard-card {
                        padding: 15px;
                    }

                    .card-value {
                        font-size: 24px;
                    }

                    .card-title {
                        font-size: 14px;
                    }

                    h2 {
                        font-size: 24px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
