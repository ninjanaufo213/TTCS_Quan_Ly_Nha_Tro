import React from 'react';
import SharedHeader from './SharedHeader';
import SharedFooter from './SharedFooter';

/**
 * Unified Dashboard Layout component
 * Provides consistent look and feel for Admin Dashboard, Landlord Dashboard, and Tenant Dashboard
 */
const DashboardLayout = ({ children, title, subtitle, showHeader = true, showFooter = true }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Shared Header */}
      {showHeader && <SharedHeader showSearch={false} showDashboardButton={false} />}

      {/* Main Content */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%)',
        padding: '24px 0',
      }}>
        <div style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: '0 24px',
        }}>
          {/* Title Section */}
          {(title || subtitle) && (
            <div style={{ marginBottom: 32 }}>
              {title && (
                <h1 style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#0f3460',
                  margin: '0 0 8px 0',
                }}>
                  {title}
                </h1>
              )}
              {subtitle && (
                <p style={{
                  fontSize: 14,
                  color: '#64748b',
                  margin: 0,
                }}>
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Content */}
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}>
            {children}
          </div>
        </div>
      </div>

      {/* Shared Footer */}
      {showFooter && <SharedFooter />}
    </div>
  );
};

export default DashboardLayout;
