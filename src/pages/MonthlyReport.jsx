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
import { DollarSign, Milk } from 'lucide-react';

const MonthlyReport = () => {
    // State variables
    const [customers, setCustomers] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [advancePayments, setAdvancePayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rates, setRates] = useState({
        milk: 120,
        yogurt: 140,
        monthlyRates: {}
    });

    // Monthly Report State
    const [monthlyReport, setMonthlyReport] = useState({
        selectedMonth: new Date().getMonth(),
        selectedYear: new Date().getFullYear(),
        reportData: {
            totalAdvanceReceived: 0,
            totalMilkSold: 0,
            totalYogurtSold: 0,
            totalRevenue: 0,
            outstandingAmount: 0,
            paymentsReceivedNextMonthForCurrentMonthSales: 0,
            customerData: []
        }
    });

    // Helper function to round numbers
    const roundNumber = (num) => {
        return Math.round(num);
    };

    // Fetch data on component mount
    useEffect(() => {
        fetchCustomers();
        fetchPurchases();
        fetchAdvancePayments();
        fetchRates();
    }, []);

    // Update report when data changes
    useEffect(() => {
        if (customers.length > 0 && purchases.length > 0) {
            updateMonthlyReport(monthlyReport.selectedMonth, monthlyReport.selectedYear);
        }
    }, [customers, purchases, advancePayments, rates]);

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
                setRates(ratesSnapshot.data());
            }
        } catch (error) {
            console.error("Error fetching rates: ", error);
        }
    };

    // Monthly rates functions (same as other components)
    const findMostRecentMonthlyRate = (customerId, targetMonth, targetYear) => {
        if (!rates.monthlyRates) return null;
        
        let mostRecentRate = null;
        let mostRecentDate = null;
        
        Object.keys(rates.monthlyRates).forEach(key => {
            const [rateCustomerId, rateYear, rateMonth] = key.split('_');
            
            if (rateCustomerId === customerId) {
                const rateDate = new Date(parseInt(rateYear), parseInt(rateMonth), 1);
                const targetDate = new Date(targetYear, targetMonth, 1);
                
                if (rateDate <= targetDate) {
                    const rate = rates.monthlyRates[key];
                    
                    if (rate &&
                        typeof rate.milkRate === 'number' && rate.milkRate > 0 &&
                        typeof rate.yogurtRate === 'number' && rate.yogurtRate > 0) {
                        
                        if (!mostRecentDate || rateDate > mostRecentDate) {
                            mostRecentRate = rate;
                            mostRecentDate = rateDate;
                        }
                    }
                }
            }
        });
        
        return mostRecentRate;
    };

    const getMonthlyRates = (customerId, month, year) => {
        const key = `${customerId}_${year}_${month}`;
        if (!rates.monthlyRates) return null;
        
        const monthlyRate = rates.monthlyRates[key];
        if (monthlyRate &&
            typeof monthlyRate.milkRate === 'number' && monthlyRate.milkRate > 0 &&
            typeof monthlyRate.yogurtRate === 'number' && monthlyRate.yogurtRate > 0) {
            return monthlyRate;
        }
        
        return findMostRecentMonthlyRate(customerId, month, year);
    };

    const calculateMonthlyReportData = (month, year) => {
        // Filter purchases for the selected month/year
        const monthlyPurchases = purchases.filter(purchase => {
            if (!purchase.date) return false;
            const purchaseDate = purchase.date instanceof Date ?
                purchase.date :
                new Date(purchase.date);
            return purchaseDate.getMonth() === month && purchaseDate.getFullYear() === year;
        });

        // Calculate totals
        const totalMilkSold = monthlyPurchases.reduce((sum, p) => sum + (parseFloat(p.milk) || 0), 0);
        const totalYogurtSold = monthlyPurchases.reduce((sum, p) => sum + (parseFloat(p.yogurt) || 0), 0);

        // Calculate revenue
        let totalRevenue = 0;
        const customerData = [];
        const customerStats = {};

        // Group purchases by customer
        monthlyPurchases.forEach(purchase => {
            const customerId = purchase.customerId;
            if (!customerStats[customerId]) {
                customerStats[customerId] = {
                    milk: 0,
                    yogurt: 0,
                    amount: 0,
                    customerInfo: customers.find(c => c.id === customerId)
                };
            }

            customerStats[customerId].milk += parseFloat(purchase.milk) || 0;
            customerStats[customerId].yogurt += parseFloat(purchase.yogurt) || 0;

            // Use stored purchase amount if available (preserves historical rates)
            if (purchase.total && !isNaN(parseFloat(purchase.total))) {
                customerStats[customerId].amount += parseFloat(purchase.total);
            } else {
                // Fallback: Calculate using proper rate hierarchy: Monthly Rates → Global Rates
                const monthlyRates = getMonthlyRates(customerId, month, year);
                
                const milkRate = monthlyRates ? monthlyRates.milkRate : rates.milk;
                const yogurtRate = monthlyRates ? monthlyRates.yogurtRate : rates.yogurt;

                customerStats[customerId].amount +=
                    (parseFloat(purchase.milk) || 0) * milkRate +
                    (parseFloat(purchase.yogurt) || 0) * yogurtRate;
            }
        });

        // Convert to array and calculate total revenue
        Object.keys(customerStats).forEach(customerId => {
            const stats = customerStats[customerId];
            totalRevenue += stats.amount;
            customerData.push({
                customerId,
                customerName: stats.customerInfo?.name || 'Unknown',
                milk: stats.milk,
                yogurt: stats.yogurt,
                amount: stats.amount
            });
        });

        // Calculate advance payments received for this month
        const monthlyAdvancePayments = advancePayments.filter(payment => {
            if (!payment.date) return false;
            const paymentDate = new Date(payment.date);
            return paymentDate.getMonth() === month && paymentDate.getFullYear() === year;
        });

        const totalAdvanceReceived = monthlyAdvancePayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);

        // Calculate payments received in the next month for current month's sales
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        
        // Get advance payments received in the next month
        const nextMonthAdvancePayments = advancePayments.filter(payment => {
            if (!payment.date) return false;
            const paymentDate = new Date(payment.date);
            return paymentDate.getMonth() === nextMonth && paymentDate.getFullYear() === nextYear;
        });

        const paymentsReceivedNextMonthForCurrentMonthSales = nextMonthAdvancePayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);

        // Calculate outstanding amount (Current Month Sales - Payments Received Next Month)
        const outstandingAmount = totalRevenue - paymentsReceivedNextMonthForCurrentMonthSales;

        return {
            totalAdvanceReceived,
            totalMilkSold,
            totalYogurtSold,
            totalRevenue,
            outstandingAmount,
            paymentsReceivedNextMonthForCurrentMonthSales,
            customerData: customerData.sort((a, b) => b.amount - a.amount) // Sort by amount descending
        };
    };

    // Update monthly report when month/year changes
    const updateMonthlyReport = (month, year) => {
        const reportData = calculateMonthlyReportData(month, year);
        setMonthlyReport({
            selectedMonth: month,
            selectedYear: year,
            reportData
        });
    };

    return (
        <div className="main-content">
            <section id="monthlyReport" className="active">
                <div className="monthly-report-header">
                    <h2>ماہانہ رپورٹ - دودھ اور دہی</h2>
                    <div className="report-controls">
                        <div className="form-group">
                            <label htmlFor="reportMonth">مہینہ:</label>
                            <select
                                id="reportMonth"
                                value={monthlyReport.selectedMonth}
                                onChange={(e) => updateMonthlyReport(parseInt(e.target.value), monthlyReport.selectedYear)}
                            >
                                <option value={0}>جنوری</option>
                                <option value={1}>فروری</option>
                                <option value={2}>مارچ</option>
                                <option value={3}>اپریل</option>
                                <option value={4}>مئی</option>
                                <option value={5}>جون</option>
                                <option value={6}>جولائی</option>
                                <option value={7}>اگست</option>
                                <option value={8}>ستمبر</option>
                                <option value={9}>اکتوبر</option>
                                <option value={10}>نومبر</option>
                                <option value={11}>دسمبر</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="reportYear">سال:</label>
                            <select
                                id="reportYear"
                                value={monthlyReport.selectedYear}
                                onChange={(e) => updateMonthlyReport(monthlyReport.selectedMonth, parseInt(e.target.value))}
                            >
                                {[2023, 2024, 2025, 2026, 2027].map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="monthly-report-content">
                    {/* Summary Cards */}
                    <div className="report-summary-cards">
                        <div className="summary-card advance-received">
                            <div className="card-header">
                                <div className="card-icon">💳</div>
                            </div>
                            <div className="card-content">
                                <div className="main-value">Rs. {monthlyReport.reportData.paymentsReceivedNextMonthForCurrentMonthSales.toFixed(2)}</div>
                                <div className="unit">اگلے مہینے میں موصولہ</div>
                            </div>
                        </div>

                        <div className="summary-card milk-sold">
                            <div className="card-header">
                                <div className="card-icon"><Milk size={24} /></div>
                            </div>
                            <div className="card-content">
                                <div className="main-value">{monthlyReport.reportData.totalMilkSold.toFixed(1)}</div>
                                <div className="unit">لیٹر<h3>دودھ فروخت</h3></div>
                            </div>
                        </div>

                        <div className="summary-card yogurt-sold">
                            <div className="card-header">
                                <div className="card-icon"><Milk size={24} /></div>
                            </div>
                            <div className="card-content">
                                <div className="main-value">{monthlyReport.reportData.totalYogurtSold.toFixed(1)}</div>
                                <div className="unit">کلو<h3>دہی فروخت</h3></div>
                            </div>
                        </div>

                        <div className="summary-card total-revenue">
                            <div className="card-header">
                                <div className="card-icon"><DollarSign size={24} /></div>
                            </div>
                            <div className="card-content">
                                <div className="main-value">Rs. {monthlyReport.reportData.totalRevenue.toFixed(0)}</div>
                                <div className="unit">روپے   <h3>کل آمدنی</h3></div>
                            </div>
                        </div>

                        <div className={`summary-card outstanding-amount ${monthlyReport.reportData.outstandingAmount < 0 ? 'credit-balance' : 'debt-balance'}`}>
                            <div className="card-header">
                                <div className="card-icon">{monthlyReport.reportData.outstandingAmount < 0 ? '✅' : '⚠️'}</div>
                            </div>
                            <div className="card-content">
                                <div className={`main-value ${monthlyReport.reportData.outstandingAmount < 0 ? 'credit-amount' : 'debt-amount'}`}>
                                    Rs. {Math.abs(monthlyReport.reportData.outstandingAmount).toFixed(0)}
                                </div>
                                <div className="unit">{monthlyReport.reportData.outstandingAmount < 0 ? 'کریڈٹ' : 'باقی'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Breakdown Table */}
                    <div className="customer-breakdown">
                        <h3>گاہک کی تفصیلات</h3>
                        {monthlyReport.reportData.customerData.length > 0 ? (
                            <div className="customer-table-container">
                                <table className="customer-breakdown-table">
                                    <thead>
                                        <tr>
                                            <th>گاہک کا نام</th>
                                            <th>دودھ (لیٹر)</th>
                                            <th>دہی (کلو)</th>
                                            <th>کل رقم (روپے)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {monthlyReport.reportData.customerData.map((customer, index) => (
                                            <tr key={customer.customerId || index}>
                                                <td>{customer.customerName}</td>
                                                <td>{customer.milk.toFixed(1)}</td>
                                                <td>{customer.yogurt.toFixed(1)}</td>
                                                <td>Rs. {customer.amount.toFixed(0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td><strong>مجموعی</strong></td>
                                            <td><strong>{monthlyReport.reportData.totalMilkSold.toFixed(1)}</strong></td>
                                            <td><strong>{monthlyReport.reportData.totalYogurtSold.toFixed(1)}</strong></td>
                                            <td><strong>Rs. {monthlyReport.reportData.totalRevenue.toFixed(0)}</strong></td>
                                        </tr>
                                        <tr>
                                            <td colSpan="3"><strong>موصولہ رقم </strong></td>
                                            <td><strong>Rs. {monthlyReport.reportData.paymentsReceivedNextMonthForCurrentMonthSales.toFixed(0)}</strong></td>
                                        </tr>
                                        <tr className={monthlyReport.reportData.outstandingAmount < 0 ? 'credit-row' : 'debt-row'}>
                                            <td colSpan="3"><strong>{monthlyReport.reportData.outstandingAmount < 0 ? 'کریڈٹ بیلنس' : 'باقی رقم'}</strong></td>
                                            <td><strong>Rs. {Math.abs(monthlyReport.reportData.outstandingAmount).toFixed(0)}</strong></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <div className="no-data-message">
                                <p>اس مہینے کے لیے کوئی ڈیٹا نہیں ملا</p>
                            </div>
                        )}
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

                .monthly-report-header {
                    background: white;
                    padding: 25px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    margin-bottom: 30px;
                }

                .monthly-report-header h2 {
                    color: #2d6a4f;
                    margin-bottom: 20px;
                    font-size: 28px;
                    text-align: center;
                }

                .report-controls {
                    display: flex;
                    gap: 20px;
                    justify-content: center;
                    align-items: end;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .form-group label {
                    font-weight: 600;
                    color: #2d6a4f;
                    font-size: 16px;
                }

                .form-group select {
                    padding: 10px 15px;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    font-size: 16px;
                    background: white;
                    cursor: pointer;
                    transition: border-color 0.3s ease;
                    direction: rtl;
                }

                .form-group select:focus {
                    outline: none;
                    border-color: #52b788;
                }

                .monthly-report-content {
                    display: flex;
                    flex-direction: column;
                    gap: 30px;
                }

                .report-summary-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                }

                .summary-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    border-left: 4px solid #52b788;
                }

                .summary-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                }

                .summary-card.credit-balance {
                    border-left-color: #28a745;
                }

                .summary-card.debt-balance {
                    border-left-color: #dc3545;
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }

                .card-icon {
                    font-size: 32px;
                    opacity: 0.8;
                }

                .card-content {
                    text-align: center;
                }

                .main-value {
                    font-size: 28px;
                    font-weight: bold;
                    color: #2d6a4f;
                    margin-bottom: 5px;
                }

                .credit-amount {
                    color: #28a745 !important;
                }

                .debt-amount {
                    color: #dc3545 !important;
                }

                .unit {
                    color: #666;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                }

                .unit h3 {
                    margin: 0;
                    color: #2d6a4f;
                    font-size: 16px;
                }

                .customer-breakdown {
                    background: white;
                    padding: 25px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .customer-breakdown h3 {
                    color: #2d6a4f;
                    margin-bottom: 20px;
                    font-size: 22px;
                }

                .customer-table-container {
                    overflow-x: auto;
                }

                .customer-breakdown-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                }

                .customer-breakdown-table th,
                .customer-breakdown-table td {
                    padding: 12px;
                    text-align: right;
                    border-bottom: 1px solid #e9ecef;
                }

                .customer-breakdown-table th {
                    background-color: #f8f9fa;
                    font-weight: 600;
                    color: #2d6a4f;
                    position: sticky;
                    top: 0;
                }

                .customer-breakdown-table tbody tr:hover {
                    background-color: #f8f9fa;
                }

                .customer-breakdown-table tfoot tr {
                    background-color: #f8f9fa;
                    font-weight: 600;
                }

                .customer-breakdown-table tfoot td {
                    border-top: 2px solid #2d6a4f;
                    color: #2d6a4f;
                }

                .credit-row td {
                    color: #28a745 !important;
                }

                .debt-row td {
                    color: #dc3545 !important;
                }

                .no-data-message {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                    font-size: 18px;
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    border: 2px dashed #ddd;
                }

                @media (max-width: 768px) {
                    .monthly-report-header {
                        padding: 20px;
                    }

                    .report-controls {
                        flex-direction: column;
                        gap: 15px;
                    }

                    .report-summary-cards {
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 15px;
                    }

                    .summary-card {
                        padding: 15px;
                    }

                    .main-value {
                        font-size: 24px;
                    }

                    .customer-breakdown {
                        padding: 20px;
                    }

                    .customer-breakdown-table {
                        font-size: 14px;
                    }

                    .customer-breakdown-table th,
                    .customer-breakdown-table td {
                        padding: 8px;
                    }
                }

                @media (max-width: 480px) {
                    .main-content {
                        padding: 15px;
                    }

                    .report-summary-cards {
                        grid-template-columns: 1fr;
                    }

                    .customer-breakdown-table {
                        min-width: 500px;
                    }

                    .main-value {
                        font-size: 20px;
                    }

                    .card-icon {
                        font-size: 24px;
                    }
                }
            `}</style>
        </div>
    );
};

export default MonthlyReport;
