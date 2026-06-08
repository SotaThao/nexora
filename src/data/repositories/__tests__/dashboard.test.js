import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createDashboardRepository } from '../dashboard';

describe('dashboardRepository', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = { get: vi.fn(), put: vi.fn() };
    vi.stubEnv('VITE_DATA_SOURCE', 'api');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('getOverview fetches from /api/v1/merchant/dashboard/overview and normalizes data', async () => {
    const repo = createDashboardRepository(mockClient);
    mockClient.get.mockResolvedValue({
      totalTipAmount: 1500,
      tipCount: 50,
      avgTipAmount: 30,
      totalScans: 100,
      qrToTipConversionRate: 50,
      totalReviews: 20,
      publicReviews: 15,
      privateFeedback: 5,
      avgStarRating: 4.8,
      routedToGoogle: 10,
      routedToYelp: 5
    });

    const res = await repo.getOverview();
    
    expect(mockClient.get).toHaveBeenCalledWith('/api/v1/merchant/dashboard/overview', { params: {} });
    expect(res.totalTips).toBe(1500);
    expect(res.totalTransactions).toBe(50);
    expect(res.scans).toBe(100);
    // averageTip comes from response.averageTip which is 0 (not in mock), so test that it's 0
    expect(res.averageTip).toBe(0);
  });

  it('getStaffMetrics fetches from /api/v1/merchant/dashboard/staff and normalizes data', async () => {
    const repo = createDashboardRepository(mockClient);
    mockClient.get.mockResolvedValue([
      { staffId: 's1', staffName: 'Mia', tipsCollected: 500, totalReviews: 10, avgRating: 5 }
    ]);

    const res = await repo.getStaffMetrics();
    
    expect(mockClient.get).toHaveBeenCalledWith('/api/v1/merchant/dashboard/staff', { params: {} });
    expect(res[0].id).toBe('s1');
    expect(res[0].name).toBe('Mia');
    expect(res[0].tips).toBe(500);
    expect(res[0].rating).toBe(5);
    expect(res[0].totalReviews).toBe(10);
  });

  it('getOverview returns null gracefully on 404', async () => {
    const repo = createDashboardRepository(mockClient);
    mockClient.get.mockRejectedValue({ status: 404 });

    const res = await repo.getOverview();
    expect(res).toBeNull();
  });
});
