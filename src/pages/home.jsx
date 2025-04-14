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

const Home = () => {
    // State variables
    const [activeSection, setActiveSection] = useState('billing');
    const [customers, setCustomers] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [rates, setRates] = useState({ milk: 120, yogurt: 140 });
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
                font-size: 1.1rem;
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
                padding: 12px 15px;
                text-align: left;
                border-bottom: 1px solid #e9ecef;
            }

            th {
                background-color: #f8f9fa;
                color: #495057;
                font-weight: 700;
                font-size: 1.1rem;
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
        calculateTodaySales();
    }, [bills]);

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
            const purchasesList = purchasesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date.toDate().toISOString()
            }));
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
                setRates(ratesSnapshot.data());
            } else {
                // Initialize rates if they don't exist
                await setDoc(ratesDoc, { milk: 120, yogurt: 140 });
                setRates({ milk: 120, yogurt: 140 });
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
                date: doc.data().date.toDate().toLocaleDateString()
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
            const inventoryDoc = doc(firestore, 'settings', 'inventory');
            await setDoc(inventoryDoc, newInventory);
            setInventory(newInventory);
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
        } catch (error) {
            console.error("Error updating customer: ", error);
        } finally {
            setLoading(false);
        }
    };

    const deleteCustomer = async (customerId) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            setLoading(true);
            try {
                await deleteDoc(doc(firestore, 'customers', customerId));
                fetchCustomers();
            } catch (error) {
                console.error("Error deleting customer: ", error);
            } finally {
                setLoading(false);
            }
        }
    };

    const clearBills = async () => {
        if (window.confirm('آپ واقعی تمام بلوں کو حذف کرنا چاہتے ہیں؟')) {
            setLoading(true);
            try {
                const billsCollection = collection(firestore, 'bills');
                const billsSnapshot = await getDocs(billsCollection);

                const deletePromises = billsSnapshot.docs.map(doc =>
                    deleteDoc(doc.ref)
                );

                await Promise.all(deletePromises);
                fetchBills();
                setSuccessMessage('تمام بل کامیابی سے حذف کر دیے گئے ہیں');
                setShowSuccessPopup(true);
            } catch (error) {
                console.error("Error clearing bills: ", error);
                setSuccessMessage("بلوں کو حذف کرنے میں خرابی");
                setShowSuccessPopup(true);
            } finally {
                setLoading(false);
            }
        }
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

            const purchasesCollection = collection(firestore, 'purchases');
            const milkTotal = milkQty * milkRate;
            const yogurtTotal = yogurtQty * yogurtRate;
            const total = milkTotal + yogurtTotal;

            await addDoc(purchasesCollection, {
                customerId: selectedCustomer,
                milk: milkQty,
                yogurt: yogurtQty,
                milkRate: milkRate,
                yogurtRate: yogurtRate,
                total: total,
                date: Timestamp.now()
            });

            // Update inventory
            const newInventory = {
                milk: inventory.milk - milkQty,
                yogurt: inventory.yogurt - yogurtQty
            };
            await updateInventory(newInventory);

            setPurchaseFormData({ milk: 0, yogurt: 0 });
            closeModal('purchaseModal');
            fetchPurchases();
            setSuccessMessage('پرچز کامیابی سے شامل کر دیا گیا');
            setShowSuccessPopup(true);
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
            await setDoc(ratesDoc, rates);
            setSuccessMessage('Rates updated successfully!');
            setShowSuccessPopup(true);
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

    const deleteAdvancePayment = async (paymentId) => {
        if (window.confirm('کیا آپ واقعی اس ایڈوانس پیمنٹ کو حذف کرنا چاہتے ہیں؟')) {
            setLoading(true);
            try {
                await deleteDoc(doc(firestore, 'advancePayments', paymentId));
                fetchAdvancePayments();
                setSuccessMessage('ایڈوانس پیمنٹ کامیابی سے حذف کر دی گئی ہے');
                setShowSuccessPopup(true);
            } catch (error) {
                console.error("Error deleting advance payment: ", error);
            } finally {
                setLoading(false);
            }
        }
    };

    // Add a function to close the success popup
    const closeSuccessPopup = () => {
        setShowSuccessPopup(false);
    };

    // UI Helper Functions
    const showSection = (sectionId) => {
        setActiveSection(sectionId);
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
                    customMilkRate: rates.milk, // Default to global rate
                    customYogurtRate: rates.yogurt // Default to global rate
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
        document.getElementById('purchaseModal').style.display = 'block';
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
            </div>
        `;

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
                        body { margin: 0; }
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

        // Initiate printing
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
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
                    .divider {
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
        
        // Initiate printing
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
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
                                <td>${Math.round(selectedCustomerBalance)}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="footer">
                        <p class="red-text">درخواست ہے کہ 10 تاریخ تک ادائیگی کریں۔ اگر ادائیگی نہیں ہوگی تو سپلائی بند کر دی جائے گی۔</p>
                        <p>خدمت انچارج: 03457411666</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        // Write content to the print window
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Initiate printing
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    // New function to print monthly bill
    const printMonthlyBill = () => {
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
        const remainingBalance = (monthlyTotals.amount - selectedCustomerAdvanceTotal).toFixed(2);

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
                        <tfoot>
                            <tr>
                                <td colspan="1"><strong>کل</strong></td>
                                <td><strong>${monthlyTotals.milk.toFixed(1)} لیٹر</strong></td>
                                <td><strong>${monthlyTotals.yogurt.toFixed(1)} کلو</strong></td>
                                <td><strong>${totalPurchases} روپے</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <div class="balance-summary">
                        <div class="balance-row">
                            <span>کل خریداری</span>
                            <span class="total-amount">${totalPurchases} روپے</span>
                        </div>
                        ${pichlaBaqaya !== 0 ? `
                        <div class="balance-row">
                            <span>پچھلا بقایا:</span>
                            <span class="pichla-baqaya">${(pichlaBaqaya !== undefined ? pichlaBaqaya.toFixed(2) : '0.00')} روپے</span>
                        </div>` : ''}
                        <div class="balance-row">
                            <span>کل ایڈوانس:</span>
                            <span>${totalAdvance} روپے</span>
                        </div>
                        <div class="balance-row">
                            <span>باقی رقم:</span>
                            <span class="remaining-balance">${remainingBalance} روپے</span>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Write content to the print window
        printWindow.document.write(printContent);
        printWindow.document.close();

        // Initiate printing
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    // Update the showCustomerPurchases function
    const showCustomerPurchases = (customerId) => {
        setSelectedCustomer(customerId);
        // The rest will be handled by the useEffect
    };

    // Filter functions
    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(customerSearchTerm)) ||
        (customer.address && customer.address.toLowerCase().includes(customerSearchTerm))
    );

    const filteredCustomersList = customers.filter(customer =>
        customer.name.toLowerCase().includes(customerListSearchTerm.toLowerCase())
    );

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
        return purchasesList.reduce((acc, curr) => ({
            milk: acc.milk + (parseFloat(curr.milk) || 0),
            yogurt: acc.yogurt + (parseFloat(curr.yogurt) || 0),
            amount: acc.amount + (parseFloat(curr.total) || 0)
        }), { milk: 0, yogurt: 0, amount: 0 });
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

    const selectedCustomerTotals = calculateTotals(selectedCustomerPurchases);
    const selectedCustomerInfo = selectedCustomer ? customers.find(c => c.id === selectedCustomer) : null;
    const selectedCustomerBalance = selectedCustomerTotals.amount - selectedCustomerAdvanceTotal;

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
    const calculateTodaySales = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayBills = bills.filter(bill => {
            const billDate = new Date(bill.date);
            return billDate >= today;
        });

        const todayTotal = todayBills.reduce((sum, bill) => sum + bill.grandTotal, 0);
        setTodaySales(todayTotal);

        // Calculate growth (comparing with previous day)
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const dayBefore = new Date(yesterday);
        dayBefore.setDate(dayBefore.getDate() - 1);

        const yesterdayBills = bills.filter(bill => {
            const billDate = new Date(bill.date);
            return billDate >= yesterday && billDate < today;
        });

        const yesterdayTotal = yesterdayBills.reduce((sum, bill) => sum + bill.grandTotal, 0);

        if (yesterdayTotal > 0) {
            const growth = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;
            setSalesGrowth(growth);
        } else {
            setSalesGrowth(0);
        }
    };

    // Add a new function to clear monthly purchases
    const clearMonthlyPurchases = async () => {
      if (window.confirm('کیا آپ واقعی تمام ماہانہ خریداری کو حذف کرنا چاہتے ہیں؟ ایڈوانس اور باقیہ رقم برقرار رہیں گی۔')) {
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
          fetchPurchases(); // Refresh the purchases list
          
          setSuccessMessage('تمام ماہانہ خریداری کامیابی سے حذف کر دی گئی ہیں۔ ایڈوانس اور باقیہ رقم برقرار ہیں۔');
          setShowSuccessPopup(true);
        } catch (error) {
          console.error("Error clearing monthly purchases: ", error);
          setSuccessMessage("ماہانہ خریداری کو حذف کرنے میں خرابی");
          setShowSuccessPopup(true);
        } finally {
          setLoading(false);
        }
      }
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
            setSuppliers(suppliersList);
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
            return calculateTotals(monthlyPurchases);
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

    // Function for printing a full A4 page monthly bill with green header
    const printA4MonthlyBill = () => {
        // Get selected customer info
        const customer = selectedCustomerInfo;
        if (!customer) return;
        
        // Get monthly totals
        const monthlyTotals = getCurrentMonthTotals();
        const currentDate = new Date();
        const formattedDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
        
        // Calculate total milk and yogurt
        const milkRate = customer.customMilkRate || rates.milk;
        const yogurtRate = customer.customYogurtRate || rates.yogurt;
        const milkTotal = Math.round(monthlyTotals.milk * milkRate);
        const yogurtTotal = Math.round(monthlyTotals.yogurt * yogurtRate);
        const grandTotal = milkTotal + yogurtTotal;
        const dueAmount = Math.round(selectedCustomerBalance);
        
        // Create a new window for the print
        const printWindow = window.open('', '', 'height=600,width=800');
        
        // Generate the print content for A4 size - EXACT MATCH to image
        const printContent = `
            <html>
            <head>
                <title>Monthly Bill - ${customer.name}</title>
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
                        padding: 0;
                        margin: 0;
                        direction: rtl;
                    }
                    .bill-container {
                        width: 100%;
                        max-width: 21cm;
                        margin: 0 auto;
                        border: 1px solid black;
                    }
                    .header {
                        background-color: #c8e6c9;
                        text-align: center;
                        font-weight: bold;
                        padding: 5px;
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
                        background-color: white;
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
                            <td>کل فروخت</td>
                            <td></td>
                            <td></td>
                            <td>${grandTotal}</td>
                        </tr>
                        <tr>
                            <td>پیشگی ادائیگی</td>
                            <td></td>
                            <td></td>
                            <td>${Math.round(selectedCustomerAdvanceTotal)}</td>
                        </tr>
                        <tr>
                            <td>کل بقایا رقم</td>
                            <td></td>
                            <td></td>
                            <td>${dueAmount}</td>
                        </tr>
                    </table>
                    
                    <div class="footer">
                        درخواست ہے کہ 10 تاریخ تک ادائیگی کریں۔ اگر ادائیگی نہیں ہوگی تو سپلائی بند کر دی جائے گی۔
                    </div>
                    <div class="contact">
                        خدمت انچارج: 03457411666
                    </div>
                </div>
            </body>
            </html>
        `;
        
        // Write content to the print window
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Initiate printing
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
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
                                </div>
                                <div className="form-group">
                                    <label htmlFor="milkQty">دودھ کی مقدار (لیٹر):</label>
                                    <input
                                        type="number"
                                        id="milkQty"
                                        name="milkQty"
                                        readOnly
                                        value={billFormData.milkQty}
                                        onChange={(e) => handleInputChange(e, setBillFormData, billFormData)}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="yogurtQty">دہی کی مقدار (کلو):</label>
                                    <input
                                        type="number"
                                        id="yogurtQty"
                                        name="yogurtQty"
                                        readOnly
                                        value={billFormData.yogurtQty}
                                        onChange={(e) => handleInputChange(e, setBillFormData, billFormData)}
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
                                                            onClick={() => deleteSupplier(supplier.id)}
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
                                                <div className="total-item total-amount">
                                                    <span className="total-label">Total Amount:</span>
                                                    <span className="total-value">Rs. {(selectedCustomerTotals.amount !== undefined ? selectedCustomerTotals.amount.toFixed(2) : '0.00')}</span>
                                                </div>
                                                <div className="total-item total-payments">
                                                    <span className="total-label">Total Payments:</span>
                                                    <span className="total-value">Rs. {(selectedCustomerAdvanceTotal !== undefined ? selectedCustomerAdvanceTotal.toFixed(2) : '0.00')}</span>
                                                </div>
                                                <div className="total-item total-remaining">
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
                                                                <div className="total-item total-amount">
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
                                                    </div>
                                                </div>
                                                
                                                {dailyPurchases.length > 0 && (
                                                    <div className="daily-purchases">
                                                        <h4>Daily Purchase Details for {selectedDate.toLocaleDateString()}</h4>
                                                        <table>
                                                            <thead>
                                                                <tr>
                                                                    <th>وقت</th>
                                                                    <th>دودھ (لیٹر)</th>
                                                                    <th>دہی (کلو)</th>
                                                                    <th>رقم</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {dailyPurchases.map(purchase => (
                                                                    <tr key={purchase.id}>
                                                                        <td>{new Date(purchase.date).toLocaleTimeString()}</td>
                                                                        <td>{purchase.milk}</td>
                                                                        <td>{purchase.yogurt}</td>
                                                                        <td>روپے {(purchase.total !== undefined ? purchase.total.toFixed(2) : '0.00')}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                            <tfoot>
                                                                <tr>
                                                                    <td><strong>کل</strong></td>
                                                                    <td><strong>{dailyPurchases.reduce((sum, p) => sum + (parseFloat(p.milk) || 0), 0)} لیٹر</strong></td>
                                                                    <td><strong>{dailyPurchases.reduce((sum, p) => sum + (parseFloat(p.yogurt) || 0), 0)} کلو</strong></td>
                                                                    <td><strong>روپے {dailyPurchases.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0)}</strong></td>
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
                        <div id="customerInfo" className="customer-info">
                            {selectedCustomerInfo && (
                                <>
                                    <h3>{selectedCustomerInfo.name}</h3>
                                    <p>Phone: {selectedCustomerInfo.phone || 'N/A'}</p>
                                    <p>Address: {selectedCustomerInfo.address || 'N/A'}</p>
                                    <div style={{ 
                                        backgroundColor: '#f0f8ff', 
                                        padding: '10px', 
                                        borderRadius: '5px',
                                        marginTop: '10px' 
                                    }}>
                                        <h4>Custom Rates</h4>
                                        <p>Milk Rate: Rs. {selectedCustomerInfo.customMilkRate || rates.milk} exactly</p>
                                        <p>Yogurt Rate: Rs. {selectedCustomerInfo.customYogurtRate || rates.yogurt} exactly</p>
                                    </div>
                                </>
                            )}
                        </div>

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
                                        // Use customer's custom milk rate if available
                                        const milkRate = selectedCustomerInfo && selectedCustomerInfo.customMilkRate 
                                            ? parseFloat(selectedCustomerInfo.customMilkRate) 
                                            : rates.milk;
                                        const qty = amount / milkRate;
                                        setPurchaseFormData({ ...purchaseFormData, milk: qty.toFixed(2) });
                                    }}
                                    disabled={loading}
                                />
                                <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                                    Rate: Rs. {selectedCustomerInfo?.customMilkRate || rates.milk} exactly
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
                                        // Use customer's custom yogurt rate if available
                                        const yogurtRate = selectedCustomerInfo && selectedCustomerInfo.customYogurtRate 
                                            ? parseFloat(selectedCustomerInfo.customYogurtRate) 
                                            : rates.yogurt;
                                        const qty = amount / yogurtRate;
                                        setPurchaseFormData({ ...purchaseFormData, yogurt: qty.toFixed(2) });
                                    }}
                                    disabled={loading}
                                />
                                <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                                    Rate: Rs. {selectedCustomerInfo?.customYogurtRate || rates.yogurt} exactly
                                </small>
                            </div>

                            {/* Original quantity fields */}
                            <div className="form-group">
                                <label htmlFor="purchaseMilk">دودھ کی مقدار (لیٹر):</label>
                                <input
                                    type="number"
                                    id="purchaseMilk"
                                    name="milk"
                                    min="0"
                                    readOnly

                                    value={purchaseFormData.milk}
                                    onChange={(e) => handleInputChange(e, setPurchaseFormData, purchaseFormData)}
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
                                    readOnly
                                    value={purchaseFormData.yogurt}
                                    onChange={(e) => handleInputChange(e, setPurchaseFormData, purchaseFormData)}
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
                                                    setAdvanceFormData({...advanceFormData, customerId: ''});
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
                                                                setAdvanceFormData({...advanceFormData, customerId: customer.id});
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
            </div>
        
    );
};

export default Home;
