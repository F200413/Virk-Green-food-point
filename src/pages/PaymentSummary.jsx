import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { 
    collection, 
    getDocs, 
    doc, 
    query, 
    orderBy,
    getDoc
} from 'firebase/firestore';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CreditCardIcon from '@mui/icons-material/CreditCard';

const PaymentSummary = () => {
    // State variables
    const [customers, setCustomers] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [advancePayments, setAdvancePayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rates, setRates] = useState({
        milk: 120,
        yogurt: 140
    });

    // Payment summary state
    const [paymentSummary, setPaymentSummary] = useState({
        totalMilkAmount: 0,
        totalYogurtAmount: 0,
        totalRevenue: 0,
        totalPaymentsReceived: 0,
        outstandingAmount: 0
    });

    // Fetch data on component mount
    useEffect(() => {
        fetchCustomers();
        fetchPurchases();
        fetchAdvancePayments();
        fetchRates();
    }, []);

    // Calculate payment summary when data changes
    useEffect(() => {
        if (customers.length > 0 && purchases.length > 0) {
            calculatePaymentSummary();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customers, purchases, advancePayments]);

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

    const fetchPurchases = async () => {
        setLoading(true);
        try {
            const purchasesCollection = collection(firestore, 'purchases');
            const q = query(purchasesCollection, orderBy('date', 'desc'));
            const purchasesSnapshot = await getDocs(q);
            const purchasesList = purchasesSnapshot.docs.map(doc => {
                const rawDate = doc.data().date;
                let date;
                if (rawDate && typeof rawDate.toDate === 'function') {
                    date = rawDate.toDate();
                } else if (rawDate) {
                    date = new Date(rawDate);
                } else {
                    date = null;
                }
                return {
                    id: doc.id,
                    ...doc.data(),
                    date
                };
            });
            setPurchases(purchasesList);
        } catch (error) {
            console.error("Error fetching purchases: ", error);
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

    const fetchRates = async () => {
        try {
            const ratesDoc = doc(firestore, 'settings', 'rates');
            const ratesSnapshot = await getDoc(ratesDoc);
            if (ratesSnapshot.exists()) {
                const data = ratesSnapshot.data();
                setRates({
                    milk: data.milk || 120,
                    yogurt: data.yogurt || 140
                });
            }
        } catch (error) {
            console.error("Error fetching rates: ", error);
        }
    };

    const calculatePaymentSummary = async () => {
        try {
            let totalMilkAmount = 0;
            let totalYogurtAmount = 0;
            let totalRevenue = 0;
            let totalPaymentsReceived = 0;

            // Calculate totals from all customer purchases
            for (const customer of customers) {
                const customerPurchases = purchases.filter(purchase => purchase.customerId === customer.id);

                for (const purchase of customerPurchases) {
                    totalMilkAmount += parseFloat(purchase.milk || 0);
                    totalYogurtAmount += parseFloat(purchase.yogurt || 0);
                    totalRevenue += parseFloat(purchase.total || 0);
                }
            }

            // Calculate total payments received from all advance payments
            for (const payment of advancePayments) {
                totalPaymentsReceived += parseFloat(payment.amount || 0);
            }

            const outstandingAmount = totalRevenue - totalPaymentsReceived;

            setPaymentSummary({
                totalMilkAmount,
                totalYogurtAmount,
                totalRevenue,
                totalPaymentsReceived,
                outstandingAmount
            });
        } catch (error) {
            console.error("Error calculating payment summary: ", error);
        }
    };

    return (
        <div className="main-content">
            <section id="paymentSummary" className="active">
                <div className="payment-summary-header">
                    <h2>پیمنٹ کی مکمل رپورٹ</h2>
                    <p className="summary-subtitle">تمام ماہانہ گاہکوں کی مکمل رپورٹ</p>
                </div>

                <div className="payment-summary-content">
                    <div className="summary-cards-grid">
                        <div className="summary-card total-milk-card">
                            <div className="card-icon">
                                <LocalDrinkIcon fontSize="large" />
                            </div>
                            <div className="card-content">
                                <h3>کل دودھ</h3>
                                <div className="main-value">{paymentSummary.totalMilkAmount.toFixed(1)} لیٹر</div>
                                <div className="sub-value">دہی: {paymentSummary.totalYogurtAmount.toFixed(1)} کلو</div>
                            </div>
                        </div>

                        {/* <div className="summary-card payments-received-card">
                            <div className="card-icon">
                                <AccountBalanceIcon fontSize="large" />
                            </div>
                            <div className="card-content">
                                <h3>پیمنٹ موصولہ</h3>
                                <div className="main-value">Rs. {paymentSummary.totalPaymentsReceived.toFixed(0)}</div>
                                <div className="sub-value">جمع شدہ رقم</div>
                            </div>
                        </div> */}

                        <div className="summary-card outstanding-card">
                            <div className="card-icon">
                                <CreditCardIcon fontSize="large" />
                            </div>
                            <div className="card-content">
                                <h3>باقی رقم</h3>
                                <div className="main-value" style={{ color: paymentSummary.outstandingAmount > 0 ? '#dc3545' : '#28a745' }}>
                                    Rs. {paymentSummary.outstandingAmount.toFixed(0)}
                                </div>
                                <div className="sub-value">وصول کرنا باقی</div>
                            </div>
                        </div>
                    </div>

                    <div className="payment-breakdown">
                        <div className="breakdown-section">
                            <h3>تفصیلی رپورٹ</h3>
                            <div className="breakdown-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>تفصیلات</th>
                                            <th>مقدار</th>
                                            <th>رقم (Rs.)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>کل دودھ فروخت</td>
                                            <td>{paymentSummary.totalMilkAmount.toFixed(1)} لیٹر</td>
                                            <td>-</td>
                                        </tr>
                                        <tr>
                                            <td>کل دہی فروخت</td>
                                            <td>{paymentSummary.totalYogurtAmount.toFixed(1)} کلو</td>
                                            <td>-</td>
                                        </tr>
                                 
                                        {/* <tr className="received-row">
                                            <td><strong>پیمنٹ موصولہ</strong></td>
                                            <td>-</td>
                                            <td style={{ color: '#28a745' }}><strong>Rs. {paymentSummary.totalPaymentsReceived.toFixed(0)}</strong></td>
                                        </tr> */}
                                        <tr className="outstanding-row">
                                            <td><strong>باقی رقم</strong></td>
                                            <td>-</td>
                                            <td style={{ color: paymentSummary.outstandingAmount > 0 ? '#dc3545' : '#28a745' }}>
                                                <strong>Rs. {paymentSummary.outstandingAmount.toFixed(0)}</strong>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="payment-percentage">
                            <h4>پیمنٹ کی صورتحال</h4>
                            <div className="percentage-bar">
                                <div
                                    className="percentage-fill"
                                    style={{
                                        width: `${paymentSummary.totalRevenue > 0 ? (paymentSummary.totalPaymentsReceived / paymentSummary.totalRevenue) * 100 : 0}%`
                                    }}
                                ></div>
                            </div>
                            <div className="percentage-text">
                                {paymentSummary.totalRevenue > 0 ?
                                    ((paymentSummary.totalPaymentsReceived / paymentSummary.totalRevenue) * 100).toFixed(1) : 0
                                }% پیمنٹ مکمل
                            </div>
                        </div>
                    </div>
                </div>
            </section>

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

                .payment-summary-header {
                    background: linear-gradient(135deg, #2d6a4f 0%, #52b788 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 12px;
                    text-align: center;
                    margin-bottom: 30px;
                    box-shadow: 0 4px 20px rgba(45, 106, 79, 0.3);
                }

                .payment-summary-header h2 {
                    color: white;
                    margin-bottom: 10px;
                    font-size: 32px;
                    font-weight: 700;
                }

                .summary-subtitle {
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 18px;
                    margin: 0;
                    font-weight: 300;
                }

                .payment-summary-content {
                    display: flex;
                    flex-direction: column;
                    gap: 30px;
                }

                .summary-cards-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 25px;
                }

                .summary-card {
                    background: white;
                    border-radius: 16px;
                    padding: 25px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                    border-left: 5px solid #52b788;
                    position: relative;
                    overflow: hidden;
                }

                .summary-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #52b788, #2d6a4f);
                }

                .summary-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
                }

                .total-milk-card {
                    border-left-color: #3498db;
                }

                .payments-received-card {
                    border-left-color: #28a745;
                }

                .outstanding-card {
                    border-left-color: #dc3545;
                }

                .card-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    border-radius: 50%;
                    margin: 0 auto 15px;
                    color: #2d6a4f;
                }

                .card-content {
                    text-align: center;
                }

                .card-content h3 {
                    color: #2d6a4f;
                    margin-bottom: 15px;
                    font-size: 18px;
                    font-weight: 600;
                }

                .main-value {
                    font-size: 32px;
                    font-weight: 700;
                    color: #1b4332;
                    margin-bottom: 8px;
                    line-height: 1.2;
                }

                .sub-value {
                    color: #666;
                    font-size: 14px;
                    font-weight: 500;
                }

                .payment-breakdown {
                    background: white;
                    border-radius: 16px;
                    padding: 30px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }

                .breakdown-section h3 {
                    color: #2d6a4f;
                    margin-bottom: 25px;
                    font-size: 24px;
                    text-align: center;
                    position: relative;
                }

                .breakdown-section h3::after {
                    content: '';
                    position: absolute;
                    bottom: -10px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 60px;
                    height: 3px;
                    background: linear-gradient(90deg, #52b788, #2d6a4f);
                    border-radius: 2px;
                }

                .breakdown-table {
                    overflow-x: auto;
                    margin-bottom: 30px;
                }

                .breakdown-table table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .breakdown-table th,
                .breakdown-table td {
                    padding: 15px;
                    text-align: right;
                    border-bottom: 1px solid #e9ecef;
                }

                .breakdown-table th {
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    font-weight: 600;
                    color: #2d6a4f;
                    font-size: 16px;
                }

                .breakdown-table tbody tr:hover {
                    background-color: #f8f9fa;
                }

                .total-row {
                    background-color: #e8f5e8 !important;
                    font-weight: 600;
                }

                .received-row {
                    background-color: #d4edda !important;
                }

                .outstanding-row {
                    background-color: #f8d7da !important;
                }

                .payment-percentage {
                    text-align: center;
                    padding: 25px;
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    border-radius: 12px;
                }

                .payment-percentage h4 {
                    color: #2d6a4f;
                    margin-bottom: 20px;
                    font-size: 20px;
                    font-weight: 600;
                }

                .percentage-bar {
                    width: 100%;
                    height: 20px;
                    background-color: #e9ecef;
                    border-radius: 10px;
                    overflow: hidden;
                    margin-bottom: 15px;
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
                }

                .percentage-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #28a745, #20c997);
                    border-radius: 10px;
                    transition: width 0.8s ease;
                    position: relative;
                }

                .percentage-fill::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    animation: shimmer 2s infinite;
                }

                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                .percentage-text {
                    font-size: 18px;
                    font-weight: 600;
                    color: #2d6a4f;
                }

                @media (max-width: 768px) {
                    .payment-summary-header {
                        padding: 20px;
                    }

                    .payment-summary-header h2 {
                        font-size: 24px;
                    }

                    .summary-subtitle {
                        font-size: 16px;
                    }

                    .summary-cards-grid {
                        grid-template-columns: 1fr;
                        gap: 20px;
                    }

                    .summary-card {
                        padding: 20px;
                    }

                    .main-value {
                        font-size: 28px;
                    }

                    .payment-breakdown {
                        padding: 20px;
                    }

                    .breakdown-table th,
                    .breakdown-table td {
                        padding: 10px;
                        font-size: 14px;
                    }

                    .payment-percentage {
                        padding: 20px;
                    }
                }

                @media (max-width: 480px) {
                    .main-content {
                        padding: 15px;
                    }

                    .summary-card {
                        padding: 15px;
                    }

                    .main-value {
                        font-size: 24px;
                    }

                    .card-content h3 {
                        font-size: 16px;
                    }

                    .breakdown-table {
                        min-width: 400px;
                    }
                }
            `}</style>
        </div>
    );
};

export default PaymentSummary;
