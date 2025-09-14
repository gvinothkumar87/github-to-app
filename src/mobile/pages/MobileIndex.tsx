import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { ServiceStatusIndicator } from '../components/ServiceStatusIndicator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Truck, 
  Users, 
  Package, 
  Receipt, 
  FileText,
  Settings,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';
import { networkService } from '../services/network.service';
import { useMobileServices } from '../providers/MobileServiceProvider';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

const MobileIndex: React.FC = () => {
  const { isReady } = useMobileServices();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(networkService.isOnline());
  const isAdmin = useAdminCheck();

  useEffect(() => {
    const unsubscribe = networkService.onStatusChange((status) => {
      setIsOnline(status.connected);
    });

    // Handle mobile back button - navigate back to dashboard
    let backButtonListener: any;
    if (Capacitor.isNativePlatform()) {
      App.addListener('backButton', () => {
        navigate('/');
      }).then((listener) => {
        backButtonListener = listener;
      });
    }

    return () => {
      unsubscribe();
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [navigate]);

  const menuItems = [
    {
      title: 'Transit Logbook',
      description: 'Create and manage outward entries',
      icon: Truck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/transit'
    },
    {
      title: 'Customers',
      description: 'Manage customer information',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/customers'
    },
    {
      title: 'Items',
      description: 'Manage item catalog',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/items'
    },
    {
      title: 'Receipts',
      description: 'Create and track receipts',
      icon: Receipt,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/receipts/new'
    },
    {
      title: 'Sales',
      description: 'Record sales transactions',
      icon: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      href: '/sales'
    },
    {
      title: 'Sales Ledger',
      description: 'View sales reports (Offline)',
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      href: '/sales-ledger'
    },
    {
      title: 'Customer Ledger',
      description: 'Customer account details (Offline)',
      icon: FileText,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      href: '/customer-ledger'
    },
    {
      title: 'Bills',
      description: 'Manage sales bills and invoices',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/bills'
    },
    {
      title: 'Reports',
      description: 'Generate business reports',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/reports'
    },
    {
      title: 'Settings',
      description: 'App configuration and sync',
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      href: '/settings'
    }
  ];

  // Filter menu items based on user type
  const getFilteredMenuItems = () => {
    if (isAdmin) {
      // Admin users can see: receipts, sales, sales ledger, customer ledger, bills
      const adminAllowedItems = ['Receipts', 'Sales', 'Sales Ledger', 'Customer Ledger', 'Bills'];
      return menuItems.filter(item => adminAllowedItems.includes(item.title));
    } else {
      // Non-admin users can only see: Transit Logbook, Customers, Items, Settings
      const normalUserAllowedItems = ['Transit Logbook', 'Customers', 'Items', 'Settings'];
      return menuItems.filter(item => normalUserAllowedItems.includes(item.title));
    }
  };

  const handleMenuClick = (href: string) => {
    navigate(href);
  };

  return (
    <MobileLayout title="GRM Sales Mobile">
      <div className="space-y-6">
        {/* Service Status Indicator */}
        <ServiceStatusIndicator />


        {/* Menu Grid */}
        <div className="grid grid-cols-2 gap-4">
          {getFilteredMenuItems().map((item) => (
            <Card 
              key={item.title}
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => handleMenuClick(item.href)}
            >
              <CardContent className="p-4">
                <div className={`inline-flex p-2 rounded-lg ${item.bgColor} mb-3`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <h3 className="font-medium text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!isAdmin && (
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => handleMenuClick('/transit/new')}
              >
                <Truck className="h-4 w-4 mr-2" />
                New Outward Entry
              </Button>
            )}
            {isAdmin && (
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => handleMenuClick('/receipts/new')}
              >
                <Receipt className="h-4 w-4 mr-2" />
                New Receipt
              </Button>
            )}
            {!isAdmin && (
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => handleMenuClick('/customers/new')}
              >
                <Users className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default MobileIndex;