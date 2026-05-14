import { prisma } from '../lib/prisma';

async function main() {
  console.log('Seeding data...');

  // Create some global trading signals
  const signals = [
    {
      symbol: 'TSLA',
      signal: 'BUY',
      confidence: 82,
      priceTarget: 195.00,
    },
    {
      symbol: 'AAPL',
      signal: 'WATCH',
      confidence: 65,
      priceTarget: 180.00,
    },
    {
      symbol: 'NVDA',
      signal: 'BUY',
      confidence: 91,
      priceTarget: 1050.00,
    },
    {
      symbol: 'BTC',
      signal: 'HOLD',
      confidence: 50,
      priceTarget: 72000.00,
    }
  ];

  for (const signal of signals) {
    await prisma.tradingSignal.create({
      data: signal,
    });
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
