import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const RatePage = () => {
    // State variables
    const [rates, setRates] = useState({
        milk: 120,
        yogurt: 140,
        monthlyRates: {}
    });
    const [loading, setLoading] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

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

    // Fetch rates on component mount
    useEffect(() => {
        fetchRates();
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
            setSuccessMessage('ریٹس کامیابی سے اپڈیٹ ہوگئے');
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error updating rates: ", error);
            setSuccessMessage("ریٹس اپڈیٹ کرنے میں خرابی");
            setShowSuccessPopup(true);
        } finally {
            setLoading(false);
        }
    };

    const handleRatesFormSubmit = (e) => {
        e.preventDefault();
        updateRates();
    };

    return (
        <div className="main-content">
            <section id="settings" className="active">
                <h2>ریٹ اور انوینٹری کی ترتیبات</h2>

                {/* Rates Form */}
                <div className="rates-form-container">
                    <h3>ریٹ کی ترتیبات</h3>
                    <form onSubmit={handleRatesFormSubmit}>
                        <div className="form-group">
                            <label htmlFor="milkRate">دودھ کی قیمت (فی لیٹر):</label>
                            <input
                                type="number"
                                id="milkRate"
                                min="0"
                                step="0.01"
                                value={rates.milk}
                                onChange={(e) => setRates({ ...rates, milk: parseFloat(e.target.value) || 0 })}
                                disabled={loading}
                                required
                            />
                            <small className="rate-info">Current rate: Rs. {rates.milk} per liter</small>
                        </div>
                        <div className="form-group">
                            <label htmlFor="yogurtRate">دہی کی قیمت (فی کلو):</label>
                            <input
                                type="number"
                                id="yogurtRate"
                                min="0"
                                step="0.01"
                                value={rates.yogurt}
                                onChange={(e) => setRates({ ...rates, yogurt: parseFloat(e.target.value) || 0 })}
                                disabled={loading}
                                required
                            />
                            <small className="rate-info">Current rate: Rs. {rates.yogurt} per kg</small>
                        </div>
                        <button type="submit" disabled={loading} className="button-with-spinner">
                            ریٹ محفوظ کریں
                            {loading && <LoadingSpinner />}
                        </button>
                    </form>
                </div>

                {/* Rate Information Card */}
                <div className="rate-info-card">
                    <h3>Current Rates</h3>
                    <div className="rate-display-grid">
                        <div className="rate-display-item">
                            <div className="rate-icon">🥛</div>
                            <div className="rate-details">
                                <h4>Milk (دودھ)</h4>
                                <p className="rate-value">Rs. {rates.milk.toFixed(2)} per liter</p>
                                <small>فی لیٹر</small>
                            </div>
                        </div>
                        <div className="rate-display-item">
                            <div className="rate-icon">🧈</div>
                            <div className="rate-details">
                                <h4>Yogurt (دہی)</h4>
                                <p className="rate-value">Rs. {rates.yogurt.toFixed(2)} per kg</p>
                                <small>فی کلو</small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Monthly Rates Summary */}
                {rates.monthlyRates && Object.keys(rates.monthlyRates).length > 0 && (
                    <div className="monthly-rates-summary">
                        <h3>Monthly Rates Overview</h3>
                        <p className="summary-description">
                            You have {Object.keys(rates.monthlyRates).length} custom monthly rates set for specific customers.
                            These rates will override the global rates above for specific customer-month combinations.
                        </p>
                        <div className="monthly-rates-note">
                            <strong>Note:</strong> Monthly rates are managed through the customer management section.
                            Global rates above serve as defaults when no specific monthly rate is set.
                        </div>
                    </div>
                )}

                {/* Rate Management Tips */}
                <div className="rate-tips-card">
                    <h3>Rate Management Tips</h3>
                    <ul className="tips-list">
                        <li>
                            <strong>Global Rates:</strong> These rates apply to all customers by default
                        </li>
                        <li>
                            <strong>Monthly Rates:</strong> Set specific rates for individual customers per month
                        </li>
                        <li>
                            <strong>Rate Priority:</strong> Monthly rates override global rates when available
                        </li>
                        <li>
                            <strong>Cascading:</strong> Monthly rates carry forward until new rates are set
                        </li>
                        <li>
                            <strong>Backup:</strong> Always keep global rates updated as fallback values
                        </li>
                    </ul>
                </div>
            </section>

            {/* Success Popup */}
            {showSuccessPopup && (
                <div className="popup-overlay">
                    <div className="popup-content">
                        <div className="success-icon">✅</div>
                        <p>{successMessage}</p>
                        <button onClick={() => setShowSuccessPopup(false)}>بند کریں</button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .main-content {
                    flex: 1;
                    padding: 20px;
                    background-color: #f8f9fa;
                    direction: rtl;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .main-content section {
                    display: none;
                }

                .main-content section.active {
                    display: block;
                }

                h2 {
                    color: #2d6a4f;
                    margin-bottom: 30px;
                    font-size: 28px;
                    text-align: center;
                }

                h3 {
                    color: #2d6a4f;
                    margin-bottom: 20px;
                    font-size: 22px;
                }

                .rates-form-container {
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    margin-bottom: 30px;
                }

                .form-group {
                    margin-bottom: 25px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #2d6a4f;
                    font-size: 16px;
                }

                .form-group input {
                    width: 100%;
                    max-width: 300px;
                    padding: 12px;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: border-color 0.3s ease;
                    direction: ltr;
                    text-align: right;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: #52b788;
                }

                .form-group input:disabled {
                    background-color: #f8f9fa;
                    cursor: not-allowed;
                }

                .rate-info {
                    display: block;
                    margin-top: 5px;
                    color: #666;
                    font-size: 14px;
                    font-style: italic;
                }

                .button-with-spinner {
                    background-color: #2d6a4f;
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.3s ease;
                    margin-top: 20px;
                }

                .button-with-spinner:hover:not(:disabled) {
                    background-color: #1b4332;
                    transform: translateY(-1px);
                }

                .button-with-spinner:disabled {
                    background-color: #6c757d;
                    cursor: not-allowed;
                    transform: none;
                }

                .rate-info-card {
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    margin-bottom: 30px;
                }

                .rate-display-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }

                .rate-display-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 20px;
                    background-color: #f8f9fa;
                    border-radius: 10px;
                    border-left: 4px solid #52b788;
                }

                .rate-icon {
                    font-size: 40px;
                    width: 60px;
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: white;
                    border-radius: 50%;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }

                .rate-details h4 {
                    margin: 0 0 5px 0;
                    color: #2d6a4f;
                    font-size: 18px;
                }

                .rate-value {
                    margin: 5px 0;
                    font-size: 20px;
                    font-weight: bold;
                    color: #1b4332;
                }

                .rate-details small {
                    color: #666;
                    font-size: 12px;
                }

                .monthly-rates-summary {
                    background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
                    padding: 25px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                    border: 1px solid #e1f5fe;
                }

                .summary-description {
                    color: #37474f;
                    margin-bottom: 15px;
                    line-height: 1.6;
                }

                .monthly-rates-note {
                    background-color: rgba(45, 106, 79, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid #2d6a4f;
                    color: #1b4332;
                }

                .rate-tips-card {
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .tips-list {
                    list-style: none;
                    padding: 0;
                    margin-top: 15px;
                }

                .tips-list li {
                    padding: 12px 0;
                    border-bottom: 1px solid #f0f0f0;
                    color: #555;
                    line-height: 1.5;
                }

                .tips-list li:last-child {
                    border-bottom: none;
                }

                .tips-list strong {
                    color: #2d6a4f;
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
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }

                .success-icon {
                    font-size: 48px;
                    margin-bottom: 15px;
                }

                .popup-content p {
                    font-size: 18px;
                    color: #2d6a4f;
                    margin-bottom: 20px;
                    font-weight: 500;
                }

                .popup-content button {
                    background-color: #2d6a4f;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                    transition: background-color 0.3s ease;
                }

                .popup-content button:hover {
                    background-color: #1b4332;
                }

                @media (max-width: 768px) {
                    .main-content {
                        padding: 15px;
                    }

                    .rates-form-container,
                    .rate-info-card,
                    .monthly-rates-summary,
                    .rate-tips-card {
                        padding: 20px;
                    }

                    .rate-display-grid {
                        grid-template-columns: 1fr;
                    }

                    .rate-display-item {
                        flex-direction: column;
                        text-align: center;
                    }

                    h2 {
                        font-size: 24px;
                    }

                    h3 {
                        font-size: 20px;
                    }
                }

                @media (max-width: 480px) {
                    .form-group input {
                        max-width: 100%;
                    }

                    .rate-icon {
                        font-size: 30px;
                        width: 50px;
                        height: 50px;
                    }

                    .rate-value {
                        font-size: 18px;
                    }
                }
            `}</style>
        </div>
    );
};

export default RatePage;
