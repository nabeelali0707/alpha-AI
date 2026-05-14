import MainLayout from '@/components/MainLayout';
import DashboardClient from './DashboardClient';
import { createClient } from '@/lib/supabase/server';
import { getLatestSignals, getUserWatchlist, getUserHoldings } from '@/lib/db-service';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null; // Middleware handles redirect
  }

  const [signals, watchlist, holdings] = await Promise.all([
    getLatestSignals(5),
    getUserWatchlist(user.id),
    getUserHoldings(user.id),
  ]);

  return (
    <MainLayout>
      <DashboardClient 
        initialSignals={signals} 
        initialWatchlist={watchlist} 
        initialHoldings={holdings} 
      />
    </MainLayout>
  );
}
