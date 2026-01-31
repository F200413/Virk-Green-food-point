import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { 
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    Timestamp,
    getDoc
} from 'firebase/firestore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

const Suppliers = () => {
    // State variables
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showPasswordVerification, setShowPasswordVerification] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [deleteAction, setDeleteAction] = useState(null);
    const [deleteParams, setDeleteParams] = useState(null);
    const [modalMode, setModalMode] = useState('add');
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        milkQuantity: 0,
        yogurtQuantity: 0
    });

    // Rates state
    const [rates, setRates] = useState({
        milk: 120,
        yogurt: 140
    });

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
        fetchSuppliers();
        fetchRates();
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const suppliersCollection = collection(firestore, 'suppliers');
            const suppliersSnapshot = await getDocs(suppliersCollection);
            const suppliersList = suppliersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort suppliers based on their index numbers (like home.jsx)
            const sortedSuppliers = suppliersList.sort((a, b) => {
                const getIndex = (name) => {
                    const match = name.match(/^(\d+)/);
                    return match ? parseInt(match[1]) : 0;
                };

                const indexA = getIndex(a.name);
                const indexB = getIndex(b.name);

                // Sort in descending order (higher index first)
                return indexB - indexA;
            });

            setSuppliers(sortedSuppliers);
        } catch (error) {
            console.error("Error fetching suppliers: ", error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const showSupplierModal = (mode, supplierId = null) => {
        setModalMode(mode);
        if (mode === 'edit' && supplierId) {
            const supplier = suppliers.find(s => s.id === supplierId);
            if (supplier) {
                setFormData({
                    name: supplier.name,
                    phone: supplier.phone || '',
                    milkQuantity: supplier.milkQuantity,
                    yogurtQuantity: supplier.yogurtQuantity
                });
                setSelectedSupplier(supplierId);
            }
        } else {
            setFormData({
                name: '',
                phone: '',
                milkQuantity: 0,
                yogurtQuantity: 0
            });
            setSelectedSupplier(null);
        }
        document.getElementById('supplierModal').style.display = 'block';
    };

    const closeModal = (modalId) => {
        document.getElementById(modalId).style.display = 'none';
    };

    const addSupplier = async () => {
        setLoading(true);
        try {
            const suppliersCollection = collection(firestore, 'suppliers');
            const supplierData = {
                ...formData,
                lastUpdate: Timestamp.now()
            };
            await addDoc(suppliersCollection, supplierData);

            setFormData({ name: '', phone: '', milkQuantity: 0, yogurtQuantity: 0 });
            closeModal('supplierModal');
            fetchSuppliers();
            setSuccessMessage('نیا سپلائر کامیابی سے شامل ہو گیا');
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error adding supplier: ", error);
            setSuccessMessage("سپلائر شامل کرنے میں خرابی");
            setShowSuccessPopup(true);
        } finally {
            setLoading(false);
        }
    };

    const updateSupplier = async () => {
        setLoading(true);
        try {
            const supplierDoc = doc(firestore, 'suppliers', selectedSupplier);
            const supplierData = {
                ...formData,
                lastUpdate: Timestamp.now()
            };
            await updateDoc(supplierDoc, supplierData);

            setFormData({ name: '', phone: '', milkQuantity: 0, yogurtQuantity: 0 });
            closeModal('supplierModal');
            fetchSuppliers();
            setSuccessMessage('سپلائر کی معلومات کامیابی سے اپڈیٹ ہوئیں');
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error updating supplier: ", error);
            setSuccessMessage("سپلائر اپڈیٹ کرنے میں خرابی");
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

    const deleteSupplier = async (supplierId) => {
        setLoading(true);
        try {
            await deleteDoc(doc(firestore, 'suppliers', supplierId));
            fetchSuppliers();
            setSuccessMessage('سپلائر کامیابی سے حذف ہو گیا');
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error deleting supplier: ", error);
            setSuccessMessage("سپلائر حذف کرنے میں خرابی");
            setShowSuccessPopup(true);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSupplier = (supplierId) => {
        requestPasswordForDelete(deleteSupplier, supplierId);
    };

    return (
        <div className="main-content">
            <section id="suppliers" className="active">
                <div className="supplier-header">
                    <h2>سپلائرز کی فہرست</h2>
                    <button
                        onClick={() => showSupplierModal('add')}
                        className="add-btn"
                        disabled={loading}
                    >
                        <AddIcon fontSize="small" style={{ marginRight: '8px' }} />
                        نیا سپلائر شامل کریں
                    </button>
                </div>

                <div className="supplier-list">
                    {suppliers.length > 0 ? (
                        <div className="supplier-table-container">
                            <table className="supplier-table">
                                <thead>
                                    <tr>
                                        <th>نام</th>
                                        <th>فون</th>
                                        <th>دودھ کی مقدار (لیٹر)</th>
                                        <th>دہی کی مقدار (کلو)</th>
                                        <th>آخری اپڈیٹ</th>
                                        <th>کارروائیاں</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {suppliers.map(supplier => (
                                        <tr key={supplier.id}>
                                            <td>{supplier.name}</td>
                                            <td>{supplier.phone || 'N/A'}</td>
                                            <td>{supplier.milkQuantity || 0}</td>
                                            <td>{supplier.yogurtQuantity || 0}</td>
                                            <td>{supplier.lastUpdate ? new Date(supplier.lastUpdate.toDate()).toLocaleString() : 'N/A'}</td>
                                            <td>
                                                <div className="supplier-actions">
                                                    <button
                                                        onClick={() => showSupplierModal('edit', supplier.id)}
                                                        className="edit-btn"
                                                        disabled={loading}
                                                        title="تبدیل کریں"
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSupplier(supplier.id)}
                                                        className="delete-btn"
                                                        disabled={loading}
                                                        title="حذف کریں"
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="totals-row">
                                        <td colSpan="2"><strong>مجموعی</strong></td>
                                        <td><strong>{suppliers.reduce((sum, supplier) => sum + (parseFloat(supplier.milkQuantity) || 0), 0).toFixed(1)}</strong></td>
                                        <td><strong>{suppliers.reduce((sum, supplier) => sum + (parseFloat(supplier.yogurtQuantity) || 0), 0).toFixed(1)}</strong></td>
                                        <td colSpan="2"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div className="no-data-message">
                            <p>کوئی سپلائر نہیں ملا</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Supplier Modal */}
            <div id="supplierModal" className="modal">
                <div className="modal-content">
                    <div className="modal-header">
                        <h2>{modalMode === 'add' ? 'نیا سپلائر شامل کریں' : 'سپلائر کی معلومات میں ترمیم کریں'}</h2>
                        <button className="close-btn" onClick={() => closeModal('supplierModal')}>
                            <CloseIcon />
                        </button>
                    </div>
                    <div className="modal-body">
                        <form id="supplierForm">
                            <div className="form-group">
                                <label htmlFor="name">سپلائر کا نام:</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    disabled={loading}
                                    placeholder="سپلائر کا نام درج کریں"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="phone">فون نمبر:</label>
                                <input
                                    type="text"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    placeholder="فون نمبر درج کریں"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="milkQuantity">دودھ کی مقدار (لیٹر):</label>
                                <input
                                    type="number"
                                    id="milkQuantity"
                                    name="milkQuantity"
                                    value={formData.milkQuantity}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.1"
                                    required
                                    disabled={loading}
                                    placeholder="دودھ کی مقدار"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="yogurtQuantity">دہی کی مقدار (کلو):</label>
                                <input
                                    type="number"
                                    id="yogurtQuantity"
                                    name="yogurtQuantity"
                                    value={formData.yogurtQuantity}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.1"
                                    required
                                    disabled={loading}
                                    placeholder="دہی کی مقدار"
                                />
                            </div>
                            <div className="form-group">
                                <label>کل قیمت:</label>
                                <p className="calculated-total">
                                    Rs. {(
                                        (parseFloat(formData.milkQuantity) || 0) * rates.milk +
                                        (parseFloat(formData.yogurtQuantity) || 0) * rates.yogurt
                                    ).toFixed(2)}
                                </p>
                                <small className="rate-breakdown">
                                    دودھ: Rs. {((parseFloat(formData.milkQuantity) || 0) * rates.milk).toFixed(2)} | 
                                    دہی: Rs. {((parseFloat(formData.yogurtQuantity) || 0) * rates.yogurt).toFixed(2)}
                                </small>
                            </div>
                            <div className="button-group">
                                <button
                                    type="button"
                                    onClick={modalMode === 'add' ? addSupplier : updateSupplier}
                                    className="submit-btn button-with-spinner"
                                    disabled={loading}
                                >
                                    {modalMode === 'add' ? 'سپلائر شامل کریں' : 'سپلائر اپڈیٹ کریں'}
                                    {loading && <LoadingSpinner />}
                                </button>
                            </div>
                        </form>
                    </div>
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

                .supplier-header {
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

                .supplier-list {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .supplier-table-container {
                    overflow-x: auto;
                }

                .supplier-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                }

                .supplier-table th,
                .supplier-table td {
                    padding: 12px;
                    text-align: right;
                    border-bottom: 1px solid #e9ecef;
                }

                .supplier-table th {
                    background-color: #f8f9fa;
                    font-weight: 600;
                    color: #2d6a4f;
                    position: sticky;
                    top: 0;
                }

                .supplier-table tbody tr:hover {
                    background-color: #f8f9fa;
                }

                .totals-row {
                    background-color: #f8f9fa !important;
                    font-weight: 600;
                    color: #2d6a4f;
                }

                .totals-row td {
                    border-top: 2px solid #2d6a4f;
                    padding: 15px 12px;
                }

                .supplier-actions {
                    display: flex;
                    gap: 8px;
                    justify-content: center;
                }

                .edit-btn, .delete-btn {
                    padding: 8px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    min-width: 36px;
                    height: 36px;
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
                    border: 1px solid #888;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 500px;
                    position: relative;
                    overflow: hidden;
                }

                .modal-header {
                    background-color: #2d6a4f;
                    color: white;
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-header h2 {
                    margin: 0;
                    color: white;
                    font-size: 20px;
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background-color 0.2s ease;
                }

                .close-btn:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }

                .modal-body {
                    padding: 30px;
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

                .form-group input {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: border-color 0.3s ease;
                    direction: rtl;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: #52b788;
                }

                .form-group input:disabled {
                    background-color: #f8f9fa;
                    cursor: not-allowed;
                }

                .calculated-total {
                    font-size: 20px;
                    font-weight: bold;
                    color: #2d6a4f;
                    margin: 10px 0;
                    padding: 15px;
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    border-left: 4px solid #52b788;
                }

                .rate-breakdown {
                    color: #666;
                    font-size: 14px;
                    display: block;
                    margin-top: 8px;
                }

                .button-group {
                    margin-top: 25px;
                }

                .submit-btn {
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
                    transition: background-color 0.3s ease;
                }

                .submit-btn:hover:not(:disabled) {
                    background-color: #1b4332;
                }

                .submit-btn:disabled {
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

                @media (max-width: 768px) {
                    .supplier-header {
                        flex-direction: column;
                        gap: 15px;
                        align-items: stretch;
                    }
                    
                    .supplier-table {
                        font-size: 14px;
                    }
                    
                    .supplier-table th,
                    .supplier-table td {
                        padding: 8px;
                    }
                    
                    .modal-content {
                        width: 95%;
                        margin: 2% auto;
                    }
                    
                    .modal-body {
                        padding: 20px;
                    }
                    
                    .modal-header {
                        padding: 15px;
                    }
                    
                    .modal-header h2 {
                        font-size: 18px;
                    }
                }

                @media (max-width: 480px) {
                    .supplier-table-container {
                        overflow-x: scroll;
                    }
                    
                    .supplier-table {
                        min-width: 600px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Suppliers;
