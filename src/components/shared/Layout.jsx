import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children, onLogout, activeSection, onSectionChange }) => {
  return (
    <div className="app-layout">
      <Header onLogout={onLogout} />
      <div className="app-container">
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={onSectionChange} 
        />
        <div className="main-content">
          {children}
        </div>
      </div>

      <style jsx>{`
        .app-layout {
          min-height: 100vh;
          background-color: #f8f9fa;
        }

        .app-container {
          display: flex;
          flex-direction: row-reverse;
          min-height: calc(100vh - 80px);
        }

        .main-content {
          flex: 1;
          padding: 20px;
          background-color: #f8f9fa;
          direction: rtl;
          overflow-y: auto;
        }

        @media (max-width: 768px) {
          .app-container {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
