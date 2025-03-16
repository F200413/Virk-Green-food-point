import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';

const Home = () => {
    // State variables
    const [activeSection, setActiveSection] = useState('customers');
    const [customers, setCustomers] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [rates, setRates] = useState({ milk: 120, yogurt: 140 });
    const [bills, setBills] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [customerListSearchTerm, setCustomerListSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: ''
    });
    const [purchaseFormData, setPurchaseFormData] = useState({
        milk: 0,
        yogurt: 0
    });
    const [billFormData, setBillFormData] = useState({
        customerName: '',
        milkQty: 0,
        yogurtQty: 0
    });

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
        `;
        document.head.appendChild(style);
        
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Fetch data from Firestore on component mount
    useEffect(() => {
        fetchCustomers();
        fetchPurchases();
        fetchRates();
        fetchBills();
    }, []);

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
            const ratesCollection = collection(firestore, 'settings');
            const ratesSnapshot = await getDocs(ratesCollection);
            if (!ratesSnapshot.empty) {
                setRates(ratesSnapshot.docs[0].data());
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

    const addCustomer = async () => {
        setLoading(true);
        try {
            const customersCollection = collection(firestore, 'customers');
            await addDoc(customersCollection, formData);
            setFormData({ name: '', phone: '', address: '' });
            closeModal('customerModal');
            fetchCustomers();
        } catch (error) {
            console.error("Error adding customer: ", error);
        } finally {
            setLoading(false);
        }
    };

    const updateCustomer = async () => {
        setLoading(true);
        try {
            const customerDoc = doc(firestore, 'customers', selectedCustomer);
            await updateDoc(customerDoc, formData);
            setFormData({ name: '', phone: '', address: '' });
            closeModal('customerModal');
            fetchCustomers();
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

    const addPurchase = async () => {
        setLoading(true);
        try {
            const purchasesCollection = collection(firestore, 'purchases');
            const milkQty = parseFloat(purchaseFormData.milk) || 0;
            const yogurtQty = parseFloat(purchaseFormData.yogurt) || 0;
            const milkTotal = milkQty * rates.milk;
            const yogurtTotal = yogurtQty * rates.yogurt;
            const total = milkTotal + yogurtTotal;

            await addDoc(purchasesCollection, {
                customerId: selectedCustomer,
                milk: milkQty,
                yogurt: yogurtQty,
                milkRate: rates.milk,
                yogurtRate: rates.yogurt,
                total: total,
                date: Timestamp.now()
            });

            setPurchaseFormData({ milk: 0, yogurt: 0 });
            closeModal('purchaseModal');
            fetchPurchases();
        } catch (error) {
            console.error("Error adding purchase: ", error);
        } finally {
            setLoading(false);
        }
    };

    const addBill = async () => {
        setLoading(true);
        try {
            const billsCollection = collection(firestore, 'bills');
            const milkQty = parseFloat(billFormData.milkQty) || 0;
            const yogurtQty = parseFloat(billFormData.yogurtQty) || 0;
            const milkTotal = milkQty * rates.milk;
            const yogurtTotal = yogurtQty * rates.yogurt;
            const grandTotal = milkTotal + yogurtTotal;

            const bill = {
                customerName: billFormData.customerName,
                milkQty: milkQty,
                yogurtQty: yogurtQty,
                milkTotal: milkTotal,
                yogurtTotal: yogurtTotal,
                grandTotal: grandTotal,
                date: Timestamp.now()
            };

            await addDoc(billsCollection, bill);
            setBillFormData({ customerName: '', milkQty: 0, yogurtQty: 0 });
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
            const ratesCollection = collection(firestore, 'settings');
            const ratesSnapshot = await getDocs(ratesCollection);
            
            if (ratesSnapshot.empty) {
                await addDoc(ratesCollection, rates);
            } else {
                const rateDoc = doc(firestore, 'settings', ratesSnapshot.docs[0].id);
                await updateDoc(rateDoc, rates);
            }
            
            alert('Rates updated successfully!');
        } catch (error) {
            console.error("Error updating rates: ", error);
        } finally {
            setLoading(false);
        }       
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
                    address: customer.address || ''
                });
                setSelectedCustomer(customerId);
            }
        } else {
            setFormData({ name: '', phone: '', address: '' });
            setSelectedCustomer(null);
        }
        document.getElementById('customerModal').style.display = 'block';
    };

    const showPurchaseModal = (customerId) => {
        const customer = customers.find(c => c.id === customerId);
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
        
        billPrint.innerHTML = `
            <h3>Bill Receipt</h3>
            <p>Date: ${bill.date instanceof Timestamp ? bill.date.toDate().toLocaleDateString() : bill.date}</p>
            <p>Customer Name: ${bill.customerName}</p>
            <hr>
            <p>Milk: ${bill.milkQty} L × Rs.${rates.milk} = Rs.${bill.milkTotal}</p>
            <p>Yogurt: ${bill.yogurtQty} kg × Rs.${rates.yogurt} = Rs.${bill.yogurtTotal}</p>
            <hr>
            <h4>Total Amount: Rs.${bill.grandTotal}</h4>
        `;
        
        modal.style.display = 'block';
    };

    const printBill = () => {
        const billContent = document.getElementById('billPrint').innerHTML;
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Bill Print</title>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(billContent);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    const printCustomerHistory = () => {
        window.print();
    };

    const showCustomerPurchases = (customerId) => {
        setSelectedCustomer(customerId);
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

    const selectedCustomerPurchases = purchases.filter(p => p.customerId === selectedCustomer);

    const calculateTotals = (purchasesList) => {
        return purchasesList.reduce((acc, curr) => ({
            milk: acc.milk + (parseFloat(curr.milk) || 0),
            yogurt: acc.yogurt + (parseFloat(curr.yogurt) || 0),
            amount: acc.amount + (parseFloat(curr.total) || 0)
        }), { milk: 0, yogurt: 0, amount: 0 });
    };

    const selectedCustomerTotals = calculateTotals(selectedCustomerPurchases);
    const selectedCustomerInfo = selectedCustomer ? customers.find(c => c.id === selectedCustomer) : null;

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

    const handleInputChange = (e, setter, data) => {
        const { name, value } = e.target;
        setter({ ...data, [name]: value });
    };

    return (
        <div className="container">
            <header>
                <h1>Virk Milk Shop</h1>
                <nav>
                    <button 
                        onClick={() => showSection('billing')} 
                        className={activeSection === 'billing' ? 'active-nav' : ''}
                        disabled={loading}
                    >
                        Daily Customers
                    </button>
                    <button 
                        onClick={() => showSection('history')} 
                        className={activeSection === 'history' ? 'active-nav' : ''}
                        disabled={loading}
                    >
                        Daily Customer Billing List
                    </button>
                    <button 
                        onClick={() => showSection('customers')} 
                        className={activeSection === 'customers' ? 'active-nav' : ''}
                        disabled={loading}
                    >
                        Monthly Customers
                    </button>
                    <button 
                        onClick={() => showSection('purchaseList')} 
                        className={activeSection === 'purchaseList' ? 'active-nav' : ''}
                        disabled={loading}
                    >
                        Monthly Customer Billing List
                    </button>
                    <button 
                        onClick={() => showSection('settings')} 
                        className={activeSection === 'settings' ? 'active-nav' : ''}
                        disabled={loading}
                    >
                        Settings
                    </button>
                </nav>
            </header>

            <main>
                {/* Customers Section */}
                <section id="customers" className={activeSection === 'customers' ? 'active' : ''}>
                    <div className="customer-header">
                        <h2>Customer List</h2>
                        <button 
                            onClick={() => showCustomerModal('add')} 
                            className="add-btn"
                            disabled={loading}
                        >
                            Add New Customer
                        </button>
                    </div>
                    <div className="search-bar">
                        <input 
                            type="text" 
                            placeholder="Search customers..." 
                            value={customerSearchTerm}
                            onChange={(e) => setCustomerSearchTerm(e.target.value)}
                            disabled={loading}
                        />
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
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => deleteCustomer(customer.id)} 
                                        className="delete-btn"
                                        disabled={loading}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Billing Section */}
                <section id="billing" className={activeSection === 'billing' ? 'active' : ''}>
                    <h2>New Bill</h2>
                    <form onSubmit={handleBillFormSubmit}>
                        <div className="form-group">
                            <label htmlFor="customerName">Customer Name:</label>
                            <input 
                                type="text" 
                                id="customerName" 
                                name="customerName"
                                value={billFormData.customerName}
                                onChange={(e) => handleInputChange(e, setBillFormData, billFormData)}
                                required 
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="milkQty">Milk Quantity (Liters):</label>
                            <input 
                                type="number" 
                                id="milkQty" 
                                name="milkQty"
                                min="0" 
                                step="0.5" 
                                value={billFormData.milkQty}
                                onChange={(e) => handleInputChange(e, setBillFormData, billFormData)}
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="yogurtQty">Yogurt Quantity (KG):</label>
                            <input 
                                type="number" 
                                id="yogurtQty" 
                                name="yogurtQty"
                                min="0" 
                                step="0.5" 
                                value={billFormData.yogurtQty}
                                onChange={(e) => handleInputChange(e, setBillFormData, billFormData)}
                                disabled={loading}
                            />
                        </div>
                        <button type="submit" disabled={loading} className="button-with-spinner">
                            Generate Bill
                            {loading && <LoadingSpinner />}
                        </button>
                    </form>
                </section>

                {/* History Section */}
                <section id="history" className={activeSection === 'history' ? 'active' : ''}>
                    <h2>Bill History</h2>
                    <div id="billHistory">
                        {bills.map(bill => (
                            <div key={bill.id} className="bill-record">
                                <p>Date: {bill.date}</p>
                                <p>Customer: {bill.customerName}</p>
                                <p>Total: Rs.{bill.grandTotal}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Settings Section */}
                <section id="settings" className={activeSection === 'settings' ? 'active' : ''}>
                    <h2>Rate Settings</h2>
                    <form onSubmit={handleRatesFormSubmit}>
                        <div className="form-group">
                            <label htmlFor="milkRate">Milk Rate (per liter):</label>
                            <input 
                                type="number" 
                                id="milkRate" 
                                min="0" 
                                value={rates.milk}
                                onChange={(e) => setRates({...rates, milk: parseFloat(e.target.value)})}
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="yogurtRate">Yogurt Rate (per kg):</label>
                            <input 
                                type="number" 
                                id="yogurtRate" 
                                min="0" 
                                value={rates.yogurt}
                                onChange={(e) => setRates({...rates, yogurt: parseFloat(e.target.value)})}
                                disabled={loading}
                            />
                        </div>
                        <button type="submit" disabled={loading} className="button-with-spinner">
                            Save Rates
                            {loading && <LoadingSpinner />}
                        </button>
                    </form>
                </section>

                {/* Purchase List Section */}
                <section id="purchaseList" className={activeSection === 'purchaseList' ? 'active' : ''}>
                    <div className="list-header">
                        <h2>Customer Purchase History</h2>
                        <input 
                            type="text" 
                            placeholder="Search customers..." 
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
                                            <p>Total Purchases: Rs.{totalAmount.toFixed(2)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right side: Purchase History */}
                        <div className="purchase-history-view">
                            <div id="selectedCustomerInfo">
                                {selectedCustomerInfo && (
                                    <>
                                        <h3>{selectedCustomerInfo.name}</h3>
                                        <p>Phone: {selectedCustomerInfo.phone || 'N/A'}</p>
                                        <p>Address: {selectedCustomerInfo.address || 'N/A'}</p>
                                    </>
                                )}
                            </div>
                            <div className="purchase-table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Milk (L)</th>
                                            <th>Yogurt (KG)</th>
                                            <th>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedCustomerPurchases.map(purchase => (
                                            <tr key={purchase.id}>
                                                <td>{new Date(purchase.date).toLocaleString()}</td>
                                                <td>{purchase.milk}</td>
                                                <td>{purchase.yogurt}</td>
                                                <td>Rs.{purchase.total}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td><strong>Totals</strong></td>
                                            <td><strong>{selectedCustomerTotals.milk.toFixed(1)} L</strong></td>
                                            <td><strong>{selectedCustomerTotals.yogurt.toFixed(1)} KG</strong></td>
                                            <td><strong>Rs.{selectedCustomerTotals.amount.toFixed(2)}</strong></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            {selectedCustomerInfo && (
                                <button 
                                    onClick={printCustomerHistory} 
                                    className="print-btn button-with-spinner"
                                    disabled={loading}
                                >
                                    Print History
                                    {loading && <LoadingSpinner />}
                                </button>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            {/* Customer Modal */}
            <div id="customerModal" className="modal">
                <div className="modal-content">
                    <span className="close" onClick={() => !loading && closeModal('customerModal')}>&times;</span>
                    <h3>{modalMode === 'edit' ? 'Edit Customer' : 'Add New Customer'}</h3>
                    <form id="customerForm" onSubmit={handleCustomerFormSubmit}>
                        <div className="form-group">
                            <label htmlFor="customerNameInput">Customer Name:</label>
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
                            <label htmlFor="customerPhone">Phone Number:</label>
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
                            <label htmlFor="customerAddress">Address:</label>
                            <textarea 
                                id="customerAddress" 
                                name="address"
                                value={formData.address}
                                onChange={(e) => handleInputChange(e, setFormData, formData)}
                                disabled={loading}
                            ></textarea>
                        </div>
                        <button type="submit" disabled={loading} className="button-with-spinner">
                            {modalMode === 'edit' ? 'Update Customer' : 'Save Customer'}
                            {loading && <LoadingSpinner />}
                        </button>
                    </form>
                </div>
            </div>

            {/* Purchase Modal */}
            <div id="purchaseModal" className="modal">
                <div className="modal-content">
                    <span className="close" onClick={() => !loading && closeModal('purchaseModal')}>&times;</span>
                    <h3>New Purchase</h3>
                    <div id="customerInfo" className="customer-info">
                        {selectedCustomerInfo && (
                            <>
                                <h3>{selectedCustomerInfo.name}</h3>
                                <p>Phone: {selectedCustomerInfo.phone || 'N/A'}</p>
                                <p>Address: {selectedCustomerInfo.address || 'N/A'}</p>
                            </>
                        )}
                    </div>

                    <form id="purchaseForm" onSubmit={handlePurchaseFormSubmit}>
                        <div className="form-group">
                            <label htmlFor="purchaseMilk">Milk Quantity (Liters):</label>
                            <input 
                                type="number" 
                                id="purchaseMilk" 
                                name="milk"
                                min="0" 
                                step="0.5" 
                                value={purchaseFormData.milk}
                                onChange={(e) => handleInputChange(e, setPurchaseFormData, purchaseFormData)}
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="purchaseYogurt">Yogurt Quantity (KG):</label>
                            <input 
                                type="number" 
                                id="purchaseYogurt" 
                                name="yogurt"
                                min="0" 
                                step="0.5" 
                                value={purchaseFormData.yogurt}
                                onChange={(e) => handleInputChange(e, setPurchaseFormData, purchaseFormData)}
                                disabled={loading}
                            />
                        </div>
                        <button type="submit" disabled={loading} className="button-with-spinner">
                            Save Purchase
                            {loading && <LoadingSpinner />}
                        </button>
                    </form>

                    <div className="purchase-history">
                        <h4>Purchase History</h4>
                        <div id="customerPurchaseHistory">
                            {selectedCustomerPurchases.map(purchase => (
                                <div key={purchase.id} className="purchase-record">
                                    <div className="purchase-date">
                                        {new Date(purchase.date).toLocaleDateString()} 
                                        {new Date(purchase.date).toLocaleTimeString()}
                                    </div>
                                    <div>
                                        {purchase.milk > 0 && `Milk: ${purchase.milk}L × Rs.${purchase.milkRate} = Rs.${purchase.milk * purchase.milkRate}`}
                                        {purchase.milk > 0 && purchase.yogurt > 0 && <br />}
                                        {purchase.yogurt > 0 && `Yogurt: ${purchase.yogurt}kg × Rs.${purchase.yogurtRate} = Rs.${purchase.yogurt * purchase.yogurtRate}`}
                                    </div>
                                    <div><strong>Total: Rs.{purchase.total}</strong></div>
                                </div>
                            ))}
                        </div>
                        <div className="total-summary" id="totalSummary">
                            <h4>Total Summary</h4>
                            <p>Total Milk: {selectedCustomerTotals.milk.toFixed(1)}L</p>
                            <p>Total Yogurt: {selectedCustomerTotals.yogurt.toFixed(1)}kg</p>
                            <p>Total Amount: Rs.{selectedCustomerTotals.amount.toFixed(2)}</p>
                        </div>
                    </div>
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
                        className="button-with-spinner"
                    >
                        Print Bill
                        {loading && <LoadingSpinner />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Home;
