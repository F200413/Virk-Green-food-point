import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, Timestamp, getDoc, setDoc } from 'firebase/firestore';
import HomeIcon from '@mui/icons-material/Home';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentIcon from '@mui/icons-material/Payment';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
import easypaisa from '../assets/easy.jpg';
import allied from '../assets/allied.png';
// Create a placeholder for JazzCash if you don't have an image
const jazzCash = "data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23ED0006' rx='10' /%3E%3Ctext x='50' y='50' font-family='Arial' font-size='40' fill='white' text-anchor='middle' dominant-baseline='middle'%3EJC%3C/text%3E%3C/svg%3E";
const Home = () => {
    // State variables
    const [activeSection, setActiveSection] = useState(() => {
        // Try to get the saved section from localStorage, default to 'billing' if not found
        return localStorage.getItem('activeSection') || 'billing';
    });
    const [customers, setCustomers] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [rates, setRates] = useState({
        milk: 120,
        yogurt: 140,
        monthlyRates: {} // Store monthly rates for each customer
    });
    const [bills, setBills] = useState([]);
    const [advancePayments, setAdvancePayments] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [customerListSearchTerm, setCustomerListSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        customMilkRate: rates.milk, // Default to global rate
        customYogurtRate: rates.yogurt // Default to global rate
    });
    const [purchaseFormData, setPurchaseFormData] = useState({
        milk: 0,
        yogurt: 0
    });
    const [billFormData, setBillFormData] = useState({
        customerName: '',
        milkQty: 0,
        yogurtQty: 0,
        entries: []  // Array to store multiple milk and yogurt entries
    });
    const [advanceFormData, setAdvanceFormData] = useState({
        customerId: '',
        amount: 0,
        description: ''
    });
    const [todaySales, setTodaySales] = useState(0);
    const [salesGrowth, setSalesGrowth] = useState(0);
    const [customerSearchForAdvance, setCustomerSearchForAdvance] = useState('');
    const [editingAdvancePayment, setEditingAdvancePayment] = useState(null);
    const [inventory, setInventory] = useState({
        milk: 0,
        yogurt: 0
    });
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(false);
    const [dailyPurchases, setDailyPurchases] = useState([]);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    
    // Payment summary state
    const [paymentSummary, setPaymentSummary] = useState({
        totalMilkAmount: 0,
        totalYogurtAmount: 0,
        totalRevenue: 0,
        totalPaymentsReceived: 0,
        outstandingAmount: 0
    });

    // Password verification for delete operations
    const [showPasswordVerification, setShowPasswordVerification] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [deleteAction, setDeleteAction] = useState(null);
    const [deleteParams, setDeleteParams] = useState(null);

    // Add this after the existing state declarations
    const [monthlyRateForm, setMonthlyRateForm] = useState({
        customerId: '',
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        milkRate: 0,
        yogurtRate: 0
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
            customerData: []
        }
    });

    // Helper function to round numbers
    const roundNumber = (num) => {
        return Math.round(num);
    };

    // Loading Spinner Component
    const LoadingSpinner = () => (
        <div className="spinner"></div>
    );

    // CSS for the spinner (add to your CSS file)
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
            
            .button-with-spinner {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            /* New professional styles */
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }

            header {
                background-color: #fff;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                padding: 15px;
                margin-bottom: 20px;
            }

            header h1 {
                color: #2c3e50;
                margin-bottom: 15px;
                text-align: center;
                font-size: 28px;
            }

            nav {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                justify-content: center;
            }

            nav button {
                background-color: #f8f9fa;
                border: 1px solid #e9ecef;
                color: #495057;
                padding: 10px 15px;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-weight: 500;
            }

            nav button:hover {
                background-color: #e9ecef;
            }

            nav button.active-nav {
                background-color: #0096c7;
                color: white;
                border-color: #0096c7;
            }

            section {
                display: none;
                background-color: #fff;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                padding: 20px;
                margin-bottom: 20px;
            }

            section.active {
                display: block;
            }

            section h2 {
                color: #2c3e50;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid #f0f0f0;
                font-size: 1.8rem;
                font-weight: 700;
            }

            .form-group {
                margin-bottom: 15px;
            }

            .form-group label {
                display: block;
                margin-bottom: 5px;
                color: #495057;
                font-weight: 600;
                font-size: 0.8rem;
            }

            input, select, textarea {
                width: 100%;
                        padding: 10px;
                border: 1px solid #ced4da;
                border-radius: 5px;
                font-size: 16px;
                transition: border-color 0.3s ease;
            }

            input:focus, select:focus, textarea:focus {
                border-color: #0096c7;
                outline: none;
                box-shadow: 0 0 0 3px rgba(0, 150, 199, 0.1);
            }

            button[type="submit"], .add-btn, .print-btn {
                background-color: #2d6a4f;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                
                transition: background-color 0.3s ease;
                font-weight: 500;
                width: 100%;
            }

            button[type="submit"]:hover, .add-btn:hover, .print-btn:hover {
                background-color: #1b4332;
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
                animation: fadeIn 0.3s;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .modal-content {
                background-color: #fff;
                margin: 10% auto;
                padding: 20px;
                width: 50%;
                border-radius: 10px;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
                position: relative;
                animation: slideDown 0.3s;
            }

            @keyframes slideDown {
                from { transform: translateY(-50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            .close {
                position: absolute;
                right: 20px;
                top: 15px;
                font-size: 24px;
                font-weight: bold;
                color: #adb5bd;
                cursor: pointer;
            }

            .close:hover {
                color: #495057;
            }

            .customer-card {
                background-color: #f8f9fa;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 15px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }

            .customer-card:hover {
                transform: translateY(-3px);
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .customer-card h3 {
                color: #212529;
                margin-bottom: 10px;
                font-size: 1.3rem;
                font-weight: 600;
            }

            .customer-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 10px;
            }

            .edit-btn, .delete-btn {
                padding: 5px 10px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            }

            .edit-btn {
                background-color: #52b788;
                color: #081c15;
                border: none;
            }

            .delete-btn {
                background-color: #ef476f;
                color: white;
                border: none;
            }

            .search-bar {
                margin-bottom: 20px;
            }

            .bill-record {
                background-color: #f8f9fa;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 15px;
                border-left: 4px solid #2d6a4f;
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

            .purchase-history-view {
                flex: 2;
            }

            .customer-list-item {
                padding: 10px;
                border-radius: 5px;
                margin-bottom: 10px;
                cursor: pointer;
                transition: background-color 0.2s ease;
            }

            .customer-list-item:hover {
                background-color: #f0f0f0;
            }

            .customer-list-item.active {
                background-color: #e6f3eb;
                border-left: 3px solid #2d6a4f;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }

            th, td {
                padding: 12px 9px;
                text-align: left;
                border-bottom: 1px solid #e9ecef;
            }

            th {
                background-color: #f8f9fa;
                color: #495057;
                font-weight: 700;
                font-size: 0.75rem;
            }

            tr:hover {
                background-color: #f8f9fa;
            }

            .customer-balance-summary {
                margin-top: 20px;
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 8px;
            }

            .balance-due {
                color: #ef476f;
            }

            .balance-credit {
                color: #06d6a0;
            }

            @media screen and (max-width: 768px) {
                .modal-content {
                    width: 90%;
                }
                
                .customer-purchase-container {
                    flex-direction: column;
                }
                
                .customer-list-sidebar {
                    max-width: 100%;
                    border-right: none;
                    border-bottom: 1px solid #e9ecef;
                    padding-bottom: 15px;
                    margin-bottom: 15px;
                }
                
                nav {
                    flex-direction: column;
                }
            }

            .search-input-container {
                position: relative;
                display: flex;
                align-items: center;
            }
            
            .search-icon {
                position: absolute;
                left: 10px;
                color: #666;
            }
            
            .search-bar input {
                padding-left: 35px;
            }
            
            .edit-btn, .delete-btn {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .success-message {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 20px;
                text-align: center;
            }
            
            .close {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            /* Customer search styles */
            .customer-search-container {
                position: relative;
            }
            
            .search-results {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                max-height: 200px;
                overflow-y: auto;
                background-color: white;
                border: 1px solid #ced4da;
                border-top: none;
                border-radius: 0 0 5px 5px;
                z-index: 10;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            
            .customer-search-result {
                padding: 10px 15px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                transition: background-color 0.2s;
                direction: rtl;
                text-align: right;
            }
            
            .customer-search-result:hover,
            .customer-search-result.selected {
                background-color: #e6f3eb;
            }
            
            .customer-search-result:last-child {
                border-bottom: none;
            }
            
            .no-results {
                padding: 10px 15px;
                color: #6c757d;
                text-align: center;
            }
            
            .validation-message {
                color: #dc3545;
                font-size: 12px;
                margin-top: 5px;
            }
            
            /* Calendar styles */
            .react-calendar {
                width: 100%;
                max-width: 500px;
                background: white;
                border: 1px solid #ced4da;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.5em;
                margin-bottom: 20px;
            }
            
            .react-calendar__tile {
                max-width: 100%;
                padding: 10px;
                background: none;
                text-align: center;
                line-height: 20px;
            }
            
            .react-calendar__tile--now {
                background: #e6f3eb;
            }
            
            .react-calendar__tile--active {
                background: #2d6a4f;
                color: white;
            }
            
            .react-calendar__tile--hasContent {
                background-color: #ffd166;
                font-weight: bold;
            }
            
            .daily-purchases {
                margin-top: 20px;
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 8px;
                border-left: 4px solid #2d6a4f;
            }
            
            .daily-purchases h4 {
                margin-top: 0;
                margin-bottom: 15px;
                color: #2d6a4f;
                font-size: 18px;
            }
            
            .toggle-calendar-btn {
                background-color: #2d6a4f;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 8px 15px;
                margin-bottom: 15px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s;
            }
            
            .toggle-calendar-btn:hover {
                background-color: #1b4332;
            }
            
            .calendar-container {
                margin-bottom: 20px;
            }
            
            .monthly-summary-container {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .customer-header-info {
                flex: 1;
            }
            
            .customer-header-info h3 {
                margin-top: 0;
                margin-bottom: 10px;
                color: #2d6a4f;
            }
            
            .monthly-totals-card {
                flex: 1;
                background-color: #f8f9fa;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                max-width: 48%;
            }
            
            .monthly-totals-card h4 {
                margin-top: 0;
                margin-bottom: 15px;
                color: #2d6a4f;
                font-size: 18px;
                text-align: center;
                border-bottom: 2px solid #2d6a4f;
                padding-bottom: 8px;
            }
            
            .monthly-totals-grid {
                display: grid;
                grid-gap: 8px;
                font-size: 14px;
            }

            .total-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 4px 0;
            }

            .total-label {
                font-weight: 600;
                color: #555;
            }

            .total-value {
                font-weight: 500;
            }

            .total-amount {
                margin-top: 5px;
                padding-top: 5px;
                border-top: 1px dashed #ddd;
            }
            
            .toggle-calendar-btn {
                background-color: #2d6a4f;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 8px 15px;
                margin-bottom: 15px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s;
            }
            
            .toggle-calendar-btn:hover {
                background-color: #1b4332;
            }
            
            /* Mobile responsiveness */
            @media screen and (max-width: 768px) {
                .monthly-summary-container {
                    flex-direction: column;
                }
                
                .monthly-totals-card, .payment-form-container {
                    max-width: 100%;
                    margin-top: 15px;
                }
            }

            .payment-form-container {
                flex: 1;
                background-color: #f8f9fa;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                max-width: 48%;
            }

            .payment-form-container h4 {
                margin-top: 0;
                margin-bottom: 15px;
                color: #2d6a4f;
                font-size: 18px;
                text-align: center;
                border-bottom: 2px solid #2d6a4f;
                padding-bottom: 8px;
            }

            .payment-input-group {
                margin-bottom: 0;
            }

            .payment-input-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #333;
                font-size: 14px;
            }

            .payment-input-with-button {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .payment-input-with-button input {
                flex: 1;
                padding: 10px 12px;
                border: 2px solid #ced4da;
                border-radius: 8px;
                font-size: 16px;
                height: 45px;
                width: 100%;
            }

            .payment-input-with-button input:focus {
                border-color: #2d6a4f;
                outline: none;
                box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.2);
            }

            .payment-submit-btn {
                background-color: #2d6a4f;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 12px;
                cursor: pointer;
                font-weight: 600;
                font-size: 16px;
                transition: all 0.3s ease;
                width: 100%;
                height: 45px;
            }

            .payment-submit-btn:hover {
                background-color: #1b4332;
                transform: translateY(-2px);
            }

            .payment-submit-btn:disabled {
                background-color: #6c757d;
                cursor: not-allowed;
                transform: none;
            }

            .total-payments, .total-remaining {
                margin-top: 10px;
            }

            .total-remaining {
                font-weight: bold;
                font-size: 18px;
            }

            @media screen and (max-width: 768px) {
                .payment-input-with-button {
                    flex-direction: column;
                }
                
                .payment-submit-btn {
                    width: 100%;
                }
            }

            .balance-due {
                color: #ef476f;
            }
            
            .balance-credit {
                color: #06d6a0;
            }

            .bill-history-container {
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                overflow: hidden;
            }

            .bills-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 16px;
            }

            .bills-table thead {
                background-color: #f0f8f4;
                position: sticky;
                top: 0;
            }

            .bills-table th {
                text-align: center;
                font-weight: 600;
                color: #2d6a4f;
                border-bottom: 2px solid #ddd;
            }

            .bills-table td {
                text-align: center;
                border-bottom: 1px solid #eee;
            }

            .bill-table-row {
                transition: background-color 0.2s;
                cursor: pointer;
            }

            .bill-table-row:hover {
                background-color: #f0f8f4;
            }

            .bill-amount {
                font-weight: bold;
                color: #2d6a4f;
            }

            @media screen and (max-width: 768px) {
                .bills-table {
                    font-size: 14px;
                }
            }

            .entry-form {
                background-color: #f8f9fa;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .entry-form h3 {
                margin-top: 0;
                margin-bottom: 15px;
                color: #2d6a4f;
                font-size: 18px;
                border-bottom: 2px solid #2d6a4f;
                padding-bottom: 8px;
            }

            .buttons-container {
                display: flex;
                justify-content: space-between;
                gap: 10px;
                margin-top: 15px;
                width: 100%;
            }

            .action-buttons-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-top: 15px;
                width: 100%;
            }

            .add-entry-btn {
                background-color: #0077b6;
                color: white;
                border: none;
                border-radius: 5px;
                padding: 10px 5px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 500;
                transition: all 0.3s ease;
                width: 100%;
                height: 45px;
            }

            .add-entry-btn:hover {
                background-color: #023e8a;
            }

            .bill-submit-btn {
                background-color: #2d6a4f;
                color: white;
                border: none;
                border-radius: 5px;
                padding: 10px 5px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 500;
                transition: all 0.3s ease;
                width: 100%;
                height: 45px;
            }

            .bill-submit-btn:hover {
                background-color: #1b4332;
            }

            .entries-list {
                background-color: white;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .entries-list h3 {
                margin-top: 0;
                margin-bottom: 15px;
                color: #2d6a4f;
                font-size: 18px;
                border-bottom: 2px solid #2d6a4f;
                padding-bottom: 8px;
            }

            .entries-table {
                width: 100%;
                border-collapse: collapse;
            }

            .entries-table th, .entries-table td {
                padding: 10px;
                text-align: center;
                border-bottom: 1px solid #eee;
            }

            .entries-table th {
                background-color: #f0f8f4;
                color: #2d6a4f;
                font-weight: 600;
            }

            .entries-table tfoot {
                font-weight: bold;
                background-color: #f0f8f4;
            }

            .delete-entry-btn {
                background-color: #ef476f;
                color: white;
                border: none;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .delete-entry-btn:hover {
                background-color: #d64161;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Add custom styles to the component when it mounts
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            /* Calendar purchase day highlight */
            .calendar-tile-purchase-day {
                background-color: #ffeb3b !important; /* Yellow */
                color: #000 !important;
                font-weight: bold;
            }
            
            /* Main layout styles */
            .app-container {
                display: flex;
                height: 100vh;
                background-color: #f8f9fa;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Add supplier-specific styles
    useEffect(() => {
        const supplierStyle = document.createElement('style');
        supplierStyle.textContent = `
            /* Supplier styles */
            .supplier-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .supplier-table-container {
                overflow-x: auto;
                margin-bottom: 20px;
            }
            
            .supplier-table {
                width: 100%;
                border-collapse: collapse;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                background-color: #fff;
            }
            
            .supplier-table th, 
            .supplier-table td {
                padding: 12px 15px;
                text-align: center;
                border-bottom: 1px solid #e0e0e0;
            }
            
            .supplier-table th {
                background-color: #3498db;
                color: white;
                font-weight: 600;
            }
            
            .supplier-table tr:hover {
                background-color: #f5f5f5;
            }
            
            .supplier-table tfoot {
                font-weight: bold;
                background-color: #f8f9fa;
            }
            
            .calculated-total {
                font-size: 1.1rem;
                font-weight: bold;
                color: #2d6a4f;
                margin: 5px 0;
            }
            
            .no-data-message {
                text-align: center;
                padding: 20px;
                background-color: #f8f9fa;
                border-radius: 5px;
                font-size: 1.1rem;
                color: #6c757d;
            }
        `;
        document.head.appendChild(supplierStyle);

        return () => {
            document.head.removeChild(supplierStyle);
        };
    }, []);

    // Add payment summary styles
    useEffect(() => {
        const paymentSummaryStyle = document.createElement('style');
        paymentSummaryStyle.textContent = `
            /* Payment Summary Styles */
            .payment-summary-header {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .payment-summary-header h2 {
                color: #2d6a4f;
                margin-bottom: 10px;
            }
            
            .summary-subtitle {
                color: #6c757d;
                font-size: 16px;
                margin: 0;
            }
            
            .payment-summary-content {
                display: flex;
                flex-direction: column;
                gap: 30px;
            }
            
            .summary-cards-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .summary-card {
                background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
                border-radius: 15px;
                padding: 25px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                border-left: 5px solid #007bff;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                display: flex;
                align-items: center;
                gap: 20px;
            }
            
            .summary-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            }
            
            .total-milk-card {
                border-left-color: #17a2b8;
            }
            
            .total-revenue-card {
                border-left-color: #007bff;
            }
            
            .payments-received-card {
                border-left-color: #28a745;
            }
            
            .outstanding-card {
                border-left-color: #dc3545;
            }
            
            .card-icon {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #007bff, #0056b3);
                color: white;
                flex-shrink: 0;
            }
            
            .total-milk-card .card-icon {
                background: linear-gradient(135deg, #17a2b8, #138496);
            }

            /* Monthly Report Styles */
            .monthly-report-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                flex-wrap: wrap;
                gap: 20px;
            }

            .report-controls {
                display: flex;
                gap: 20px;
                align-items: end;
            }

            .report-controls .form-group {
                margin-bottom: 0;
            }

            .monthly-report-content {
                display: flex;
                flex-direction: column;
                gap: 30px;
            }

            .report-summary-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }

            .summary-card {
                background: white;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                border-left: 4px solid;
                transition: transform 0.2s ease;
            }

            .summary-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(0,0,0,0.15);
            }

            .summary-card.advance-received {
                border-left-color: #28a745;
            }

            .summary-card.milk-sold {
                border-left-color: #2d6a4f;
            }

            .summary-card.yogurt-sold {
                border-left-color: #9d4edd;
            }

            .summary-card.total-revenue {
                border-left-color: #d4af37;
            }

            .summary-card.outstanding-amount.debt-balance {
                border-left-color: #dc3545;
            }

            .summary-card.outstanding-amount.credit-balance {
                border-left-color: #28a745;
            }

            .main-value.credit-amount {
                color: #28a745 !important;
            }

            .main-value.debt-amount {
                color: #dc3545 !important;
            }

            .summary-card .card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .summary-card .card-header h3 {
                margin: 0;
                font-size: 14px;
                color: #6c757d;
                font-weight: 500;
            }

            .summary-card .card-icon {
                font-size: 24px;
                opacity: 0.7;
            }

            .summary-card .card-content {
                text-align: center;
            }

            .summary-card .main-value {
                font-size: 28px;
                font-weight: bold;
                color: #212529;
                margin-bottom: 5px;
            }

            .summary-card .unit {
                font-size: 12px;
                color: #6c757d;
                font-weight: 500;
            }

            .customer-breakdown {
                background: white;
                border-radius: 12px;
                padding: 25px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }

            .customer-breakdown h3 {
                margin-top: 0;
                margin-bottom: 20px;
                color: #2d6a4f;
                font-size: 18px;
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
                color: #495057;
            }

            .customer-breakdown-table tbody tr:hover {
                background-color: #f8f9fa;
            }

            .customer-breakdown-table tfoot td {
                background-color: #e9ecef;
                font-weight: bold;
                border-top: 2px solid #2d6a4f;
            }

            /* Mobile responsiveness for monthly report */
            @media screen and (max-width: 768px) {
                .monthly-report-header {
                    flex-direction: column;
                    align-items: stretch;
                }

                .report-controls {
                    flex-direction: column;
                    gap: 15px;
                }

                .report-summary-cards {
                    grid-template-columns: 1fr;
                }

                .summary-card .main-value {
                    font-size: 24px;
                }
            }
            
            .payments-received-card .card-icon {
                background: linear-gradient(135deg, #28a745, #1e7e34);
            }
            
            .outstanding-card .card-icon {
                background: linear-gradient(135deg, #dc3545, #c82333);
            }
            
            .card-content {
                flex: 1;
            }
            
            .card-content h3 {
                margin: 0 0 10px 0;
                font-size: 16px;
                color: #6c757d;
                font-weight: 500;
            }
            
            .main-value {
                font-size: 24px;
                font-weight: bold;
                color: #212529;
                margin-bottom: 5px;
            }
            
            .sub-value {
                font-size: 14px;
                color: #6c757d;
            }
            
            .payment-breakdown {
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 30px;
            }
            
            .breakdown-section {
                background: white;
                border-radius: 12px;
                padding: 25px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            }
            
            .breakdown-section h3 {
                margin: 0 0 20px 0;
                color: #212529;
                font-size: 20px;
            }
            
            .breakdown-table table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .breakdown-table th,
            .breakdown-table td {
                padding: 12px 15px;
                text-align: right;
                border-bottom: 1px solid #e0e0e0;
            }
            
            .breakdown-table th {
                background-color: #f8f9fa;
                color: #495057;
                font-weight: 600;
                text-align: center;
            }
            
            .breakdown-table tr:hover {
                background-color: #f8f9fa;
            }
            
            .breakdown-table .total-row {
                background-color: #e3f2fd;
            }
            
            .breakdown-table .received-row {
                background-color: #e8f5e8;
            }
            
            .breakdown-table .outstanding-row {
                background-color: #ffebee;
            }
            
            .payment-percentage {
                background: white;
                border-radius: 12px;
                padding: 25px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            
            .payment-percentage h4 {
                margin: 0 0 20px 0;
                text-align: center;
                color: #212529;
            }
            
            .percentage-bar {
                width: 100%;
                height: 20px;
                background-color: #e9ecef;
                border-radius: 10px;
                overflow: hidden;
                margin-bottom: 10px;
            }
            
            .percentage-fill {
                height: 100%;
                background: linear-gradient(90deg, #28a745, #20c997);
                transition: width 0.3s ease;
            }
            
            .percentage-text {
                text-align: center;
                font-size: 18px;
                font-weight: bold;
                color: #28a745;
            }
            
            /* Responsive design */
            @media (max-width: 768px) {
                .summary-cards-grid {
                    grid-template-columns: 1fr;
                }
                
                .payment-breakdown {
                    grid-template-columns: 1fr;
                }
                
                .summary-card {
                    flex-direction: column;
                    text-align: center;
                }
            }
        `;
        document.head.appendChild(paymentSummaryStyle);

        return () => {
            document.head.removeChild(paymentSummaryStyle);
        };
    }, []);

    // Fetch data from Firestore on component mount
    useEffect(() => {
        fetchCustomers();
        fetchPurchases();
        fetchRates();
        fetchBills();
        fetchAdvancePayments();
        fetchInventory();
        fetchSuppliers(); // Add this line
    }, []);

    // Add a new useEffect to calculate today's sales when bills change
    useEffect(() => {
        const fetchSales = async () => {
            await calculateTodaySales();
        };
        fetchSales();
    }, [bills]);

    // Initialize monthly report when purchases, customers, or advance payments change
    useEffect(() => {
        if (purchases.length > 0 && customers.length > 0) {
            updateMonthlyReport(monthlyReport.selectedMonth, monthlyReport.selectedYear);
        }
    }, [purchases, customers, advancePayments]);

    // Add this useEffect to monitor selectedCustomer changes
    useEffect(() => {
        if (selectedCustomer) {
            // Reset calendar date to today and update daily purchases
            setSelectedDate(new Date());
            const filtered = filterPurchasesByDate(new Date());
            setDailyPurchases(filtered);
            // Always show calendar when customer is selected
            setShowCalendar(true);
        }
    }, [selectedCustomer]);

    // Firestore operations
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

    const fetchRates = async () => {
        setLoading(true);
        try {
            const ratesDoc = doc(firestore, 'settings', 'rates');
            const ratesSnapshot = await getDoc(ratesDoc);
            if (ratesSnapshot.exists()) {
                const data = ratesSnapshot.data();
                // Ensure monthlyRates property exists to prevent data loss
                setRates({
                    milk: data.milk || 120,
                    yogurt: data.yogurt || 140,
                    monthlyRates: data.monthlyRates || {}
                });
            } else {
                // Initialize rates if they don't exist - include monthlyRates property
                const initialRates = { 
                    milk: 120, 
                    yogurt: 140, 
                    monthlyRates: {} 
                };
                await setDoc(ratesDoc, initialRates);
                setRates(initialRates);
            }
        } catch (error) {
            console.error("Error fetching rates: ", error);
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

    const fetchAdvancePayments = async () => {
        setLoading(true);
        try {
            const advanceCollection = collection(firestore, 'advancePayments');
            const q = query(advanceCollection, orderBy('date', 'desc'));
            const advanceSnapshot = await getDocs(q);
            const advanceList = advanceSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date.toDate().toISOString()
            }));
            setAdvancePayments(advanceList);
        } catch (error) {
            console.error("Error fetching advance payments: ", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInventory = async () => {
        try {
            const inventoryDoc = doc(firestore, 'settings', 'inventory');
            const inventorySnapshot = await getDoc(inventoryDoc);
            if (inventorySnapshot.exists()) {
                setInventory(inventorySnapshot.data());
            } else {
                // Initialize inventory if it doesn't exist
                await setDoc(inventoryDoc, { milk: 0, yogurt: 0 });
            }
        } catch (error) {
            console.error("Error fetching inventory: ", error);
        }
    };

    const updateInventory = async (newInventory) => {
        try {
            // Ensure inventory values never go below 0
            const safeInventory = {
                milk: Math.max(0, newInventory.milk),
                yogurt: Math.max(0, newInventory.yogurt)
            };

            const inventoryDoc = doc(firestore, 'settings', 'inventory');
            await setDoc(inventoryDoc, safeInventory);
            setInventory(safeInventory);
        } catch (error) {
            console.error("Error updating inventory: ", error);
        }
    };

    const addCustomer = async () => {
        setLoading(true);
        try {
            // Ensure custom rates are numbers
            const customerData = {
                ...formData,
                customMilkRate: parseFloat(formData.customMilkRate) || rates.milk,
                customYogurtRate: parseFloat(formData.customYogurtRate) || rates.yogurt
            };

            const customersCollection = collection(firestore, 'customers');
            await addDoc(customersCollection, customerData);
            setFormData({
                name: '',
                phone: '',
                address: '',
                customMilkRate: rates.milk,
                customYogurtRate: rates.yogurt
            });
            closeModal('customerModal');
            fetchCustomers();
            setSuccessMessage('نیا گاہک کامیابی سے شامل ہو گیا');
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error adding customer: ", error);
        } finally {
            setLoading(false);
        }
    };

    const updateCustomer = async () => {
        setLoading(true);
        try {
            // Ensure custom rates are numbers
            const customerData = {
                ...formData,
                customMilkRate: parseFloat(formData.customMilkRate) || rates.milk,
                customYogurtRate: parseFloat(formData.customYogurtRate) || rates.yogurt
            };

            const customerDoc = doc(firestore, 'customers', selectedCustomer);
            await updateDoc(customerDoc, customerData);
            setFormData({
                name: '',
                phone: '',
                address: '',
                customMilkRate: rates.milk,
                customYogurtRate: rates.yogurt
            });
            closeModal('customerModal');
            fetchCustomers();
            setSuccessMessage('گاہک کی معلومات کامیابی سے اپڈیٹ ہو گئیں');
            setShowSuccessPopup(true);

            // Refresh the customer info and daily purchases display if this is the currently selected customer
            if (selectedCustomer) {
                // This will trigger a re-render with updated rates for the currently viewed customer
                const updatedCustomerInfo = { ...customerData, id: selectedCustomer };
                const customer = customers.find(c => c.id === selectedCustomer);
                if (customer) {
                    // Only update if the rates actually changed
                    if (customer.customMilkRate !== customerData.customMilkRate ||
                        customer.customYogurtRate !== customerData.customYogurtRate) {
                        // Refresh daily purchases display if there's a selected date
                        if (selectedDate) {
                            const filtered = filterPurchasesByDate(selectedDate);
                            setDailyPurchases(filtered);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error updating customer: ", error);
        } finally {
            setLoading(false);
        }
    };

    const deleteCustomer = async (customerId) => {
        if (!customerId) return;

        // Request password verification before proceeding
        requestPasswordForDelete(async (id) => {
            setLoading(true);
            try {
                const customerRef = doc(firestore, 'customers', id);
                await deleteDoc(customerRef);

                // Update local state
                setCustomers(prevCustomers => prevCustomers.filter(customer => customer.id !== id));

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

    const clearBills = async () => {

        // Request password verification before proceeding
        requestPasswordForDelete(async () => {
            setLoading(true);
            try {
                const billsCollection = collection(firestore, 'bills');
                const billsSnapshot = await getDocs(billsCollection);

                const deletePromises = billsSnapshot.docs.map(doc =>
                    deleteDoc(doc.ref)
                );

                await Promise.all(deletePromises);
                setBills([]); // Clear bills in state
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

    const addPurchase = async () => {
        setLoading(true);
        try {
            const milkQty = parseFloat(purchaseFormData.milk) || 0;
            const yogurtQty = parseFloat(purchaseFormData.yogurt) || 0;

            // Check if enough inventory is available
            if (milkQty > inventory.milk || yogurtQty > inventory.yogurt) {
                setSuccessMessage("انوینٹری میں کافی مقدار نہیں ہے!");
                setShowSuccessPopup(true);
                setLoading(false);
                return;
            }

            // Get the customer's custom rates
            const customer = customers.find(c => c.id === selectedCustomer);
            const milkRate = customer && customer.customMilkRate ? parseFloat(customer.customMilkRate) : rates.milk;
            const yogurtRate = customer && customer.customYogurtRate ? parseFloat(customer.customYogurtRate) : rates.yogurt;

            // Use the selected date for the purchase, but keep current time
            const purchaseDate = new Date(selectedDate);
            purchaseDate.setHours(new Date().getHours());
            purchaseDate.setMinutes(new Date().getMinutes());
            purchaseDate.setSeconds(new Date().getSeconds());

            const purchaseData = {
                customerId: selectedCustomer,
                milk: milkQty,
                yogurt: yogurtQty,
                milkRate: milkRate,
                yogurtRate: yogurtRate,
                total: (milkQty * milkRate) + (yogurtQty * yogurtRate),
                date: Timestamp.fromDate(purchaseDate)
            };

            // Add to Firestore
            const purchasesCollection = collection(firestore, 'purchases');
            const docRef = await addDoc(purchasesCollection, purchaseData);

            // Update inventory - ensure values never go below 0
            const newInventory = {
                milk: Math.max(0, inventory.milk - milkQty),
                yogurt: Math.max(0, inventory.yogurt - yogurtQty)
            };
            await updateInventory(newInventory);

            // Update local state immediately
            const newPurchase = {
                id: docRef.id,
                ...purchaseData,
                date: purchaseDate.toISOString() // Convert to ISO string to match the format
            };

            // Update purchases state
            setPurchases(prevPurchases => [...prevPurchases, newPurchase]);

            // Update daily purchases
            setDailyPurchases(prevDailyPurchases => [...prevDailyPurchases, newPurchase]);

            setPurchaseFormData({ milk: 0, yogurt: 0 });
            closeModal('purchaseModal');

            setSuccessMessage('پرچز کامیابی سے شامل کر دیا گیا');
            setShowSuccessPopup(true);

            // Fetch fresh data to ensure everything is in sync
            await fetchPurchases();
        } catch (error) {
            console.error("Error adding purchase: ", error);
        } finally {
            setLoading(false);
        }
    };

    // Add a new function to fetch the current token number
    const getNextTokenNumber = async () => {
        try {
            const tokenDoc = doc(firestore, 'settings', 'tokenCounter');
            const tokenSnapshot = await getDoc(tokenDoc);

            if (tokenSnapshot.exists()) {
                return tokenSnapshot.data().currentToken || 1;
            } else {
                // Create the document if it doesn't exist yet
                await setDoc(tokenDoc, { currentToken: 1 });
                return 1;
            }
        } catch (error) {
            console.error("Error getting token number: ", error);
            return 1; // Default to 1 if there's an error
        }
    };

    // Add a function to update the token number
    const updateTokenNumber = async (tokenNumber) => {
        try {
            const tokenDoc = doc(firestore, 'settings', 'tokenCounter');
            await setDoc(tokenDoc, { currentToken: tokenNumber + 1 }, { merge: true });
        } catch (error) {
            console.error("Error updating token number: ", error);
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

    // Update the addBill function to include token number
    const addBill = async () => {
        setLoading(true);
        try {
            // Check if we have at least one entry or direct milk/yogurt quantities
            const hasEntries = billFormData.entries.length > 0;
            const hasDirectQuantities = parseFloat(billFormData.milkQty) > 0 || parseFloat(billFormData.yogurtQty) > 0;

            if (!hasEntries && !hasDirectQuantities) {
                setSuccessMessage("براہ کرم کم از کم ایک اندراج شامل کریں");
                setShowSuccessPopup(true);
                setLoading(false);
                return;
            }

            // Add current values as an entry if they exist
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

            // Calculate totals from all entries
            const totalMilkQty = allEntries.reduce((sum, entry) => sum + entry.milkQty, 0);
            const totalYogurtQty = allEntries.reduce((sum, entry) => sum + entry.yogurtQty, 0);
            const totalMilkAmount = allEntries.reduce((sum, entry) => sum + entry.milkTotal, 0);
            const totalYogurtAmount = allEntries.reduce((sum, entry) => sum + entry.yogurtTotal, 0);
            const grandTotal = totalMilkAmount + totalYogurtAmount;

            // Check if enough inventory is available
            if (totalMilkQty > inventory.milk || totalYogurtQty > inventory.yogurt) {
                setSuccessMessage("انوینٹری میں کافی مقدار نہیں ہے!");
                setShowSuccessPopup(true);
                setLoading(false);
                return;
            }

            const billsCollection = collection(firestore, 'bills');

            // Get the next token number
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
                entries: allEntries  // Store all entries in the bill
            };

            await addDoc(billsCollection, bill);

            // Update inventory
            const newInventory = {
                milk: inventory.milk - totalMilkQty,
                yogurt: inventory.yogurt - totalYogurtQty
            };
            await updateInventory(newInventory);

            // Update the token number for next bill
            await updateTokenNumber(tokenNumber);

            // Reset form data
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

    const updateRates = async () => {
        setLoading(true);
        try {
            const ratesDoc = doc(firestore, 'settings', 'rates');
            // Ensure we preserve monthlyRates when updating global rates
            const updatedRates = {
                milk: rates.milk,
                yogurt: rates.yogurt,
                monthlyRates: rates.monthlyRates || {} // Preserve existing monthly rates
            };
            await setDoc(ratesDoc, updatedRates);
            closeModal('ratesModal');
            setSuccessMessage('ریٹس کامیابی سے اپڈیٹ ہوگئے');
            setShowSuccessPopup(true);

            // If there is a selected date and customer, refresh the daily purchases
            if (selectedCustomer && selectedDate) {
                const filtered = filterPurchasesByDate(selectedDate);
                setDailyPurchases(filtered);
            }
        } catch (error) {
            console.error("Error updating rates: ", error);
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
            closeModal('advanceModal');
            fetchAdvancePayments();
            setSuccessMessage('ایڈوانس رقم کامیابی سے شامل کر دی گئی ہے');
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error adding advance payment: ", error);
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
            closeModal('advanceModal');
            fetchAdvancePayments();
            setSuccessMessage('ایڈوانس رقم کامیابی سے اپڈیٹ کر دی گئی ہے');
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error updating advance payment: ", error);
        } finally {
            setLoading(false);
        }
    };
    // Add this function to get rates for a specific month
    const getMonthlyRates = (customerId, month, year) => {
        const key = `${customerId}_${year}_${month}`;
        // Ensure rates.monthlyRates is always an object
        if (!rates.monthlyRates) return null;
        const monthlyRate = rates.monthlyRates[key];
        // Only return monthly rates if they have valid values (not null, undefined, or 0)
        if (monthlyRate && 
            typeof monthlyRate.milkRate === 'number' && monthlyRate.milkRate > 0 &&
            typeof monthlyRate.yogurtRate === 'number' && monthlyRate.yogurtRate > 0) {
            return monthlyRate;
        }
        return null;
    };
    const deleteAdvancePayment = async (paymentId) => {
        if (!paymentId) return;

        // Request password verification before proceeding
        requestPasswordForDelete(async (id) => {
            setLoading(true);
            try {
                const paymentRef = doc(firestore, 'advancePayments', id);
                await deleteDoc(paymentRef);

                // Update local state
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

    // Add a function to close the success popup
    const closeSuccessPopup = () => {
        setShowSuccessPopup(false);
    };

    // UI Helper Functions
    const showSection = (sectionId) => {
        setActiveSection(sectionId);
        // Save the active section to localStorage
        localStorage.setItem('activeSection', sectionId);
    };

    const showCustomerModal = (mode, customerId = null) => {
        setModalMode(mode);
        if (mode === 'edit' && customerId) {
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
                setFormData({
                    name: customer.name,
                    phone: customer.phone || '',
                    address: customer.address || '',
                    customMilkRate: customer.customMilkRate || rates.milk,
                    customYogurtRate: customer.customYogurtRate || rates.yogurt
                });
                setSelectedCustomer(customerId);
            }
        } else {
            setFormData({ name: '', phone: '', address: '', customMilkRate: rates.milk, customYogurtRate: rates.yogurt });
            setSelectedCustomer(null);
        }
        document.getElementById('customerModal').style.display = 'block';
    };

    const showAdvanceModal = (mode = 'add', paymentId = null) => {
        if (mode === 'edit' && paymentId) {
            const payment = advancePayments.find(p => p.id === paymentId);
            if (payment) {
                // Get customer name for the search field
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

    const showPurchaseModal = (customerId) => {
        const customer = customers.filter(c => c.id === customerId);
        if (!customer) return;

        setSelectedCustomer(customerId);
        setPurchaseFormData({ milk: 0, yogurt: 0 });

        // Show the modal first so the DOM elements are available
        document.getElementById('purchaseModal').style.display = 'block';

        // Now reset the amount input fields
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

    const showBill = (bill) => {
        const modal = document.getElementById('billModal');
        const billPrint = document.getElementById('billPrint');

        // Get current date and time
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString();
        const formattedTime = currentDate.toLocaleTimeString();

        // Create bill number (could be sequential or based on timestamp)
        const billNumber = bill.id || '0';

        // Get the entries from the bill or create default entries if not found
        const entries = bill.entries || [
            {
                id: 1,
                milkQty: bill.milkQty || 0,
                yogurtQty: bill.yogurtQty || 0,
                milkTotal: bill.milkTotal || 0,
                yogurtTotal: bill.yogurtTotal || 0
            }
        ];

        // Generate entries HTML
        let entriesHTML = '';
        entries.forEach((entry, index) => {
            if (entry.milkQty > 0) {
                entriesHTML += `
                <tr>
                    <td style="text-align: right;">دودھ</td>
                    <td style="text-align: center;">${index + 1}</td>
                    <td style="text-align: center;">${entry.milkQty.toFixed(2)}</td>
                    <td style="text-align: center;">${entry.milkTotal.toFixed(2)}</td>
                </tr>`;
            }

            if (entry.yogurtQty > 0) {
                entriesHTML += `
                <tr>
                    <td style="text-align: right;">دہی</td>
                    <td style="text-align: center;">${index + 1}</td>
                    <td style="text-align: center;">${entry.yogurtQty.toFixed(2)}</td>
                    <td style="text-align: center;">${entry.yogurtTotal.toFixed(2)}</td>
                </tr>`;
            }
        });

        // Convert image to base64 data URL for use in HTML string
        const easyPaisaCanvas = document.createElement('canvas');
        const epCtx = easyPaisaCanvas.getContext('2d');
        const epImg = new Image();
        epImg.src = easypaisa;

        epImg.onload = () => {
            easyPaisaCanvas.width = epImg.width;
            easyPaisaCanvas.height = epImg.height;
            epCtx.drawImage(epImg, 0, 0);
            const easyPaisaDataURL = easyPaisaCanvas.toDataURL('image/jpeg');

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
        };

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
        }, 100);

    };

    const printCustomerHistory = () => {
        // Create a new window for the print
        const printWindow = window.open('', '', 'height=600,width=800');

        // Get the customer's information
        const customerName = selectedCustomerInfo ? selectedCustomerInfo.name : 'N/A';
        const customerPhone = selectedCustomerInfo ? (selectedCustomerInfo.phone || 'N/A') : 'N/A';
        const pichlaBaqaya = selectedCustomerInfo && selectedCustomerInfo.pichlaBaqaya ? selectedCustomerInfo.pichlaBaqaya : 0;

        // Get current date and time
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString();
        const formattedTime = currentDate.toLocaleTimeString();

        // Calculate token number (could be based on customer or a counter)
        const tokenNumber = '2'; // You can replace this with a dynamic token

        // Calculate the totals for the summary
        const totalPurchases = selectedCustomerTotals.amount.toFixed(2);
        const totalAdvance = selectedCustomerAdvanceTotal.toFixed(2);
        const remainingBalance = selectedCustomerBalance.toFixed(2);

        // Generate the print content
        const printContent = `
            <html>
            <head>
                <title>Customer History</title>
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
                    .divider {
                        border-top: 1px dashed #000;
                        margin: 5px 0;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        margin: 3px 0;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    th {
                        border-bottom: 1px solid #000;
                    }
                    td, th {
                        text-align: center;
                        padding: 3px;
                    }
                    .totals {
                        margin-top: 10px;
                        text-align: right;
                    }
                    .balance-summary {
                        margin-top: 15px;
                        padding-top: 10px;
                        border-top: 1px dashed #000;
                    }
                    .balance-row {
                        display: flex;
                        justify-content: space-between;
                        margin: 5px 0;
                    }
                    .total-amount {
                        font-weight: bold;
                    }
                    .remaining-balance {
                        font-weight: bold;
                        color: ${selectedCustomerBalance > 0 ? '#ef476f' : '#06d6a0'};
                    }
                    .pichla-baqaya {
                        color: #ef476f;
                    }
                </style>
            </head>
            <body>
                <div class="bill-container">
                    <div class="header">ورک گرین فوڈ پوائنٹ</div>
                    <div class="divider"></div>
                    
                    <div class="info-row">
                        <span>تاریخ :</span>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="info-row">
                        <span>وقت :</span>
                        <span>${formattedTime}</span>
                    </div>
                    <div class="info-row">
                        <span>ٹوکن نمبر :</span>
                        <span>${tokenNumber}</span>
                    </div>
                    <div class="info-row">
                        <span>فون ورک :</span>
                        <span>03457411666</span>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>پروڈکٹس</th>
                             
                                <th>مقدار</th>
                                <th>قیمت</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${selectedCustomerTotals.milk > 0 ? `
                            <tr>
                                <td>دودھ</td>
                                
                                <td>${(selectedCustomerTotals.milk !== undefined ? selectedCustomerTotals.milk.toFixed(2) : '0.00')} لیٹر</td>
                                <td>${(selectedCustomerTotals.milk !== undefined ? (selectedCustomerTotals.milk * rates.milk).toFixed(2) : '0.00')}</td>
                            </tr>` : ''}
                            ${selectedCustomerTotals.yogurt > 0 ? `
                            <tr>
                                <td>دہی</td>
                                
                                <td>${(selectedCustomerTotals.yogurt !== undefined ? selectedCustomerTotals.yogurt.toFixed(2) : '0.00')} کلو</td>
                                <td>${(selectedCustomerTotals.yogurt !== undefined ? (selectedCustomerTotals.yogurt * rates.yogurt).toFixed(2) : '0.00')}</td>
                            </tr>` : ''}
                        </tbody>
                    </table>
                    
                    <div class="balance-summary">
                        <div class="balance-row">
                            <span>کل خریداری</span>
                            <span class="total-amount">${(totalPurchases !== undefined ? totalPurchases.toFixed(2) : '0.00')} روپے</span>
                        </div>
                        ${pichlaBaqaya !== 0 ? `
                        <div class="balance-row">
                            <span>پچھلا بقایا:</span>
                            <span class="pichla-baqaya">${(pichlaBaqaya !== undefined ? pichlaBaqaya.toFixed(2) : '0.00')} روپے</span>
                        </div>` : ''}
                        <div class="balance-row">
                            <span>کل ایڈوانس:</span>
                            <span>${(totalAdvance !== undefined ? totalAdvance.toFixed(2) : '0.00')} روپے</span>
                        </div>
                        <div class="balance-row">
                            <span>باقی رقم:</span>
                            <span class="remaining-balance">${(remainingBalance !== undefined ? remainingBalance.toFixed(2) : '0.00')} روپے</span>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Write content to the print window
        printWindow.document.write(printContent);
        printWindow.document.close();

        // // Initiate printing
        // setTimeout(() => {
        //     printWindow.print();
        //     printWindow.close();
        // }, 500);
    };

    // Function to print monthly totals
    const printMonthlyTotals = () => {
        const monthlyTotals = getCurrentMonthTotals();
        const currentMonth = selectedDate.getMonth();
        const currentYear = selectedDate.getFullYear();
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        const monthName = monthNames[currentMonth];

        // Create a new window for the print
        const printWindow = window.open('', '', 'height=600,width=800');

        // Generate the print content
        const printContent = `
            <html>
            <head>
                <title>Monthly Totals - ${monthName} ${currentYear}</title>
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
                    .summary-container {
                        border: 2px solid black;
                        padding: 15px;
                        width: 80%;
                        max-width: 500px;
                        margin: 0 auto;
                    }
                    .header {
                        text-align: center;
                        font-weight: bold;
                        font-size: 20px;
                        margin-bottom: 15px;
                    }
                    .month-title {
                        font-size: 18px;
                        margin: 10px 0;
                    }
                    .divider {e
                        border-top: 1px dashed #000;
                        margin: 10px 0;
                    }
                    .totals-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 10px;
                        margin: 15px 0;
                    }
                    .total-item {
                        padding: 8px;
                        background-color: #f9f9f9;
                        border-radius: 4px;
                    }
                    .total-label {
                        font-weight: bold;
                    }
                    .total-amount {
                        grid-column: span 2;
                        background-color: #f0f0f0;
                        font-weight: bold;
                    }
                    .footer {
                        margin-top: 20px;
                        font-size: 12px;
                        color: #777;
                    }
                </style>
            </head>
            <body>
                <div class="summary-container">
                    <div class="header">
                        ورک گرین فوڈ پوائنٹ
                    </div>
                    <div class="month-title">
                        Monthly Totals for ${monthName} ${currentYear}
                    </div>
                    <div class="divider"></div>
                    
                    <div class="totals-grid">
                        <div class="total-item">
              
                            <div class="total-label">دودھ (Milk):</div>
                            <div class="total-value">${monthlyTotals.milk.toFixed(1)} لیٹر</div>
                        </div>
                        <div class="total-item">
                            <div class="total-label">دہی (Yogurt):</div>
                            <div class="total-value">${monthlyTotals.yogurt.toFixed(1)} کلو</div>
                        </div>
                        <div class="total-item">
                            <div class="total-label">Milk Rate:</div>
                            <div class="total-value">Rs. ${monthlyTotals.milkRate ? monthlyTotals.milkRate.toFixed(2) : rates.milk.toFixed(2)}</div>
                        </div>
                        <div class="total-item">
                            <div class="total-label">Yogurt Rate:</div>
                            <div class="total-value">Rs. ${monthlyTotals.yogurtRate ? monthlyTotals.yogurtRate.toFixed(2) : rates.yogurt.toFixed(2)}</div>
                        </div>
                        <div class="total-item total-amount">
                            <div class="total-label">Total Amount:</div>
                            <div class="total-value">Rs. ${Math.round(monthlyTotals.amount)}</div>
                        </div>
                    </div>
                    
                    <div class="divider"></div>
                    <div class="footer">
                        Printed on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
                    </div>
                </div>
            </body>
            </html>
        `;

        // Write content to the print window
        printWindow.document.write(printContent);
        printWindow.document.close();

        // // Initiate printing
        // setTimeout(() => {
        //     printWindow.print();
        //     printWindow.close();
        // }, 500);
    };

    // Add new function for exact receipt format like in the image
    const printExactMonthlyBill = () => {
        // Get selected customer info
        const customer = selectedCustomerInfo;
        if (!customer) return;

        // Get monthly totals
        const monthlyTotals = getCurrentMonthTotals();
        const currentDate = new Date();
        const formattedDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;

        // Create a bill number
        const billNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

        // Calculate total milk and yogurt
        const milkTotal = Math.round(monthlyTotals.milk * (customer.customMilkRate || rates.milk));
        const yogurtTotal = Math.round(monthlyTotals.yogurt * (customer.customYogurtRate || rates.yogurt));
        const grandTotal = milkTotal + yogurtTotal;

        // Get all previous months' balance
        const pichlaBaqaya = Math.round(getAllPreviousMonthsBalance(customer.id));

        // Calculate total balance including previous months
        const totalBalance = Math.round(selectedCustomerBalance);
        const isCredit = totalBalance <= 0;

        // Create a new window for the print
        const printWindow = window.open('', '', 'height=600,width=800');

        // Generate the print content - matching exactly the image format
        const printContent = `
            <html>
            <head>
                <title>Monthly Bill - ${customer.name}</title>
                <style>
                    @media print {
                        body { margin: 0; padding: 0; }
                        @page { margin: 0; }
                    }
                    body { 
                        font-family: Arial, sans-serif;
                        padding: 0;
                        margin: 0;
                        direction: rtl;
                    }
                    .receipt {
                        width: 100%;
                        max-width: 380px;
                        margin: 0 auto;
                        border: 1px solid #000;
                    }
                    .header {
                        background-color: #c8e6c9;
                        padding: 8px;
                        text-align: center;
                        font-weight: bold;
                        border-bottom: 1px solid #000;
                    }
                    .bill-info {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        border-bottom: 1px solid #000;
                    }
                    .bill-info-item {
                        padding: 5px;
                        border-left: 1px solid #000;
                    }
                    .last-item {
                        border-left: none;
                    }
                    .bill-table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .bill-table th, .bill-table td {
                        border-bottom: 1px solid #000;
                        padding: 5px;
                        text-align: right;
                    }
                    .bill-table th {
                        background-color: #f0f0f0;
                    }
                    .total-row {
                        font-weight: bold;
                    }
                    .footer {
                        padding: 5px;
                        text-align: center;
                        font-size: 10px;
                        border-top: 1px solid #000;
                    }
                    .red-text {
                        color: red;
                    }
                    .credit-amount {
                        color: green;
                        font-weight: bold;
                    }
                    .due-amount {
                        color: red;
                        font-weight: bold;
                    }
                    .pichla-baqaya {
                        color: red;
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="header">
                        ورک گرین فوڈ پوائنٹ
                    </div>
                    <div class="bill-info">
                        <div class="bill-info-item">
                            تاریخ: ${formattedDate}
                        </div>
                        <div class="bill-info-item last-item">
                            حساب نمبر: ${billNumber}
                        </div>
                        <div class="bill-info-item">
                            گاہک کا نام: ${customer.name}
                        </div>
                        <div class="bill-info-item last-item">
                            فون: ${customer.phone || 'N/A'}
                        </div>
                    </div>
                    
                    <table class="bill-table">
                        <thead>
                            <tr>
                                <th>تفصیل</th>
                                <th>مقدار</th>
                                <th>ریٹ</th>
                                <th>رقم</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${monthlyTotals.milk > 0 ? `
                            <tr>
                                <td>دودھ</td>
                                <td>${Math.round(monthlyTotals.milk)}</td>
                                <td>${customer.customMilkRate || rates.milk}</td>
                                <td>${milkTotal}</td>
                            </tr>` : ''}
                            ${monthlyTotals.yogurt > 0 ? `
                            <tr>
                                <td>دہی</td>
                                <td>${Math.round(monthlyTotals.yogurt)}</td>
                                <td>${customer.customYogurtRate || rates.yogurt}</td>
                                <td>${yogurtTotal}</td>
                            </tr>` : ''}
                            <tr>
                                <td>کل فروخت</td>
                                <td></td>
                                <td></td>
                                <td>${grandTotal}</td>
                            </tr>
                            ${pichlaBaqaya > 0 ? `
                            <tr>
                                <td>پچھلا بقایا</td>
                                <td></td>
                                <td></td>
                                <td class="pichla-baqaya">${pichlaBaqaya}</td>
                            </tr>` : ''}
                            <tr>
                                <td>پیشگی ادائیگی</td>
                                <td></td>
                                <td></td>
                                <td>${Math.round(selectedCustomerAdvanceTotal)}</td>
                            </tr>
                            <tr class="total-row">
                                <td>کل بقایا رقم</td>
                                <td></td>
                                <td></td>
                                <td class="${isCredit ? 'credit-amount' : 'due-amount'}">${Math.abs(totalBalance)}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="footer">
                        <p class="red-text">درخواست ہے کہ 7 تاریخ تک ادائیگی کریں۔ اگر ادائیگی نہیں ہوگی تو سپلائی بند کر دی جائے گی۔</p>
                    </div>
                    
                    <!-- Payment Methods Section -->
                    <div style="margin-top: 10px; text-align: center; border-top: 1px dashed #000; padding-top: 5px;">
                        <div style="font-weight: bold; font-size: 12px; margin-bottom: 5px;">پیمنٹ کے طریقے</div>
                        
                        <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 5px;">
                            <!-- Payment methods in a row, with smaller images -->
                            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                                <img src="${easypaisa}" alt="EasyPaisa" style="width: 30px; height: 30px; object-fit: contain;" />
                                <span style="font-size: 12px;">03457411666</span>
                            </div>
                            
                            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                                <span style="color: #ED0006; font-weight: bold; font-size: 12px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">JC</span>
                                <span style="font-size: 12px;">03457411666</span>
                            </div>
                        </div>
                    </div>
                    
               
               
                </div>
            </body>
            </html>
        `;

        // Write content to the print window
        printWindow.document.write(printContent);
        printWindow.document.close();

        // // Initiate printing
        // setTimeout(() => {
        //     printWindow.print();
        //     printWindow.close();
        // }, 500);
    };

    // New function to print monthly bill
    const printMonthlyBill = () => {
        // Create a new window for the print
        const printWindow = window.open('', '', 'height=600,width=800');

        // Get the customer's information
        const customerName = selectedCustomerInfo ? selectedCustomerInfo.name : 'N/A';
        const customerPhone = selectedCustomerInfo ? (selectedCustomerInfo.phone || 'N/A') : 'N/A';

        // Get current date and time
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString();
        const formattedTime = currentDate.toLocaleTimeString();

        // Ask user which month to print via a prompt
        let selectedMonthStr = prompt("Enter month number (1-12):", currentDate.getMonth() + 1);
        let selectedYearStr = prompt("Enter year:", currentDate.getFullYear());

        // Default to current month and year if user cancels or enters invalid data
        let selectedMonth, selectedYear;

        if (selectedMonthStr === null || selectedYearStr === null) {
            // User pressed Cancel
            printWindow.close();
            return;
        }

        // Try to parse the input as numbers
        selectedMonth = parseInt(selectedMonthStr) - 1; // Convert to 0-based month
        selectedYear = parseInt(selectedYearStr);

        // Validate month (0-11) and year (reasonable range)
        if (isNaN(selectedMonth) || selectedMonth < 0 || selectedMonth > 11) {
            // Invalid month - use current month
            selectedMonth = currentDate.getMonth();
            alert("Invalid month entered. Using current month (" + (currentDate.getMonth() + 1) + ").");
        }

        if (isNaN(selectedYear) || selectedYear < 2000 || selectedYear > 2100) {
            // Invalid year - use current year
            selectedYear = currentDate.getFullYear();
            alert("Invalid year entered. Using current year (" + currentDate.getFullYear() + ").");
        }

        // Get the purchases for the selected month and year
        const monthlyPurchases = filterPurchasesByMonth(selectedCustomer, selectedMonth, selectedYear);

        // If no purchases found for the selected month, show an alert and return
        if (monthlyPurchases.length === 0) {
            const monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];
            alert(`No purchases found for ${monthNames[selectedMonth]} ${selectedYear}. Please try a different month.`);
            printWindow.close();
            return;
        }

        // Calculate the totals for the monthly summary
        const monthlyTotals = calculateTotals(monthlyPurchases);
        const totalPurchases = monthlyTotals.amount.toFixed(2);
        const totalAdvance = selectedCustomerAdvanceTotal.toFixed(2);

        // Get all previous months' balance up to the selected month
        // We need to modify this to get balance from all months before the selected month in the selected year
        let pichlaBaqaya = 0;

        if (selectedCustomer) {
            // Loop through months before the selected month in the same year
            for (let month = 0; month < selectedMonth; month++) {
                const prevMonthPurchases = filterPurchasesByMonth(selectedCustomer, month, selectedYear);
                if (prevMonthPurchases.length === 0) continue;

                const prevMonthTotals = calculateTotals(prevMonthPurchases);

                // Get advance payments up to the end of that month
                const endOfPrevMonth = new Date(selectedYear, month + 1, 0, 23, 59, 59, 999);
                const relevantAdvancePayments = advancePayments.filter(payment => {
                    if (payment.customerId !== selectedCustomer) return false;
                    const paymentDate = payment.date instanceof Date ? payment.date : new Date(payment.date);
                    return paymentDate <= endOfPrevMonth;
                });

                const monthAdvance = relevantAdvancePayments.reduce((sum, payment) => sum + payment.amount, 0);
                pichlaBaqaya += (prevMonthTotals.amount - monthAdvance);
            }
        }

        // Round pichlaBaqaya
        pichlaBaqaya = Math.round(pichlaBaqaya);

        // Calculate remaining balance including previous months balance
        const remainingBalance = (monthlyTotals.amount + (pichlaBaqaya > 0 ? pichlaBaqaya : 0) - selectedCustomerAdvanceTotal);
        const isCredit = remainingBalance <= 0;

        // Generate purchases HTML for the month
        let purchasesHTML = '';
        monthlyPurchases.forEach(purchase => {
            const purchaseDate = new Date(purchase.date);
            purchasesHTML += `
                <tr>
                    <td>${purchaseDate.toLocaleDateString()}</td>
                    <td>${purchase.milk || 0}</td>
                    <td>${purchase.yogurt || 0}</td>
                    <td>${purchase.total.toFixed(2)}</td>
                </tr>
            `;
        });

        // Get month name for the title
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        const monthName = monthNames[selectedMonth];

        // Generate the print content
        const printContent = `
            <html>
            <head>
                <title>Monthly Bill - ${monthName} ${selectedYear}</title>
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
                    .divider {
                        border-top: 1px dashed #000;
                        margin: 5px 0;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        margin: 3px 0;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    th {
                        border-bottom: 1px solid #000;
                    }
                    td, th {
                        text-align: center;
                        padding: 3px;
                    }
                    .totals {
                        margin-top: 10px;
                        text-align: right;
                    }
                    .balance-summary {
                        margin-top: 15px;
                        padding-top: 10px;
                        border-top: 1px dashed #000;
                    }
                    .balance-row {
                        display: flex;
                        justify-content: space-between;
                        margin: 2px 0;
                    }
                    .month-title {
                        font-size: 16px;
                        font-weight: bold;
                        margin: 10px 0;
                    }
                    .credit-amount {
                        color: green;
                        font-weight: bold;
                    }
                    .due-amount {
                        color: red;
                        font-weight: bold;
                    }
                    .pichla-baqaya {
                        color: red;
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <div class="bill-container">
                    <div class="header">
                        ورک گرین فوڈ پوائنٹ
                    </div>
                    <div class="divider"></div>
                    <div class="month-title">
                        ماہانہ بل - ${monthName} ${selectedYear}
                    </div>
                    <div class="divider"></div>
                    <div class="info-row">
                        <span>نام:</span>
                        <span>${customerName}</span>
                    </div>
                    <div class="info-row">
                        <span>فون:</span>
                        <span>${customerPhone}</span>
                    </div>
                    <div class="info-row">
                        <span>تاریخ:</span>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="info-row">
                        <span>وقت:</span>
                        <span>${formattedTime}</span>
                    </div>
                    <div class="divider"></div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>تاریخ</th>
                                <th>دودھ (لیٹر)</th>
                                <th>دہی (کلو)</th>
                                <th>رقم</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${purchasesHTML}
                        </tbody>
                    </table>
                    
                    <div class="balance-summary">
                        <div class="balance-row">
                            <span>کل خریداری</span>
                            <span class="total-amount">${totalPurchases} روپے</span>
                        </div>
                        ${pichlaBaqaya > 0 ? `
                        <div class="balance-row">
                            <span>پچھلا بقایا:</span>
                            <span class="pichla-baqaya">${pichlaBaqaya.toFixed(2)} روپے</span>
                        </div>` : ''}
                        <div class="balance-row">
                            <span>کل ایڈوانس:</span>
                            <span>${totalAdvance} روپے</span>
                        </div>
                        <div class="balance-row">
                            <span>باقی رقم:</span>
                            <span class="${isCredit ? 'credit-amount' : 'due-amount'}">${Math.abs(remainingBalance).toFixed(2)} روپے ${isCredit ? '(کریڈٹ)' : '(بقایا)'}</span>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Write content to the print window
        printWindow.document.write(printContent);
        printWindow.document.close();

        // // Initiate printing
        // setTimeout(() => {
        //     printWindow.print();
        //     printWindow.close();
        // }, 500);
    };

    // Calculate payment summary for all monthly customers
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
            console.error('Error calculating payment summary:', error);
        }
    };

    // useEffect to recalculate payment summary when data changes
    useEffect(() => {
        if (customers.length > 0 && purchases.length > 0) {
            calculatePaymentSummary();
        }
    }, [customers, purchases, advancePayments]);

    // Update the showCustomerPurchases function
    const showCustomerPurchases = (customerId) => {
        setSelectedCustomer(customerId);
        // The rest will be handled by the useEffect
    };

    // Filter functions
    const filteredCustomers = customers
        .filter(customer =>
            customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
            (customer.phone && customer.phone.includes(customerSearchTerm)) ||
            (customer.address && customer.address.toLowerCase().includes(customerSearchTerm))
        )
        .sort((a, b) => {
            // Find all numbers in the name and get the last one
            const aNumbers = a.name.match(/\d+/g);
            const bNumbers = b.name.match(/\d+/g);

            const aLastNumber = aNumbers ? aNumbers[aNumbers.length - 1] : null;
            const bLastNumber = bNumbers ? bNumbers[bNumbers.length - 1] : null;

            // If both have numbers, compare them numerically
            if (aLastNumber && bLastNumber) {
                // Remove leading zeros and convert to numbers
                const aNum = parseInt(aLastNumber.replace(/^0+/, ''), 10) || 0;
                const bNum = parseInt(bLastNumber.replace(/^0+/, ''), 10) || 0;
                return aNum - bNum;
            }
            // If only one has a number, prioritize it
            if (aLastNumber) return -1;
            if (bLastNumber) return 1;
            // If neither has a number, sort alphabetically
            return a.name.localeCompare(b.name);
        });

    const filteredCustomersList = customers
        .filter(customer =>
            customer.name.toLowerCase().includes(customerListSearchTerm.toLowerCase())
        )
        .sort((a, b) => {
            // Find all numbers in the name and get the last one
            const aNumbers = a.name.match(/\d+/g);
            const bNumbers = b.name.match(/\d+/g);

            const aLastNumber = aNumbers ? aNumbers[aNumbers.length - 1] : null;
            const bLastNumber = bNumbers ? bNumbers[bNumbers.length - 1] : null;

            // If both have numbers, compare them numerically
            if (aLastNumber && bLastNumber) {
                // Remove leading zeros and convert to numbers
                const aNum = parseInt(aLastNumber.replace(/^0+/, ''), 10) || 0;
                const bNum = parseInt(bLastNumber.replace(/^0+/, ''), 10) || 0;
                return aNum - bNum;
            }
            // If only one has a number, prioritize it
            if (aLastNumber) return -1;
            if (bLastNumber) return 1;
            // If neither has a number, sort alphabetically
            return a.name.localeCompare(b.name);
        });

    // Improve the filterPurchasesByDate function for better date handling
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

    // Calculate customer's total advance payments
    const getCustomerAdvanceTotal = (customerId) => {
        const customerAdvances = advancePayments.filter(payment => payment.customerId === customerId);
        return customerAdvances.reduce((total, payment) => total + payment.amount, 0);
    };
    const selectedCustomerPurchases = purchases.filter(p => p.customerId === selectedCustomer);
    const selectedCustomerAdvanceTotal = selectedCustomer ? getCustomerAdvanceTotal(selectedCustomer) : 0;

    const calculateTotals = (purchasesList) => {
        const totals = purchasesList.reduce((acc, purchase) => {
            const purchaseDate = new Date(purchase.date);
            const month = purchaseDate.getMonth();
            const year = purchaseDate.getFullYear();

            // Try to get monthly rates first
            const monthlyRates = getMonthlyRates(purchase.customerId, month, year);

            // Use monthly rates if available, otherwise fall back to customer's custom rates or global rates
            const milkRate = monthlyRates ? monthlyRates.milkRate :
                (purchase.customMilkRate || rates.milk);
            const yogurtRate = monthlyRates ? monthlyRates.yogurtRate :
                (purchase.customYogurtRate || rates.yogurt);

            const milkAmount = (parseFloat(purchase.milk) || 0) * milkRate;
            const yogurtAmount = (parseFloat(purchase.yogurt) || 0) * yogurtRate;

            return {
                milk: acc.milk + (parseFloat(purchase.milk) || 0),
                yogurt: acc.yogurt + (parseFloat(purchase.yogurt) || 0),
                amount: acc.amount + milkAmount + yogurtAmount,
                milkRate: milkRate,
                yogurtRate: yogurtRate
            };
        }, { milk: 0, yogurt: 0, amount: 0, milkRate: 0, yogurtRate: 0 });

        return totals;
    };

    // New function to filter purchases by month and year
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

    // Add this function after the filterPurchasesByMonth function
    const getAllPreviousMonthsBalance = (customerId) => {
        if (!customerId) return 0;

        const customer = customers.find(c => c.id === customerId);
        if (!customer) return 0;

        // Calculate balance up to the beginning of the currently selected month
        const currentMonth = selectedDate.getMonth();
        const currentYear = selectedDate.getFullYear();
        const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

        let totalPreviousPurchases = 0;

        // Consider all purchases up to the end of last month
        const previousPurchases = purchases.filter(p => {
            if (p.customerId !== customerId) return false;
            const purchaseDate = p.date instanceof Date ? p.date : new Date(p.date);
            return purchaseDate <= endOfLastMonth;
        });

        if (previousPurchases.length > 0) {
            totalPreviousPurchases = calculateTotals(previousPurchases).amount;
        }

        // Consider all advance payments up to the end of last month
        const previousAdvancePayments = advancePayments.filter(payment => {
            if (payment.customerId !== customerId) return false;
            const paymentDate = payment.date instanceof Date ? payment.date : new Date(payment.date);
            return paymentDate <= endOfLastMonth;
        });

        const totalPreviousAdvance = previousAdvancePayments.reduce((sum, payment) => sum + payment.amount, 0);

        return totalPreviousPurchases - totalPreviousAdvance;
    };

    const selectedCustomerTotals = calculateTotals(selectedCustomerPurchases);
    const selectedCustomerInfo = selectedCustomer ? customers.find(c => c.id === selectedCustomer) : null;
    const customSelectedCustomerTotals = calculateTotals(selectedCustomerPurchases);
    const selectedCustomerBalance = customSelectedCustomerTotals.amount - selectedCustomerAdvanceTotal;

    // Event handlers
    const handleCustomerFormSubmit = (e) => {
        e.preventDefault();
        if (modalMode === 'edit') {
            updateCustomer();
        } else {
            addCustomer();
        }
    };

    const handlePurchaseFormSubmit = (e) => {
        e.preventDefault();
        addPurchase();
    };

    const handleBillFormSubmit = (e) => {
        e.preventDefault();
        addBill();
    };

    const handleRatesFormSubmit = (e) => {
        e.preventDefault();
        updateRates();
    };

    const handleAdvanceFormSubmit = (e) => {
        e.preventDefault();
        if (editingAdvancePayment) {
            updateAdvancePayment();
        } else {
            addAdvancePayment();
        }
    };

    const handleInputChange = (e, setter, data) => {
        const { name, value } = e.target;
        setter({ ...data, [name]: value });
    };

    // Add a function to calculate today's sales
    const calculateTodaySales = async () => {
        try {
            // Calculate today's revenue
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todayBills = bills.filter(bill => {
                const billDate = new Date(bill.date);
                // Compare only the date part (year, month, day)
                return billDate.getFullYear() === today.getFullYear() &&
                    billDate.getMonth() === today.getMonth() &&
                    billDate.getDate() === today.getDate();
            });

            const todayTotal = todayBills.reduce((sum, bill) => sum + bill.grandTotal, 0);
            setTodaySales(todayTotal);

            // Calculate growth (comparing with previous day)
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const yesterdayBills = bills.filter(bill => {
                const billDate = new Date(bill.date);
                return billDate.getFullYear() === yesterday.getFullYear() &&
                    billDate.getMonth() === yesterday.getMonth() &&
                    billDate.getDate() === yesterday.getDate();
            });

            const yesterdayTotal = yesterdayBills.reduce((sum, bill) => sum + bill.grandTotal, 0);

            if (yesterdayTotal > 0) {
                const growth = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;
                setSalesGrowth(growth);
            } else {
                setSalesGrowth(0);
            }
        } catch (error) {
            console.error("Error calculating today's sales: ", error);
        }
    };

    // Add a new function to clear monthly purchases
    const clearMonthlyPurchases = async () => {
        // Request password verification before proceeding
        requestPasswordForDelete(async () => {
            setLoading(true);
            try {
                // First fetch all the purchases
                const purchasesCollection = collection(firestore, 'purchases');
                const purchasesSnapshot = await getDocs(purchasesCollection);

                // Create delete promises for all purchases
                const deletePromises = purchasesSnapshot.docs.map(doc =>
                    deleteDoc(doc.ref)
                );

                await Promise.all(deletePromises);
                setPurchases([]); // Clear purchases in state
                setDailyPurchases([]); // Clear daily purchases in state

                setSuccessMessage('تمام ماہانہ خریداری کامیابی سے حذف کر دی گئی ہیں۔ ایڈوانس اور باقیہ رقم برقرار ہیں۔');
                setShowSuccessPopup(true);
            } catch (error) {
                console.error("Error clearing monthly purchases: ", error);
                setSuccessMessage("ماہانہ خریداری کو حذف کرنے میں خرابی");
                setShowSuccessPopup(true);
            } finally {
                setLoading(false);
            }
        });
    };

    // Add this function with the other handlers
    const handleInventoryUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateInventory(inventory);
            setSuccessMessage('انوینٹری کامیابی سے اپ ڈیٹ ہو گئی ہے');
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error updating inventory: ", error);
            setSuccessMessage("انوینٹری اپڈیٹ کرنے میں خرابی");
        } finally {
            setLoading(false);
        }
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

    const addSupplier = async () => {
        setLoading(true);
        try {
            const suppliersCollection = collection(firestore, 'suppliers');
            const supplierData = {
                ...formData,
                lastUpdate: Timestamp.now()
            };
            await addDoc(suppliersCollection, supplierData);

            // Update total inventory
            const newInventory = {
                milk: inventory.milk + (parseFloat(formData.milkQuantity) || 0),
                yogurt: inventory.yogurt + (parseFloat(formData.yogurtQuantity) || 0)
            };
            await updateInventory(newInventory);

            setFormData({ name: '', phone: '', milkQuantity: 0, yogurtQuantity: 0 });
            closeModal('supplierModal');
            fetchSuppliers();
            setSuccessMessage('نیا سپلائر کامیابی سے شامل ہو گیا');
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error adding supplier: ", error);
        } finally {
            setLoading(false);
        }
    };

    const updateSupplier = async () => {
        setLoading(true);
        try {
            const oldSupplier = suppliers.find(s => s.id === selectedSupplier);
            const supplierDoc = doc(firestore, 'suppliers', selectedSupplier);
            const supplierData = {
                ...formData,
                lastUpdate: Timestamp.now()
            };
            await updateDoc(supplierDoc, supplierData);

            // Update total inventory
            const milkDiff = (parseFloat(formData.milkQuantity) || 0) - (parseFloat(oldSupplier.milkQuantity) || 0);
            const yogurtDiff = (parseFloat(formData.yogurtQuantity) || 0) - (parseFloat(oldSupplier.yogurtQuantity) || 0);
            const newInventory = {
                milk: inventory.milk + milkDiff,
                yogurt: inventory.yogurt + yogurtDiff
            };
            await updateInventory(newInventory);

            setFormData({ name: '', phone: '', milkQuantity: 0, yogurtQuantity: 0 });
            closeModal('supplierModal');
            fetchSuppliers();
            setSuccessMessage('سپلائر کامیابی سے اپڈیٹ ہو گیا');
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error updating supplier: ", error);
        } finally {
            setLoading(false);
        }
    };

    const deleteSupplier = async (supplierId) => {
        if (window.confirm('کیا آپ واقعی اس سپلائر کو حذف کرنا چاہتے ہیں؟')) {
            setLoading(true);
            try {
                const supplier = suppliers.find(s => s.id === supplierId);
                await deleteDoc(doc(firestore, 'suppliers', supplierId));

                // Update total inventory
                const newInventory = {
                    milk: inventory.milk - (parseFloat(supplier.milkQuantity) || 0),
                    yogurt: inventory.yogurt - (parseFloat(supplier.yogurtQuantity) || 0)
                };
                await updateInventory(newInventory);

                fetchSuppliers();
                setSuccessMessage('سپلائر کامیابی سے حذف ہو گیا');
                setShowSuccessPopup(true);
            } catch (error) {
                console.error("Error deleting supplier: ", error);
            } finally {
                setLoading(false);
            }
        }
    };

    // Add this function with your other Firestore operations
    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const suppliersCollection = collection(firestore, 'suppliers');
            const suppliersSnapshot = await getDocs(suppliersCollection);
            const suppliersList = suppliersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort suppliers based on their index numbers
            const sortedSuppliers = suppliersList.sort((a, b) => {
                // Extract index numbers from supplier names
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

    // Handle date change on calendar
    const handleDateChange = (date) => {
        setSelectedDate(date);
        const filtered = filterPurchasesByDate(date);
        setDailyPurchases(filtered);

        // No need to recalculate monthly totals on each date change
        // We'll calculate them when we need to display them
    };

    // Get current month and year totals for display
    const getCurrentMonthTotals = () => {
        const currentMonth = selectedDate.getMonth();
        const currentYear = selectedDate.getFullYear();

        if (selectedCustomer) {
            // For a specific customer
            const monthlyPurchases = filterPurchasesByMonth(selectedCustomer, currentMonth, currentYear);
            const totals = calculateTotals(monthlyPurchases);

            // If there's a selected customer, get the monthly rates
            if (selectedCustomerInfo) {
                // Try to get monthly rates first
                const monthlyRates = getMonthlyRates(selectedCustomer, currentMonth, currentYear);

                // Use monthly rates if available, otherwise fall back to customer's custom rates or global rates
                const milkRate = monthlyRates ? monthlyRates.milkRate :
                    (selectedCustomerInfo.customMilkRate || rates.milk);
                const yogurtRate = monthlyRates ? monthlyRates.yogurtRate :
                    (selectedCustomerInfo.customYogurtRate || rates.yogurt);

                // Calculate the total amount using the rates
                const calculatedAmount = (totals.milk * milkRate) + (totals.yogurt * yogurtRate);

                // Return an updated totals object with the calculated amount
                return {
                    ...totals,
                    milk: totals.milk,
                    yogurt: totals.yogurt,
                    amount: calculatedAmount,
                    // Also include the rates for reference
                    milkRate: milkRate,
                    yogurtRate: yogurtRate
                };
            }

            return totals;
        } else {
            // For all customers
            return calculateMonthlySales(currentMonth, currentYear);
        }
    };

    // Function to check if a date has purchases
    const tileClassName = ({ date, view }) => {
        if (view === 'month' && selectedCustomer) {
            const hasContent = purchases.some(purchase => {
                const purchaseDate = new Date(purchase.date);
                return purchase.customerId === selectedCustomer &&
                    purchaseDate.getDate() === date.getDate() &&
                    purchaseDate.getMonth() === date.getMonth() &&
                    purchaseDate.getFullYear() === date.getFullYear();
            });
            return hasContent ? 'calendar-tile-purchase-day' : null;
        }
    };

    // Add a function to handle payment submission
    const handlePaymentSubmit = async (e) => {
        e.preventDefault();

        if (!selectedCustomer || !paymentAmount || parseFloat(paymentAmount) <= 0) {
            setSuccessMessage('Please enter a valid payment amount');
            setShowSuccessPopup(true);
            return;
        }

        setPaymentProcessing(true);

        try {
            // Create a new payment record in Firestore
            const paymentData = {
                customerId: selectedCustomer,
                amount: parseFloat(paymentAmount),
                description: 'Bill Payment',
                date: Timestamp.now()
            };

            // Add payment to advance payments collection
            const advanceCollection = collection(firestore, 'advancePayments');
            await addDoc(advanceCollection, paymentData);

            // Refresh advance payments
            await fetchAdvancePayments();

            // Clear the payment input
            setPaymentAmount('');

            // Show success message
            setSuccessMessage('Payment recorded successfully');
            setShowSuccessPopup(true);

        } catch (error) {
            console.error("Error recording payment: ", error);
            setSuccessMessage("Failed to record payment. Please try again.");
            setShowSuccessPopup(true);
        } finally {
            setPaymentProcessing(false);
        }
    };

    // Add a function to calculate monthly sales totals
    const calculateMonthlySales = (month, year) => {
        // This assumes purchases has been loaded
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

        // Filter purchases for this month across all customers
        const monthlyPurchases = purchases.filter(purchase => {
            const purchaseDate = purchase.date instanceof Date ?
                purchase.date :
                new Date(purchase.date);
            return purchaseDate >= startOfMonth && purchaseDate <= endOfMonth;
        });

        // Calculate the totals
        return monthlyPurchases.reduce((acc, curr) => ({
            milk: acc.milk + (parseFloat(curr.milk) || 0),
            yogurt: acc.yogurt + (parseFloat(curr.yogurt) || 0),
            amount: acc.amount + (parseFloat(curr.total) || 0)
        }), { milk: 0, yogurt: 0, amount: 0 });
    };

    // Calculate Monthly Report Data
    const calculateMonthlyReportData = (month, year) => {
        // Filter purchases for the selected month/year
        const monthlyPurchases = purchases.filter(purchase => {
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
            
            // Calculate amount using customer's rates
            const customer = customerStats[customerId].customerInfo;
            const milkRate = customer?.customMilkRate || rates.milk;
            const yogurtRate = customer?.customYogurtRate || rates.yogurt;
            
            customerStats[customerId].amount += 
                (parseFloat(purchase.milk) || 0) * milkRate + 
                (parseFloat(purchase.yogurt) || 0) * yogurtRate;
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
            const paymentDate = new Date(payment.date);
            return paymentDate.getMonth() === month && paymentDate.getFullYear() === year;
        });

        const totalAdvanceReceived = monthlyAdvancePayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);

        // Calculate outstanding amount (Total Revenue - Advance Payments Received)
        const outstandingAmount = totalRevenue - totalAdvanceReceived;

        return {
            totalAdvanceReceived,
            totalMilkSold,
            totalYogurtSold,
            totalRevenue,
            outstandingAmount,
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

    // Function for printing a full A4 page monthly bill with green header
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
        const milkRate = monthlyRates ? monthlyRates.milkRate : (customer.customMilkRate || rates.milk);
        const yogurtRate = monthlyRates ? monthlyRates.yogurtRate : (customer.customYogurtRate || rates.yogurt);
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
            const milkRate = prevMonthRates ? prevMonthRates.milkRate : (customer.customMilkRate || rates.milk);
            const yogurtRate = prevMonthRates ? prevMonthRates.yogurtRate : (customer.customYogurtRate || rates.yogurt);
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
                    }
                    .bill-container {
                        width: 100%;
                        max-width: 21cm;
                        margin: 0 auto;
                        border: 1px solid black;
                    }
                    .header {
                        background-color:rgb(243, 0, 0);
                        text-align: center;
                        font-weight: bold;
                        padding: 12px;
                        border-bottom: 1px solid black;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    th, td {
                        padding: 5px;
                        text-align: right;
                        border-bottom: 1px solid black;
                        border-left: 1px solid black;
                    }
                    th:last-child, td:last-child {
                        border-left: none;
                    }
                    th {
                        background-color: red;
                    }
                    .total-row {
                        font-weight: bold;
                    }
                    .footer {
                        padding: 5px;
                        text-align: center;
                        font-size: 0.8em;
                        color: red;
                        border-top: 1px solid black;
                    }
                    .contact {
                        text-align: center;
                        font-size: 0.8em;
                    }
                    .credit-amount {
                        color: green;
                        font-weight: bold;
                    }
                    .due-amount {
                        color: red;
                        font-weight: bold;
                    }
                    .pichla-baqaya {
                        color: red;
                        font-weight: bold;
                    }
                    .running-balance {
                        margin-top: 20px;
                        border: 1px solid black;
                        padding: 10px;
                    }
                    .running-balance-title {
                        font-weight: bold;
                        text-align: center;
                        font-size: 1.2em;
                        margin-bottom: 10px;
                        border-bottom: 1px solid black;
                        padding-bottom: 5px;
                    }
                    .balance-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 5px 0;
                        border-bottom: 1px dashed #ccc;
                    }
                    .balance-label {
                        font-weight: bold;
                    }
                    /* New styles for bottom info */
                    .bottom-info {
                        margin-top: 30px;
                        text-align: center;
                        font-size: 1em;
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
                    }
                    .bottom-info .name-row {
                        margin-bottom: 8px;
                        font-weight: bold;
                    }
                    .bottom-info .contact-row {
                        margin-bottom: 8px;
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
                            <td>حساب نمبر</td>
                            <td>${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}</td>
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
                            <span>${previousBalance}</span>
                        </div>
                        
                        <div class="balance-row">
                            <span class="balance-label">اس ماہ کل فروخت:</span>
                            <span>${thisMonthTotal}</span>
                        </div>
                        
                        <div class="balance-row">
                            <span class="balance-label">کل بقایا:</span>
                            <span>${grandTotal}</span>
                        </div>
                        
                        <div class="balance-row">
                            <span class="balance-label">کل ادائیگی:</span>
                            <span>${totalAdvancePayments}</span>
                        </div>
                        
                        <div class="balance-row" style="border-bottom: none; font-weight: bold; margin-top: 5px;">
                            <span class="balance-label">باقی رقم:</span>
                            <span class="${isCredit ? 'credit-amount' : 'due-amount'}">${Math.abs(remainingBalance)}</span>
                        </div>
                    </div>
                                        <!-- Payment Methods Section -->
                    <div style="margin-top: 5px; text-align: center; border-top: 1px dashed #000; padding-top: 10px;">
                       
                        <span style="font-size: 14px; font-weight: bold;"> Account No: PK84ABPA0010007723910022 &nbsp; | &nbsp; Tahir Ghulam &nbsp; | &nbsp; Contact No: 03457411666</span>
                         <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px;">
                            <div style="font-weight: bold; font-size: 14px;">پیمنٹ کے طریقے</div>
                            <img src="${allied}" alt="Allied Bank" style="width: 120px; height:30px; object-fit: contain;" />
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

    // Function for printing a multi-month running balance statement
    const printMonthlyRunningBalance = () => {
        // Get selected customer info
        const customer = selectedCustomerInfo;
        if (!customer) return;

        // Ask user which year to print balances for
        let selectedYearStr = prompt("Enter year for running balance statement:", new Date().getFullYear());

        // Validate input
        if (selectedYearStr === null) {
            return; // User cancelled
        }

        const selectedYear = parseInt(selectedYearStr);
        if (isNaN(selectedYear)) {
            alert("Invalid year entered.");
            return;
        }

        // Create a new window for the print
        const printWindow = window.open('', '', 'height=600,width=800');

        // Calculate data for all months
        const monthsData = [];
        let runningBalance = 0;
        let runningAdvanceTotal = 0;


        // Process each month
        for (let month = 0; month < 12; month++) {
            // Get monthly purchases for this month
            const monthlyPurchases = filterPurchasesByMonth(customer.id, month, selectedYear);
            const monthlyRates = getMonthlyRates(customer.id, month, selectedYear);
            const milkRate = monthlyRates ? monthlyRates.milkRate : (customer.customMilkRate || rates.milk);
            const yogurtRate = monthlyRates ? monthlyRates.yogurtRate : (customer.customYogurtRate || rates.yogurt);


            // Skip months with no activity unless there's a previous balance
            if (monthlyPurchases.length === 0 && runningBalance === 0) continue;

            // Calculate this month's totals
            const monthlyTotals = calculateTotals(monthlyPurchases);
            const milkTotal = Math.round(monthlyTotals.milk * milkRate);
            const yogurtTotal = Math.round(monthlyTotals.yogurt * yogurtRate);
            const thisMonthTotal = milkTotal + yogurtTotal;

            // Get payments made during this month
            const startOfMonth = new Date(selectedYear, month, 1);
            const endOfMonth = new Date(selectedYear, month + 1, 0, 23, 59, 59, 999);

            const monthPayments = advancePayments.filter(payment => {
                if (payment.customerId !== customer.id) return false;
                const paymentDate = payment.date instanceof Date ? payment.date : new Date(payment.date);
                return paymentDate >= startOfMonth && paymentDate <= endOfMonth;
            });

            const monthPaymentTotal = monthPayments.reduce((sum, payment) => sum + payment.amount, 0);
            runningAdvanceTotal += monthPaymentTotal;

            // Calculate totals
            const previousBalance = runningBalance;
            const totalWithPrevious = thisMonthTotal + previousBalance;
            runningBalance = totalWithPrevious - monthPaymentTotal;

            // Store month data
            monthsData.push({
                month,
                thisMonthTotal,
                previousBalance,
                totalWithPrevious,
                paid: monthPaymentTotal,
                remainingBalance: runningBalance
            });
        }

        // Generate the print content for running balance statement
        const printContent = `
            <html>
            <head>
                <title>Monthly Running Balance - ${customer.name}</title>
                <style>
                    @media print {
                        @page {
                            size: A4;
                            margin: 0.5cm;
                        }
                        body { 
                            margin: 0; 
                            padding: 0;
                        }
                    }
                    body { 
                        font-family: Arial, sans-serif;
                        padding: 10px;
                        margin: 0;
                        direction: rtl;
                    }
                    .statement-container {
                        width: 100%;
                        max-width: 21cm;
                        margin: 0 auto;
                        border: 1px solid black;
                    }
                    .header {
                        background-color: rgb(243, 0, 0);
                        text-align: center;
                        font-weight: bold;
                        padding: 12px;
                        border-bottom: 1px solid black;
                    }
                    .customer-info {
                        padding: 10px;
                        border-bottom: 1px solid black;
                    }
                    .month-section {
                        border: 1px solid #ccc;
                        margin: 10px;
                        padding: 10px;
                    }
                    .month-title {
                        font-weight: bold;
                        text-align: center;
                        font-size: 1.2em;
                        margin-bottom: 10px;
                        background-color: #f0f0f0;
                        padding: 5px;
                    }
                    .balance-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 5px 0;
                        border-bottom: 1px dashed #ccc;
                    }
                    .balance-label {
                        font-weight: bold;
                        min-width: 150px;
                    }
                    .balance-value {
                        text-align: left;
                    }
                    .footer {
                        padding: 5px;
                        text-align: center;
                        font-size: 0.8em;
                        border-top: 1px solid black;
                    }
                    .negative-balance {
                        color: green;
                        font-weight: bold;
                    }
                    .positive-balance {
                        color: red;
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <div class="statement-container">
                    <div class="header">
                        ورک گرین فوڈ پوائنٹ - سالانہ کھاتہ ${selectedYear}
                    </div>
                    
                    <div class="customer-info">
                        <div style="display: flex; justify-content: space-between;">
                            <div>
                                <strong>گاہک کا نام:</strong> ${customer.name}
                            </div>
                            <div>
                                <strong>فون:</strong> ${customer.phone || 'N/A'}
                            </div>
                            <div>
                                <strong>تاریخ:</strong> ${new Date().toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                    
                    ${monthsData.map(data => {
            const monthNames = [
                "جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون",
                "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"
            ];
            return `
                            <div class="month-section">
                                <div class="month-title">${monthNames[data.month]}</div>
                                
                                ${data.previousBalance > 0 ? `
                                <div class="balance-row">
                                    <span class="balance-label">پچھلا بقایا:</span>
                                    <span class="balance-value">${data.previousBalance}</span>
                                </div>` : ''}
                                
                                <div class="balance-row">
                                    <span class="balance-label">اس ماہ کل فروخت:</span>
                                    <span class="balance-value">${data.thisMonthTotal}</span>
                                </div>
                                
                                <div class="balance-row">
                                    <span class="balance-label">کل بقایا:</span>
                                    <span class="balance-value">${data.totalWithPrevious}</span>
                                </div>
                                
                                <div class="balance-row">
                                    <span class="balance-label">ادا شدہ رقم:</span>
                                    <span class="balance-value">${data.paid}</span>
                                </div>
                                
                                <div class="balance-row" style="border-bottom: none; font-weight: bold;">
                                    <span class="balance-label">باقی رقم:</span>
                                    <span class="balance-value ${data.remainingBalance <= 0 ? 'negative-balance' : 'positive-balance'}">${Math.abs(data.remainingBalance)}</span>
                                </div>
                            </div>
                        `;
        }).join('')}
                    
                  
                </div>
            </body>
            </html>
        `;

        // Write content to the print window
        printWindow.document.write(printContent);
        printWindow.document.close();

        // // Initiate printing
        // setTimeout(() => {
        //     printWindow.print();
        //     printWindow.close();
        // }, 500);
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
        // Check if password matches login password
        if (passwordInput === 'virk0912') {
            // Password is correct, proceed with deletion
            setShowPasswordVerification(false);
            setPasswordInput('');

            // Execute the requested delete action with params
            if (deleteAction) {
                if (deleteParams) {
                    deleteAction(deleteParams);
                } else {
                    deleteAction();
                }
            }
        } else {
            // Password is incorrect
            setPasswordError('پاس ورڈ غلط ہے');
        }
    };

    const closePasswordModal = () => {
        setShowPasswordVerification(false);
        setPasswordInput('');
        setPasswordError('');
    };

    // Wrapper functions for delete operations that use password verification
    const handleDeleteSupplier = (supplierId) => {
        requestPasswordForDelete(deleteSupplier, supplierId);
    };

    const handleDeleteCustomer = (customerId) => {
        requestPasswordForDelete(deleteCustomer, customerId);
    };

    const handleDeleteAdvancePayment = (paymentId) => {
        requestPasswordForDelete(deleteAdvancePayment, paymentId);
    };

    const handleClearBills = () => {
        requestPasswordForDelete(clearBills);
    };

    const handleClearMonthlyPurchases = () => {
        requestPasswordForDelete(clearMonthlyPurchases);
    };

    // Function to manually clear daily revenue
    const clearDailyRevenue = async () => {
        // Request password verification before proceeding
        requestPasswordForDelete(async () => {
            setLoading(true);
            try {
                // Reset the daily sales to 0
                setTodaySales(0);
                setSalesGrowth(0);

                // Reset token number to 0
                const tokenDoc = doc(firestore, 'settings', 'tokenNumber');
                await setDoc(tokenDoc, { current: 0 });

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

    // Function to handle clear daily revenue button click
    const handleClearDailyRevenue = () => {
        clearDailyRevenue();
    };

    // Helper function to convert an image to a Data URL
    const convertImgToBase64 = (imgSrc) => {
        // For imported images, we can use the src directly
        return imgSrc;
    };

    // Function to recalculate purchase amounts based on current rates
    const recalculatePurchaseAmount = (purchase) => {
        const purchaseDate = new Date(purchase.date);
        const month = purchaseDate.getMonth();
        const year = purchaseDate.getFullYear();

        // Try to get monthly rates first
        const monthlyRates = getMonthlyRates(purchase.customerId, month, year);

        // Use monthly rates if available, otherwise fall back to customer's custom rates or global rates
        const milkRate = monthlyRates ? monthlyRates.milkRate :
            (purchase.customMilkRate || rates.milk);
        const yogurtRate = monthlyRates ? monthlyRates.yogurtRate :
            (purchase.customYogurtRate || rates.yogurt);

        return (parseFloat(purchase.milk) * milkRate) + (parseFloat(purchase.yogurt) * yogurtRate);
    };



    // Add this function to show the monthly rates modal
    const showMonthlyRatesModal = (customerId) => {
        const currentDate = new Date();
        setMonthlyRateForm({
            customerId,
            month: currentDate.getMonth(),
            year: currentDate.getFullYear(),
            milkRate: rates.milk,
            yogurtRate: rates.yogurt
        });
        const modal = document.getElementById('monthlyRatesModal');
        if (modal) {
            modal.style.display = 'block';
        }
    };

    // Add this function to handle monthly rate form submission
    const handleMonthlyRateFormSubmit = (e) => {
        e.preventDefault();
        updateMonthlyRates();
    };

    // Add this function to update monthly rates
    const updateMonthlyRates = async () => {
        setLoading(true);
        try {
            const ratesDoc = doc(firestore, 'settings', 'rates');
            const key = `${monthlyRateForm.customerId}_${monthlyRateForm.year}_${monthlyRateForm.month}`;
            const updatedRates = {
                ...rates,
                monthlyRates: {
                    ...rates.monthlyRates,
                    [key]: {
                        milkRate: parseFloat(monthlyRateForm.milkRate),
                        yogurtRate: parseFloat(monthlyRateForm.yogurtRate)
                    }
                }
            };
            await setDoc(ratesDoc, updatedRates);
            setRates(updatedRates);
            closeModal('monthlyRatesModal');
            setSuccessMessage('مہینہ وار ریٹس کامیابی سے اپڈیٹ ہوگئے');
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error updating monthly rates: ", error);
        } finally {
            setLoading(false);
        }
    };

    const deletePurchase = async (purchaseId) => {
        setLoading(true);
        try {
            const purchaseRef = doc(firestore, 'purchases', purchaseId);
            await deleteDoc(purchaseRef);

            // Update local state
            const updatedPurchases = purchases.filter(p => p.id !== purchaseId);
            setPurchases(updatedPurchases);

            // also update daily purchases view
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

    return (
        <div className="app-container">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="sidebar-content">
                    <div className="sidebar-group">
                        <div className="sidebar-group-content">
                            <div className="sidebar-menu">
                                <div className="sidebar-menu-item">
                                    <button
                                        onClick={() => showSection('billing')}
                                        className={activeSection === 'billing' ? 'active' : ''}
                                    >
                                        <span className="icon"><ShoppingCartIcon fontSize="small" /></span>
                                        <span>روزانہ گاہک</span>
                                    </button>
                                </div>
                                <div className="sidebar-menu-item">
                                    <button
                                        onClick={() => showSection('history')}
                                        className={activeSection === 'history' ? 'active' : ''}
                                    >
                                        <span className="icon"><DescriptionIcon fontSize="small" /></span>
                                        <span>روزانہ بل کی فہرست</span>
                                    </button>
                                </div>
                                <div className="sidebar-menu-item">
                                    <button
                                        onClick={() => showSection('customers')}
                                        className={activeSection === 'customers' ? 'active' : ''}
                                    >
                                        <span className="icon"><PeopleIcon fontSize="small" /></span>
                                        <span>ماہانہ گاہک</span>
                                    </button>
                                </div>
                                <div className="sidebar-menu-item">
                                    <button
                                        onClick={() => showSection('paymentSummary')}
                                        className={activeSection === 'paymentSummary' ? 'active' : ''}
                                    >
                                        <span className="icon"><AccountBalanceIcon fontSize="small" /></span>
                                        <span>پیمنٹ کی مکمل رپورٹ</span>
                                    </button>
                                </div>
                                <div className="sidebar-menu-item">
                                    <button
                                        onClick={() => showSection('purchaseList')}
                                        className={activeSection === 'purchaseList' ? 'active' : ''}
                                    >
                                        <span className="icon"><CalendarMonthIcon fontSize="small" /></span>
                                        <span>ماہانہ بل کی فہرست</span>
                                    </button>
                                </div>
                                <div className="sidebar-menu-item">
                                    <button
                                        onClick={() => showSection('settings')}
                                        className={activeSection === 'settings' ? 'active' : ''}
                                    >
                                        <span className="icon"><SettingsIcon fontSize="small" /></span>
                                        <span>ریٹ</span>
                                    </button>
                                </div>
                                <div className="sidebar-menu-item">
                                    <button
                                        onClick={() => showSection('advancePayments')}
                                        className={activeSection === 'advancePayments' ? 'active' : ''}
                                    >
                                        <span className="icon"><CreditCardIcon fontSize="small" /></span>
                                        <span>ایڈوانس پیمنٹس</span>
                                    </button>
                                </div>

                                <div className="sidebar-menu-item">
                                    <button
                                        onClick={() => showSection('suppliers')}
                                        className={activeSection === 'suppliers' ? 'active' : ''}
                                    >
                                        <span className="icon"><LocalDrinkIcon fontSize="small" /></span>
                                        <span>سپلائرز</span>
                                    </button>
                                </div>

                                <div className="sidebar-menu-item">
                                    <button
                                        onClick={() => showSection('quanty')}
                                        className={activeSection === 'quanty' ? 'active' : ''}
                                    >
                                        <span className="icon"><LocalDrinkIcon fontSize="small" /></span>
                                        <span>دودھ اور دہی کی مقدار</span>
                                    </button>
                                </div>
                                <div className="sidebar-menu-item">
                                    <button
                                        onClick={() => showSection('monthlyReport')}
                                        className={activeSection === 'monthlyReport' ? 'active' : ''}
                                    >
                                        <span className="icon"><DescriptionIcon fontSize="small" /></span>
                                        <span>ماہانہ رپورٹ</span>
                                    </button>
                                </div>
                                <div className="sidebar-menu-item">
                                    <button
                                        onClick={() => showSection('dashboard')}
                                        className={activeSection === 'dashboard' ? 'active' : ''}
                                    >
                                        <span className="icon"><HomeIcon fontSize="small" /></span>
                                        <span>ڈیش بورڈ</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <main>
                    {/* Dashboard Section */}
                    <section id="dashboard" className={activeSection === 'dashboard' ? 'active' : ''}>
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
                                        <div className="card-value">Rs.{(todaySales !== undefined ? todaySales.toFixed(2) : '0.00')}</div>
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
                                        <div className="card-value">{bills.length}</div>
                                        <div className="card-subtitle">Total customers today</div>
                                    </div>
                                </div>

                                {/* New inventory cards */}
                                <div className="dashboard-card">
                                    <div className="card-header">
                                        <span className="card-title">دودھ کی باقی مقدار</span>
                                        <span className="card-unit">لیٹر</span>
                                    </div>
                                    <div className="card-body">
                                        <div className="card-value">{(inventory.milk !== undefined ? inventory.milk.toFixed(1) : '0.0')}</div>
                                        <div className="card-subtitle">موجودہ انوینٹری</div>
                                    </div>
                                </div>

                                <div className="dashboard-card">

                                    <div className="card-header">
                                        <span className="card-title">دہی کی باقی مقدار</span>
                                        <span className="card-unit">کلو</span>
                                    </div>
                                    <div className="card-body">
                                        <div className="card-value">{(inventory.yogurt !== undefined ? inventory.yogurt.toFixed(1) : '0.0')}</div>
                                        <div className="card-subtitle">موجودہ انوینٹری</div>
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
                            </div>
                        </div>
                    </section>

                    {/* Customers Section */}
                    <section id="customers" className={activeSection === 'customers' ? 'active' : ''}>
                        <div className="customer-header">
                            <h2>گاہکوں کی فہرست</h2>
                            <button
                                onClick={() => showCustomerModal('add')}
                                className="add-btn"
                                disabled={loading}
                                style={{ width: '20%' }}
                            >
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
                        <div className="customer-list">
                            {filteredCustomers.map(customer => (
                                <div key={customer.id} className="customer-card" onClick={() => !loading && showPurchaseModal(customer.id)}>
                                    <h3>{customer.name}</h3>
                                    <p>Phone: {customer.phone || 'N/A'}</p>
                                    <p>Address: {customer.address || 'N/A'}</p>
                                    <div className="customer-actions" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => showCustomerModal('edit', customer.id)}
                                            className="edit-btn"
                                            disabled={loading}
                                        >
                                            <EditIcon fontSize="small" />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            onClick={() => deleteCustomer(customer.id)}
                                            className="delete-btn"
                                            disabled={loading}
                                        >
                                            <DeleteIcon fontSize="small" />
                                            <span>Delete</span>
                                        </button>
                                        {/* Add this inside the customer list item actions */}
                                        <button
                                            className="action-btn"
                                            onClick={() => showMonthlyRatesModal(customer.id)}
                                            title="مہینہ وار ریٹس"
                                        >
                                            <CalendarMonthIcon />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Billing Section */}
                    <section id="billing" className={activeSection === 'billing' ? 'active' : ''}>
                        <h2>نیا بل</h2>
                        <form onSubmit={handleBillFormSubmit}>
                            {/* Current entry form */}
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
                                            // Handle normal input change
                                            handleInputChange(e, setBillFormData, billFormData);

                                            // Calculate and update the amount field
                                            const qty = parseFloat(e.target.value) || 0;
                                            const amount = qty * rates.milk;

                                            // Update corresponding amount field
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
                                            // Handle normal input change
                                            handleInputChange(e, setBillFormData, billFormData);

                                            // Calculate and update the amount field
                                            const qty = parseFloat(e.target.value) || 0;
                                            const amount = qty * rates.yogurt;

                                            // Update corresponding amount field
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
                                            // Only add if there's milk or yogurt quantity
                                            if (parseFloat(billFormData.milkQty) > 0 || parseFloat(billFormData.yogurtQty) > 0) {
                                                const newEntry = {
                                                    id: Date.now(), // Unique ID for the entry
                                                    milkQty: parseFloat(billFormData.milkQty) || 0,
                                                    yogurtQty: parseFloat(billFormData.yogurtQty) || 0,
                                                    milkTotal: (parseFloat(billFormData.milkQty) || 0) * rates.milk,
                                                    yogurtTotal: (parseFloat(billFormData.yogurtQty) || 0) * rates.yogurt
                                                };

                                                // Add the new entry to the entries array
                                                setBillFormData({
                                                    ...billFormData,
                                                    entries: [...billFormData.entries, newEntry],
                                                    milkQty: 0,
                                                    yogurtQty: 0
                                                });

                                                // Clear the amount input fields
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

                            {/* Entries list */}
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
                                            {billFormData.entries.map((entry, index) => (
                                                <tr key={entry.id}>
                                                    <td>
                                                        {entry.milkQty > 0 ? 'دودھ' : ''}
                                                        {entry.milkQty > 0 && entry.yogurtQty > 0 ? ' + ' : ''}
                                                        {entry.yogurtQty > 0 ? 'دہی' : ''}
                                                    </td>
                                                    <td>
                                                        {entry.milkQty > 0 ? `${entry.milkQty} لیٹر` : ''}
                                                        {entry.milkQty > 0 && entry.yogurtQty > 0 ? ' + ' : ''}
                                                        {entry.yogurtQty > 0 ? `${entry.yogurtQty} کلو` : ''}
                                                    </td>
                                                    <td>
                                                        {(entry.milkTotal + entry.yogurtTotal).toFixed(2)} روپے
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="delete-entry-btn"
                                                            onClick={() => {
                                                                // Remove the entry from the array
                                                                const updatedEntries = billFormData.entries.filter((_, i) => i !== index);
                                                                setBillFormData({
                                                                    ...billFormData,
                                                                    entries: updatedEntries
                                                                });
                                                            }}
                                                            disabled={loading}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan="2"><strong>کل رقم:</strong></td>
                                                <td colSpan="2">
                                                    <strong>
                                                        {billFormData.entries.reduce((total, entry) =>
                                                            total + entry.milkTotal + entry.yogurtTotal, 0).toFixed(2)} روپے
                                                    </strong>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </form>
                    </section>

                    {/* History Section */}
                    <section id="history" className={activeSection === 'history' ? 'active' : ''}>
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
                                            <td className="bill-amount">{bill.grandTotal} روپے</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Settings Section */}
                    <section id="settings" className={activeSection === 'settings' ? 'active' : ''}>
                        <h2>ریٹ اور انوینٹری کی ترتیبات</h2>

                        {/* Rates Form */}
                        <h3>ریٹ کی ترتیبات</h3>
                        <form onSubmit={handleRatesFormSubmit}>
                            <div className="form-group">
                                <label htmlFor="milkRate">دودھ کی قیمت (فی لیٹر):</label>
                                <input
                                    type="number"
                                    id="milkRate"
                                    min="0"
                                    value={rates.milk}
                                    onChange={(e) => setRates({ ...rates, milk: parseFloat(e.target.value) })}
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="yogurtRate">دہی کی قیمت (فی کلو):</label>
                                <input
                                    type="number"
                                    id="yogurtRate"
                                    min="0"
                                    value={rates.yogurt}
                                    onChange={(e) => setRates({ ...rates, yogurt: parseFloat(e.target.value) })}
                                    disabled={loading}
                                />
                            </div>
                            <button type="submit" disabled={loading} className="button-with-spinner">
                                ریٹ محفوظ کریں
                                {loading && <LoadingSpinner />}
                            </button>
                        </form>

                    </section>
                    {/* Settings Section */}
                    <section id="quanty" className={activeSection === 'quanty' ? 'active' : ''}>
                        <h2> انوینٹری کی ترتیبات</h2>



                        {/* Inventory Form */}
                        <h3 style={{ marginTop: '30px' }}>انوینٹری کی ترتیبات</h3>
                        <form onSubmit={handleInventoryUpdate}>
                            <div className="form-group">
                                <label htmlFor="milkInventory">دودھ کی کل مقدار (لیٹر):</label>
                                <input
                                    type="number"
                                    id="milkInventory"
                                    min="0"
                                    value={inventory.milk}
                                    onChange={(e) => setInventory({ ...inventory, milk: parseFloat(e.target.value) || 0 })}
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="yogurtInventory">دہی کی کل مقدار (کلو):</label>
                                <input
                                    type="number"
                                    id="yogurtInventory"
                                    min="0"
                                    value={inventory.yogurt}
                                    onChange={(e) => setInventory({ ...inventory, yogurt: parseFloat(e.target.value) || 0 })}
                                    disabled={loading}
                                />
                            </div>
                            <button type="submit" disabled={loading} className="button-with-spinner">
                                انوینٹری اپڈیٹ کریں
                                {loading && <LoadingSpinner />}
                            </button>
                        </form>
                    </section>

                    {/* Suppliers Section */}
                    <section id="suppliers" className={activeSection === 'suppliers' ? 'active' : ''}>
                        <div className="supplier-header">
                            <h2>سپلائرز کی فہرست</h2>
                            <button
                                onClick={() => showSupplierModal('add')}
                                className="add-btn"
                                disabled={loading}
                                style={{ width: '20%' }}
                            >
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
                                                        <button
                                                            onClick={() => showSupplierModal('edit', supplier.id)}
                                                            className="edit-btn"
                                                            disabled={loading}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSupplier(supplier.id)}
                                                            className="delete-btn"
                                                            disabled={loading}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
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

                    {/* Monthly Report Section */}
                    <section id="monthlyReport" className={activeSection === 'monthlyReport' ? 'active' : ''}>
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
                                        {[2023, 2024, 2025, 2026].map(year => (
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
                                        <h3>رقم موصولہ</h3>
                                        <div className="card-icon">💳</div>
                                    </div>
                                    <div className="card-content">
                                        <div className="main-value">Rs. {monthlyReport.reportData.totalAdvanceReceived.toFixed(0)}</div>
                                        <div className="unit">ایڈوانس پیمنٹ</div>
                                    </div>
                                </div>

                                <div className="summary-card milk-sold">
                                    <div className="card-header">
                                        <h3>دودھ فروخت</h3>
                                        <div className="card-icon">📦</div>
                                    </div>
                                    <div className="card-content">
                                        <div className="main-value">{monthlyReport.reportData.totalMilkSold.toFixed(1)}</div>
                                        <div className="unit">لیٹر</div>
                                    </div>
                                </div>

                                <div className="summary-card yogurt-sold">
                                    <div className="card-header">
                                        <h3>دہی فروخت</h3>
                                        <div className="card-icon">📦</div>
                                    </div>
                                    <div className="card-content">
                                        <div className="main-value">{monthlyReport.reportData.totalYogurtSold.toFixed(1)}</div>
                                        <div className="unit">کلو</div>
                                    </div>
                                </div>

                                <div className="summary-card total-revenue">
                                    <div className="card-header">
                                        <h3>کل آمدنی</h3>
                                        <div className="card-icon">💰</div>
                                    </div>
                                    <div className="card-content">
                                        <div className="main-value">Rs. {monthlyReport.reportData.totalRevenue.toFixed(0)}</div>
                                        <div className="unit">روپے</div>
                                    </div>
                                </div>

                                <div className={`summary-card outstanding-amount ${monthlyReport.reportData.outstandingAmount < 0 ? 'credit-balance' : 'debt-balance'}`}>
                                    <div className="card-header">
                                        <h3>باقایا رقم</h3>
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

                    {/* Purchase List Section */}
                    <section id="purchaseList" className={activeSection === 'purchaseList' ? 'active' : ''}>
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
                                        const customerPurchases = purchases.filter(p => p.customerId === customer.id);
                                        const totalAmount = customerPurchases.reduce((sum, p) => sum + p.total, 0);

                                        return (
                                            <div
                                                key={customer.id}
                                                className={`customer-list-item ${selectedCustomer === customer.id ? 'active' : ''}`}
                                                onClick={() => !loading && showCustomerPurchases(customer.id)}
                                            >
                                                <h3>{customer.name}</h3>
                                                <p>Phone: {customer.phone || 'N/A'}</p>
                                                <p>Total Purchases: Rs.{(totalAmount !== undefined ? totalAmount.toFixed(2) : '0.00')}</p>
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
                                                    <span className="total-value">Rs. {(customSelectedCustomerTotals.amount !== undefined ? customSelectedCustomerTotals.amount.toFixed(2) : '0.00')}</span>
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

                                                        {/* <button 
                                                            onClick={printExactMonthlyBill}
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
                                                            Print Exact Bill
                                                        </button> */}

                                                        <button
                                                            onClick={printA4MonthlyBill}
                                                            className="print-btn"
                                                            disabled={loading}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                padding: '8px 15px',
                                                                backgroundColor: '#e74c3c',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '5px',
                                                                cursor: 'pointer',
                                                                fontSize: '14px',
                                                                flex: 1,
                                                                marginLeft: '10px'
                                                            }}
                                                        >
                                                            <PrintIcon fontSize="small" style={{ marginRight: '5px' }} />
                                                            Print A4 Bill
                                                        </button>

                                                        <button
                                                            onClick={printMonthlyRunningBalance}
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
                                                                flex: 1,
                                                                marginLeft: '10px'
                                                            }}
                                                        >
                                                            <PrintIcon fontSize="small" style={{ marginRight: '5px' }} />
                                                            Running Balance
                                                        </button>
                                                    </div>
                                                </div>

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
                                                                            <button className="action-btn" onClick={() => handleDeletePurchase(purchase.id)}><DeleteIcon /></button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                            <tfoot>
                                                                <tr>
                                                                    <td><strong>کل</strong></td>
                                                                    <td><strong>{dailyPurchases.reduce((sum, p) => sum + (p.milk || 0), 0)} لیٹر</strong></td>
                                                                    <td><strong>{dailyPurchases.reduce((sum, p) => sum + (p.yogurt || 0), 0)} کلو</strong></td>
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
                                                            padding: '10px 20px',
                                                            border: 'none',
                                                            borderRadius: '5px',
                                                            cursor: 'pointer',
                                                            marginTop: '15px',
                                                            fontSize: '16px'
                                                        }}
                                                    >
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


                    {/* Advance Payments Section */}
                    <section id="advancePayments" className={activeSection === 'advancePayments' ? 'active' : ''}>
                        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2>ایڈوانس پیمنٹس</h2>
                            <button
                                onClick={() => showAdvanceModal()}
                                className="add-btn"
                                disabled={loading}
                                style={{ width: '20%' }}
                            >
                                نئی ایڈوانس پیمنٹ
                            </button>
                        </div>
                        <div className="advance-payments-list">
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
                                                <td>{new Date(payment.date).toLocaleString()}</td>
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
                        </div>
                    </section>

                    {/* Payment Summary Section */}
                    <section id="paymentSummary" className={activeSection === 'paymentSummary' ? 'active' : ''}>
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

                                <div className="summary-card total-revenue-card">
                                    <div className="card-icon">
                                        <PaymentIcon fontSize="large" />
                                    </div>
                                    <div className="card-content">
                                        <h3>کل رقم</h3>
                                        <div className="main-value">Rs. {paymentSummary.totalRevenue.toFixed(0)}</div>
                                        <div className="sub-value">تمام بلز کی رقم</div>
                                    </div>
                                </div>

                                <div className="summary-card payments-received-card">
                                    <div className="card-icon">
                                        <AccountBalanceIcon fontSize="large" />
                                    </div>
                                    <div className="card-content">
                                        <h3>پیمنٹ موصولہ</h3>
                                        <div className="main-value">Rs. {paymentSummary.totalPaymentsReceived.toFixed(0)}</div>
                                        <div className="sub-value">جمع شدہ رقم</div>
                                    </div>
                                </div>

                                <div className="summary-card outstanding-card">
                                    <div className="card-icon">
                                        <CreditCardIcon fontSize="large" />
                                    </div>
                                    <div className="card-content">
                                        <h3>باقی رقم</h3>
                                        <div className="main-value" style={{color: paymentSummary.outstandingAmount > 0 ? '#dc3545' : '#28a745'}}>
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
                                                <tr className="total-row">
                                                    <td><strong>کل آمدن</strong></td>
                                                    <td>-</td>
                                                    <td><strong>Rs. {paymentSummary.totalRevenue.toFixed(0)}</strong></td>
                                                </tr>
                                                <tr className="received-row">
                                                    <td><strong>پیمنٹ موصولہ</strong></td>
                                                    <td>-</td>
                                                    <td style={{color: '#28a745'}}><strong>Rs. {paymentSummary.totalPaymentsReceived.toFixed(0)}</strong></td>
                                                </tr>
                                                <tr className="outstanding-row">
                                                    <td><strong>باقی رقم</strong></td>
                                                    <td>-</td>
                                                    <td style={{color: paymentSummary.outstandingAmount > 0 ? '#dc3545' : '#28a745'}}>
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
                </main>

                {/* Customer Modal */}
                <div id="customerModal" className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => !loading && closeModal('customerModal')}>&times;</span>
                        <h3>{modalMode === 'edit' ? 'گاہک میں ترمیم کریں' : 'نیا گاہک شامل کریں'}</h3>
                        <form id="customerForm" onSubmit={handleCustomerFormSubmit}>
                            <div className="form-group">
                                <label htmlFor="customerNameInput">گاہک کا نام:</label>
                                <input
                                    type="text"
                                    id="customerNameInput"
                                    name="name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange(e, setFormData, formData)}
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
                                    onChange={(e) => handleInputChange(e, setFormData, formData)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="customerAddress">پتہ:</label>
                                <textarea
                                    id="customerAddress"
                                    name="address"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange(e, setFormData, formData)}
                                    disabled={loading}
                                ></textarea>
                            </div>

                            <div style={{
                                padding: '15px',
                                marginTop: '15px',
                                backgroundColor: '#f0f8ff',
                                borderRadius: '5px',
                                marginBottom: '15px'
                            }}>
                                <h4 style={{ marginBottom: '10px' }}>کسٹم ریٹس</h4>
                                <div className="form-group">
                                    <label htmlFor="customMilkRate">دودھ کا ریٹ (روپے/لیٹر):</label>
                                    <input
                                        type="number"
                                        id="customMilkRate"
                                        name="customMilkRate"
                                        min="0"
                                        step="any"
                                        value={formData.customMilkRate}
                                        onChange={(e) => handleInputChange(e, setFormData, formData)}
                                        disabled={loading}
                                    />

                                </div>
                                <div className="form-group">
                                    <label htmlFor="customYogurtRate">دہی کا ریٹ (روپے/کلو):</label>
                                    <input
                                        type="number"
                                        id="customYogurtRate"
                                        name="customYogurtRate"
                                        min="0"
                                        step="any"
                                        value={formData.customYogurtRate}
                                        onChange={(e) => handleInputChange(e, setFormData, formData)}
                                        disabled={loading}
                                    />

                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="button-with-spinner">
                                {modalMode === 'edit' ? 'گاہک کو اپڈیٹ کریں' : 'گاہک محفوظ کریں'}
                                {loading && <LoadingSpinner />}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Purchase Modal */}
                <div id="purchaseModal" className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => !loading && closeModal('purchaseModal')}>&times;</span>
                        <h3>نئی خریداری</h3>


                        <form id="purchaseForm" onSubmit={handlePurchaseFormSubmit}>
                            {/* New fields for amount-based calculation */}
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
                                        setPurchaseFormData({ ...purchaseFormData, milk: qty.toFixed(2) });
                                    }}
                                    disabled={loading}
                                />
                                {/* <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                                    Rate: Rs. {rates.milk} exactly
                                </small> */}
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
                                        setPurchaseFormData({ ...purchaseFormData, yogurt: qty.toFixed(2) });
                                    }}
                                    disabled={loading}
                                />
                                {/* <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                                    Rate: Rs. {rates.yogurt} exactly
                                </small> */}
                            </div>

                            {/* Original quantity fields with automatic price calculation */}
                            <div className="form-group">
                                <label htmlFor="purchaseMilk">دودھ کی مقدار (لیٹر):</label>
                                <input
                                    type="number"
                                    id="purchaseMilk"
                                    name="milk"
                                    min="0"
                                    step="any"
                                    value={purchaseFormData.milk}
                                    onChange={(e) => {
                                        const qty = parseFloat(e.target.value) || 0;
                                        // Handle normal input change
                                        handleInputChange(e, setPurchaseFormData, purchaseFormData);

                                        // Calculate milk amount based on quantity
                                        const milkRate = selectedCustomerInfo && selectedCustomerInfo.customMilkRate
                                            ? parseFloat(selectedCustomerInfo.customMilkRate)
                                            : rates.milk;

                                        // Update corresponding amount field
                                        document.getElementById('milkAmount').value = (qty * milkRate).toFixed(2);
                                    }}
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="purchaseYogurt">دہی کی مقدار (کلو):</label>
                                <input
                                    type="number"
                                    id="purchaseYogurt"
                                    name="yogurt"
                                    min="0"
                                    step="any"
                                    value={purchaseFormData.yogurt}
                                    onChange={(e) => {
                                        const qty = parseFloat(e.target.value) || 0;
                                        // Handle normal input change
                                        handleInputChange(e, setPurchaseFormData, purchaseFormData);

                                        // Calculate yogurt amount based on quantity
                                        const yogurtRate = selectedCustomerInfo && selectedCustomerInfo.customYogurtRate
                                            ? parseFloat(selectedCustomerInfo.customYogurtRate)
                                            : rates.yogurt;

                                        // Update corresponding amount field
                                        document.getElementById('yogurtAmount').value = (qty * yogurtRate).toFixed(2);
                                    }}
                                    disabled={loading}
                                />
                            </div>
                            <button type="submit" disabled={loading} className="button-with-spinner">
                                خریداری محفوظ کریں
                                {loading && <LoadingSpinner />}
                            </button>
                        </form>
                    </div>
                </div>

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
                            <PrintIcon fontSize="small" style={{ marginRight: '8px' }} />
                            بل پرنٹ کریں
                            {loading && <LoadingSpinner />}
                        </button>
                    </div>
                </div>

                {/* Add Success Popup Modal */}
                {showSuccessPopup && (
                    <div className="modal" style={{ display: 'block' }}>
                        <div className="modal-content w-1/2">
                            <span className="close" onClick={closeSuccessPopup}><CloseIcon /></span>
                            <div className="success-message">
                                <CheckCircleIcon style={{ color: '#2d6a4f', fontSize: '48px', marginBottom: '16px' }} />
                                <h3>کامیابی</h3>
                                <p>{successMessage}</p>
                            </div>
                            <div className="button-container">
                                <button type="submit" onClick={closeSuccessPopup}>ٹھیک ہے</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Message Popup Modal */}
                {showSuccessPopup && (
                    <div className="modal" style={{ display: 'block' }}>
                        <div className="modal-content w-1/2">
                            <span className="close" onClick={closeSuccessPopup}><CloseIcon /></span>
                            <div className="popup-message" style={{ textAlign: 'center', padding: '20px' }}>
                                {successMessage.includes("کافی مقدار") ||
                                    successMessage.includes("خرابی") ||
                                    successMessage.includes("Failed") ||
                                    successMessage.includes("Please enter") ? (
                                    <>
                                        <CancelIcon style={{ color: '#e63946', fontSize: '48px', marginBottom: '16px' }} />
                                        <h3 style={{ color: '#e63946', marginBottom: '10px' }}>تنبیہ</h3>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircleIcon style={{ color: '#2d6a4f', fontSize: '48px', marginBottom: '16px' }} />
                                        <h3 style={{ color: '#2d6a4f', marginBottom: '10px' }}>کامیابی</h3>
                                    </>
                                )}
                                <p>{successMessage}</p>
                            </div>
                            <div className="button-container" style={{
                                display: 'flex',
                                justifyContent: 'center',
                                marginTop: '20px'
                            }}>
                                <button
                                    type="button"
                                    onClick={closeSuccessPopup}
                                    style={{
                                        padding: '8px 20px',
                                        borderRadius: '5px',
                                        backgroundColor: successMessage.includes("کافی مقدار") ||
                                            successMessage.includes("خرابی") ||
                                            successMessage.includes("Failed") ||
                                            successMessage.includes("Please enter") ? '#e63946' : '#2d6a4f',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ٹھیک ہے
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Password Verification Modal */}
                {showPasswordVerification && (
                    <div className="modal" style={{ display: 'block' }}>
                        <div className="modal-content" style={{ maxWidth: '400px' }}>
                            <span className="close" onClick={closePasswordModal}><CloseIcon /></span>
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <LockIcon style={{ color: '#e63946', fontSize: '48px', marginBottom: '16px' }} />
                                <h3 style={{ marginBottom: '15px' }}>پاس ورڈ کی تصدیق</h3>
                                <p style={{ marginBottom: '20px' }}>براہ کرم، حذف کرنے کے لیے اپنا پاس ورڈ درج کریں۔</p>

                                {passwordError && (
                                    <div style={{
                                        color: '#e63946',
                                        backgroundColor: '#ffe3e5',
                                        padding: '10px',
                                        borderRadius: '5px',
                                        marginBottom: '15px'
                                    }}>
                                        {passwordError}
                                    </div>
                                )}

                                <div style={{ marginBottom: '20px' }}>
                                    <input
                                        type="password"
                                        value={passwordInput}
                                        onChange={(e) => setPasswordInput(e.target.value)}
                                        placeholder="پاس ورڈ"
                                        autoComplete="new-password"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ccc',
                                            borderRadius: '5px',
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <button
                                        onClick={closePasswordModal}
                                        style={{
                                            padding: '8px 20px',
                                            borderRadius: '5px',
                                            backgroundColor: '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        منسوخ کریں
                                    </button>
                                    <button
                                        onClick={handlePasswordVerification}
                                        style={{
                                            padding: '8px 20px',
                                            borderRadius: '5px',
                                            backgroundColor: '#e63946',
                                            color: 'white',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        تصدیق کریں
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                                                // Clear selected customer if search field is cleared
                                                if (!e.target.value) {
                                                    setAdvanceFormData({ ...advanceFormData, customerId: '' });
                                                }
                                            }}
                                            value={customerSearchForAdvance}
                                            disabled={loading}
                                        />

                                        {/* Filtered customers search results */}
                                        {customerSearchForAdvance && (
                                            <div className="search-results">
                                                {customers
                                                    .filter(c => c.name.toLowerCase().includes(customerSearchForAdvance.toLowerCase()))
                                                    .map(customer => (
                                                        <div
                                                            key={customer.id}
                                                            className={`customer-search-result ${advanceFormData.customerId === customer.id ? 'selected' : ''}`}
                                                            onClick={() => {
                                                                setAdvanceFormData({ ...advanceFormData, customerId: customer.id });
                                                                setCustomerSearchForAdvance(customer.name);
                                                            }}
                                                        >
                                                            {customer.name}
                                                        </div>
                                                    ))
                                                }
                                                {customers.filter(c => c.name.toLowerCase().includes(customerSearchForAdvance.toLowerCase())).length === 0 && (
                                                    <div className="no-results">کوئی گاہک نہیں ملا</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {/* Hidden input to store the selected customer ID for form submission */}
                                    <input
                                        type="hidden"
                                        name="customerId"
                                        value={advanceFormData.customerId}
                                        required
                                    />
                                    {!advanceFormData.customerId && (
                                        <div className="validation-message">گاہک منتخب کریں</div>
                                    )}
                                </div>
                            )}
                            {editingAdvancePayment && (
                                <div className="form-group">
                                    <label>گاہک:</label>
                                    <div className="selected-customer">
                                        {customers.find(c => c.id === advanceFormData.customerId)?.name || 'نامعلوم گاہک'}
                                    </div>
                                </div>
                            )}
                            <div className="form-group">
                                <label htmlFor="advanceAmount">رقم:</label>
                                <input
                                    type="number"
                                    id="advanceAmount"
                                    name="amount"
                                    min="1"
                                    step="1"
                                    value={advanceFormData.amount}
                                    onChange={(e) => handleInputChange(e, setAdvanceFormData, advanceFormData)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="advanceDescription">تفصیل (اختیاری):</label>
                                <textarea
                                    id="advanceDescription"
                                    name="description"
                                    value={advanceFormData.description}
                                    onChange={(e) => handleInputChange(e, setAdvanceFormData, advanceFormData)}
                                    disabled={loading}
                                ></textarea>
                            </div>
                            <button
                                type="submit"
                                disabled={loading || (!editingAdvancePayment && !advanceFormData.customerId)}
                                className="button-with-spinner"
                            >
                                {editingAdvancePayment ? 'اپڈیٹ کریں' : 'ایڈوانس محفوظ کریں'}
                                {loading && <LoadingSpinner />}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Add styles for the dashboard */}
                <style jsx>{`
                    .dashboard-container {
                        background-color: #fff;
                        border-radius: 15px;
                        padding: 20px;
                        margin-top: 20px;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    }
                    
                    .dashboard-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                        gap: 20px;
                    }
                    
                    .dashboard-card {
                        background-color: #2d6a4f; /* Forest green color */
                        border-radius: 10px;
                        padding: 20px;
                        color: white;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    
                    .card-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 15px;
                    }
                    
                    .card-title {
                        font-size: 18px;
                        font-weight: 600;
                        color: rgba(255, 255, 255, 0.8);
                    }
                    
                    .card-currency, .card-icon {
                        color: rgba(255, 255, 255, 0.8);
                        font-size: 16px;
                    }
                    
                    .card-body {
                        padding-top: 5px;
                    }
                    
                    .card-value {
                        font-size: 36px;
                        font-weight: 700;
                        margin-bottom: 5px;
                        color: #ffffff;
                    }
                    
                    .card-subtitle {
                        font-size: 16px;
                        color: rgba(255, 255, 255, 0.8);
                    }
                    
                    @media screen and (max-width: 768px) {
                        .dashboard-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                `}</style>
            </div>


            {/* Add styles for the sidebar */}
            <style jsx>{`
            .app-container {
                display: flex;
                flex-direction: row-reverse; /* Right-to-left layout for Urdu */
                min-height: 100vh;
            }

            .sidebar {
                width: 260px;
                background-color: #2d6a4f; /* Changed to forest green to match dashboard */
                border-left: 1px solid #1b4332; /* Darker green border */
                height: 100vh;
                position: sticky;
                top: 0;
                overflow-y: auto;
                direction: rtl; /* For Urdu text alignment */
            }

            .sidebar-content {
                padding: 20px 10px;
            }

            .sidebar-group-label {
                font-size: 14px;
                font-weight: 600;
                color: rgba(255, 255, 255, 0.8); /* Lighter text for better visibility */
                padding: 0 12px;
                margin-bottom: 10px;
            }

            .sidebar-menu-item button {
                display: flex;
                align-items: center;
                gap: 12px;
                width: 100%;
                padding: 12px 15px; /* Increased padding */
                border: none;
                background: none;
                border-radius: 6px;
                color: #ffffff;
                font-size: 16px; /* Increased from 14px */
                font-weight: 600; /* Increased from 500 */
                text-align: right;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .sidebar-menu-item button:hover {
                background-color: #1b4332; /* Darker green hover color */
            }

            .sidebar-menu-item button.active {
                background-color: #081c15; /* Dark green for active state */
                color: white;
            }

            .icon {
                font-size: 20px; /* Increased from 18px */
                display: inline-block;
                width: 28px; /* Increased from 24px */
                text-align: center;
                color: #ffffff;
            }

            .main-content {
                flex: 1;
                padding: 20px;
                max-width: calc(100% - 260px);
            }
            
            /* Responsive adjustments */
            @media screen and (max-width: 768px) {
                .app-container {
                    flex-direction: column-reverse;
                }
                
                .sidebar {
                    width: 100%;
                    height: auto;
                    border-left: none;
                    border-bottom: 1px solid #1b4332;
                }
                
                .sidebar-menu {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                }
                
                .sidebar-menu-item {
                    flex: 1 0 auto;
                }
                
                .main-content {
                    max-width: 100%;
                }
            }
        `}</style>

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
                                    onChange={(e) => handleInputChange(e, setFormData, formData)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="phone">فون نمبر:</label>
                                <input
                                    type="text"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange(e, setFormData, formData)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="milkQuantity">دودھ کی مقدار (لیٹر):</label>
                                <input
                                    type="number"
                                    id="milkQuantity"
                                    name="milkQuantity"
                                    value={formData.milkQuantity}
                                    onChange={(e) => handleInputChange(e, setFormData, formData)}
                                    min="0"
                                    step="0.1"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="yogurtQuantity">دہی کی مقدار (کلو):</label>
                                <input
                                    type="number"
                                    id="yogurtQuantity"
                                    name="yogurtQuantity"
                                    value={formData.yogurtQuantity}
                                    onChange={(e) => handleInputChange(e, setFormData, formData)}
                                    min="0"
                                    step="0.1"
                                    required
                                    disabled={loading}
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
                                <button
                                    type="button"
                                    onClick={() => closeModal('supplierModal')}
                                    className="cancel-btn"
                                    disabled={loading}
                                >
                                    منسوخ کریں
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

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
                    }}>{modalMode === 'add' ? 'نیا مہینہ وار ریٹس شامل کریں' : 'مہینہ وار ریٹس میں ترمیم کریں'}</h2>
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
                                onChange={(e) => setMonthlyRateForm({ ...monthlyRateForm, customerId: e.target.value })}
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
                                onChange={(e) => setMonthlyRateForm({ ...monthlyRateForm, month: parseInt(e.target.value) })}
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
                                onChange={(e) => setMonthlyRateForm({ ...monthlyRateForm, year: parseInt(e.target.value) })}
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
                                onChange={(e) => setMonthlyRateForm({ ...monthlyRateForm, milkRate: parseFloat(e.target.value) })}
                                disabled={loading}
                                style={{
                                    padding: '0.7rem',
                                    borderRadius: '8px',
                                    border: '1px solid #ced4da',
                                    fontSize: '1rem',
                                    background: '#f8f9fa',
                                }}
                            />
                        </div>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label htmlFor="yogurtRate" style={{ fontWeight: 500, color: '#333' }}>دہی کی ریٹ (روپے/کلو):</label>
                            <input
                                type="number"
                                id="yogurtRate"
                                name="yogurtRate"
                                value={monthlyRateForm.yogurtRate}
                                onChange={(e) => setMonthlyRateForm({ ...monthlyRateForm, yogurtRate: parseFloat(e.target.value) })}
                                disabled={loading}
                                style={{
                                    padding: '0.7rem',
                                    borderRadius: '8px',
                                    border: '1px solid #ced4da',
                                    fontSize: '1rem',
                                    background: '#f8f9fa',
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.7rem', marginTop: '0.5rem' }}>
                            <button
                                type="submit"
                                className="submit-btn button-with-spinner"
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    backgroundColor: '#218838',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '0.9rem 0',
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                }}
                            >
                                {modalMode === 'add' ? 'مہینہ وار ریٹس شامل کریں' : 'مہینہ وار ریٹس اپڈیٹ کریں'}
                                {loading && <LoadingSpinner />}
                            </button>
                            <button
                                type="button"
                                onClick={() => closeModal('monthlyRatesModal')}
                                className="cancel-btn"
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    backgroundColor: '#f8f9fa',
                                    color: '#333',
                                    border: '1px solid #ced4da',
                                    borderRadius: '8px',
                                    padding: '0.9rem 0',
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                }}
                            >
                                منسوخ کریں
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

    );
};

export default Home;
