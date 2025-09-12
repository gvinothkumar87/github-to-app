import React from 'react';
import { Truck, Package, Users, ClipboardList, BarChart3, Menu, Scale, LogOut, ShoppingCart, Receipt, Book, FileText, Plus, Minus, Trash2, Home } from 'lucide-react';
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
  SidebarTrigger,
  useSidebar 
} from './ui/sidebar';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AppSidebar = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) => {
  const { language } = useLanguage();
  const { signOut } = useAuth();
  const { setOpenMobile, setOpen } = useSidebar();
  const navigate = useNavigate();
  const isAdmin = useAdminCheck();

  const allTabs = [
    { id: 'entries', label: language === 'english' ? 'Outward Entries' : 'வெளியீட்டு பதிவுகள்', icon: Truck },
    { id: 'load-weight', label: language === 'english' ? 'Load Weight' : 'மொத்த எடை', icon: Scale },
    { id: 'sales', label: language === 'english' ? 'Sales' : 'விற்பனை', icon: ShoppingCart, adminOnly: true },
    { id: 'sales-ledger', label: language === 'english' ? 'Sales Ledger' : 'விற்பனை லெட்ஜர்', icon: ClipboardList, adminOnly: true },
    { id: 'amount-received', label: language === 'english' ? 'Amount Received' : 'பெற்ற தொகை', icon: Receipt, adminOnly: true },
    { id: 'customer-ledger', label: language === 'english' ? 'Customer Ledger' : 'வாடிக்கையாளர் லெட்ஜர்', icon: Book, adminOnly: true },
    { id: 'admin-delete', label: language === 'english' ? 'Delete Entry' : 'என்ட்ரி நீக்கு', icon: Trash2, adminOnly: true },
    { id: 'customers', label: language === 'english' ? 'Customers' : 'வாடிக்கையாளர்கள்', icon: Users },
    { id: 'items', label: language === 'english' ? 'Items' : 'பொருட்கள்', icon: Package },
    { id: 'reports', label: language === 'english' ? 'Reports' : 'அறிக்கைகள்', icon: BarChart3 },
  ];

  const navigationItems = [
    { 
      id: 'bills', 
      label: language === 'english' ? 'Bills Management' : 'பில் மேலாண்மை', 
      icon: FileText, 
      adminOnly: true,
      isNavigation: true,
      onClick: () => navigate('/bills')
    },
    { 
      id: 'debit-note', 
      label: language === 'english' ? 'Debit Note' : 'டெபிட் குறிப்பு', 
      icon: Plus, 
      adminOnly: true,
      isNavigation: true,
      onClick: () => navigate('/debit-note')
    },
    { 
      id: 'credit-note', 
      label: language === 'english' ? 'Credit Note' : 'கிரெடிட் குறிப்பு', 
      icon: Minus, 
      adminOnly: true,
      isNavigation: true,
      onClick: () => navigate('/credit-note')
    },
  ];

  // Filter tabs based on admin status
  const tabs = allTabs.filter(tab => !tab.adminOnly || isAdmin);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setOpenMobile(false); // Close mobile sidebar after selection
    setOpen(false); // Close desktop sidebar after selection
  };

  return (
    <Sidebar className="border-r">
      <SidebarContent>
        <SidebarMenu className="pt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <SidebarMenuItem key={tab.id}>
                <SidebarMenuButton 
                  onClick={() => handleTabClick(tab.id)}
                  isActive={activeTab === tab.id}
                  className="w-full justify-start"
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          
          {/* Navigation items */}
          {navigationItems.filter(item => !item.adminOnly || isAdmin).map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton 
                  onClick={() => {
                    item.onClick();
                    setOpenMobile(false);
                    setOpen(false);
                  }}
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
              <span>{language === 'english' ? 'Logout' : 'வெளியேறু'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isAdmin = useAdminCheck();

  const HomeButton = () => {
    const { toggleSidebar } = useSidebar();
    
    return (
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        title={language === 'english' ? 'Toggle Menu' : 'மெனுவை மாற்று'}
      >
        <Home className="h-5 w-5" />
      </button>
    );
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar */}
        <AppSidebar activeTab={activeTab} onTabChange={onTabChange} />
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Home button - always visible */}
          <div className="p-4 border-b">
            <HomeButton />
          </div>

          {/* Main Content */}
          <main className="flex-1 px-4 py-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};