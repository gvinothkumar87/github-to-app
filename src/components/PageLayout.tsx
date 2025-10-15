import React from 'react';
import { Menu, LogOut, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
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

  const menuItems = [
    { id: 'home', label: language === 'english' ? 'Home' : 'முகப்பு', path: '/', icon: Home },
  ];

  return (
    <Sidebar className="border-r">
      <SidebarContent>
        <SidebarMenu className="pt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton 
                  onClick={() => {
                    navigate(item.path);
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
          
          <SidebarMenuItem>
            <div className="px-2 py-1">
              <LanguageToggle />
            </div>
          </SidebarMenuItem>
          
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
