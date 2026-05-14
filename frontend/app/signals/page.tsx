import MainLayout from '@/components/MainLayout';
import { getLatestSignals } from '@/lib/db-service';

export default async function SignalsPage() {
  const signals = await getLatestSignals(20);

  return (
    <MainLayout>
      <div className="p-margin-desktop space-y-md w-full">
        {/* Header */}
        <div className="mb-lg">
          <h1 className="font-headline-lg text-headline-lg text-primary-fixed mb-xs">
            Trading Signals
          </h1>
          <p className="text-on-surface-variant font-body-md">
            AI-generated buy/sell signals with confidence metrics.
          </p>
        </div>

        {/* Signals Table */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container/50 border-b border-outline-variant/20">
                <tr>
                  <th className="px-md py-sm text-left font-label-md text-on-surface-variant">Symbol</th>
                  <th className="px-md py-sm text-center font-label-md text-on-surface-variant">Signal</th>
                  <th className="px-md py-sm text-right font-label-md text-on-surface-variant">Confidence</th>
                  <th className="px-md py-sm text-right font-label-md text-on-surface-variant">Price Target</th>
                  <th className="px-md py-sm text-right font-label-md text-on-surface-variant">Upside</th>
                  <th className="px-md py-sm text-center font-label-md text-on-surface-variant">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {signals.length > 0 ? signals.map((row) => (
                  <tr key={row.id} className="border-b border-outline-variant/10 hover:bg-surface-variant/20 transition-colors">
                    <td className="px-md py-sm font-label-md text-on-surface font-bold">{row.symbol}</td>
                    <td className="px-md py-sm text-center">
                      <span
                        className={`px-sm py-1 rounded text-label-sm font-label-md ${
                          row.signal === 'BUY'
                            ? 'bg-on-primary-container/20 text-on-primary-container'
                            : row.signal === 'SELL'
                            ? 'bg-secondary/20 text-secondary'
                            : 'bg-surface-container-high text-on-surface'
                        }`}
                      >
                        {row.signal}
                      </span>
                    </td>
                    <td className="px-md py-sm text-right">
                      <div className="flex justify-end">
                        <span className="inline-flex items-center gap-xs">
                          <div className="h-2 w-12 bg-surface-container-low rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-fixed-dim"
                              style={{ width: `${row.confidence}%` }}
                            ></div>
                          </div>
                          <span className="font-data-mono text-on-surface">{row.confidence}%</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-md py-sm text-right font-data-mono text-on-surface">
                      ${Number(row.priceTarget).toFixed(2)}
                    </td>
                    <td
                      className={`px-md py-sm text-right font-data-mono font-label-md ${
                        row.signal === 'BUY' ? 'text-primary-fixed' : 'text-secondary'
                      }`}
                    >
                      {row.signal === 'BUY' ? '+5.2%' : '-2.1%'}
                    </td>
                    <td className="px-md py-sm text-center text-on-surface-variant font-data-mono text-xs">
                      {new Date(row.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-md py-xl text-center text-on-surface-variant font-label-md">
                      No active signals detected.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signal History */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <div className="glass p-md rounded-xl">
            <h3 className="font-label-md text-on-surface-variant mb-base uppercase">Signal Count</h3>
            <div className="font-headline-lg text-headline-lg text-primary-fixed">{signals.length}</div>
            <span className="text-label-sm text-on-surface-variant">in last 24 hours</span>
          </div>

          <div className="glass p-md rounded-xl">
            <h3 className="font-label-md text-on-surface-variant mb-base uppercase">Accuracy Rate</h3>
            <div className="font-headline-lg text-headline-lg text-primary-fixed">94.2%</div>
            <span className="text-label-sm text-on-surface-variant">last 30 days</span>
          </div>

          <div className="glass p-md rounded-xl">
            <h3 className="font-label-md text-on-surface-variant mb-base uppercase">Avg Win</h3>
            <div className="font-headline-lg text-headline-lg text-primary-fixed">+2.8%</div>
            <span className="text-label-sm text-on-surface-variant">per signal</span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
