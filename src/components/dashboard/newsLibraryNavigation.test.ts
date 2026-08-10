import {
  buildDashboardMenuPath,
  DASHBOARD_MENU_ID,
  getDashboardMenuLocalizedLabel,
  MENU_ITEMS,
  MERCHANT_SIDEBAR_MENU_ITEMS,
} from './constants'

describe('dashboard News & Library navigation', () => {
  it('exposes News & Library as an owner sidebar item', () => {
    const menuId = DASHBOARD_MENU_ID.newsLibrary
    const menuItem = MENU_ITEMS.find((item) => item.id === menuId)
    const merchantSidebarIds = MERCHANT_SIDEBAR_MENU_ITEMS.map((item) => item.id)

    expect(menuId).toBe('news-library')
    expect(menuItem?.label).toBe('News & Library')
    expect(merchantSidebarIds).toContain(menuId)
    expect(buildDashboardMenuPath(menuId)).toBe('/dashboard/news-library')
  })

  it('localizes the News & Library menu label', () => {
    const translate = vi.fn((key: string) =>
      key === 'dashboard.menu.news_library' ? 'Tin tức & Thư viện' : key,
    )

    expect(
      getDashboardMenuLocalizedLabel(
        DASHBOARD_MENU_ID.newsLibrary,
        translate,
        'News & Library',
      ),
    ).toBe('Tin tức & Thư viện')
    expect(translate).toHaveBeenCalledWith('dashboard.menu.news_library')
  })
})
