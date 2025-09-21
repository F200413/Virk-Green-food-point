import React from 'react';
import HomeIcon from '@mui/icons-material/Home';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';

const Sidebar = ({ activeSection, onSectionChange }) => {
  const menuItems = [
    {
      id: 'billing',
      label: 'روزانہ گاہک',
      icon: <ShoppingCartIcon fontSize="small" />
    },
    {
      id: 'history',
      label: 'روزانہ بل کی فہرست',
      icon: <DescriptionIcon fontSize="small" />
    },
    {
      id: 'customers',
      label: 'ماہانہ گاہک',
      icon: <PeopleIcon fontSize="small" />
    },
 
    {
      id: 'purchaseList',
      label: 'ماہانہ بل کی فہرست',
      icon: <CalendarMonthIcon fontSize="small" />
    },
    {
      id: 'settings',
      label: 'ریٹ',
      icon: <SettingsIcon fontSize="small" />
    },
    {
      id: 'advancePayments',
      label: 'ایڈوانس پیمنٹس',
      icon: <CreditCardIcon fontSize="small" />
    },
    {
      id: 'suppliers',
      label: 'سپلائرز',
      icon: <LocalDrinkIcon fontSize="small" />
    },
    {
      id: 'monthlyReport',
      label: 'ماہانہ رپورٹ',
      icon: <DescriptionIcon fontSize="small" />
    },
    {
        id: 'paymentSummary',
        label: 'پیمنٹ کی مکمل رپورٹ',
        icon: <AccountBalanceIcon fontSize="small" />
      },
    {
      id: 'dashboard',
      label: 'ڈیش بورڈ',
      icon: <HomeIcon fontSize="small" />
    }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-group">
          <div className="sidebar-group-content">
            <div className="sidebar-menu">
              {menuItems.map((item) => (
                <div key={item.id} className="sidebar-menu-item">
                  <button
                    onClick={() => onSectionChange(item.id)}
                    className={activeSection === item.id ? 'active' : ''}
                  >
                    <span className="icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .sidebar {
          width: 260px;
          background-color: #2d6a4f;
          border-left: 1px solid #1b4332;
          height: 100vh;
          position: sticky;
          top: 0;
          overflow-y: auto;
          direction: rtl;
        }

        .sidebar-content {
          padding: 20px 10px;
        }

        .sidebar-menu-item button {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 15px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          font-weight: 500;
          text-align: right;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sidebar-menu-item button:hover {
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
          transform: translateX(-2px);
        }

        .sidebar-menu-item button.active {
          background-color: rgba(255, 255, 255, 0.15);
          color: white;
          border-right: 3px solid #52b788;
          font-weight: 600;
        }

        .sidebar-menu-item button .icon {
          display: flex;
          align-items: center;
          opacity: 0.8;
        }

        .sidebar-menu-item button.active .icon {
          opacity: 1;
        }

        .sidebar-menu-item {
          margin-bottom: 2px;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
