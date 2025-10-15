import React from 'react';
import { Menu, LogOut, Home, FileText, Plus, Minus, Users, ShoppingCart, Book, Package, Truck, Scale, ClipboardList, Receipt, Trash2, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { LanguageToggle } from './LanguageToggle';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarProvider, 
  useSidebar 
} from './ui/sidebar';
import { Button } from './ui/button';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const NavigationSidebar = () => {
  const { language } = useLanguage();
  const { signOut } = useAuth();
  const { setOpenMobile, setOpen } = useSidebar();
  const navigate = useNavigate();
  const isAdmin = useAdminCheck();

  // Since we're on navigation pages, we need to communicate with Index page for tab changes
  // For now, we'll just navigate to home with the intention of showing that tab
  const navigateToHomeTab = (tabId: string) => {
    navigate('/', { state: { activeTab: tabId } });
    setOpenMobile(false);
    setOpen(false);
  };

  const mainAppTabs = [
    { id: 'entries', label: language === 'english' ? 'Outward Entries' : 'வெளியீட்டு பதிவுகள்', icon: Truck },
    { id: 'load-weight', label: language === 'english' ? 'Load Weight' : 'மொத்த எடை', icon: Scale },
    { id: 'direct-sales', label: language === 'english' ? 'Direct Sales' : 'நேரடி விற்பனை', icon: ShoppingCart, adminOnly: true },
    { id: 'outward-sales', label: language === 'english' ? 'Sales from Transit' : 'போக்குவரத்து விற்பனை', icon: Truck, adminOnly: true },
    { id: 'sales-ledger', label: language === 'english' ? 'Sales Ledger' : 'விற்பனை லெட்ஜர்', icon: ClipboardList, adminOnly: true },
    { id: 'amount-received', label: language === 'english' ? 'Amount Received' : 'பெற்ற தொகை', icon: Receipt, adminOnly: true },
    { id: 'customer-ledger', label: language === 'english' ? 'Customer Ledger' : 'வாடிக்கையாளர் லெட்ஜர்', icon: Book, adminOnly: true },
    { id: 'admin-delete', label: language === 'english' ? 'Delete Entry' : 'என்ட்ரி நீக்கு', icon: Trash2, adminOnly: true },
    { id: 'customers', label: language === 'english' ? 'Customers' : 'வாடிக்கையாளர்கள்', icon: Users },
    { id: 'items', label: language === 'english' ? 'Items' : 'பொருட்கள்', icon: Package },
    { id: 'reports', label: language === 'english' ? 'Reports' : 'அறிக்கைகள்', icon: BarChart3 },
  ];

  const salesMenuItems = [
    { 
      id: 'bills', 
      label: language === 'english' ? 'Bills Management' : 'பில் மேலாண்மை', 
      path: '/bills',
      icon: FileText, 
      adminOnly: true
    },
    { 
      id: 'debit-note', 
      label: language === 'english' ? 'Debit Note' : 'டெபிட் குறிப்பு', 
      path: '/debit-note',
      icon: Plus, 
      adminOnly: true
    },
    { 
      id: 'credit-note', 
      label: language === 'english' ? 'Credit Note' : 'கிரெடிட் குறிப்பு', 
      path: '/credit-note',
      icon: Minus, 
      adminOnly: true
    },
  ];

  const purchaseMenuItems = [
    { 
      id: 'suppliers', 
      label: language === 'english' ? 'Suppliers' : 'சப்ளையர்கள்', 
      path: '/suppliers',
      icon: Users, 
      adminOnly: true
    },
    { 
      id: 'purchases', 
      label: language === 'english' ? 'Purchases' : 'கொள்முதல்', 
      path: '/purchases',
      icon: ShoppingCart, 
      adminOnly: true
    },
    { 
      id: 'supplier-ledger', 
      label: language === 'english' ? 'Supplier Ledger' : 'சப்ளையர் லெட்ஜர்', 
      path: '/supplier-ledger',
      icon: Book, 
      adminOnly: true
    },
    { 
      id: 'stock-ledger', 
      label: language === 'english' ? 'Stock Ledger' : 'ஸ்டாக் லெட்ஜர்', 
      path: '/stock-ledger',
      icon: Package, 
      adminOnly: true
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpenMobile(false);
    setOpen(false);
  };


  return (
    <Sidebar className="border-r">
      <SidebarContent>
        <SidebarMenu className="pt-4">
          {/* Main App Tabs - Navigate to home page */}
          {mainAppTabs.filter(tab => !tab.adminOnly || isAdmin).map((tab) => {
            const Icon = tab.icon;
            return (
              <SidebarMenuItem key={tab.id}>
                <SidebarMenuButton 
                  onClick={() => navigateToHomeTab(tab.id)}
                  className="w-full justify-start"
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}

          {/* Sales & Bills Section */}
          {salesMenuItems.filter(item => !item.adminOnly || isAdmin).map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton 
                  onClick={() => handleNavigation(item.path)}
                  className="w-full justify-start"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}

          {/* Purchase Management Section */}
          {purchaseMenuItems.filter(item => !item.adminOnly || isAdmin).map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton 
                  onClick={() => handleNavigation(item.path)}
                  className="w-full justify-start"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          
          {/* Language Toggle */}
          <SidebarMenuItem>
            <div className="px-2 py-1">
              <LanguageToggle />
            </div>
          </SidebarMenuItem>
          
          {/* Logout button */}
          <SidebarMenuItem className="mt-auto">
            <SidebarMenuButton 
              onClick={signOut}
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span>{language === 'english' ? 'Logout' : 'வெளியேறு'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};

const PageHeader = ({ title }: { title?: string }) => {
  const { toggleSidebar } = useSidebar();
  const { language } = useLanguage();

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          title={language === 'english' ? 'Toggle Menu' : 'மெனுவை மாற்று'}
        >
          <Menu className="h-5 w-5" />
        </Button>
        {title && <h1 className="text-lg font-semibold">{title}</h1>}
      </div>
    </header>
  );
};

export const PageLayout: React.FC<PageLayoutProps> = ({ children, title }) => {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <NavigationSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <PageHeader title={title} />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
