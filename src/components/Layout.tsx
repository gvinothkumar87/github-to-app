import React from 'react';
import { Truck, Package, Users, ClipboardList, BarChart3, Menu, Scale, LogOut, ShoppingCart, Receipt, Book, FileText, Plus, Minus, Trash2 } from 'lucide-react';
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
  const { setOpenMobile } = useSidebar();
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
                  }}
                  className="w-full justify-start"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          
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

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isAdmin = useAdminCheck();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Mobile sidebar */}
        <AppSidebar activeTab={activeTab} onTabChange={onTabChange} />
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="bg-gradient-primary text-primary-foreground shadow-elevated">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="md:hidden bg-white/10 hover:bg-white/20 text-white border-white/20" />
                  <Truck className="h-8 w-8" />
                  <h1 className="text-xl md:text-2xl font-bold">
                    {language === 'english' ? 'Transit Logbook' : 'போக்குவரத்து பதிவேடு'}
                  </h1>
                </div>
                <LanguageToggle />
              </div>
            </div>
          </header>

          {/* Desktop navigation tabs - hidden on mobile */}
          <nav className="hidden md:block bg-card border-b shadow-card">
            <div className="px-4">
              <div className="flex space-x-1 overflow-x-auto">
                {[
                  { id: 'entries', label: language === 'english' ? 'Outward Entries' : 'வெளியீட்டு பதிவுகள்', icon: Truck },
                  { id: 'load-weight', label: language === 'english' ? 'Load Weight' : 'மொத்த எடை', icon: Scale },
                  { id: 'sales', label: language === 'english' ? 'Sales' : 'விற்பனை', icon: ShoppingCart, adminOnly: true },
                  { id: 'sales-ledger', label: language === 'english' ? 'Sales Ledger' : 'விற்பனை லெட்ஜர்', icon: ClipboardList, adminOnly: true },
                  { id: 'amount-received', label: language === 'english' ? 'Amount Received' : 'பெற்ற தொகை', icon: Receipt, adminOnly: true },
                  { id: 'customer-ledger', label: language === 'english' ? 'Customer Ledger' : 'வாடிக்கையாளர் லெட்ஜர்', icon: Book, adminOnly: true },
                  { id: 'customers', label: language === 'english' ? 'Customers' : 'வாடிக்கையாளர்கள்', icon: Users },
                  { id: 'items', label: language === 'english' ? 'Items' : 'பொருட்கள்', icon: Package },
                  { id: 'reports', label: language === 'english' ? 'Reports' : 'அறிக்கைகள்', icon: BarChart3 },
                ].filter(tab => !tab.adminOnly || isAdmin).map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id)}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-primary text-primary bg-primary/5'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
                
                {/* Navigation buttons */}
                {isAdmin && (
                  <>
                    <button
                      onClick={() => navigate('/bills')}
                      className="flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                    >
                      <FileText className="h-4 w-4" />
                      {language === 'english' ? 'Bills Management' : 'பில் மேலாண்மை'}
                    </button>
                    <button
                      onClick={() => navigate('/debit-note')}
                      className="flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                    >
                      <Plus className="h-4 w-4" />
                      {language === 'english' ? 'Debit Note' : 'டெபிட் குறிப்பு'}
                    </button>
                    <button
                      onClick={() => navigate('/credit-note')}
                      className="flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                    >
                      <Minus className="h-4 w-4" />
                      {language === 'english' ? 'Credit Note' : 'கிரெடிட் குறிப்பு'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 px-4 py-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};