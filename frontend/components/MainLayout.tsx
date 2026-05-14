import TopNavBar from './TopNavBar';
import SideNav from './SideNav';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex pt-[72px] h-screen overflow-hidden w-full">
      <SideNav />
      <TopNavBar />
      <main className="flex-1 lg:ml-[260px] flex flex-col overflow-y-auto overflow-x-hidden w-full">
        {children}
      </main>
    </div>
  );
}
