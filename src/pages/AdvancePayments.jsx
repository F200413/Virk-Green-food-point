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
    Timestamp
} from 'firebase/firestore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const AdvancePayments = () => {
    // State variables
    const [customers, setCustomers] = useState([]);
    const [advancePayments, setAdvancePayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showPasswordVerification, setShowPasswordVerification] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [deleteAction, setDeleteAction] = useState(null);
    const [deleteParams, setDeleteParams] = useState(null);
    
    // Form state
    const [advanceFormData, setAdvanceFormData] = useState({
        customerId: '',
        amount: 0,
        description: ''
    });
    const [customerSearchForAdvance, setCustomerSearchForAdvance] = useState('');
    const [editingAdvancePayment, setEditingAdvancePayment] = useState(null);

    // Debounced search term
    const [debouncedCustomerSearchForAdvance, setDebouncedCustomerSearchForAdvance] = useState('');

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

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedCustomerSearchForAdvance(customerSearchForAdvance);
        }, 300);

        return () => clearTimeout(timer);
    }, [customerSearchForAdvance]);

    // Fetch data on component mount
    useEffect(() => {
        fetchCustomers();
        fetchAdvancePayments();
    }, []);

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

    const fetchAdvancePayments = async () => {
        setLoading(true);
        try {
            const advanceCollection = collection(firestore, 'advancePayments');
            const q = query(advanceCollection, orderBy('date', 'desc'));
            const advanceSnapshot = await getDocs(q);
            const advanceList = advanceSnapshot.docs.map(doc => {
                const rawDate = doc.data().date;
                let date;
                if (rawDate && typeof rawDate.toDate === 'function') {
                    date = rawDate.toDate();
                } else if (rawDate) {
                    date = new Date(rawDate);
                } else {
                    date = new Date();
                }
                return {
                    id: doc.id,
                    ...doc.data(),
                    date
                };
            });
            setAdvancePayments(advanceList);
        } catch (error) {
            console.error("Error fetching advance payments: ", error);
        } finally {
            setLoading(false);
        }
    };

    const addAdvancePayment = async () => {
        setLoading(true);
        try {
            const amount = parseFloat(advanceFormData.amount);

            if (amount <= 0) {
                setSuccessMessage("رقم صفر سے زیادہ ہونی چاہیے");
                setShowSuccessPopup(true);
                setLoading(false);
                return;
            }

            const advanceCollection = collection(firestore, 'advancePayments');
            await addDoc(advanceCollection, {
                customerId: advanceFormData.customerId,
                amount: amount,
                description: advanceFormData.description,
                date: Timestamp.now()
            });

            setAdvanceFormData({ customerId: '', amount: 0, description: '' });
            setCustomerSearchForAdvance('');
            closeModal('advanceModal');
            fetchAdvancePayments();
            setSuccessMessage('ایڈوانس رقم کامیابی سے شامل کر دی گئی ہے');
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error adding advance payment: ", error);
            setSuccessMessage("ایڈوانس رقم شامل کرنے میں خرابی");
            setShowSuccessPopup(true);
        } finally {
            setLoading(false);
        }
    };

    const updateAdvancePayment = async () => {
        setLoading(true);
        try {
            const amount = parseFloat(advanceFormData.amount);

            if (amount <= 0) {
                setSuccessMessage("رقم صفر سے زیادہ ہونی چاہیے");
                setShowSuccessPopup(true);
                setLoading(false);
                return;
            }

            const advanceDoc = doc(firestore, 'advancePayments', editingAdvancePayment);
            await updateDoc(advanceDoc, {
                amount: amount,
                description: advanceFormData.description,
                date: Timestamp.now()
            });

            setAdvanceFormData({ customerId: '', amount: 0, description: '' });
            setCustomerSearchForAdvance('');
            setEditingAdvancePayment(null);
            closeModal('advanceModal');
            fetchAdvancePayments();
            setSuccessMessage('ایڈوانس رقم کامیابی سے اپڈیٹ کر دی گئی ہے');
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error updating advance payment: ", error);
            setSuccessMessage("ایڈوانس رقم اپڈیٹ کرنے میں خرابی");
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

    const deleteAdvancePayment = async (paymentId) => {
        if (!paymentId) return;

        requestPasswordForDelete(async (id) => {
            setLoading(true);
            try {
                const paymentRef = doc(firestore, 'advancePayments', id);
                await deleteDoc(paymentRef);

                setAdvancePayments(prevPayments => prevPayments.filter(payment => payment.id !== id));

                setSuccessMessage('ایڈوانس پیمنٹ کامیابی سے حذف کر دی گئی');
                setShowSuccessPopup(true);
            } catch (error) {
                console.error("Error deleting advance payment: ", error);
                setSuccessMessage("ایڈوانس پیمنٹ کو حذف کرنے میں خرابی");
                setShowSuccessPopup(true);
            } finally {
                setLoading(false);
            }
        }, paymentId);
    };

    const showAdvanceModal = (mode = 'add', paymentId = null) => {
        if (mode === 'edit' && paymentId) {
            const payment = advancePayments.find(p => p.id === paymentId);
            if (payment) {
                const customer = customers.find(c => c.id === payment.customerId);
                setAdvanceFormData({
                    customerId: payment.customerId,
                    amount: payment.amount,
                    description: payment.description || ''
                });
                setCustomerSearchForAdvance(customer ? customer.name : '');
                setEditingAdvancePayment(paymentId);
            }
        } else {
            setAdvanceFormData({ customerId: '', amount: 0, description: '' });
            setCustomerSearchForAdvance('');
            setEditingAdvancePayment(null);
        }
        document.getElementById('advanceModal').style.display = 'block';
    };

    const closeModal = (modalId) => {
        document.getElementById(modalId).style.display = 'none';
    };

    const handleAdvanceFormSubmit = (e) => {
        e.preventDefault();
        if (editingAdvancePayment) {
            updateAdvancePayment();
        } else {
            addAdvancePayment();
        }
    };

    return (
        <div className="main-content">
            <section id="advancePayments" className="active">
                <div className="section-header">
                    <h2>ایڈوانس پیمنٹس</h2>
                    <button
                        onClick={() => showAdvanceModal()}
                        className="add-btn"
                        disabled={loading}
                    >
                        <AddIcon fontSize="small" style={{ marginRight: '8px' }} />
                        نئی ایڈوانس پیمنٹ
                    </button>
                </div>
                
                <div className="advance-payments-list">
                    {advancePayments.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>تاریخ</th>
                                    <th>گاہک</th>
                                    <th>رقم</th>
                                    <th>تفصیل</th>
                                    <th>ایکشنز</th>
                                </tr>
                            </thead>
                            <tbody>
                                {advancePayments.map(payment => {
                                    const customer = customers.find(c => c.id === payment.customerId);
                                    return (
                                        <tr key={payment.id}>
                                            <td>{payment.date.toLocaleString()}</td>
                                            <td>{customer ? customer.name : 'نامعلوم گاہک'}</td>
                                            <td>روپے {(payment.amount !== undefined ? payment.amount.toFixed(2) : '0.00')}</td>
                                            <td>{payment.description || '-'}</td>
                                            <td>
                                                <div className="customer-actions">
                                                    <button
                                                        onClick={() => showAdvanceModal('edit', payment.id)}
                                                        className="edit-btn"
                                                        disabled={loading}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                        <span>Edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => deleteAdvancePayment(payment.id)}
                                                        className="delete-btn"
                                                        disabled={loading}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                        <span>Delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="no-data-message">
                            <p>کوئی ایڈوانس پیمنٹ موجود نہیں</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Advance Payment Modal */}
            <div id="advanceModal" className="modal">
                <div className="modal-content">
                    <span className="close" onClick={() => !loading && closeModal('advanceModal')}>&times;</span>
                    <h3>{editingAdvancePayment ? 'ایڈوانس پیمنٹ میں ترمیم کریں' : 'نئی ایڈوانس پیمنٹ'}</h3>
                    <form id="advanceForm" onSubmit={handleAdvanceFormSubmit}>
                        {!editingAdvancePayment && (
                            <div className="form-group">
                                <label htmlFor="advanceCustomerSearch">گاہک:</label>
                                <div className="customer-search-container">
                                    <input
                                        type="text"
                                        id="advanceCustomerSearch"
                                        placeholder="گاہک تلاش کریں..."
                                        onChange={(e) => {
                                            setCustomerSearchForAdvance(e.target.value);
                                            if (!e.target.value) {
                                                setAdvanceFormData({ ...advanceFormData, customerId: '' });
                                            }
                                        }}
                                        value={customerSearchForAdvance}
                                        disabled={loading}
                                        required
                                    />

                                    {debouncedCustomerSearchForAdvance && (
                                        <div className="search-results">
                                            {customers
                                                .filter(c => c.name.toLowerCase().includes(debouncedCustomerSearchForAdvance.toLowerCase()))
                                                .map(customer => (
                                                    <div
                                                        key={customer.id}
                                                        className="search-result-item"
                                                        onClick={() => {
                                                            setAdvanceFormData({ ...advanceFormData, customerId: customer.id });
                                                            setCustomerSearchForAdvance(customer.name);
                                                        }}
                                                    >
                                                        <div className="customer-name">{customer.name}</div>
                                                        <div className="customer-phone">{customer.phone || 'فون نہیں'}</div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {editingAdvancePayment && (
                            <div className="form-group">
                                <label>گاہک:</label>
                                <div className="selected-customer">
                                    {customerSearchForAdvance}
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="advanceAmount">رقم:</label>
                            <input
                                type="number"
                                id="advanceAmount"
                                min="0"
                                step="0.01"
                                value={advanceFormData.amount}
                                onChange={(e) => setAdvanceFormData({ ...advanceFormData, amount: parseFloat(e.target.value) || 0 })}
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="advanceDescription">تفصیل:</label>
                            <textarea
                                id="advanceDescription"
                                value={advanceFormData.description}
                                onChange={(e) => setAdvanceFormData({ ...advanceFormData, description: e.target.value })}
                                disabled={loading}
                                rows="3"
                                placeholder="تفصیل درج کریں (اختیاری)"
                            ></textarea>
                        </div>

                        <button type="submit" disabled={loading || !advanceFormData.customerId} className="button-with-spinner">
                            {editingAdvancePayment ? 'اپڈیٹ کریں' : 'محفوظ کریں'}
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

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
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
                    transition: all 0.3s ease;
                }

                .add-btn:hover:not(:disabled) {
                    background-color: #1b4332;
                    transform: translateY(-1px);
                }

                .add-btn:disabled {
                    background-color: #6c757d;
                    cursor: not-allowed;
                    transform: none;
                }

                .advance-payments-list {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    overflow-x: auto;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                }

                th, td {
                    padding: 12px;
                    text-align: right;
                    border-bottom: 1px solid #e9ecef;
                }

                th {
                    background-color: #f8f9fa;
                    font-weight: 600;
                    color: #2d6a4f;
                    position: sticky;
                    top: 0;
                }

                tr:hover {
                    background-color: #f8f9fa;
                }

                .customer-actions {
                    display: flex;
                    gap: 8px;
                    justify-content: flex-end;
                }

                .edit-btn, .delete-btn {
                    padding: 6px 10px;
                    border: none;
                    border-radius: 4px;
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

                .edit-btn:hover:not(:disabled) {
                    background-color: #40916c;
                }

                .delete-btn {
                    background-color: #dc3545;
                    color: white;
                }

                .delete-btn:hover:not(:disabled) {
                    background-color: #c82333;
                }

                .edit-btn:disabled, .delete-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .no-data-message {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                    font-size: 18px;
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

                .customer-search-container {
                    position: relative;
                }

                .search-results {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: white;
                    border: 1px solid #e9ecef;
                    border-top: none;
                    border-radius: 0 0 8px 8px;
                    max-height: 200px;
                    overflow-y: auto;
                    z-index: 1001;
                }

                .search-result-item {
                    padding: 10px 12px;
                    cursor: pointer;
                    border-bottom: 1px solid #f8f9fa;
                    transition: background-color 0.2s ease;
                }

                .search-result-item:hover {
                    background-color: #f8f9fa;
                }

                .search-result-item:last-child {
                    border-bottom: none;
                }

                .customer-name {
                    font-weight: 600;
                    color: #2d6a4f;
                    margin-bottom: 2px;
                }

                .customer-phone {
                    font-size: 14px;
                    color: #666;
                }

                .selected-customer {
                    padding: 12px;
                    background-color: #f8f9fa;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    font-weight: 600;
                    color: #2d6a4f;
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
                    transition: background-color 0.3s ease;
                }

                .button-with-spinner:hover:not(:disabled) {
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
                    .section-header {
                        flex-direction: column;
                        gap: 15px;
                        align-items: stretch;
                    }
                    
                    table {
                        font-size: 14px;
                    }
                    
                    th, td {
                        padding: 8px;
                    }
                    
                    .customer-actions {
                        flex-direction: column;
                        gap: 4px;
                    }
                }
            `}</style>
        </div>
    );
};

export default AdvancePayments;
