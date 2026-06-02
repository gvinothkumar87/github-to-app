import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Truck, 
  Scale, 
  ShoppingCart, 
  ClipboardList, 
  FileText, 
  Book 
} from 'lucide-react';
import { usePageAccess } from '@/hooks/usePageAccess';
import { useLanguage } from '@/contexts/LanguageContext';

const MobilePurchases: React.FC = () => {
  const navigate = useNavigate();
  const { checkAccess, isAdmin } = usePageAccess();
  const { language } = useLanguage();

  const purchaseModules = [
    {
      title: language === 'english' ? 'Inward Entries' : 'உள்வரும் பதிவுகள்',
      description: language === 'english' ? 'Manage inward entries' : 'உள்வரும் பதிவுகளை நிர்வகிக்க',
      icon: Truck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/purchases/inward',
      accessKey: 'index:purchase-inward-entries'
    },
    {
      title: language === 'english' ? 'Empty Weight' : 'காலி எடை',
      description: language === 'english' ? 'Update empty weight' : 'காலி எடை புதுப்பிப்பு',
      icon: Scale,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/purchases/empty-weight',
      accessKey: 'index:purchase-empty-weight'
    },
    {
      title: language === 'english' ? 'Direct Purchase' : 'நேரடி கொள்முதல்',
      description: language === 'english' ? 'Create direct purchases' : 'நேரடி கொள்முதல் உருவாக்க',
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/purchases/direct',
      accessKey: 'index:purchase-direct'
    },
    {
      title: language === 'english' ? 'Purchase from Transit' : 'போக்குவரத்து கொள்முதல்',
      description: language === 'english' ? 'Create purchase from entries' : 'பதிவுகளிலிருந்து கொள்முதல்',
      icon: Truck,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      href: '/purchases/from-transit',
      accessKey: 'index:purchase-from-transit'
    },
    {
      title: language === 'english' ? 'Purchase List' : 'கொள்முதல் பட்டியல்',
      description: language === 'english' ? 'View all purchases' : 'அனைத்து கொள்முதல்களை பார்க்க',
      icon: ClipboardList,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      href: '/purchases/list',
      accessKey: 'index:purchase-list'
    },
    {
      title: language === 'english' ? 'Purchase Bills' : 'கொள்முதல் பில்கள்',
      description: language === 'english' ? 'Manage bills & invoices' : 'பில்களை நிர்வகிக்க',
      icon: FileText,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      href: '/purchases/bills',
      accessKey: 'index:purchase-bills'
    },
    {
      title: language === 'english' ? 'Supplier Ledger' : 'சப்ளையர் லெட்ஜர்',
      description: language === 'english' ? 'View supplier accounts' : 'கணக்குகளை பார்க்க',
      icon: Book,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      href: '/purchases/supplier-ledger',
      accessKey: 'index:purchase-supplier-ledger'
    }
  ];

  const filteredModules = purchaseModules.filter(module => isAdmin || checkAccess(module.accessKey));

  return (
    <MobileLayout title={language === 'english' ? 'Purchases Hub' : 'கொள்முதல் மையம்'} showBackButton onBack={() => navigate('/')}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {filteredModules.map((module) => (
            <Card
              key={module.title}
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => navigate(module.href)}
            >
              <CardContent className="p-4">
                <div className={`inline-flex p-2 rounded-lg ${module.bgColor} mb-3`}>
                  <module.icon className={`h-6 w-6 ${module.color}`} />
                </div>
                <h3 className="font-medium text-sm mb-1">{module.title}</h3>
                <p className="text-xs text-muted-foreground">{module.description}</p>
              </CardContent>
            </Card>
          ))}
          {filteredModules.length === 0 && (
             <div className="col-span-2 text-center text-muted-foreground py-8">
               {language === 'english' ? 'No purchase modules available.' : 'எந்த கொள்முதல் தொகுதிகளும் இல்லை.'}
             </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobilePurchases;
