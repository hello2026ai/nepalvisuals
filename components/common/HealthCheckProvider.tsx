import React, { useEffect } from 'react';
import ServiceErrorBoundary from './ServiceErrorBoundary';
import ServiceMonitor from './ServiceMonitor';
import { databaseBootstrapper } from '../../lib/services/databaseBootstrapper';

interface HealthCheckProviderProps {
  children: React.ReactNode;
  enableMonitoring?: boolean;
  showMonitorUI?: boolean;
}

/**
 * Health Check Provider Component
 * 
 * Provides comprehensive service health monitoring and error handling
 * for the entire application. This component should wrap your main
 * application components to ensure proper error boundaries and
 * service monitoring.
 */
export const HealthCheckProvider: React.FC<HealthCheckProviderProps> = ({
  children,
  enableMonitoring = true,
  showMonitorUI = false
}) => {
  useEffect(() => {
    // Run database bootstrap to self-heal missing tables
    // This attempts to create tables via RPC if they don't exist
    databaseBootstrapper.verifyAndCreateTables()
        .then(result => {
            if (result.success) {
                console.log('Database bootstrap successful:', result.message);
            } else {
                // Use debug to avoid console noise if RPC is missing (common in dev)
                console.debug('Database bootstrap skipped or failed:', result.message);
            }
        })
        .catch(err => console.debug('Database bootstrap error:', err));
  }, []);

  const handleServiceError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Service error detected:', error, errorInfo);
    
    // Log to external monitoring service (can be extended)
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: true
      });
    }
  };

  const handleStatusChange = (status: any) => {
    console.log('Service status changed:', status);
    
    // Handle status changes (can trigger alerts, notifications, etc.)
    if (status.status === 'unavailable') {
      console.warn('Service unavailable - triggering recovery mechanisms');
    }
  };

  return (
    <ServiceErrorBoundary onError={handleServiceError}>
      {enableMonitoring && showMonitorUI && (
        <div className="fixed top-4 right-4 z-50 w-80">
          <ServiceMonitor 
            onStatusChange={handleStatusChange}
            showAlerts={true}
          />
        </div>
      )}
      
      {children}
    </ServiceErrorBoundary>
  );
};

// Extend Window interface for Google Analytics
declare global {
  interface Window {
    gtag?: any;
  }
}

export default HealthCheckProvider;