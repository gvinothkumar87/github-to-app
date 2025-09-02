import React from 'react';
import { Truck, Package, Users, ClipboardList, BarChart3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from './LanguageToggle';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { language } = useLanguage();

  const tabs = [
    { id: 'entries', label: language === 'english' ? 'Outward Entries' : 'வெளியீட்டு பதிவுகள்', icon: Truck },
    { id: 'customers', label: language === 'english' ? 'Customers' : 'வாடிக்கையாளர்கள்', icon: Users },
    { id: 'items', label: language === 'english' ? 'Items' : 'பொருட்கள்', icon: Package },
    { id: 'load-weight', label: language === 'english' ? 'Load Weight' : 'மொத்த எடை', icon: ClipboardList },
    { id: 'reports', label: language === 'english' ? 'Reports' : 'அறிக்கைகள்', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-primary-foreground shadow-elevated">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8" />
              <h1 className="text-2xl font-bold">
                {language === 'english' ? 'Transit Logbook' : 'போக்குவரத்து பதிவேடு'}
              </h1>
            </div>
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-card border-b shadow-card">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
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
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};