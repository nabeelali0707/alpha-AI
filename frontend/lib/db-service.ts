import { prisma } from './prisma';

export async function getUserWatchlist(userId: string) {
  return await prisma.watchlist.findMany({
    where: { userId },
    orderBy: { addedAt: 'desc' },
  });
}

export async function getUserHoldings(userId: string) {
  return await prisma.holding.findMany({
    where: { userId },
  });
}

export async function getLatestSignals(limit = 10) {
  return await prisma.tradingSignal.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function addToWatchlist(userId: string, symbol: string) {
  return await prisma.watchlist.upsert({
    where: {
      userId_symbol: { userId, symbol },
    },
    update: {},
    create: { userId, symbol },
  });
}

export async function removeFromWatchlist(userId: string, symbol: string) {
  return await prisma.watchlist.delete({
    where: {
      userId_symbol: { userId, symbol },
    },
  });
}
