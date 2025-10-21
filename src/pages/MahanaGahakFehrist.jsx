import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, addDoc, getDocs, doc, query, orderBy, getDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import SearchIcon from '@mui/icons-material/Search';
import PrintIcon from '@mui/icons-material/Print';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import whatsapp from '../assets/whatsapp.png';
import allied from '../assets/allied.png';

const Home = () => {
    // State variables - only what's needed for purchaseList
    const [customers, setCustomers] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [advancePayments, setAdvancePayments] = useState([]);
    const [rates, setRates] = useState({
        milk: 120,
        yogurt: 140,
        monthlyRates: {}
    });
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerListSearchTerm, setCustomerListSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [dailyPurchases, setDailyPurchases] = useState([]);
    const [purchaseFormData, setPurchaseFormData] = useState({
        milk: 0,
        yogurt: 0
    });
    const [showPasswordVerification, setShowPasswordVerification] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [deleteAction, setDeleteAction] = useState(null);
    const [deleteParams, setDeleteParams] = useState(null);

    // Debounced search term
    const [debouncedCustomerListSearchTerm, setDebouncedCustomerListSearchTerm] = useState('');

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedCustomerListSearchTerm(customerListSearchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [customerListSearchTerm]);

    // Monitor selectedCustomer changes
    useEffect(() => {
        if (selectedCustomer) {
            setSelectedDate(new Date());
            const filtered = filterPurchasesByDate(new Date());
            setDailyPurchases(filtered);
            setShowCalendar(true);
        }
    }, [selectedCustomer]);

    // Fetch data on component mount
    useEffect(() => {
        fetchCustomers();
        fetchPurchases();
        fetchAdvancePayments();
        fetchRates();
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
                    date = rawDate.toDate().toISOString();
                } else if (rawDate) {
                    date = new Date(rawDate).toISOString();
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

    // Monthly rates functions
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

    // Helper functions
    const filterPurchasesByMonth = (customerId, month, year) => {
        if (!customerId) return [];

        return purchases.filter(purchase => {
            if (!purchase.date) return false;
            const purchaseDate = purchase.date instanceof Date ?
                purchase.date :
                new Date(purchase.date);
            return purchase.customerId === customerId &&
                purchaseDate.getMonth() === month &&
                purchaseDate.getFullYear() === year;
        });
    };

    const calculateTotals = (purchasesList) => {
        return purchasesList.reduce((acc, purchase) => {
            const purchaseDate = new Date(purchase.date);
            const month = purchaseDate.getMonth();
            const year = purchaseDate.getFullYear();

            const monthlyRates = getMonthlyRates(purchase.customerId, month, year);
            const milkRate = monthlyRates ? monthlyRates.milkRate : rates.milk;
            const yogurtRate = monthlyRates ? monthlyRates.yogurtRate : rates.yogurt;

            const milkAmount = (parseFloat(purchase.milk) || 0) * milkRate;
            const yogurtAmount = (parseFloat(purchase.yogurt) || 0) * yogurtRate;

            return {
                milk: acc.milk + (parseFloat(purchase.milk) || 0),
                yogurt: acc.yogurt + (parseFloat(purchase.yogurt) || 0),
                amount: acc.amount + milkAmount + yogurtAmount,
                milkRate: milkRate,
                yogurtRate: yogurtRate
            };
        }, { milk: 0, yogurt: 0, amount: 0, milkRate: rates.milk, yogurtRate: rates.yogurt });
    };

    const getCustomerAdvanceTotal = (customerId) => {
        const customerAdvances = advancePayments.filter(payment => payment.customerId === customerId);
        return customerAdvances.reduce((total, payment) => total + (parseFloat(payment.amount) || 0), 0);
    };

    // Filter customers based on search term
    const filteredCustomersList = customers
        .filter(customer =>
            customer.name.toLowerCase().includes(debouncedCustomerListSearchTerm.toLowerCase())
        )
        .sort((a, b) => {
            const aNumbers = a.name.match(/\d+/g);
            const bNumbers = b.name.match(/\d+/g);

            const aLastNumber = aNumbers ? aNumbers[aNumbers.length - 1] : null;
            const bLastNumber = bNumbers ? bNumbers[bNumbers.length - 1] : null;

            if (aLastNumber && bLastNumber) {
                const aNum = parseInt(aLastNumber.replace(/^0+/, ''), 10) || 0;
                const bNum = parseInt(bLastNumber.replace(/^0+/, ''), 10) || 0;
                return aNum - bNum;
            }
            if (aLastNumber) return -1;
            if (bLastNumber) return 1;
            return a.name.localeCompare(b.name);
        });

    const showCustomerPurchases = (customerId) => {
        setSelectedCustomer(customerId);
    };

    // Get selected customer data
    const selectedCustomerPurchases = purchases.filter(p => p.customerId === selectedCustomer);
    const selectedCustomerAdvanceTotal = selectedCustomer ? getCustomerAdvanceTotal(selectedCustomer) : 0;
    const selectedCustomerTotals = calculateTotals(selectedCustomerPurchases);
    const selectedCustomerInfo = selectedCustomer ? customers.find(c => c.id === selectedCustomer) : null;
    const customSelectedCustomerTotals = calculateTotals(selectedCustomerPurchases);
    const selectedCustomerBalance = customSelectedCustomerTotals.amount - selectedCustomerAdvanceTotal;

    // Get advance payments for selected customer
    const selectedCustomerAdvancePayments = selectedCustomer 
        ? advancePayments.filter(p => p.customerId === selectedCustomer)
        : [];

    // Get current month totals
    const getCurrentMonthTotals = () => {
        if (!selectedCustomer) return { milk: 0, yogurt: 0, amount: 0, milkRate: rates.milk, yogurtRate: rates.yogurt };

        const currentMonth = selectedDate.getMonth();
        const currentYear = selectedDate.getFullYear();

        const monthlyPurchases = filterPurchasesByMonth(selectedCustomer, currentMonth, currentYear);
        return calculateTotals(monthlyPurchases);
    };

    // Calendar tile className for highlighting days with purchases
    const tileClassName = ({ date, view }) => {
        if (view === 'month' && selectedCustomer) {
            const hasPurchase = selectedCustomerPurchases.some(purchase => {
                const purchaseDate = new Date(purchase.date);
                return purchaseDate.toDateString() === date.toDateString();
            });
            return hasPurchase ? 'has-purchase' : null;
        }
    };

    // Calendar tile content to show milk and yogurt quantities under each date
    const tileContent = ({ date, view }) => {
        if (view !== 'month' || !selectedCustomer) return null;
        const dailyTotals = calculateTotals(filterPurchasesByDate(date));
        const milkTotal = dailyTotals.milk || 0;
        const yogurtTotal = dailyTotals.yogurt || 0;
        
        if (milkTotal <= 0 && yogurtTotal <= 0) return null;
        
        return (
            <div
                className="calendar-tile-qty"
                style={{
                    marginTop: 4,
                    fontSize: 10,
                    color: '#ffffff',
                    fontWeight: 600,
                    display: 'flex',
                    gap: '4px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}
            >
                {milkTotal > 0 && <span>{milkTotal.toFixed(1)}L</span>}
                {yogurtTotal > 0 && <span>{yogurtTotal.toFixed(1)}K</span>}
            </div>
        );
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        const filtered = filterPurchasesByDate(date);
        setDailyPurchases(filtered);
    };

    // Helper function to filter purchases by specific date
    const filterPurchasesByDate = (date) => {
        if (!selectedCustomer) return [];

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return purchases.filter(purchase => {
            if (!purchase.date) return false;
            const purchaseDate = purchase.date instanceof Date ?
                purchase.date :
                new Date(purchase.date);
            return purchase.customerId === selectedCustomer &&
                purchaseDate >= startOfDay &&
                purchaseDate <= endOfDay;
        });
    };

    // Function to recalculate purchase amounts based on monthly rates
    const recalculatePurchaseAmount = (purchase) => {
        const purchaseDate = new Date(purchase.date);
        const month = purchaseDate.getMonth();
        const year = purchaseDate.getFullYear();

        const monthlyRates = getMonthlyRates(purchase.customerId, month, year);
        const milkRate = monthlyRates ? monthlyRates.milkRate : rates.milk;
        const yogurtRate = monthlyRates ? monthlyRates.yogurtRate : rates.yogurt;

        return (parseFloat(purchase.milk) * milkRate) + (parseFloat(purchase.yogurt) * yogurtRate);
    };

    // Password verification functions
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

    // Purchase management functions
    const showPurchaseModal = (customerId) => {
        const customer = customers.filter(c => c.id === customerId);
        if (!customer) return;

        setSelectedCustomer(customerId);
        setPurchaseFormData({ milk: 0, yogurt: 0 });

        document.getElementById('purchaseModal').style.display = 'block';

        setTimeout(() => {
            const milkAmountInput = document.getElementById('milkAmount');
            const yogurtAmountInput = document.getElementById('yogurtAmount');
            if (milkAmountInput) milkAmountInput.value = '';
            if (yogurtAmountInput) yogurtAmountInput.value = '';
        }, 10);
    };

    const closeModal = (modalId) => {
        document.getElementById(modalId).style.display = 'none';
    };

    const addPurchase = async () => {
        setLoading(true);
        try {
            const milkQty = parseFloat(purchaseFormData.milk) || 0;
            const yogurtQty = parseFloat(purchaseFormData.yogurt) || 0;

            if (milkQty <= 0 && yogurtQty <= 0) {
                setSuccessMessage("براہ کرم دودھ یا دہی کی مقدار درج کریں");
                setShowSuccessPopup(true);
                setLoading(false);
                return;
            }

            const customer = customers.find(c => c.id === selectedCustomer);
            const purchaseMonth = selectedDate.getMonth();
            const purchaseYear = selectedDate.getFullYear();
            const monthlyRates = getMonthlyRates(selectedCustomer, purchaseMonth, purchaseYear);
            
            const milkRate = monthlyRates ? monthlyRates.milkRate : rates.milk;
            const yogurtRate = monthlyRates ? monthlyRates.yogurtRate : rates.yogurt;

            const purchaseDate = new Date(selectedDate);
            purchaseDate.setHours(new Date().getHours());
            purchaseDate.setMinutes(new Date().getMinutes());
            purchaseDate.setSeconds(new Date().getSeconds());

            const total = (milkQty * milkRate) + (yogurtQty * yogurtRate);

            const purchasesCollection = collection(firestore, 'purchases');
            const newPurchase = {
                customerId: selectedCustomer,
                milk: milkQty,
                yogurt: yogurtQty,
                total: total,
                date: Timestamp.fromDate(purchaseDate)
            };

            await addDoc(purchasesCollection, newPurchase);

            // Update local state
            const purchaseWithId = { ...newPurchase, id: Date.now(), date: purchaseDate.toISOString() };
            setDailyPurchases(prevDailyPurchases => [...prevDailyPurchases, purchaseWithId]);

            setPurchaseFormData({ milk: 0, yogurt: 0 });
            closeModal('purchaseModal');

            setSuccessMessage('پرچز کامیابی سے شامل کر دیا گیا');
            setShowSuccessPopup(true);

            await fetchPurchases();
        } catch (error) {
            console.error("Error adding purchase: ", error);
            setSuccessMessage('پرچز شامل کرنے میں خرابی');
            setShowSuccessPopup(true);
        } finally {
            setLoading(false);
        }
    };

    const deletePurchase = async (purchaseId) => {
        setLoading(true);
        try {
            const purchaseRef = doc(firestore, 'purchases', purchaseId);
            await deleteDoc(purchaseRef);

            const updatedPurchases = purchases.filter(p => p.id !== purchaseId);
            setPurchases(updatedPurchases);

            const updatedDailyPurchases = dailyPurchases.filter(p => p.id !== purchaseId);
            setDailyPurchases(updatedDailyPurchases);

            setSuccessMessage('Purchase deleted successfully.');
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error deleting purchase: ", error);
            setSuccessMessage("Error deleting purchase.");
            setShowSuccessPopup(true);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePurchase = (purchaseId) => {
        requestPasswordForDelete(() => deletePurchase(purchaseId));
    };

    const handlePurchaseFormSubmit = (e) => {
        e.preventDefault();
        addPurchase();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPurchaseFormData({ ...purchaseFormData, [name]: parseFloat(value) || 0 });
    };

    // Payment handling
    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCustomer || !paymentAmount) return;

        setPaymentProcessing(true);
        try {
            const advanceCollection = collection(firestore, 'advancePayments');
            const paymentData = {
                customerId: selectedCustomer,
                amount: parseFloat(paymentAmount),
                description: 'Bill Payment',
                date: new Date()
            };

            await addDoc(advanceCollection, paymentData);
            
            setPaymentAmount('');
            await fetchAdvancePayments();
            setSuccessMessage('Payment recorded successfully');
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error recording payment: ", error);
            setSuccessMessage("Error recording payment");
            setShowSuccessPopup(true);
        } finally {
            setPaymentProcessing(false);
        }
    };

    // Print functions
    const printMonthlyTotals = () => {
        if (!selectedCustomerInfo) return;

        const monthlyTotals = getCurrentMonthTotals();
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString();
        const formattedTime = currentDate.toLocaleTimeString();

        const printWindow = window.open('', '', 'height=600,width=800');
        const printContent = `
            <html>
            <head>
                <title>Monthly Summary</title>
                <style>
                    @media print {
                        body { margin: 0; padding: 20px; }
                        @page { margin: 0.5cm; }
                    }
                    body { 
                        font-family: Arial, sans-serif; 
                        direction: rtl;
                        text-align: center;
                    }
                    .bill-container {
                        border: 2px solid black;
                        padding: 10px;
                        width: 300px;
                        margin: 0 auto;
                    }
                    .header {
                        text-align: center;
                        font-weight: bold;
                        font-size: 18px;
                        margin-bottom: 5px;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 3px;
                        font-size: 12px;
                    }
                    .dashed-line {
                        border-top: 1px dashed black;
                        margin: 8px 0;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 10px 0;
                    }
                    th, td {
                        border: 1px solid black;
                        padding: 5px;
                        text-align: center;
                        font-size: 12px;
                    }
                    .balance-summary {
                        margin-top: 10px;
                    }
                    .balance-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 3px;
                        font-size: 12px;
                    }
                    .total-amount {
                        font-weight: bold;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="bill-container">
                    <div class="header">ورک گرین فوڈ پوائنٹ</div>
                    <div class="dashed-line"></div>
                    <div class="info-row">
                        <span>تاریخ:</span>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="info-row">
                        <span>وقت:</span>
                        <span>${formattedTime}</span>
                    </div>
                    <div class="info-row">
                        <span>گاہک:</span>
                        <span>${selectedCustomerInfo.name}</span>
                    </div>
                    <div class="info-row">
                        <span>فون:</span>
                        <span>${selectedCustomerInfo.phone || 'N/A'}</span>
                    </div>
                    <div class="dashed-line"></div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>آئٹم</th>
                                <th>مقدار</th>
                                <th>قیمت</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${monthlyTotals.milk > 0 ? `
                            <tr>
                                <td>دودھ</td>
                                <td>${monthlyTotals.milk.toFixed(2)} لیٹر</td>
                                <td>${(monthlyTotals.milk * (monthlyTotals.milkRate || rates.milk)).toFixed(2)}</td>
                            </tr>` : ''}
                            ${monthlyTotals.yogurt > 0 ? `
                            <tr>
                                <td>دہی</td>
                                <td>${monthlyTotals.yogurt.toFixed(2)} کلو</td>
                                <td>${(monthlyTotals.yogurt * (monthlyTotals.yogurtRate || rates.yogurt)).toFixed(2)}</td>
                            </tr>` : ''}
                        </tbody>
                    </table>
                    
                    <div class="balance-summary">
                        <div class="balance-row total-amount">
                            <span>کل رقم:</span>
                            <span>${monthlyTotals.amount.toFixed(2)} روپے</span>
                        </div>
                        <div class="balance-row">
                            <span>کل ایڈوانس:</span>
                            <span>${selectedCustomerAdvanceTotal.toFixed(2)} روپے</span>
                        </div>
                        <div class="balance-row">
                            <span>باقی رقم:</span>
                            <span>${selectedCustomerBalance.toFixed(2)} روپے</span>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const printA4MonthlyBill = () => {
        // Get selected customer info
        const customer = selectedCustomerInfo;
        if (!customer) return;

        // Ask user which month to print via a prompt
        let selectedMonthStr = prompt("Enter month number (1-12):", new Date().getMonth() + 1);
        let selectedYearStr = prompt("Enter year:", new Date().getFullYear());

        // Default to current month and year if user cancels or enters invalid data
        let selectedMonth, selectedYear;

        if (selectedMonthStr === null || selectedYearStr === null) {
            // User pressed Cancel
            return;
        }

        // Try to parse the input as numbers
        selectedMonth = parseInt(selectedMonthStr) - 1; // Convert to 0-based month
        selectedYear = parseInt(selectedYearStr);

        // Validate month (0-11) and year (reasonable range)
        if (isNaN(selectedMonth) || selectedMonth < 0 || selectedMonth > 11 || isNaN(selectedYear)) {
            alert("Invalid month or year entered.");
            return;
        }

        // Get monthly purchases for selected month
        const monthlyPurchases = filterPurchasesByMonth(customer.id, selectedMonth, selectedYear);
        const monthlyTotals = calculateTotals(monthlyPurchases);

        // Format the date for display
        const formattedDate = `${new Date().getDate()}/${selectedMonth + 1}/${selectedYear}`;

        // Calculate total milk and yogurt
        const monthlyRates = getMonthlyRates(customer.id, selectedMonth, selectedYear);
        const milkRate = monthlyRates ? monthlyRates.milkRate : rates.milk;
        const yogurtRate = monthlyRates ? monthlyRates.yogurtRate : rates.yogurt;
        const milkTotal = Math.round(monthlyTotals.milk * milkRate);
        const yogurtTotal = Math.round(monthlyTotals.yogurt * yogurtRate);
        const thisMonthTotal = milkTotal + yogurtTotal;

        // Calculate previous balance - all months before the selected month
        let previousBalance = 0;

        // Loop through all previous months up to the selected month
        for (let m = 0; m < selectedMonth; m++) {
            // Get previous month's purchases
            const prevMonthPurchases = filterPurchasesByMonth(customer.id, m, selectedYear);
            if (prevMonthPurchases.length === 0) continue;

            // Calculate previous month's totals
            const prevMonthTotals = calculateTotals(prevMonthPurchases);
            const prevMonthRates = getMonthlyRates(customer.id, m, selectedYear);
            const milkRate = prevMonthRates ? prevMonthRates.milkRate : rates.milk;
            const yogurtRate = prevMonthRates ? prevMonthRates.yogurtRate : rates.yogurt;
            const prevMilkTotal = Math.round(prevMonthTotals.milk * milkRate);
            const prevYogurtTotal = Math.round(prevMonthTotals.yogurt * yogurtRate);
            const prevMonthTotal = prevMilkTotal + prevYogurtTotal;

            // Add to previous balance
            previousBalance += prevMonthTotal;
        }

        // Get all advance payments up to the end of selected month
        const endOfSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
        const allAdvancePayments = advancePayments.filter(payment => {
            if (payment.customerId !== customer.id) return false;
            const paymentDate = payment.date instanceof Date ? payment.date : new Date(payment.date);
            return paymentDate <= endOfSelectedMonth;
        });

        // Calculate previous month's payment (only for the previous month)
        const previousMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
        const previousYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
        const startOfPreviousMonth = new Date(previousYear, previousMonth, 1);
        const endOfPreviousMonth = new Date(previousYear, previousMonth + 1, 0, 23, 59, 59, 999);

        const previousMonthPayments = advancePayments.filter(payment => {
            if (payment.customerId !== customer.id) return false;
            const paymentDate = payment.date instanceof Date ? payment.date : new Date(payment.date);
            return paymentDate >= startOfPreviousMonth && paymentDate <= endOfPreviousMonth;
        });
        const previousMonthPayment = previousMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);

        // Calculate current/selected month's payment
        const startOfCurrentMonth = new Date(selectedYear, selectedMonth, 1);
        const endOfCurrentMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

        const currentMonthPayments = advancePayments.filter(payment => {
            if (payment.customerId !== customer.id) return false;
            const paymentDate = payment.date instanceof Date ? payment.date : new Date(payment.date);
            return paymentDate >= startOfCurrentMonth && paymentDate <= endOfCurrentMonth;
        });
        const currentMonthPayment = currentMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);

        // Calculate total advance payments
        const totalAdvancePayments = allAdvancePayments.reduce((sum, payment) => sum + payment.amount, 0);

        // Calculate the grand total including previous balance
        const grandTotal = thisMonthTotal + previousBalance;

        // Calculate remaining balance after payments
        const remainingBalance = grandTotal - totalAdvancePayments;
        const isCredit = remainingBalance <= 0;

        // Create a new window for the print
        const printWindow = window.open('', '', 'height=600,width=800');

        // Generate the print content for A4 size with running balance format
        const printContent = `
            <html>
            <head>
                <title>Monthly Bill - ${customer.name}</title>
                <style>
                    @media print {
                        @page {
                            size: A4;
                            margin: 0.6cm;
                        }
                        body { 
                            margin: 0; 
                            padding: 0;
                        }
                    }
                    body { 
                        font-family: Arial, sans-serif;
                        padding: 215px;
                        padding-top: 0px;
                        margin-bottom: 800;
                        direction: rtl;
                        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    }
                    .bill-container {
                        width: 100%;
                        max-width: 21cm;
                        margin: 0 auto;
                        border: 2px solid #2c5aa0;
                        border-radius: 8px;
                        box-shadow: 0 4px 15px rgba(44, 90, 160, 0.1);
                        background: white;
                        overflow: hidden;
                    }
                    .header {
                        background: linear-gradient(135deg, #2c5aa0 0%, #1e3d6f 100%);
                        color: white;
                        text-align: center;
                        font-weight: bold;
                        font-size: 27px;
                        padding: 12px;
                        border-bottom: 3px solid #1e3d6f;
                        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
                        letter-spacing: 1px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    th, td {
                        padding: 5px;
                        text-align: right;
                        border-bottom: 1px solid #dee2e6;
                        border-left: 1px solid #dee2e6;
                    }
                    th:last-child, td:last-child {
                        border-left: none;
                    }
                    th {
                        background: linear-gradient(135deg, #4a90a4 0%, #357a8a 100%);
                        color: white;
                        font-weight: bold;
                        text-shadow: 1px 1px 1px rgba(0,0,0,0.3);
                    }
                    tr:nth-child(even) {
                        background-color: #f8f9fa;
                    }
                    tr:hover {
                        background-color: #e3f2fd;
                    }
                    .total-row {
                        font-weight: bold;
                        background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
                        color: #155724;
                    }
                    .footer {
                        padding: 5px;
                        text-align: center;
                        font-size: 0.8em;
                        color: #d73502;
                        background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
                        border-top: 2px solid #f39c12;
                        font-weight: 600;
                    }
                    .contact {
                        text-align: center;
                        font-size: 0.8em;
                        color: #495057;
                    }
                    .credit-amount {
                        color: #28a745;
                        font-weight: bold;
                        text-shadow: 0 1px 2px rgba(40, 167, 69, 0.2);
                    }
                    .due-amount {
                        color: #dc3545;
                        font-weight: bold;
                        text-shadow: 0 1px 2px rgba(220, 53, 69, 0.2);
                    }
                    .pichla-baqaya {
                        color: #dc3545;
                        font-weight: bold;
                        text-shadow: 0 1px 2px rgba(220, 53, 69, 0.2);
                    }
                    .running-balance {
                        margin-top: 3px;
                        border: 2px solid #4a90a4;
                        border-radius: 6px;
                        padding: 10px;
                        background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
                        box-shadow: 0 2px 8px rgba(74, 144, 164, 0.1);
                    }
                    .running-balance-title {
                        font-weight: bold;
                        text-align: center;
                        font-size: 1.2em;
                        margin-bottom: 10px;
                        border-bottom: 2px solid #4a90a4;
                        padding-bottom: 5px;
                        color: #2c5aa0;
                    }
                    .balance-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 5px 0;
                        border-bottom: 1px dashed #b3d9ff;
                        transition: background-color 0.2s ease;
                    }
                    .balance-row:hover {
                        background-color: rgba(74, 144, 164, 0.05);
                    }
                    .balance-label {
                        font-weight: bold;
                        color: #2c5aa0;
                    }
                    .bottom-info {
                        margin-top: 30px;
                        text-align: center;
                        font-size: 1em;
                        color: #495057;
                    }
                    .bottom-info .account-row {
                        margin-bottom: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                    }
                    .bottom-info .iban {
                        font-weight: bold;
                        direction: ltr;
                        margin-left: 8px;
                        color: #2c5aa0;
                    }
                    .bottom-info .name-row {
                        margin-bottom: 8px;
                        font-weight: bold;
                        color: #2c5aa0;
                    }
                    .bottom-info .contact-row {
                        margin-bottom: 8px;
                        color: #495057;
                    }
                    .payment-section {
                        margin-top: 5px;
                        text-align: center;
                        border-top: 2px dashed #4a90a4;
                        padding-top: 10px;
                        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                        border-radius: 0 0 6px 6px;
                    }
                    .payment-info {
                        font-size: 14px;
                        font-weight: bold;
                        color: #2c5aa0;
                        margin-bottom: 10px;
                    }
                    .payment-methods {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        margin-bottom: 10px;
                    }
                    .payment-methods-container {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        width: 100%;
                        gap: 20px;
                    }
                    .payment-left {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    .payment-right {
                        display: flex;
                        align-items: center;
                    }
                    .payment-label {
                        font-weight: bold;
                        font-size: 14px;
                        color: #2c5aa0;
                    }
                </style>
            </head>
            <body>
                <div class="bill-container">
                    <div class="header">
                        ورک گرین فوڈ پوائنٹ
                    </div>
                    
                    <table>
                        <tr>
                            <td>تاریخ</td>
                            <td>${formattedDate}</td>
                        </tr>
                        <tr>
                            <td>گاہک کا نام</td>
                            <td>${customer.name}</td>
                        </tr>
                        <tr>
                            <td>فون</td>
                            <td>${customer.phone || 'N/A'}</td>
                        </tr>
                    </table>
                    
                    <table>
                        <tr>
                            <th>تفصیل</th>
                            <th>مقدار</th>
                            <th>ریٹ</th>
                            <th>رقم</th>
                        </tr>
                        ${monthlyTotals.milk > 0 ? `
                        <tr>
                            <td>دودھ</td>
                            <td>${Math.round(monthlyTotals.milk)}</td>
                            <td>${milkRate}</td>
                            <td>${milkTotal}</td>
                        </tr>` : ''}
                        ${monthlyTotals.yogurt > 0 ? `
                        <tr>
                            <td>دہی</td>
                            <td>${Math.round(monthlyTotals.yogurt)}</td>
                            <td>${yogurtRate}</td>
                            <td>${yogurtTotal}</td>
                        </tr>` : ''}
                        <tr>
                            <td>اس ماہ کل فروخت</td>
                            <td></td>
                            <td></td>
                            <td>${thisMonthTotal}</td>
                        </tr>
                    </table>
                    
                    <!-- Running Balance Section -->
                    <div class="running-balance">
                        <div class="balance-row">
                            <span class="balance-label">پچھلا بقایا:</span>
                            <span class="${(remainingBalance - thisMonthTotal) < 0 ? 'credit-amount' : 'due-amount'}">${Math.abs(remainingBalance - thisMonthTotal)}</span>
                        </div>                  
                         <div class="balance-row" style="border-bottom: none;">
                            <span class="balance-label">پچھلے ماہ کی ادائیگی:</span>
                            <span>${currentMonthPayment}</span>
                        </div>

                        
                        <div class="balance-row" style="border-bottom: none; font-weight: bold; margin-top: 5px;">
                            <span class="balance-label">باقی رقم:</span>
                            <span class="${isCredit ? 'credit-amount' : 'due-amount'}">${Math.abs(remainingBalance)}</span>
                        </div>
                    </div>
                                        <!-- Payment Methods Section -->
                    <div class="payment-section">
                       
                        <span class="payment-info"> Account No: PK84ABPA0010007723910022 &nbsp; | &nbsp; Tahir Ghulam &nbsp; | &nbsp; Contact No: 03457411666</span>
                         <div class="payment-methods">
                            <div class="payment-label">پیمنٹ کے طریقے</div>
                            <img src="${whatsapp}" alt="WhatsApp" style="width: 60px; height:30px; object-fit: contain; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-right: 10px;" />
                            <img src="${allied}" alt="Allied Bank" style="width: 120px; height:30px; object-fit: contain; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />
                        </div>
                    </div>
                                        
                    <div class="footer">                        
                        درخواست ہے کہ 7 تاریخ تک ادائیگی کریں۔ اگر ادائیگی نہیں ہوگی تو سپلائی بند کر دی جائے گی۔
                    </div>
                     
                </div>
            </body>
            </html>
        `;

        // Write content to the print window
        printWindow.document.write(printContent);
        printWindow.document.close();

        // Print after a short delay to ensure content is loaded
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const getPrintA4Values = () => {
        if (!selectedCustomer) return { grandTotal: 0, totalAdvancePayments: 0, remainingBalance: 0 };
        
        const customer = selectedCustomerInfo;
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const monthlyPurchases = filterPurchasesByMonth(customer.id, currentMonth, currentYear);
        const monthlyTotals = calculateTotals(monthlyPurchases);
        
        const monthlyRates = getMonthlyRates(customer.id, currentMonth, currentYear);
        const milkRate = monthlyRates ? monthlyRates.milkRate : rates.milk;
        const yogurtRate = monthlyRates ? monthlyRates.yogurtRate : rates.yogurt;
        const milkTotal = Math.round(monthlyTotals.milk * milkRate);
        const yogurtTotal = Math.round(monthlyTotals.yogurt * yogurtRate);
        const grandTotal = milkTotal + yogurtTotal;

        const monthlyAdvancePayments = selectedCustomerAdvancePayments.filter(payment => {
            const paymentDate = new Date(payment.date);
            return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        });

        const totalAdvancePayments = monthlyAdvancePayments.reduce((sum, payment) => 
            sum + (parseFloat(payment.amount) || 0), 0);

        return {
            grandTotal: grandTotal,
            totalAdvancePayments: totalAdvancePayments,
            remainingBalance: grandTotal - totalAdvancePayments
        };
    };

    const printA4Values = getPrintA4Values();

    return (
        <div className="main-content">
            {/* Purchase List Section */}
            <section id="purchaseList" className="active">
                <div className="list-header">
                    <h2>گاہک کی خریداری کی تاریخ</h2>
                    <input
                        type="text"
                        placeholder="گاہکوں کو تلاش کریں..."
                        className="search-filter"
                        value={customerListSearchTerm}
                        onChange={(e) => setCustomerListSearchTerm(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div className="customer-purchase-container">
                    {/* Left side: Customer List */}
                    <div className="customer-list-sidebar">
                        <div id="customerListView">
                            {filteredCustomersList.map(customer => {
                                return (
                                    <div
                                        key={customer.id}
                                        className={`customer-list-item ${selectedCustomer === customer.id ? 'active' : ''}`}
                                        onClick={() => !loading && showCustomerPurchases(customer.id)}
                                    >
                                        <h3>{customer.name}</h3>
                                        <p>Phone: {customer.phone || 'N/A'}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right side: Purchase History */}
                    <div className="purchase-history-view">
                        {selectedCustomerInfo && (
                            <div className="monthly-summary-container">
                                <div className="payment-form-container">
                                    <h4>Record Payment</h4>
                                    <form onSubmit={handlePaymentSubmit}>
                                        <div className="payment-input-group">
                                            <label htmlFor="paymentAmount">Bill Payment Amount:</label>
                                            <div className="payment-input-with-button">
                                                <input
                                                    type="number"
                                                    id="paymentAmount"
                                                    value={paymentAmount}
                                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                                    placeholder="Enter amount"
                                                    min="0"
                                                    step="any"
                                                    disabled={paymentProcessing}
                                                    required
                                                />
                                                <button
                                                    type="submit"
                                                    className="payment-submit-btn"
                                                    disabled={paymentProcessing}
                                                >
                                                    {paymentProcessing ? 'Processing...' : 'Record Payment'}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>

                                <div className="monthly-totals-card">
                                    <h4>Total Purchased</h4>
                                    <div className="monthly-totals-grid">
                                        <div className="total-item">
                                            <span className="total-label">دودھ (Milk):</span>
                                            <span className="total-value">{(selectedCustomerTotals.milk !== undefined ? selectedCustomerTotals.milk.toFixed(1) : '0.0')} لیٹر</span>
                                        </div>
                                        <div className="total-item">
                                            <span className="total-label">دہی (Yogurt):</span>
                                            <span className="total-value">{(selectedCustomerTotals.yogurt !== undefined ? selectedCustomerTotals.yogurt.toFixed(1) : '0.0')} کلو</span>
                                        </div>

                                        <div className="total-item total-amount" style={{ gridColumn: 'span 2', borderTop: '1px dashed #ddd', paddingTop: '10px', marginTop: '5px' }}>
                                            <span className="total-label">Total Amount:</span>
                                            <span className="total-value">Rs. {(selectedCustomerTotals.amount !== undefined ? selectedCustomerTotals.amount.toFixed(2) : '0.00')}</span>
                                        </div>
                                        <div className="total-item total-payments">
                                            <span className="total-label">Total Payments:</span>
                                            <span className="total-value">Rs. {(selectedCustomerAdvanceTotal !== undefined ? selectedCustomerAdvanceTotal.toFixed(2) : '0.00')}</span>
                                        </div>
                                        <div className="total-item total-remaining" style={{ gridColumn: 'span 2' }}>
                                            <span className="total-label">Remaining Balance:</span>
                                            <span className={`total-value ${selectedCustomerBalance > 0 ? 'balance-due' : 'balance-credit'}`}>
                                                Rs. {(selectedCustomerBalance !== undefined ? Math.abs(selectedCustomerBalance).toFixed(2) : '0.00')}
                                                {selectedCustomerBalance > 0 ? ' (Due)' : ' (Credit)'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedCustomerInfo && (
                            <div className="calendar-view-container">
                                <button
                                    className="toggle-calendar-btn"
                                    onClick={() => setShowCalendar(!showCalendar)}
                                >
                                    {showCalendar ? 'Hide Calendar' : 'Show Daily Purchase Calendar'}
                                </button>

                                {showCalendar && (
                                    <div className="calendar-container">
                                        <Calendar
                                            onChange={handleDateChange}
                                            value={selectedDate}
                                            tileClassName={tileClassName}
                                            tileContent={tileContent}
                                        />

                                        {/* Monthly Totals Summary */}
                                        <div className="monthly-summary" style={{ padding: '15px', marginTop: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                            <h4>Monthly Totals for {new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toLocaleDateString('default', { month: 'long', year: 'numeric' })}</h4>
                                            {(() => {
                                                const monthlyTotals = getCurrentMonthTotals();
                                                return (
                                                    <div className="monthly-totals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
                                                        <div className="total-item">
                                                            <span className="total-label">دودھ (Milk):</span>
                                                            <span className="total-value">{monthlyTotals.milk.toFixed(1)} لیٹر</span>
                                                        </div>
                                                        <div className="total-item">
                                                            <span className="total-label">دہی (Yogurt):</span>
                                                            <span className="total-value">{monthlyTotals.yogurt.toFixed(1)} کلو</span>
                                                        </div>
                                                        <div className="total-item">
                                                            <span className="total-label">Milk Rate:</span>
                                                            <span className="total-value">Rs. {monthlyTotals.milkRate ? monthlyTotals.milkRate.toFixed(2) : rates.milk.toFixed(2)}</span>
                                                        </div>
                                                        <div className="total-item">
                                                            <span className="total-label">Yogurt Rate:</span>
                                                            <span className="total-value">Rs. {monthlyTotals.yogurtRate ? monthlyTotals.yogurtRate.toFixed(2) : rates.yogurt.toFixed(2)}</span>
                                                        </div>
                                                        <div className="total-item total-amount" style={{ gridColumn: 'span 3', borderTop: '1px dashed #ddd', paddingTop: '10px', marginTop: '5px' }}>
                                                            <span className="total-label">Total Amount:</span>
                                                            <span className="total-value">Rs. {monthlyTotals.amount.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                            <div style={{
                                                display: 'flex',
                                                gap: '10px',
                                                marginTop: '15px'
                                            }}>
                                                <button
                                                    onClick={printMonthlyTotals}
                                                    className="print-btn"
                                                    disabled={loading}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        padding: '8px 15px',
                                                        backgroundColor: '#3498db',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '5px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        flex: 1
                                                    }}
                                                >
                                                    <PrintIcon fontSize="small" style={{ marginRight: '5px' }} />
                                                    Print Monthly Summary
                                                </button>

                                                <button
                                                    onClick={printA4MonthlyBill}
                                                    className="print-btn"
                                                    disabled={loading}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        padding: '8px 15px',
                                                        backgroundColor: '#2ecc71',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '5px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        flex: 1
                                                    }}
                                                >
                                                    <PrintIcon fontSize="small" style={{ marginRight: '5px' }} />
                                                    Print A4 Bill
                                                </button>
                                            </div>
                                        </div>

                                        {/* Daily Purchase Details */}
                                        {dailyPurchases.length > 0 && (
                                            <div className="daily-purchases">
                                                <h4>Daily Purchase Details for {selectedDate.toLocaleDateString()}</h4>
                                                <table className="daily-purchases-table">
                                                    <thead>
                                                        <tr>
                                                            <th>وقت</th>
                                                            <th>دودھ (لیٹر)</th>
                                                            <th>دہی (کلو)</th>
                                                            <th>رقم</th>
                                                            <th>اعمال</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {dailyPurchases.map(purchase => (
                                                            <tr key={purchase.id}>
                                                                <td>{new Date(purchase.date).toLocaleTimeString()}</td>
                                                                <td>{purchase.milk || 0}</td>
                                                                <td>{purchase.yogurt || 0}</td>
                                                                <td>{recalculatePurchaseAmount(purchase).toFixed(2)} روپے</td>
                                                                <td>
                                                                    <button className="action-btn" onClick={() => handleDeletePurchase(purchase.id)}>
                                                                        <DeleteIcon />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot>
                                                        <tr>
                                                            <td><strong>کل</strong></td>
                                                            <td><strong>{dailyPurchases.reduce((sum, p) => sum + (parseFloat(p.milk) || 0), 0)} لیٹر</strong></td>
                                                            <td><strong>{dailyPurchases.reduce((sum, p) => sum + (parseFloat(p.yogurt) || 0), 0)} کلو</strong></td>
                                                            <td><strong>{dailyPurchases.reduce((sum, p) => sum + recalculatePurchaseAmount(p), 0).toFixed(2)} روپے</strong></td>
                                                            <td></td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        )}

                                        {dailyPurchases.length === 0 && showCalendar && (
                                            <div className="daily-purchases">
                                                <p>No purchases found for {selectedDate.toLocaleDateString()}</p>
                                            </div>
                                        )}

                                        <div className="daily-purchases">
                                            <button
                                                className="add-purchase-btn"
                                                onClick={() => showPurchaseModal(selectedCustomer)}
                                                style={{
                                                    backgroundColor: '#2d6a4f',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '10px 20px',
                                                    borderRadius: '5px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    marginTop: '15px'
                                                }}
                                            >
                                                <AddIcon fontSize="small" />
                                                خریداری درج کریں
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Purchase Modal */}
            <div id="purchaseModal" className="modal">
                <div className="modal-content">
                    <span className="close" onClick={() => closeModal('purchaseModal')}>&times;</span>
                    <h3>خریداری درج کریں</h3>
                    <form onSubmit={handlePurchaseFormSubmit}>
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
                                    const currentMonth = selectedDate.getMonth();
                                    const currentYear = selectedDate.getFullYear();
                                    const monthlyRates = getMonthlyRates(selectedCustomer, currentMonth, currentYear);
                                    const milkRate = monthlyRates ? monthlyRates.milkRate : rates.milk;
                                    const qty = amount / milkRate;
                                    setPurchaseFormData({ ...purchaseFormData, milk: qty });
                                }}
                                disabled={loading}
                            />
                            <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                                Rate: Rs. {(() => {
                                    const currentMonth = selectedDate.getMonth();
                                    const currentYear = selectedDate.getFullYear();
                                    const monthlyRates = getMonthlyRates(selectedCustomer, currentMonth, currentYear);
                                    return monthlyRates ? monthlyRates.milkRate : rates.milk;
                                })()} per liter
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
                                    const currentMonth = selectedDate.getMonth();
                                    const currentYear = selectedDate.getFullYear();
                                    const monthlyRates = getMonthlyRates(selectedCustomer, currentMonth, currentYear);
                                    const yogurtRate = monthlyRates ? monthlyRates.yogurtRate : rates.yogurt;
                                    const qty = amount / yogurtRate;
                                    setPurchaseFormData({ ...purchaseFormData, yogurt: qty });
                                }}
                                disabled={loading}
                            />
                            <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                                Rate: Rs. {(() => {
                                    const currentMonth = selectedDate.getMonth();
                                    const currentYear = selectedDate.getFullYear();
                                    const monthlyRates = getMonthlyRates(selectedCustomer, currentMonth, currentYear);
                                    return monthlyRates ? monthlyRates.yogurtRate : rates.yogurt;
                                })()} per kg
                            </small>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="milkQty">دودھ کی مقدار (لیٹر):</label>
                            <input
                                type="number"
                                id="milkQty"
                                name="milk"
                                min="0"
                                step="any"
                                value={purchaseFormData.milk}
                                onChange={(e) => {
                                    handleInputChange(e);
                                    const qty = parseFloat(e.target.value) || 0;
                                    const currentMonth = selectedDate.getMonth();
                                    const currentYear = selectedDate.getFullYear();
                                    const monthlyRates = getMonthlyRates(selectedCustomer, currentMonth, currentYear);
                                    const milkRate = monthlyRates ? monthlyRates.milkRate : rates.milk;
                                    const amount = qty * milkRate;
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
                                name="yogurt"
                                min="0"
                                step="any"
                                value={purchaseFormData.yogurt}
                                onChange={(e) => {
                                    handleInputChange(e);
                                    const qty = parseFloat(e.target.value) || 0;
                                    const currentMonth = selectedDate.getMonth();
                                    const currentYear = selectedDate.getFullYear();
                                    const monthlyRates = getMonthlyRates(selectedCustomer, currentMonth, currentYear);
                                    const yogurtRate = monthlyRates ? monthlyRates.yogurtRate : rates.yogurt;
                                    const amount = qty * yogurtRate;
                                    document.getElementById('yogurtAmount').value = amount.toFixed(2);
                                }}
                                disabled={loading}
                            />
                        </div>

                        <button type="submit" disabled={loading} className="button-with-spinner">
                            خریداری محفوظ کریں
                            {loading && <div className="spinner"></div>}
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

            {/* Purchase Modal */}
            <div id="purchaseModal" className="modal">
                <div className="modal-content">
                    <span className="close" onClick={() => closeModal('purchaseModal')}>&times;</span>
                    <h3>خریداری درج کریں</h3>
                    <form onSubmit={handlePurchaseFormSubmit}>
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
                                    const currentMonth = selectedDate.getMonth();
                                    const currentYear = selectedDate.getFullYear();
                                    const monthlyRates = getMonthlyRates(selectedCustomer, currentMonth, currentYear);
                                    const milkRate = monthlyRates ? monthlyRates.milkRate : rates.milk;
                                    const qty = amount / milkRate;
                                    setPurchaseFormData({ ...purchaseFormData, milk: qty });
                                }}
                                disabled={loading}
                            />
                            <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                                Rate: Rs. {(() => {
                                    const currentMonth = selectedDate.getMonth();
                                    const currentYear = selectedDate.getFullYear();
                                    const monthlyRates = getMonthlyRates(selectedCustomer, currentMonth, currentYear);
                                    return monthlyRates ? monthlyRates.milkRate : rates.milk;
                                })()} per liter
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
                                    const currentMonth = selectedDate.getMonth();
                                    const currentYear = selectedDate.getFullYear();
                                    const monthlyRates = getMonthlyRates(selectedCustomer, currentMonth, currentYear);
                                    const yogurtRate = monthlyRates ? monthlyRates.yogurtRate : rates.yogurt;
                                    const qty = amount / yogurtRate;
                                    setPurchaseFormData({ ...purchaseFormData, yogurt: qty });
                                }}
                                disabled={loading}
                            />
                            <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                                Rate: Rs. {(() => {
                                    const currentMonth = selectedDate.getMonth();
                                    const currentYear = selectedDate.getFullYear();
                                    const monthlyRates = getMonthlyRates(selectedCustomer, currentMonth, currentYear);
                                    return monthlyRates ? monthlyRates.yogurtRate : rates.yogurt;
                                })()} per kg
                            </small>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="milkQty">دودھ کی مقدار (لیٹر):</label>
                            <input
                                type="number"
                                id="milkQty"
                                name="milk"
                                min="0"
                                step="any"
                                value={purchaseFormData.milk}
                                onChange={(e) => {
                                    handleInputChange(e);
                                    const qty = parseFloat(e.target.value) || 0;
                                    const currentMonth = selectedDate.getMonth();
                                    const currentYear = selectedDate.getFullYear();
                                    const monthlyRates = getMonthlyRates(selectedCustomer, currentMonth, currentYear);
                                    const milkRate = monthlyRates ? monthlyRates.milkRate : rates.milk;
                                    const amount = qty * milkRate;
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
                                name="yogurt"
                                min="0"
                                step="any"
                                value={purchaseFormData.yogurt}
                                onChange={(e) => {
                                    handleInputChange(e);
                                    const qty = parseFloat(e.target.value) || 0;
                                    const currentMonth = selectedDate.getMonth();
                                    const currentYear = selectedDate.getFullYear();
                                    const monthlyRates = getMonthlyRates(selectedCustomer, currentMonth, currentYear);
                                    const yogurtRate = monthlyRates ? monthlyRates.yogurtRate : rates.yogurt;
                                    const amount = qty * yogurtRate;
                                    document.getElementById('yogurtAmount').value = amount.toFixed(2);
                                }}
                                disabled={loading}
                            />
                        </div>

                        <button type="submit" disabled={loading} className="button-with-spinner">
                            خریداری محفوظ کریں
                            {loading && <div className="spinner"></div>}
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

                .list-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .search-filter {
                    padding: 10px;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    font-size: 16px;
                    width: 300px;
                    direction: rtl;
                }

                .search-filter:focus {
                    outline: none;
                    border-color: #52b788;
                }

                .customer-purchase-container {
                    display: flex;
                    gap: 20px;
                }

                .customer-list-sidebar {
                    flex: 1;
                    max-width: 300px;
                    border-right: 1px solid #e9ecef;
                    padding-right: 15px;
                    max-height: 600px;
                    overflow-y: auto;
                }

                .customer-list-item {
                    padding: 15px;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    background: white;
                }

                .customer-list-item:hover {
                    background-color: #f8f9fa;
                    border-color: #52b788;
                }

                .customer-list-item.active {
                    background-color: #52b788;
                    color: white;
                    border-color: #40916c;
                }

                .customer-list-item h3 {
                    margin: 0 0 8px 0;
                    font-size: 16px;
                }

                .customer-list-item p {
                    margin: 4px 0;
                    font-size: 14px;
                    opacity: 0.8;
                }

                .purchase-history-view {
                    flex: 2;
                    padding-left: 15px;
                }

                .monthly-summary-container {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    margin-bottom: 20px;
                }

                .payment-form-container {
                    margin-bottom: 20px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #e9ecef;
                }

                .payment-input-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #2d6a4f;
                }

                .payment-input-with-button {
                    display: flex;
                    gap: 10px;
                }

                .payment-input-with-button input {
                    flex: 1;
                    padding: 10px;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    font-size: 16px;
                }

                .payment-submit-btn {
                    background-color: #2d6a4f;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    white-space: nowrap;
                }

                .payment-submit-btn:hover {
                    background-color: #1b4332;
                }

                .payment-submit-btn:disabled {
                    background-color: #6c757d;
                    cursor: not-allowed;
                }

                .monthly-totals-card h4 {
                    color: #2d6a4f;
                    margin-bottom: 15px;
                }

                .monthly-totals-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                }

                .total-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                }

                .total-label {
                    font-weight: 500;
                    color: #666;
                }

                .total-value {
                    font-weight: 600;
                    color: #2d6a4f;
                }

                .balance-due {
                    color: #dc3545 !important;
                }

                .balance-credit {
                    color: #28a745 !important;
                }

                .calendar-view-container {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .toggle-calendar-btn {
                    background-color: #52b788;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    margin-bottom: 20px;
                }

                .toggle-calendar-btn:hover {
                    background-color: #40916c;
                }

                .calendar-container {
                    text-align: center;
                }

                .react-calendar {
                    width: 100%;
                    max-width: 100%;
                    background: white;
                    border: 1px solid #a0a096;
                    font-family: Arial, Helvetica, sans-serif;
                    line-height: 1.125em;
                }

                .react-calendar .has-purchase {
                    background-color: #52b788 !important;
                    color: white;
                }

                .daily-purchases {
                    margin-top: 20px;
                    padding: 15px;
                    background: white;
                    border-radius: 8px;
                    border: 1px solid #e9ecef;
                }

                .daily-purchases h4 {
                    color: #2d6a4f;
                    margin-bottom: 15px;
                    font-size: 18px;
                }

                .daily-purchases-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                }

                .daily-purchases-table th,
                .daily-purchases-table td {
                    padding: 10px;
                    text-align: right;
                    border-bottom: 1px solid #e9ecef;
                }

                .daily-purchases-table th {
                    background-color: #f8f9fa;
                    font-weight: 600;
                    color: #2d6a4f;
                }

                .daily-purchases-table tbody tr:hover {
                    background-color: #f8f9fa;
                }

                .daily-purchases-table tfoot tr {
                    background-color: #f8f9fa;
                    font-weight: 600;
                    color: #2d6a4f;
                }

                .action-btn {
                    background-color: #dc3545;
                    color: white;
                    border: none;
                    padding: 6px;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .action-btn:hover {
                    background-color: #c82333;
                }

                .add-purchase-btn:hover {
                    background-color: #1b4332 !important;
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
                    cursor: 'pointer';
                    margin-top: 15px;
                }

                h2 {
                    color: #2d6a4f;
                    margin-bottom: 20px;
                    font-size: 28px;
                }

                h4 {
                    color: #2d6a4f;
                    margin-bottom: 15px;
                }

                @media (max-width: 768px) {
                    .customer-purchase-container {
                        flex-direction: column;
                    }
                    
                    .customer-list-sidebar {
                        max-width: 100%;
                        border-right: none;
                        border-bottom: 1px solid #e9ecef;
                        padding-bottom: 15px;
                        margin-bottom: 15px;
                        padding-right: 0;
                    }

                    .purchase-history-view {
                        padding-left: 0;
                    }

                    .monthly-totals-grid {
                        grid-template-columns: 1fr;
                    }

                    .payment-input-with-button {
                        flex-direction: column;
                    }
                }
            `}</style>
        </div>
    );
};

export default Home;
