import React from 'react';
import { Truck, Package, Users, ClipboardList, BarChart3, Menu, Scale, LogOut, ShoppingCart, Receipt, Book, FileText, Plus, Minus, Trash2, Home, Settings, Lock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { usePageAccess } from '@/hooks/usePageAccess';
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
  const location = useLocation();
  const { isAdmin } = useAdminCheck();
  const { checkAccess, loading } = usePageAccess();

  // Helper to check access for tabs (prefixed with index:)
  const canAccessTab = (tabId: string) => {
    if (loading) return false;
    // Map tab IDs to routes as defined in app_pages seeding
    const route = `index:${tabId}`;
    return checkAccess(route);
  };

  const allTabs = [
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
  ].filter(tab => canAccessTab(tab.id));

  const navigationItems = [
    {
      id: 'bills',
      label: language === 'english' ? 'Bills Management' : 'பில் மேலாண்மை',
      icon: FileText,
      adminOnly: true,
      isNavigation: true,
      onClick: () => navigate('/bills'),
      route: '/bills'

    },
    {
      id: 'debit-note',
      label: language === 'english' ? 'Debit Note' : 'டெபிட் குறிப்பு',
      icon: Plus,
      adminOnly: true,
      isNavigation: true,
      onClick: () => navigate('/debit-note'),
      route: '/debit-note'
    },
    {
      id: 'credit-note',
      label: language === 'english' ? 'Credit Note' : 'கிரெடிட் குறிப்பு',
      icon: Minus,
      adminOnly: true,
      isNavigation: true,
      onClick: () => navigate('/credit-note'),
      route: '/credit-note'
    },
  ].filter(item => checkAccess(item.route));

  const purchaseMenuItems = [
    {
      id: 'suppliers',
      label: language === 'english' ? 'Suppliers' : 'சப்ளையர்கள்',
      icon: Users,
      adminOnly: true,
      isNavigation: true,
      onClick: () => navigate('/suppliers'),
      route: '/suppliers'
    },
    {
      id: 'purchases',
      label: language === 'english' ? 'Purchases' : 'கொள்முதல்',
      icon: ShoppingCart,
      adminOnly: true,
      isNavigation: true,
      onClick: () => navigate('/purchases'),
      route: '/purchases'
    },
    {
      id: 'supplier-ledger',
      label: language === 'english' ? 'Supplier Ledger' : 'சப்ளையர் லெட்ஜர்',
      icon: Book,
      adminOnly: true,
      isNavigation: true,
      onClick: () => navigate('/supplier-ledger'),
      route: '/supplier-ledger'
    },
    {
      id: 'stock-ledger',
      label: language === 'english' ? 'Stock Ledger' : 'ஸ்டாக் லெட்ஜர்',
      icon: Package,
      adminOnly: true,
      isNavigation: true,
      onClick: () => navigate('/stock-ledger'),
      route: '/stock-ledger'
    },
    {
      id: 'gst-export',
      label: language === 'english' ? 'GST Export' : 'GST ஏற்றுமதி',
      icon: FileText,
      adminOnly: true,
      isNavigation: true,
      onClick: () => navigate('/gst-export'),
      route: '/gst-export'
    },
    {
      id: 'company-settings',
      label: language === 'english' ? 'Company Settings' : 'நிறுவன அமைப்புகள்',
      icon: Settings,
      adminOnly: true,
      isNavigation: true,
      onClick: () => navigate('/company-settings'),
      route: '/company-settings'
    },
  ].filter(item => checkAccess(item.route));

  if (isAdmin) {
    purchaseMenuItems.push({
      id: 'page-access',
      label: language === 'english' ? 'Page Access' : 'பக்க அணுகல்',
      icon: Lock,
      adminOnly: true,
      isNavigation: true,
      onClick: () => navigate('/page-access'),
      route: '/page-access'
    });
  }

  return (
    <Sidebar collapsible="icon" className="bg-white border-r border-gray-200">
      <SidebarContent className="bg-white">
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate">
            {language === 'english' ? 'Sales' : 'விற்பனை'}
          </h1>
          <SidebarTrigger className="md:hidden" />
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          <SidebarMenu>
            {allTabs.map((tab) => (
              <SidebarMenuItem key={tab.id}>
                <SidebarMenuButton
                  onClick={() => {
                    if (activeTab !== tab.id) {
                      onTabChange(tab.id);
                      if (window.innerWidth < 768) {
                        setOpenMobile(false);
                      }
                    }
                  }}
                  isActive={activeTab === tab.id}
                  className={`w-full justify-start px-4 py-3 h-auto transition-all duration-200 group relative overflow-hidden ${activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <tab.icon className={`mr-3 h-5 w-5 transition-transform duration-200 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'
                    }`} />
                  <span className="text-lg font-medium">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>

          {/* Navigation Items Section */}
          {(navigationItems.length > 0 || purchaseMenuItems.length > 0) && (
            <>
              <div className="px-4 py-2">
                <div className="h-px bg-gray-100" />
                <p className="mt-4 mb-2 px-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  {language === 'english' ? 'Management' : 'மேலாண்மை'}
                </p>
              </div>
              <SidebarMenu>
                {[...navigationItems, ...purchaseMenuItems].map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => {
                        item.onClick();
                        if (window.innerWidth < 768) {
                          setOpenMobile(false);
                        }
                      }}
                      isActive={location.pathname === item.route}
                      className={`w-full justify-start px-4 py-3 h-auto transition-all duration-200 group relative ${location.pathname === item.route
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      <span className="text-lg font-medium">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-2 mt-auto">
          <LanguageToggle />
          <SidebarMenuButton
            onClick={() => signOut()}
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50/50"
          >
            <LogOut className="mr-3 h-5 w-5" />
            <span className="text-lg font-medium">{language === 'english' ? 'Sign Out' : 'வெளியேறு'}</span>
          </SidebarMenuButton>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {


  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-svh w-full bg-gray-50">
        <AppSidebar activeTab={activeTab} onTabChange={onTabChange} />
        <main className="flex-1 overflow-y-auto w-full relative">
          <SidebarTrigger className="absolute top-4 left-4 z-50 md:hidden bg-white shadow-md rounded-lg p-2" />
          <div className="p-4 md:p-8 w-full animate-fade-in pb-20 md:pb-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}