import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, getDocs, deleteDoc, doc, setDoc, query, orderBy, getDoc } from 'firebase/firestore';

const RozanaGahakList = () => {
    // State variables
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showPasswordVerification, setShowPasswordVerification] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [deleteAction, setDeleteAction] = useState(null);
    const [deleteParams, setDeleteParams] = useState(null);
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

    // Fetch bills on component mount
    useEffect(() => {
        fetchBills();
        fetchRates();
    }, []);

    const fetchBills = async () => {
        try {
            const billsCollection = collection(firestore, 'bills');
            const q = query(billsCollection, orderBy('date', 'desc'));
            const billsSnapshot = await getDocs(q);
            const billsList = billsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date.toDate().toLocaleDateString()
            }));
            setBills(billsList);
        } catch (error) {
            console.error("Error fetching bills: ", error);
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

    const resetTokenCounter = async () => {
        try {
            const tokenDoc = doc(firestore, 'settings', 'tokenCounter');
            await setDoc(tokenDoc, { currentToken: 0 });
            setSuccessMessage('ٹوکن کاؤنٹر کامیابی سے ری سیٹ ہو گیا');
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error resetting token counter: ", error);
            setSuccessMessage("ٹوکن کاؤنٹر کو ری سیٹ کرنے میں خرابی");
            setShowSuccessPopup(true);
        }
    };

    const clearBills = async () => {
        requestPasswordForDelete(async () => {
            setLoading(true);
            try {
                const billsCollection = collection(firestore, 'bills');
                const billsSnapshot = await getDocs(billsCollection);

                const deletePromises = billsSnapshot.docs.map(doc =>
                    deleteDoc(doc.ref)
                );

                await Promise.all(deletePromises);
                setBills([]);
                resetTokenCounter();
                setSuccessMessage('تمام بل کامیابی سے حذف کر دیے گئے ہیں');
                setShowSuccessPopup(true);
            } catch (error) {
                console.error("Error clearing bills: ", error);
                setSuccessMessage("بلوں کو حذف کرنے میں خرابی");
                setShowSuccessPopup(true);
            } finally {
                setLoading(false);
            }
        });
    };

    const showBill = (bill) => {
        const modal = document.getElementById('billModal');
        const billPrint = document.getElementById('billPrint');

        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString();
        const formattedTime = currentDate.toLocaleTimeString();

        const billNumber = bill.id || '0';

        const entries = bill.entries || [
            {
                id: 1,
                milkQty: bill.milkQty || 0,
                yogurtQty: bill.yogurtQty || 0,
                milkTotal: bill.milkTotal || 0,
                yogurtTotal: bill.yogurtTotal || 0
            }
        ];

        let entriesHTML = '';
        entries.forEach(entry => {
            if (entry.milkQty > 0) {
                entriesHTML += `
                    <tr>
                        <td style="text-align: right;">دودھ</td>
                        <td style="text-align: center;">1</td>
                        <td style="text-align: center;">${entry.milkQty}</td>
                        <td style="text-align: center;">${entry.milkTotal.toFixed(2)}</td>
                    </tr>
                `;
            }
            if (entry.yogurtQty > 0) {
                entriesHTML += `
                    <tr>
                        <td style="text-align: right;">دہی</td>
                        <td style="text-align: center;">1</td>
                        <td style="text-align: center;">${entry.yogurtQty}</td>
                        <td style="text-align: center;">${entry.yogurtTotal.toFixed(2)}</td>
                    </tr>
                `;
            }
        });

        billPrint.innerHTML = `
            <div style="border: 2px solid black; padding: 10px; width: 210px; margin: 0 auto; font-family: Arial, sans-serif; direction: rtl;">
                <div style="text-align: center; font-weight: bold; font-size: 25px; margin-bottom: 5px;">
                    ورک گرین فوڈ پوائنٹ
                    </div>
                <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; margin-bottom: 5px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>تاریخ :</span>
                        <span>${bill.date}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>وقت :</span>
                        <span>${formattedTime}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>ٹوکن نمبر :</span>
                        <span>${bill.tokenNumber || '0'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>فون ورک :</span>
                        <span>03457411666</span>
                    </div>
                    </div>

                <table style="width: 100%; border-collapse: collapse; margin: 10px 0; direction: rtl;">
                    <thead>
                        <tr>
                            <th style="text-align: right;">پرودکٹ</th>
                            <th style="text-align: center;">آئٹم</th>
                            <th style="text-align: center;">مقدار</th>
                            <th style="text-align: center;">قیمت</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${entriesHTML}
                    </tbody>
                </table>
                
                <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; margin-top: 5px;">
                    <div style="display: flex; justify-content: space-between; font-weight: bold;">
                        <span>کُل رقم :</span>
                        <span>${(bill.grandTotal !== undefined ? bill.grandTotal.toFixed(2) : '0.00')}</span>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    };

    const closeModal = (modalId) => {
        document.getElementById(modalId).style.display = 'none';
    };

    const printBill = () => {
        const billContent = document.getElementById('billPrint').innerHTML;
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write(`
            <html>
            <head>
                <title>Bill Print</title>
                <style>
                    @media print {
                        body { margin: 0; padding: 0; }
                        @page { margin: 0; }
                    }
                </style>
            </head>
            <body>
                ${billContent}
            </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    return (
        <div className="main-content">
            <section id="history" className="active">
                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>بل کی تاریخ</h2>
                    <button
                        onClick={clearBills}
                        className="delete-btn"
                        disabled={loading}
                        style={{ padding: '10px 20px', fontSize: '16px' }}
                    >
                        فہرست صاف کریں
                        {loading && <LoadingSpinner />}
                    </button>
                </div>
                <div id="billHistory" className="bill-history-container">
                    {bills.length > 0 ? (
                        <table className="bills-table">
                            <thead>
                                <tr>
                                    <th>تاریخ</th>
                                    <th>دودھ (لیٹر)</th>
                                    <th>دہی (کلو)</th>
                                    <th>کل رقم</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bills.map(bill => (
                                    <tr key={bill.id} className="bill-table-row" onClick={() => showBill(bill)}>
                                        <td>{bill.date}</td>
                                        <td>{bill.milkQty || 0}</td>
                                        <td>{bill.yogurtQty || 0}</td>
                                        <td className="bill-amount">{bill?.grandTotal?.toFixed(2) ?? 0} روپے</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="no-data-message">
                            <p>کوئی بل نہیں ملا</p>
                        </div>
                    )}
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

            {/* Bill Modal */}
            <div id="billModal" className="modal">
                <div className="modal-content">
                    <span className="close" onClick={() => !loading && closeModal('billModal')}>&times;</span>
                    <div id="billPrint"></div>
                    <button
                        onClick={printBill}
                        disabled={loading}
                        type="submit"
                        className="button-with-spinner"
                    >
                        بل پرنٹ کریں
                        {loading && <LoadingSpinner />}
                    </button>
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

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .delete-btn {
                    background-color: #dc3545;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .delete-btn:hover {
                    background-color: #c82333;
                }

                .delete-btn:disabled {
                    background-color: #6c757d;
                    cursor: not-allowed;
                }

                .bill-history-container {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .bills-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                }

                .bills-table th,
                .bills-table td {
                    padding: 12px;
                    text-align: right;
                    border-bottom: 1px solid #e9ecef;
                }

                .bills-table th {
                    background-color: #f8f9fa;
                    font-weight: 600;
                    color: #2d6a4f;
                    position: sticky;
                    top: 0;
                }

                .bill-table-row {
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }

                .bill-table-row:hover {
                    background-color: #f8f9fa;
                }

                .bill-amount {
                    font-weight: 600;
                    color: #2d6a4f;
                }

                .no-data-message {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                    font-size: 18px;
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
                    max-width: 600px;
                    max-height: 80vh;
                    overflow-y: auto;
                    text-align: center;
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

                .button-with-spinner {
                    background-color: #2d6a4f;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    margin-top: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-left: auto;
                    margin-right: auto;
                }

                .button-with-spinner:hover {
                    background-color: #1b4332;
                }

                .button-with-spinner:disabled {
                    background-color: #6c757d;
                    cursor: not-allowed;
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
                    
                    .bills-table {
                        font-size: 14px;
                    }
                    
                    .bills-table th,
                    .bills-table td {
                        padding: 8px;
                    }
                }
            `}</style>
        </div>
    );
};

export default RozanaGahakList;
