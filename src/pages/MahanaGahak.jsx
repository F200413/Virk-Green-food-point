import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc, 
    updateDoc, 
    query, 
    orderBy,
    getDoc,
    setDoc,
    where
} from 'firebase/firestore';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const MahanaGahak = () => {
    // State variables
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [modalMode, setModalMode] = useState('add');
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [showPasswordVerification, setShowPasswordVerification] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [deleteAction, setDeleteAction] = useState(null);
    const [deleteParams, setDeleteParams] = useState(null);
    
    // Form data
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: ''
    });

    // Monthly rates state
    const [monthlyRateForm, setMonthlyRateForm] = useState({
        customerId: '',
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        milkRate: 0,
        yogurtRate: 0
    });

    const [rates, setRates] = useState({
        milk: 120,
        yogurt: 140
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [lastVisible, setLastVisible] = useState(null);
    const [firstVisible, setFirstVisible] = useState(null);
    const [pageCache, setPageCache] = useState({}); // Cache for pagination
    const CUSTOMERS_PER_PAGE = 15;

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

    // Fetch all customers and rates
    useEffect(() => {
        fetchCustomers();
        fetchRates();
        fetchMonthlyRates();
    }, []);

    const fetchRates = async () => {
        try {
            const ratesDoc = doc(firestore, 'settings', 'rates');
            const ratesSnapshot = await getDoc(ratesDoc);
            if (ratesSnapshot.exists()) {
                setRates(ratesSnapshot.data());
            }
        } catch (error) {
            console.error("Error fetching rates: ", error);
        }
    };

  
    

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const customersCollection = collection(firestore, 'customers');
            const q = query(customersCollection, orderBy('name'));
            const customersSnapshot = await getDocs(q);
            const customersList = customersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setCustomers(customersList);
            setTotalCustomers(customersList.length);

        } catch (error) {
            console.error("Error fetching customers: ", error);
            setSuccessMessage("گاہکوں کو لوڈ کرنے میں خرابی");
            setShowSuccessPopup(true);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (modalMode === 'edit') {
            updateCustomer();
        } else {
            addCustomer();
        }
    };

    const addCustomer = async () => {
        setLoading(true);
        try {
            const customersCollection = collection(firestore, 'customers');
            await addDoc(customersCollection, formData);
            
            setFormData({
                name: '',
                phone: '',
                address: ''
            });
            
            closeModal('customerModal');
            
            // Refresh all customers data
            await fetchCustomers();
            
            setSuccessMessage('نیا گاہک کامیابی سے شامل ہو گیا');
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error adding customer: ", error);
            setSuccessMessage("گاہک شامل کرنے میں خرابی");
            setShowSuccessPopup(true);
        } finally {
            setLoading(false);
        }
    };

    const updateCustomer = async () => {
        setLoading(true);
        try {
            const customerRef = doc(firestore, 'customers', selectedCustomerId);
            await updateDoc(customerRef, formData);
            
            closeModal('customerModal');
            
            // Refresh all customers data
            await fetchCustomers();
            
            setSuccessMessage('گاہک کی معلومات کامیابی سے اپڈیٹ ہوئیں');
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error updating customer: ", error);
            setSuccessMessage("گاہک کو اپڈیٹ کرنے میں خرابی");
            setShowSuccessPopup(true);
        } finally {
            setLoading(false);
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

    const deleteCustomer = async (customerId) => {
        if (!customerId) return;

        requestPasswordForDelete(async (id) => {
            setLoading(true);
            try {
                const customerRef = doc(firestore, 'customers', id);
                await deleteDoc(customerRef);

                // Refresh all customers data
                await fetchCustomers();

                setSuccessMessage('گاہک کامیابی سے حذف کر دیا گیا');
                setShowSuccessPopup(true);
            } catch (error) {
                console.error("Error deleting customer: ", error);
                setSuccessMessage("گاہک کو حذف کرنے میں خرابی");
                setShowSuccessPopup(true);
            } finally {
                setLoading(false);
            }
        }, customerId);
    };

    const showCustomerModal = (mode, customerId = null) => {
        setModalMode(mode);
        setSelectedCustomerId(customerId);
        
        if (mode === 'edit' && customerId) {
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
                setFormData({
                    name: customer.name || '',
                    phone: customer.phone || '',
                    address: customer.address || ''
                });
            }
        } else {
            setFormData({
                name: '',
                phone: '',
                address: ''
            });
        }
        
        document.getElementById('customerModal').style.display = 'block';
    };

    const closeModal = (modalId) => {
        document.getElementById(modalId).style.display = 'none';
    };

    // Monthly rates state - separate from global rates
    const [monthlyRatesData, setMonthlyRatesData] = useState({});

    // Fetch monthly rates from separate collection
    const fetchMonthlyRates = async () => {
        try {
            const monthlyRatesCollection = collection(firestore, 'monthlyRates');
            const monthlyRatesSnapshot = await getDocs(monthlyRatesCollection);
            const monthlyRatesMap = {};
            
            monthlyRatesSnapshot.docs.forEach(doc => {
                const data = doc.data();
                const key = `${data.customerId}_${data.year}_${data.month}`;
                monthlyRatesMap[key] = {
                    milkRate: data.milkRate,
                    yogurtRate: data.yogurtRate,
                    customerId: data.customerId,
                    month: data.month,
                    year: data.year
                };
            });
            
            setMonthlyRatesData(monthlyRatesMap);
        } catch (error) {
            console.error("Error fetching monthly rates: ", error);
        }
    };

    // Monthly rates functions
    // Helper function to find the most recent monthly rate for a customer
    const findMostRecentMonthlyRate = (customerId, targetMonth, targetYear) => {
        if (!monthlyRatesData || Object.keys(monthlyRatesData).length === 0) return null;

        let mostRecentPastRate = null;
        let mostRecentPastDate = null;
        let closestFutureRate = null;
        let closestFutureDate = null;

        // Search through all monthly rates for this customer
        Object.keys(monthlyRatesData).forEach(key => {
            const rate = monthlyRatesData[key];

            if (rate.customerId === customerId) {
                const rateDate = new Date(rate.year, rate.month, 1);
                const targetDate = new Date(targetYear, targetMonth, 1);

                // Check if at least one rate is valid (OR logic - milk OR yogurt)
                const hasValidMilkRate = rate.milkRate !== null && rate.milkRate !== undefined && typeof rate.milkRate === 'number' && rate.milkRate > 0;
                const hasValidYogurtRate = rate.yogurtRate !== null && rate.yogurtRate !== undefined && typeof rate.yogurtRate === 'number' && rate.yogurtRate > 0;

                if (hasValidMilkRate || hasValidYogurtRate) {
                    if (rateDate <= targetDate) {
                        // Past or current rate - find most recent
                        if (!mostRecentPastDate || rateDate > mostRecentPastDate) {
                            mostRecentPastRate = rate;
                            mostRecentPastDate = rateDate;
                        }
                    } else {
                        // Future rate - find closest one
                        if (!closestFutureDate || rateDate < closestFutureDate) {
                            closestFutureRate = rate;
                            closestFutureDate = rateDate;
                        }
                    }
                }
            }
        });

        // Prefer past rates, but use future rate if no past rate found
        if (mostRecentPastRate) {
            return mostRecentPastRate;
        }
        if (closestFutureRate) {
            return closestFutureRate;
        }
        return null;
    };

    const getMonthlyRates = (customerId, month, year) => {
        const key = `${customerId}_${year}_${month}`;

        // First, try to get rates for the specific month
        const monthlyRate = monthlyRatesData[key];
        if (monthlyRate) {
            // Check if at least one rate is valid (OR logic - milk OR yogurt)
            const hasValidMilkRate = monthlyRate.milkRate !== null && monthlyRate.milkRate !== undefined && typeof monthlyRate.milkRate === 'number' && monthlyRate.milkRate > 0;
            const hasValidYogurtRate = monthlyRate.yogurtRate !== null && monthlyRate.yogurtRate !== undefined && typeof monthlyRate.yogurtRate === 'number' && monthlyRate.yogurtRate > 0;

            if (hasValidMilkRate || hasValidYogurtRate) {
                return monthlyRate;
            }
        }

        // If no rates found for current month, find the most recent monthly rate
        return findMostRecentMonthlyRate(customerId, month, year);
    };

    const showMonthlyRatesModal = (customerId) => {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const monthlyRates = getMonthlyRates(customerId, currentMonth, currentYear);
        const customer = customers.find(c => c.id === customerId);
        
        setMonthlyRateForm({
            customerId,
            month: currentMonth,
            year: currentYear,
            milkRate: monthlyRates ? monthlyRates.milkRate : 0,
            yogurtRate: monthlyRates ? monthlyRates.yogurtRate : 0
        });

        const modal = document.getElementById('monthlyRatesModal');
        if (modal) {
            modal.style.display = 'block';
        }
    };

    const handleMonthlyRateFormChange = (field, value) => {
        const updatedForm = { ...monthlyRateForm, [field]: value };
        
        if (field === 'month' || field === 'year' || field === 'customerId') {
            const monthlyRates = getMonthlyRates(updatedForm.customerId, updatedForm.month, updatedForm.year);
            
            updatedForm.milkRate = monthlyRates ? monthlyRates.milkRate : 0;
            updatedForm.yogurtRate = monthlyRates ? monthlyRates.yogurtRate : 0;
        }
        
        setMonthlyRateForm(updatedForm);
    };

    const handleMonthlyRateFormSubmit = (e) => {
        e.preventDefault();
        updateMonthlyRates();
    };

    const validateMonthlyRateUpdate = (customerId, month, year, newRates) => {
        const existingRates = getMonthlyRates(customerId, month, year);
        
        if (existingRates) {
            const ratesChanged = 
                existingRates.milkRate !== newRates.milkRate || 
                existingRates.yogurtRate !== newRates.yogurtRate;
            
            if (ratesChanged) {
                const password = prompt('مہینہ وار ریٹس کو تبدیل کرنے کے لیے پاس ورڈ درج کریں:');
                if (password !== 'admin123') {
                    return false;
                }
            }
        }
        
        return true;
    };

    const updateMonthlyRates = async () => {
        setLoading(true);
        try {
            const key = `${monthlyRateForm.customerId}_${monthlyRateForm.year}_${monthlyRateForm.month}`;
            
            const newRates = {
                milkRate: parseFloat(monthlyRateForm.milkRate),
                yogurtRate: parseFloat(monthlyRateForm.yogurtRate)
            };
            
            if (!validateMonthlyRateUpdate(monthlyRateForm.customerId, monthlyRateForm.month, monthlyRateForm.year, newRates)) {
                setLoading(false);
                setSuccessMessage('غلط پاس ورڈ! مہینہ وار ریٹس اپڈیٹ نہیں ہو سکے');
                setShowSuccessPopup(true);
                return;
            }
            
            // Check if monthly rate already exists
            const existingRate = getMonthlyRates(monthlyRateForm.customerId, monthlyRateForm.month, monthlyRateForm.year);
            const monthlyRatesCollection = collection(firestore, 'monthlyRates');
            
            if (existingRate) {
                // Update existing document - find the document ID
                const monthlyRatesSnapshot = await getDocs(query(
                    monthlyRatesCollection,
                    where('customerId', '==', monthlyRateForm.customerId),
                    where('month', '==', monthlyRateForm.month),
                    where('year', '==', monthlyRateForm.year)
                ));
                
                if (!monthlyRatesSnapshot.empty) {
                    const docId = monthlyRatesSnapshot.docs[0].id;
                    await updateDoc(doc(firestore, 'monthlyRates', docId), {
                        milkRate: parseFloat(monthlyRateForm.milkRate),
                        yogurtRate: parseFloat(monthlyRateForm.yogurtRate),
                        updatedAt: new Date()
                    });
                }
            } else {
                // Create new document
                await addDoc(monthlyRatesCollection, {
                    customerId: monthlyRateForm.customerId,
                    month: monthlyRateForm.month,
                    year: monthlyRateForm.year,
                    milkRate: parseFloat(monthlyRateForm.milkRate),
                    yogurtRate: parseFloat(monthlyRateForm.yogurtRate),
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
            
            // Refresh monthly rates data
            await fetchMonthlyRates();
            
            closeModal('monthlyRatesModal');
            setSuccessMessage('مہینہ وار ریٹس کامیابی سے محفوظ ہو گئے');
            setShowSuccessPopup(true);
            
        } catch (error) {
            console.error("Error updating monthly rates: ", error);
            setSuccessMessage("مہینہ وار ریٹس اپڈیٹ کرنے میں خرابی");
            setShowSuccessPopup(true);
        } finally {
            setLoading(false);
        }
    };

    // Filter customers based on search term
    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(customerSearchTerm)) ||
        (customer.address && customer.address.toLowerCase().includes(customerSearchTerm.toLowerCase()))
    );

    // Pagination handlers
    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            fetchCustomers(page);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            goToPage(currentPage + 1);
        }
    };

    // Generate pagination numbers
    const getPaginationNumbers = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages);
        } else if (totalPages > 1) {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    return (
        <div className="main-content">
            <section id="customers" className="active">
                <div className="customer-header">
                    <h2>گاہکوں کی فہرست</h2>
                    <button
                        onClick={() => showCustomerModal('add')}
                        className="add-btn"
                        disabled={loading}
                    >
                        <AddIcon fontSize="small" style={{ marginRight: '8px' }} />
                        نیا گاہک شامل کریں
                    </button>
                </div>

                <div className="search-bar">
                    <div className="search-input-container">
                        <SearchIcon className="search-icon" fontSize="small" />
                        <input
                            type="text"
                            placeholder="گاہکوں کو تلاش کریں..."
                            value={customerSearchTerm}
                            onChange={(e) => setCustomerSearchTerm(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Customer Info */}
                <div className="pagination-info">
                    <p>
                        کل گاہک: {totalCustomers}
                        {customerSearchTerm && ` | تلاش کے نتائج: ${filteredCustomers.length}`}
                    </p>
                </div>

                <div className="customer-list">
                    {loading ? (
                        <div className="loading-container">
                            <LoadingSpinner />
                            <p>گاہک لوڈ ہو رہے ہیں...</p>
                        </div>
                    ) : filteredCustomers.length > 0 ? (
                        filteredCustomers.map(customer => (
                            <div key={customer.id} className="customer-card">
                                <h3>{customer.name}</h3>
                                <p><strong>فون:</strong> {customer.phone || 'N/A'}</p>
                                <p><strong>پتہ:</strong> {customer.address || 'N/A'}</p>
                                <div className="customer-actions">
                                    <button
                                        onClick={() => showCustomerModal('edit', customer.id)}
                                        className="edit-btn"
                                        disabled={loading}
                                    >
                                        <EditIcon fontSize="small" />
                                        <span>تبدیل کریں</span>
                                    </button>
                                    <button
                                        onClick={() => deleteCustomer(customer.id)}
                                        className="delete-btn"
                                        disabled={loading}
                                    >
                                        <DeleteIcon fontSize="small" />
                                        <span>حذف کریں</span>
                                    </button>
                                    <button
                                        className="action-btn"
                                        onClick={() => showMonthlyRatesModal(customer.id)}
                                        title="مہینہ وار ریٹس"
                                        disabled={loading}
                                    >
                                        <CalendarMonthIcon />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-data-message">
                            <p>{customerSearchTerm ? 'کوئی گاہک نہیں ملا' : 'کوئی گاہک موجود نہیں'}</p>
                        </div>
                    )}
                </div>

            </section>

            {/* Customer Modal */}
            <div id="customerModal" className="modal">
                <div className="modal-content">
                    <span className="close" onClick={() => closeModal('customerModal')}>&times;</span>
                    <h3>{modalMode === 'edit' ? 'گاہک کی معلومات تبدیل کریں' : 'نیا گاہک شامل کریں'}</h3>
                    <form onSubmit={handleFormSubmit}>
                        <div className="form-group">
                            <label htmlFor="customerName">نام:</label>
                            <input
                                type="text"
                                id="customerName"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="customerPhone">فون نمبر:</label>
                            <input
                                type="tel"
                                id="customerPhone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="customerAddress">پتہ:</label>
                            <textarea
                                id="customerAddress"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                disabled={loading}
                                rows="3"
                            ></textarea>
                        </div>
                        <button type="submit" disabled={loading} className="button-with-spinner">
                            {modalMode === 'edit' ? 'گاہک کو اپڈیٹ کریں' : 'گاہک محفوظ کریں'}
                            {loading && <LoadingSpinner />}
                        </button>
                    </form>
                </div>
            </div>

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

            {/* Monthly Rates Modal */}
            <div id="monthlyRatesModal" className="modal" style={{
                display: 'none',
                position: 'fixed',
                zIndex: 1000,
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div className="modal-content" style={{
                    backgroundColor: '#fff',
                    margin: '4% auto',
                    padding: '2.5rem 2rem',
                    borderRadius: '16px',
                    width: '95%',
                    maxWidth: '420px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                }}>
                    <span className="close" onClick={() => closeModal('monthlyRatesModal')} style={{
                        position: 'absolute',
                        right: '1.5rem',
                        top: '1.2rem',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: '#333',
                        cursor: 'pointer',
                        background: '#f2f2f2',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #e0e0e0',
                        transition: 'background 0.2s, color 0.2s',
                    }}>&times;</span>
                    <h2 style={{
                        color: '#1b4332',
                        marginBottom: '0.5rem',
                        textAlign: 'center',
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                    }}>مہینہ وار ریٹس شامل کریں</h2>
                    
                    {(() => {
                        const existingRates = getMonthlyRates(monthlyRateForm.customerId, monthlyRateForm.month, monthlyRateForm.year);
                        return existingRates ? (
                            <div style={{
                                backgroundColor: '#fff3cd',
                                border: '1px solid #ffeaa7',
                                borderRadius: '8px',
                                padding: '0.8rem',
                                marginBottom: '0.5rem',
                                fontSize: '0.9rem',
                                color: '#856404'
                            }}>
                                ⚠️ <strong>تنبیہ:</strong> اس گاہک کے لیے پہلے سے مہینہ وار ریٹس موجود ہیں۔ تبدیلی کے لیے پاس ورڈ درکار ہوگا۔
                            </div>
                        ) : null;
                    })()}
                    
                    <form id="monthlyRatesForm" onSubmit={handleMonthlyRateFormSubmit} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.2rem',
                    }}>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label htmlFor="customerId" style={{ fontWeight: 500, color: '#333' }}>گاہک:</label>
                            <select
                                id="customerId"
                                name="customerId"
                                value={monthlyRateForm.customerId}
                                onChange={(e) => handleMonthlyRateFormChange('customerId', e.target.value)}
                                disabled={loading}
                                style={{
                                    padding: '0.7rem',
                                    borderRadius: '8px',
                                    border: '1px solid #ced4da',
                                    fontSize: '1rem',
                                    background: '#f8f9fa',
                                }}
                            >
                                {customers.map(customer => (
                                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label htmlFor="month" style={{ fontWeight: 500, color: '#333' }}>ماہ:</label>
                            <select
                                id="month"
                                name="month"
                                value={monthlyRateForm.month}
                                onChange={(e) => handleMonthlyRateFormChange('month', parseInt(e.target.value))}
                                disabled={loading}
                                style={{
                                    padding: '0.7rem',
                                    borderRadius: '8px',
                                    border: '1px solid #ced4da',
                                    fontSize: '1rem',
                                    background: '#f8f9fa',
                                }}
                            >
                                {Array.from({ length: 12 }, (_, i) => i).map(month => (
                                    <option key={month} value={month}>{new Date(0, month).toLocaleString('default', { month: 'long' })}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label htmlFor="year" style={{ fontWeight: 500, color: '#333' }}>سال:</label>
                            <select
                                id="year"
                                name="year"
                                value={monthlyRateForm.year}
                                onChange={(e) => handleMonthlyRateFormChange('year', parseInt(e.target.value))}
                                disabled={loading}
                                style={{
                                    padding: '0.7rem',
                                    borderRadius: '8px',
                                    border: '1px solid #ced4da',
                                    fontSize: '1rem',
                                    background: '#f8f9fa',
                                }}
                            >
                                {Array.from({ length: 10 }, (_, i) => i + new Date().getFullYear() - 5).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label htmlFor="milkRate" style={{ fontWeight: 500, color: '#333' }}>دودھ کی ریٹ (روپے/لیٹر):</label>
                            <input
                                type="number"
                                id="milkRate"
                                name="milkRate"
                                value={monthlyRateForm.milkRate}
                                onChange={(e) => handleMonthlyRateFormChange('milkRate', parseFloat(e.target.value))}
                                disabled={loading}
                                style={{
                                    padding: '0.7rem',
                                    borderRadius: '8px',
                                    border: '1px solid #ced4da',
                                    fontSize: '1rem',
                                    background: '#f8f9fa',
                                }}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label htmlFor="yogurtRate" style={{ fontWeight: 500, color: '#333' }}>دہی کی ریٹ (روپے/کلو):</label>
                            <input
                                type="number"
                                id="yogurtRate"
                                name="yogurtRate"
                                value={monthlyRateForm.yogurtRate}
                                onChange={(e) => handleMonthlyRateFormChange('yogurtRate', parseFloat(e.target.value))}
                                disabled={loading}
                                style={{
                                    padding: '0.7rem',
                                    borderRadius: '8px',
                                    border: '1px solid #ced4da',
                                    fontSize: '1rem',
                                    background: '#f8f9fa',
                                }}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                backgroundColor: '#1b4332',
                                color: 'white',
                                border: 'none',
                                padding: '0.8rem 1.5rem',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            محفوظ کریں
                            {loading && <LoadingSpinner />}
                        </button>
                    </form>
                </div>
            </div>

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

                .customer-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .add-btn {
                    background-color: #2d6a4f;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .add-btn:hover {
                    background-color: #1b4332;
                }

                .add-btn:disabled {
                    background-color: #6c757d;
                    cursor: not-allowed;
                }

                .search-bar {
                    margin-bottom: 20px;
                }

                .search-input-container {
                    position: relative;
                    max-width: 400px;
                }

                .search-input-container input {
                    width: 100%;
                    padding: 12px 40px 12px 12px;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    font-size: 16px;
                    direction: rtl;
                }

                .search-input-container input:focus {
                    outline: none;
                    border-color: #52b788;
                }

                .search-icon {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #666;
                }

                .pagination-info {
                    background: white;
                    padding: 10px 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .pagination-info p {
                    margin: 0;
                    color: #666;
                    font-size: 14px;
                }

                .loading-container {
                    text-align: center;
                    padding: 40px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .customer-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .customer-card {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                .customer-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                }

                .customer-card h3 {
                    margin: 0 0 10px 0;
                    color: #2d6a4f;
                    font-size: 18px;
                }

                .customer-card p {
                    margin: 8px 0;
                    color: #666;
                    font-size: 14px;
                }

                .customer-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 15px;
                    justify-content: flex-end;
                }

                .edit-btn, .delete-btn, .action-btn {
                    padding: 8px 12px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    transition: all 0.2s ease;
                }

                .edit-btn {
                    background-color: #52b788;
                    color: white;
                }

                .edit-btn:hover {
                    background-color: #40916c;
                }

                .delete-btn {
                    background-color: #dc3545;
                    color: white;
                }

                .delete-btn:hover {
                    background-color: #c82333;
                }

                .action-btn {
                    background-color: #6c757d;
                    color: white;
                }

                .action-btn:hover {
                    background-color: #5a6268;
                }

                .edit-btn:disabled, .delete-btn:disabled, .action-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .no-data-message {
                    text-align: center;
                    padding: 40px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    color: #666;
                    font-size: 18px;
                }

                .pagination-controls {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 10px;
                    margin-top: 30px;
                    padding: 20px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .pagination-btn {
                    padding: 10px 16px;
                    border: 1px solid #e9ecef;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }

                .pagination-btn:hover:not(:disabled) {
                    background-color: #f8f9fa;
                    border-color: #52b788;
                }

                .pagination-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .pagination-numbers {
                    display: flex;
                    gap: 5px;
                }

                .pagination-number {
                    padding: 8px 12px;
                    border: 1px solid #e9ecef;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    min-width: 40px;
                    text-align: center;
                    transition: all 0.2s ease;
                }

                .pagination-number:hover:not(:disabled):not(.dots) {
                    background-color: #f8f9fa;
                    border-color: #52b788;
                }

                .pagination-number.active {
                    background-color: #2d6a4f;
                    color: white;
                    border-color: #2d6a4f;
                }

                .pagination-number.dots {
                    cursor: default;
                    border: none;
                    background: transparent;
                }

                .pagination-number:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .modal {
                    display: none;
                    position: fixed;
                    z-index: 1000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                }

                .modal-content {
                    background-color: #fefefe;
                    margin: 5% auto;
                    padding: 20px;
                    border: 1px solid #888;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 500px;
                    position: relative;
                }

                .close {
                    color: #aaa;
                    float: right;
                    font-size: 28px;
                    font-weight: bold;
                    position: absolute;
                    right: 15px;
                    top: 10px;
                    cursor: pointer;
                }

                .close:hover,
                .close:focus {
                    color: black;
                    text-decoration: none;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #2d6a4f;
                }

                .form-group input,
                .form-group textarea {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: border-color 0.3s ease;
                    direction: rtl;
                }

                .form-group input:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: #52b788;
                }

                .button-with-spinner {
                    background-color: #2d6a4f;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    margin-top: 10px;
                }

                .button-with-spinner:hover {
                    background-color: #1b4332;
                }

                .button-with-spinner:disabled {
                    background-color: #6c757d;
                    cursor: not-allowed;
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
                }

                .popup-content button {
                    background-color: #2d6a4f;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    margin-top: 15px;
                }

                h2 {
                    color: #2d6a4f;
                    margin-bottom: 20px;
                    font-size: 28px;
                }

                h3 {
                    color: #2d6a4f;
                    margin-bottom: 15px;
                }

                @media (max-width: 768px) {
                    .customer-header {
                        flex-direction: column;
                        gap: 15px;
                        align-items: stretch;
                    }
                    
                    .customer-list {
                        grid-template-columns: 1fr;
                    }
                    
                    .customer-actions {
                        flex-wrap: wrap;
                    }
                    
                    .pagination-controls {
                        flex-wrap: wrap;
                        gap: 5px;
                    }
                    
                    .pagination-numbers {
                        order: 2;
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default MahanaGahak;
