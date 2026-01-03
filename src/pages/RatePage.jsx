import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { importMonthlyRatesFromFile } from '../utils/importMonthlyRates';
import { importAbdullahRatesFromFile } from '../utils/importAbdullahRates';
import { setCurrentMonthRatesFromLastPurchase } from '../utils/setNextMonthRates';
import { exportMonthlyDataToJSON } from '../utils/exportMonthlyData';

const RatePage = () => {
    // State variables
    const [rates, setRates] = useState({
        milk: 120,
        yogurt: 140,
        monthlyRates: {}
    });
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importingAbdullah, setImportingAbdullah] = useState(false);
    const [settingNextMonthRates, setSettingNextMonthRates] = useState(false);
    const [exportingMonthlyData, setExportingMonthlyData] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
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
            
            // CRITICAL FIX: Always fetch latest rates from Firestore first to preserve monthlyRates
            const ratesSnapshot = await getDoc(ratesDoc);
            let currentMonthlyRates = {};
            
            if (ratesSnapshot.exists()) {
                const currentData = ratesSnapshot.data();
                currentMonthlyRates = currentData.monthlyRates || {};
            }
            
            // Ensure we preserve monthlyRates when updating global rates
            const updatedRates = {
                milk: rates.milk,
                yogurt: rates.yogurt,
                monthlyRates: currentMonthlyRates // Use latest monthlyRates from Firestore, not state
            };
            await setDoc(ratesDoc, updatedRates);
            
            // Update local state with the saved data
            setRates(updatedRates);
            
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

    const handleImportRates = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            setSuccessMessage('براہ کرم صرف JSON فائل منتخب کریں');
            setShowSuccessPopup(true);
            return;
        }

        setImporting(true);
        setImportProgress({ current: 0, total: 0 });

        try {
            const result = await importMonthlyRatesFromFile(file, (current, total) => {
                setImportProgress({ current, total });
            });

            // Refresh rates after import
            await fetchRates();

            setSuccessMessage(
                `کامیابی! ${result.importedRatesCount} مہینہ وار ریٹس ${result.totalCustomers} گاہکوں کے لیے درآمد ہو گئے`
            );
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error importing rates: ", error);
            setSuccessMessage('ریٹس درآمد کرنے میں خرابی: ' + error.message);
            setShowSuccessPopup(true);
        } finally {
            setImporting(false);
            setImportProgress({ current: 0, total: 0 });
            // Reset file input
            event.target.value = '';
        }
    };

    const handleImportAbdullahRates = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            setSuccessMessage('براہ کرم صرف JSON فائل منتخب کریں');
            setShowSuccessPopup(true);
            return;
        }

        setImportingAbdullah(true);

        try {
            const result = await importAbdullahRatesFromFile(file);

            // Refresh rates after import
            await fetchRates();

            const rateDetailsText = result.rateDetails.map(d => 
                `${d.month} ${d.year}: دودھ=${d.milkRate}, دہی=${d.yogurtRate}`
            ).join('\n');

            setSuccessMessage(
                `کامیابی! عبداللہ کے لیے ${result.importedRatesCount} مہینوں کے ریٹس درآمد ہو گئے:\n${rateDetailsText}`
            );
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error importing Abdullah rates: ", error);
            setSuccessMessage('عبداللہ کے ریٹس درآمد کرنے میں خرابی: ' + error.message);
            setShowSuccessPopup(true);
        } finally {
            setImportingAbdullah(false);
            // Reset file input
            event.target.value = '';
        }
    };

    const handleSetCurrentMonthRates = async () => {
        setSettingNextMonthRates(true);
        setImportProgress({ current: 0, total: 0 });

        try {
            const result = await setCurrentMonthRatesFromLastPurchase((current, total, customerName) => {
                setImportProgress({ current, total });
            });

            // Refresh rates after setting
            await fetchRates();

            setSuccessMessage(
                `کامیابی! ${result.successCount} گاہکوں کے لیے اس مہینے کے ریٹس آخری خریداری کی بنیاد پر سیٹ ہو گئے۔ ${result.skippedCount} گاہک چھوڑ دیے گئے (کوئی خریداری نہیں ملی)۔`
            );
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error setting current month rates: ", error);
            setSuccessMessage('ریٹس سیٹ کرنے میں خرابی: ' + error.message);
            setShowSuccessPopup(true);
        } finally {
            setSettingNextMonthRates(false);
            setImportProgress({ current: 0, total: 0 });
        }
    };

    const handleExportMonthlyData = async () => {
        setExportingMonthlyData(true);
        try {
            const result = await exportMonthlyDataToJSON();
            if (result.success) {
                setSuccessMessage(`مہینہ وار ڈیٹا کامیابی سے ڈاؤن لوڈ ہو گیا: ${result.filename}`);
            } else {
                setSuccessMessage('مہینہ وار ڈیٹا ڈاؤن لوڈ کرنے میں خرابی');
            }
            setShowSuccessPopup(true);
        } catch (error) {
            console.error("Error exporting monthly data: ", error);
            setSuccessMessage('مہینہ وار ڈیٹا ڈاؤن لوڈ کرنے میں خرابی: ' + error.message);
            setShowSuccessPopup(true);
        } finally {
            setExportingMonthlyData(false);
        }
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

                    {/* Import Rates Section */}
                    <div style={{ 
                        marginTop: '30px', 
                        padding: '25px', 
                        borderTop: '2px solid #e9ecef',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px'
                    }}>
                        <h3 style={{ marginBottom: '10px', color: '#2d6a4f', fontSize: '20px' }}>
                            📥 مہینہ وار ریٹس درآمد کریں
                        </h3>
                        <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
                            JSON فائل سے تمام گاہکوں کے لیے مہینہ وار ریٹس خودکار طریقے سے درآمد کریں۔ 
                            یہ تمام مہینوں کے لیے ریٹس سیٹ کر دے گا۔
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImportRates}
                                disabled={importing}
                                id="importRatesFile"
                                style={{ display: 'none' }}
                            />
                            <label
                                htmlFor="importRatesFile"
                                style={{
                                    padding: '14px 28px',
                                    backgroundColor: importing ? '#6c757d' : '#2d6a4f',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: importing ? 'not-allowed' : 'pointer',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: importing ? 'none' : '0 2px 5px rgba(0,0,0,0.1)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!importing) {
                                        e.target.style.backgroundColor = '#1b4332';
                                        e.target.style.transform = 'translateY(-1px)';
                                        e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!importing) {
                                        e.target.style.backgroundColor = '#2d6a4f';
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                                    }
                                }}
                            >
                                {importing ? (
                                    <>
                                        <LoadingSpinner />
                                        <span>درآمد ہو رہا ہے...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>📁</span>
                                        <span>JSON فائل منتخب کریں اور درآمد کریں</span>
                                    </>
                                )}
                            </label>
                            {importing && importProgress.total > 0 && (
                                <div style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '5px',
                                    padding: '10px 15px',
                                    backgroundColor: 'white',
                                    borderRadius: '6px',
                                    border: '1px solid #e9ecef'
                                }}>
                                    <span style={{ color: '#2d6a4f', fontSize: '14px', fontWeight: '600' }}>
                                        پیش رفت: {importProgress.current} / {importProgress.total} گاہک
                                    </span>
                                    <div style={{
                                        width: '200px',
                                        height: '6px',
                                        backgroundColor: '#e9ecef',
                                        borderRadius: '3px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${(importProgress.current / importProgress.total) * 100}%`,
                                            height: '100%',
                                            backgroundColor: '#2d6a4f',
                                            transition: 'width 0.3s ease'
                                        }}></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {!importing && (
                            <div style={{ 
                                marginTop: '15px', 
                                padding: '12px', 
                                backgroundColor: '#e3f2fd', 
                                borderRadius: '6px',
                                borderLeft: '4px solid #2196f3'
                            }}>
                                <p style={{ margin: 0, color: '#1976d2', fontSize: '13px' }}>
                                    <strong>نوٹ:</strong> یہ تمام گاہکوں کے لیے تمام مہینوں کے ریٹس درآمد کرے گا۔ 
                                    موجودہ ریٹس کو اپڈیٹ کر دیا جائے گا۔
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Import Abdullah Rates Only Section - TEST */}
                    <div style={{ 
                        marginTop: '30px', 
                        padding: '25px', 
                        borderTop: '2px solid #e9ecef',
                        backgroundColor: '#fff3cd',
                        borderRadius: '8px',
                        border: '2px solid #ffc107'
                    }}>
                        <h3 style={{ marginBottom: '10px', color: '#856404', fontSize: '20px' }}>
                            🧪 ٹیسٹ: عبداللہ کے لیے ریٹس درآمد کریں
                        </h3>
                        <p style={{ marginBottom: '20px', color: '#856404', fontSize: '14px', lineHeight: '1.6' }}>
                            یہ صرف عبداللہ گاہک کے لیے ریٹس درآمد کرے گا۔ خریداری کے ڈیٹا سے اصل ریٹس کا حساب لگایا جائے گا۔
                            کامیابی کے بعد تمام گاہکوں کے لیے استعمال کیا جا سکتا ہے۔
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImportAbdullahRates}
                                disabled={importingAbdullah}
                                id="importAbdullahRatesFile"
                                style={{ display: 'none' }}
                            />
                            <label
                                htmlFor="importAbdullahRatesFile"
                                style={{
                                    padding: '14px 28px',
                                    backgroundColor: importingAbdullah ? '#6c757d' : '#ffc107',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: importingAbdullah ? 'not-allowed' : 'pointer',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: importingAbdullah ? 'none' : '0 2px 5px rgba(0,0,0,0.1)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!importingAbdullah) {
                                        e.target.style.backgroundColor = '#ffb300';
                                        e.target.style.transform = 'translateY(-1px)';
                                        e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!importingAbdullah) {
                                        e.target.style.backgroundColor = '#ffc107';
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                                    }
                                }}
                            >
                                {importingAbdullah ? (
                                    <>
                                        <LoadingSpinner />
                                        <span>درآمد ہو رہا ہے...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>🧪</span>
                                        <span>عبداللہ کے لیے ریٹس درآمد کریں (ٹیسٹ)</span>
                                    </>
                                )}
                            </label>
                        </div>
                        {!importingAbdullah && (
                            <div style={{ 
                                marginTop: '15px', 
                                padding: '12px', 
                                backgroundColor: '#fff3cd', 
                                borderRadius: '6px',
                                borderLeft: '4px solid #ffc107'
                            }}>
                                <p style={{ margin: 0, color: '#856404', fontSize: '13px' }}>
                                    <strong>نوٹ:</strong> یہ صرف عبداللہ گاہک کے لیے ریٹس درآمد کرے گا۔ 
                                    خریداری کے ڈیٹا سے اصل ریٹس کا حساب لگایا جائے گا (مثال: 500/200)۔
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Export Monthly User Data Section */}
                    <div style={{ 
                        marginTop: '30px', 
                        padding: '25px', 
                        borderTop: '2px solid #e9ecef',
                        backgroundColor: '#e7f3ff',
                        borderRadius: '8px',
                        border: '2px solid #3498db'
                    }}>
                        <h3 style={{ marginBottom: '10px', color: '#1a5490', fontSize: '20px' }}>
                            📤 مہینہ وار گاہک ڈیٹا ڈاؤن لوڈ کریں
                        </h3>
                        <p style={{ marginBottom: '20px', color: '#1a5490', fontSize: '14px', lineHeight: '1.6' }}>
                            تمام گاہکوں کا مہینہ وار ڈیٹا (خریداریاں، ریٹس، کل مقدار، کل رقم) JSON فائل میں ڈاؤن لوڈ کریں۔
                            یہ فائل بعد میں ریٹس درآمد کرنے کے لیے استعمال کی جا سکتی ہے۔
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                            <button
                                onClick={handleExportMonthlyData}
                                disabled={exportingMonthlyData}
                                style={{
                                    padding: '14px 28px',
                                    backgroundColor: exportingMonthlyData ? '#6c757d' : '#3498db',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: exportingMonthlyData ? 'not-allowed' : 'pointer',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: exportingMonthlyData ? 'none' : '0 2px 5px rgba(0,0,0,0.1)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!exportingMonthlyData) {
                                        e.target.style.backgroundColor = '#2980b9';
                                        e.target.style.transform = 'translateY(-1px)';
                                        e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!exportingMonthlyData) {
                                        e.target.style.backgroundColor = '#3498db';
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                                    }
                                }}
                            >
                                {exportingMonthlyData ? (
                                    <>
                                        <LoadingSpinner />
                                        <span>ڈاؤن لوڈ ہو رہا ہے...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>📤</span>
                                        <span>مہینہ وار ڈیٹا ڈاؤن لوڈ کریں</span>
                                    </>
                                )}
                            </button>
                        </div>
                        {!exportingMonthlyData && (
                            <div style={{ 
                                marginTop: '15px', 
                                padding: '12px', 
                                backgroundColor: '#d1ecf1', 
                                borderRadius: '6px',
                                borderLeft: '4px solid #3498db'
                            }}>
                                <p style={{ margin: 0, color: '#0c5460', fontSize: '13px' }}>
                                    <strong>نوٹ:</strong> یہ فائل تمام گاہکوں کے مہینہ وار ڈیٹا پر مشتمل ہوگی، 
                                    جس میں خریداریاں، ریٹس، کل مقدار اور کل رقم شامل ہوگی۔ 
                                    فائل کا نام: <code>monthly_user_data_YYYY-MM-DD.json</code>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Set Current Month Rates from Last Purchase */}
                    <div style={{ 
                        marginTop: '30px', 
                        padding: '25px', 
                        borderTop: '2px solid #e9ecef',
                        backgroundColor: '#d1ecf1',
                        borderRadius: '8px',
                        border: '2px solid #17a2b8'
                    }}>
                        <h3 style={{ marginBottom: '10px', color: '#0c5460', fontSize: '20px' }}>
                            ⚡ اس مہینے کے ریٹس آخری خریداری سے سیٹ کریں
                        </h3>
                        <p style={{ marginBottom: '20px', color: '#0c5460', fontSize: '14px', lineHeight: '1.6' }}>
                            تمام گاہکوں کے لیے اس مہینے کے ریٹس ان کی آخری خریداری کی بنیاد پر خودکار طریقے سے سیٹ کریں۔
                            اگر کسی گاہک کی کوئی خریداری نہیں ملی تو وہ چھوڑ دیا جائے گا۔
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                            <button
                                onClick={handleSetCurrentMonthRates}
                                disabled={settingNextMonthRates}
                                style={{
                                    padding: '14px 28px',
                                    backgroundColor: settingNextMonthRates ? '#6c757d' : '#17a2b8',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: settingNextMonthRates ? 'not-allowed' : 'pointer',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: settingNextMonthRates ? 'none' : '0 2px 5px rgba(0,0,0,0.1)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!settingNextMonthRates) {
                                        e.target.style.backgroundColor = '#138496';
                                        e.target.style.transform = 'translateY(-1px)';
                                        e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!settingNextMonthRates) {
                                        e.target.style.backgroundColor = '#17a2b8';
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                                    }
                                }}
                            >
                                {settingNextMonthRates ? (
                                    <>
                                        <LoadingSpinner />
                                        <span>سیٹ ہو رہا ہے...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>⚡</span>
                                        <span>اس مہینے کے ریٹس سیٹ کریں</span>
                                    </>
                                )}
                            </button>
                            {settingNextMonthRates && importProgress.total > 0 && (
                                <div style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '5px',
                                    padding: '10px 15px',
                                    backgroundColor: 'white',
                                    borderRadius: '6px',
                                    border: '1px solid #e9ecef'
                                }}>
                                    <span style={{ color: '#0c5460', fontSize: '14px', fontWeight: '600' }}>
                                        پیش رفت: {importProgress.current} / {importProgress.total} گاہک
                                    </span>
                                    <div style={{
                                        width: '200px',
                                        height: '6px',
                                        backgroundColor: '#e9ecef',
                                        borderRadius: '3px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${(importProgress.current / importProgress.total) * 100}%`,
                                            height: '100%',
                                            backgroundColor: '#17a2b8',
                                            transition: 'width 0.3s ease'
                                        }}></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {!settingNextMonthRates && (
                            <div style={{ 
                                marginTop: '15px', 
                                padding: '12px', 
                                backgroundColor: '#d1ecf1', 
                                borderRadius: '6px',
                                borderLeft: '4px solid #17a2b8'
                            }}>
                                <p style={{ margin: 0, color: '#0c5460', fontSize: '13px' }}>
                                    <strong>نوٹ:</strong> یہ ہر گاہک کی آخری خریداری سے ریٹس نکالے گا اور اس مہینے کے لیے سیٹ کرے گا۔
                                    مثال: اگر آخری خریداری 500/200 پر ہوئی تو یہی ریٹس اس مہینے کے لیے سیٹ ہو جائیں گے۔
                                </p>
                            </div>
                        )}
                    </div>
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
