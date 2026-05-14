import MainLayout from '@/components/MainLayout';
import { createClient } from '@/lib/supabase/server';
import { getUserHoldings } from '@/lib/db-service';

export default async function PortfolioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const holdings = await getUserHoldings(user.id);

  // Calculate totals
  const totalValue = holdings.reduce((acc, h) => acc + (Number(h.quantity) * Number(h.entryPrice)), 0); // Mocking current price as entry price for now

  return (
    <MainLayout>
      <div className="p-margin-mobile md:p-margin-desktop max-w-[1600px] mx-auto w-full">
        {/* Portfolio Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md mb-lg">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary-fixed mb-xs">
              Portfolio Executive
            </h1>
            <p className="text-on-surface-variant font-body-md">
              Real-time valuation and AI-driven risk assessment.
            </p>
          </div>
          <div className="flex gap-sm">
            <button className="px-md py-sm bg-surface-container/40 border border-outline-variant/30 rounded-lg font-label-md text-label-md hover:bg-surface-variant/30 transition-colors">
              Export
            </button>
            <button className="px-md py-sm bg-primary-container text-on-primary-container rounded-lg font-label-md text-label-md hover:brightness-110 transition-all">
              Rebalance
            </button>
          </div>
        </header>

        {/* Portfolio Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-md mb-lg">
          <div className="glass p-md rounded-xl">
            <div className="flex justify-between items-start mb-base">
              <span className="font-label-sm text-on-surface-variant">Total Value</span>
              <span className="text-primary-fixed-dim text-label-sm font-label-sm">+2.31%</span>
            </div>
            <div className="font-headline-lg text-headline-lg text-on-surface mb-base">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="h-6 w-full bg-surface-container-low rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-primary-fixed-dim rounded-full"></div>
            </div>
          </div>

          <div className="glass p-md rounded-xl">
            <span className="font-label-sm text-on-surface-variant block mb-base">Cash Available</span>
            <div className="font-headline-lg text-headline-lg text-on-surface">
              $45,230.00
            </div>
          </div>

          <div className="glass p-md rounded-xl">
            <span className="font-label-sm text-on-surface-variant block mb-base">Daily Return</span>
            <div className="font-headline-lg text-headline-lg text-primary-fixed">
              +$1,952.43
            </div>
          </div>

          <div className="glass p-md rounded-xl">
            <span className="font-label-sm text-on-surface-variant block mb-base">YTD Return</span>
            <div className="font-headline-lg text-headline-lg text-primary-fixed">
              +24.3%
            </div>
          </div>
        </div>

        {/* Holdings Section */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="p-md border-b border-outline-variant/20">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Current Holdings</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container/50 border-b border-outline-variant/20">
                <tr>
                  <th className="px-md py-sm text-left font-label-md text-on-surface-variant">Symbol</th>
                  <th className="px-md py-sm text-right font-label-md text-on-surface-variant">Quantity</th>
                  <th className="px-md py-sm text-right font-label-md text-on-surface-variant">Entry Price</th>
                  <th className="px-md py-sm text-right font-label-md text-on-surface-variant">Current Price</th>
                  <th className="px-md py-sm text-right font-label-md text-on-surface-variant">Value</th>
                  <th className="px-md py-sm text-right font-label-md text-on-surface-variant">Gain/Loss</th>
                </tr>
              </thead>
              <tbody>
                {holdings.length > 0 ? holdings.map((holding) => {
                  const qty = Number(holding.quantity);
                  const entry = Number(holding.entryPrice);
                  const current = entry * 1.05; // Mocking 5% gain
                  const value = qty * current;
                  const gain = value - (qty * entry);
                  
                  return (
                    <tr key={holding.id} className="border-b border-outline-variant/10 hover:bg-surface-variant/20 transition-colors">
                      <td className="px-md py-sm font-label-md text-on-surface">{holding.symbol}</td>
                      <td className="px-md py-sm text-right text-on-surface-variant">{qty}</td>
                      <td className="px-md py-sm text-right text-on-surface-variant font-data-mono">${entry.toFixed(2)}</td>
                      <td className="px-md py-sm text-right text-on-surface font-data-mono">${current.toFixed(2)}</td>
                      <td className="px-md py-sm text-right text-on-surface font-data-mono font-label-md">${value.toLocaleString()}</td>
                      <td className={`px-md py-sm text-right font-data-mono font-label-md ${gain >= 0 ? 'text-primary-fixed' : 'text-secondary'}`}>
                        {gain >= 0 ? '+' : ''}${gain.toLocaleString()}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="px-md py-xl text-center text-on-surface-variant font-label-md">
                      No holdings found. Start by adding assets to your portfolio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md mt-lg">
          <div className="glass p-md rounded-xl">
            <h3 className="font-headline-lg text-headline-lg text-on-surface mb-md">
              Risk Assessment
            </h3>
            <div className="space-y-md">
              <div>
                <div className="flex justify-between mb-sm">
                  <span className="font-label-md text-on-surface-variant">Beta</span>
                  <span className="font-data-mono text-on-surface">1.24</span>
                </div>
                <div className="h-2 bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-primary-fixed-dim"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-sm">
                  <span className="font-label-md text-on-surface-variant">Volatility</span>
                  <span className="font-data-mono text-on-surface">18.2%</span>
                </div>
                <div className="h-2 bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full w-2/5 bg-secondary-fixed-dim"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-sm">
                  <span className="font-label-md text-on-surface-variant">Max Drawdown</span>
                  <span className="font-data-mono text-secondary">-12.5%</span>
                </div>
                <div className="h-2 bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-secondary"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-md rounded-xl">
            <h3 className="font-headline-lg text-headline-lg text-on-surface mb-md">
              Sector Allocation
            </h3>
            <div className="space-y-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-on-surface">Technology</span>
                <span className="font-data-mono text-primary-fixed">45.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-label-md text-on-surface">Consumer</span>
                <span className="font-data-mono text-on-surface">22.8%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-label-md text-on-surface">Financial</span>
                <span className="font-data-mono text-on-surface">18.5%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-label-md text-on-surface">Energy</span>
                <span className="font-data-mono text-secondary">13.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
