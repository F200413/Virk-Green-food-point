import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const RozanaGahak = () => {
    // State variables
    const [rates, setRates] = useState({
        milk: 120,
        yogurt: 140,
        monthlyRates: {}
    });
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [billFormData, setBillFormData] = useState({
        customerName: '',
        milkQty: 0,
        yogurtQty: 0,
        entries: []
    });

    // Loading spinner component
    const LoadingSpinner = () => (
        <div className="spinner"></div>
    );

    // Fetch rates on component mount
    useEffect(() => {
        fetchRates();
        fetchBills();
    }, []);

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

    const getNextTokenNumber = async () => {
        try {
            const tokenDoc = doc(firestore, 'settings', 'tokenCounter');
            const tokenSnapshot = await getDoc(tokenDoc);

            if (tokenSnapshot.exists()) {
                return tokenSnapshot.data().currentToken || 1;
            } else {
                await setDoc(tokenDoc, { currentToken: 1 });
                return 1;
            }
        } catch (error) {
            console.error("Error getting token number: ", error);
            return 1;
        }
    };

    const updateTokenNumber = async (tokenNumber) => {
        try {
            const tokenDoc = doc(firestore, 'settings', 'tokenCounter');
            await setDoc(tokenDoc, { currentToken: tokenNumber + 1 }, { merge: true });
        } catch (error) {
            console.error("Error updating token number: ", error);
        }
    };

    const handleInputChange = (e, setter, data) => {
        const { name, value } = e.target;
        setter({ ...data, [name]: value });
    };

    const addBill = async () => {
        setLoading(true);
        try {
            const hasEntries = billFormData.entries.length > 0;
            const hasDirectQuantities = parseFloat(billFormData.milkQty) > 0 || parseFloat(billFormData.yogurtQty) > 0;

            if (!hasEntries && !hasDirectQuantities) {
                setSuccessMessage("براہ کرم کم از کم ایک اندراج شامل کریں");
                setShowSuccessPopup(true);
                setLoading(false);
                return;
            }

            let allEntries = [...billFormData.entries];
            if (hasDirectQuantities) {
                const currentEntry = {
                    id: Date.now(),
                    milkQty: parseFloat(billFormData.milkQty) || 0,
                    yogurtQty: parseFloat(billFormData.yogurtQty) || 0,
                    milkTotal: (parseFloat(billFormData.milkQty) || 0) * rates.milk,
                    yogurtTotal: (parseFloat(billFormData.yogurtQty) || 0) * rates.yogurt
                };
                allEntries.push(currentEntry);
            }

            const totalMilkQty = allEntries.reduce((sum, entry) => sum + entry.milkQty, 0);
            const totalYogurtQty = allEntries.reduce((sum, entry) => sum + entry.yogurtQty, 0);
            const totalMilkAmount = allEntries.reduce((sum, entry) => sum + entry.milkTotal, 0);
            const totalYogurtAmount = allEntries.reduce((sum, entry) => sum + entry.yogurtTotal, 0);
            const grandTotal = totalMilkAmount + totalYogurtAmount;

            const billsCollection = collection(firestore, 'bills');
            const tokenNumber = await getNextTokenNumber();

            const bill = {
                customerName: billFormData.customerName,
                milkQty: totalMilkQty,
                yogurtQty: totalYogurtQty,
                milkTotal: totalMilkAmount,
                yogurtTotal: totalYogurtAmount,
                grandTotal: grandTotal,
                tokenNumber: tokenNumber,
                date: Timestamp.now(),
                entries: allEntries
            };

            await addDoc(billsCollection, bill);
            await updateTokenNumber(tokenNumber);

            setBillFormData({
                customerName: '',
                milkQty: 0,
                yogurtQty: 0,
                entries: []
            });

            fetchBills();
            showBill(bill);
        } catch (error) {
            console.error("Error adding bill: ", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBillFormSubmit = (e) => {
        e.preventDefault();
        addBill();
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
                        <span>${formattedDate}</span>
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

        // In case the image hasn't loaded yet or fails, show the content anyway
        setTimeout(() => {
            if (billPrint.innerHTML === '') {
                // Fallback to the version without the image
                billPrint.innerHTML = `
                    <div style="border: 2px solid black; padding: 10px; width: 300px; margin: 0 auto; font-family: Arial, sans-serif; direction: rtl;">
                        <div style="text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 5px;">
                            ورک گرین فوڈ پوائنٹ
                            </div>
                        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; margin-bottom: 5px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span>تاریخ :</span>
                                <span>${formattedDate}</span>
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
                            <div style="display: flex; justify-content: space-between;">
                                <span>ٹوٹل :</span>
                                <span>${(bill.grandTotal !== undefined ? bill.grandTotal.toFixed(2) : '0.00')}</span>
                            </div>
                        </div>
                        
                        <!-- Payment Methods Section -->
                        <div style="margin-top: 15px; text-align: center; border-top: 1px dashed #000; padding-top: 10px;">
                            <div style="font-weight: bold; font-size: 14px; margin-bottom: 10px;">پیمنٹ کے طریقے</div>
                            
                            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 5px;">
                                <!-- Payment methods in a row, with text instead of images -->
                                <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                                    <span style="color: #76B82A; font-weight: bold; font-size: 14px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">EP</span>
                                    <span style="font-size: 14px;">03457411666</span>
                                </div>
                                
                                <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                                    <span style="color: #ED0006; font-weight: bold; font-size: 14px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">JC</span>
                                    <span style="font-size: 14px;">03457411666</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Thank You Message -->
                        <div style="margin-top: 15px; text-align: center; font-size: 12px; font-style: italic;">
                            ہماری سروسز استعمال کرنے کا شکریہ
                        </div>
                    </div>
                `;
            }
        }, 500);

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
            closeModal('billModal');
        }, 500);
    };

    const removeEntry = (entryId) => {
        setBillFormData({
            ...billFormData,
            entries: billFormData.entries.filter(entry => entry.id !== entryId)
        });
    };

    return (
        <div className="main-content">
            <section id="billing" className="active">
                <h2>نیا بل</h2>
                <form onSubmit={handleBillFormSubmit}>
                    <div className="entry-form">
                        <div className="form-group">
                            <label htmlFor="milkAmount">دودھ کی رقم (روپے):</label>
                            <input
                                type="number"
                                id="milkAmount"
                                name="milkAmount"
                                min="0"
                                step="any"
                                placeholder="رقم درج کریں"
                                onChange={(e) => {
                                    const amount = parseFloat(e.target.value) || 0;
                                    const qty = amount / rates.milk;
                                    setBillFormData({ ...billFormData, milkQty: qty.toFixed(2) });
                                }}
                                disabled={loading}
                            />
                            <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                                Rate: Rs. {rates.milk} exactly
                            </small>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="yogurtAmount">دہی کی رقم (روپے):</label>
                            <input
                                type="number"
                                id="yogurtAmount"
                                name="yogurtAmount"
                                min="0"
                                step="any"
                                placeholder="رقم درج کریں"
                                onChange={(e) => {
                                    const amount = parseFloat(e.target.value) || 0;
                                    const qty = amount / rates.yogurt;
                                    setBillFormData({ ...billFormData, yogurtQty: qty.toFixed(2) });
                                }}
                                disabled={loading}
                            />
                            <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                                Rate: Rs. {rates.yogurt} exactly
                            </small>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="milkQty">دودھ کی مقدار (لیٹر):</label>
                            <input
                                type="number"
                                id="milkQty"
                                name="milkQty"
                                min="0"
                                step="any"
                                value={billFormData.milkQty}
                                onChange={(e) => {
                                    handleInputChange(e, setBillFormData, billFormData);
                                    const qty = parseFloat(e.target.value) || 0;
                                    const amount = qty * rates.milk;
                                    document.getElementById('milkAmount').value = amount.toFixed(2);
                                }}
                                disabled={loading}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="yogurtQty">دہی کی مقدار (کلو):</label>
                            <input
                                type="number"
                                id="yogurtQty"
                                name="yogurtQty"
                                min="0"
                                step="any"
                                value={billFormData.yogurtQty}
                                onChange={(e) => {
                                    handleInputChange(e, setBillFormData, billFormData);
                                    const qty = parseFloat(e.target.value) || 0;
                                    const amount = qty * rates.yogurt;
                                    document.getElementById('yogurtAmount').value = amount.toFixed(2);
                                }}
                                disabled={loading}
                            />
                        </div>

                        <div className="action-buttons-row">
                            <button
                                type="button"
                                className="add-entry-btn"
                                onClick={() => {
                                    if (parseFloat(billFormData.milkQty) > 0 || parseFloat(billFormData.yogurtQty) > 0) {
                                        const newEntry = {
                                            id: Date.now(),
                                            milkQty: parseFloat(billFormData.milkQty) || 0,
                                            yogurtQty: parseFloat(billFormData.yogurtQty) || 0,
                                            milkTotal: (parseFloat(billFormData.milkQty) || 0) * rates.milk,
                                            yogurtTotal: (parseFloat(billFormData.yogurtQty) || 0) * rates.yogurt
                                        };

                                        setBillFormData({
                                            ...billFormData,
                                            entries: [...billFormData.entries, newEntry],
                                            milkQty: 0,
                                            yogurtQty: 0
                                        });

                                        document.getElementById('milkAmount').value = '';
                                        document.getElementById('yogurtAmount').value = '';
                                    } else {
                                        alert("براہ کرم دودھ یا دہی کی مقدار درج کریں");
                                    }
                                }}
                                disabled={loading}
                            >
                                <AddIcon fontSize="small" style={{ marginRight: '5px' }} />
                                اندراج شامل کریں
                            </button>

                            <button type="submit" disabled={loading} className="bill-submit-btn">
                                بل بنائیں
                                {loading && <LoadingSpinner />}
                            </button>
                        </div>
                    </div>

                    {billFormData.entries.length > 0 && (
                        <div className="entries-list">
                            <h3>اندراج کی فہرست</h3>
                            <table className="entries-table">
                                <thead>
                                    <tr>
                                        <th>آئٹم</th>
                                        <th>مقدار</th>
                                        <th>قیمت</th>
                                        <th>ایکشن</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {billFormData.entries.map(entry => (
                                        <React.Fragment key={entry.id}>
                                            {entry.milkQty > 0 && (
                                                <tr>
                                                    <td>دودھ</td>
                                                    <td>{entry.milkQty} لیٹر</td>
                                                    <td>Rs. {entry.milkTotal.toFixed(2)}</td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="delete-entry-btn"
                                                            onClick={() => removeEntry(entry.id)}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )}
                                            {entry.yogurtQty > 0 && (
                                                <tr>
                                                    <td>دہی</td>
                                                    <td>{entry.yogurtQty} کلو</td>
                                                    <td>Rs. {entry.yogurtTotal.toFixed(2)}</td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="delete-entry-btn"
                                                            onClick={() => removeEntry(entry.id)}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan="2"><strong>کل رقم:</strong></td>
                                        <td colSpan="2">
                                            <strong>
                                                Rs. {billFormData.entries.reduce((total, entry) =>
                                                    total + entry.milkTotal + entry.yogurtTotal, 0).toFixed(2)}
                                            </strong>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </form>
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

                .action-buttons-row {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                }

                .add-entry-btn,
                .bill-submit-btn {
                    padding: 12px 20px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    transition: all 0.3s ease;
                }

                .add-entry-btn {
                    background-color: #52b788;
                    color: white;
                }

                .add-entry-btn:hover {
                    background-color: #40916c;
                }

                .bill-submit-btn {
                    background-color: #2d6a4f;
                    color: white;
                    flex: 1;
                }

                .bill-submit-btn:hover {
                    background-color: #1b4332;
                }

                .entries-list {
                    margin-top: 30px;
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .entries-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                }

                .entries-table th,
                .entries-table td {
                    
                    text-align: right;
                    border-bottom: 1px solid #e9ecef;
                }

                .entries-table th {
                    background-color: #f8f9fa;
                    font-weight: 600;
                    color: #2d6a4f;
                }

                .delete-entry-btn {
                    background-color: #dc3545;
                    color: white;
                    border: none;
                    padding: 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .delete-entry-btn:hover {
                    background-color: #c82333;
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
                    .action-buttons-row {
                        flex-direction: column;
                    }
                    
                    .entries-table {
                        font-size: 14px;
                    }
                    
                    .entries-table th,
                    .entries-table td {
                        padding: 8px;
                    }
                }
            `}</style>
        </div>
    );
};

export default RozanaGahak;
