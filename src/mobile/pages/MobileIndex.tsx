import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
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
import { databaseService } from '../services/database.service';
import { networkService } from '../services/network.service';
import { syncService } from '../services/sync.service';
import { useToast } from '@/hooks/use-toast';

const MobileIndex: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize all services
        await databaseService.initialize();
        await networkService.initialize();
        await syncService.initialize();
        
        console.log('Mobile app services initialized successfully');
        
        toast({
          title: "App Ready",
          description: "Mobile app initialized successfully",
        });
      } catch (error) {
        console.error('Failed to initialize mobile services:', error);
        toast({
          title: "Initialization Error",
          description: "Failed to initialize mobile app services",
          variant: "destructive",
        });
      }
    };

    initializeServices();
  }, [toast]);

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
      title: 'Settings',
      description: 'App configuration and sync',
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      href: '/settings'
    }
  ];

  const handleMenuClick = (href: string) => {
    navigate(href);
  };

  return (
    <MobileLayout title="GRM Sales Mobile">
      <div className="space-y-6">
        {/* Welcome Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Welcome to GRM Sales Mobile
            </CardTitle>
            <CardDescription>
              Offline-capable mobile app for managing your sales operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                {networkService.isOnline() ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <span>
                  {networkService.isOnline() ? 'Online' : 'Offline Mode'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item) => (
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
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => handleMenuClick('/transit/new')}
            >
              <Truck className="h-4 w-4 mr-2" />
              New Outward Entry
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => handleMenuClick('/receipts/new')}
            >
              <Receipt className="h-4 w-4 mr-2" />
              New Receipt
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => handleMenuClick('/customers/new')}
            >
              <Users className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default MobileIndex;