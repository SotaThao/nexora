import React from 'react'
import { Wine, GlassWater, Coffee, Sparkles, Check, HeartHandshake } from 'lucide-react'
import { SitePalette } from '../palettes'

interface VipAmenitiesSectionProps {
  palette: SitePalette
  isMobileView?: boolean
}

interface DrinkItem {
  id: string
  name: string
  recipe: string
  tag?: string
}

const SIGNATURE_DRINKS = [
  {
    id: 'd1',
    name: 'Screwdriver Signature',
    tag: 'POPULAR COCKTAIL',
    ingredients: 'Premium Vodka & nước cam tươi hữu cơ ép lạnh',
    icon: Wine,
    gradient: 'from-amber-500/20 to-orange-500/20'
  },
  {
    id: 'd2',
    name: 'Tequila Sunrise',
    tag: 'HOUSE SPECIAL',
    ingredients: 'Tequila thượng hạng hòa quyện siro lựu đỏ & cam vàng',
    icon: GlassWater,
    gradient: 'from-rose-500/20 to-amber-500/20'
  },
  {
    id: 'd3',
    name: 'Complimentary Champagne',
    tag: 'CELEBRATION',
    ingredients: 'Rượu vang nổ sủi bọt cao cấp ướp lạnh ly pha lê',
    icon: Sparkles,
    gradient: 'from-amber-400/20 to-yellow-600/20'
  }
]

const FULL_BAR_MENU: DrinkItem[] = [
  { id: 'm1', name: 'Pina Colada', recipe: 'Rượu rum trắng, kem dừa béo ngậy & dứa tươi nhiệt đới', tag: 'Cocktail' },
  { id: 'm2', name: 'Cosmopolitan', recipe: 'Vodka, rượu mùi cam cao cấp, nước ép nam việt quất & chanh', tag: 'Cocktail' },
  { id: 'm3', name: 'Pink Barbie', recipe: 'Malibu coconut rum, siro dâu tây, nước cốt chanh & soda', tag: 'Cocktail' },
  { id: 'm4', name: 'Jack & Tennessee Coke', recipe: 'Rượu Tennessee Whiskey thượng hạng và nước ngọt có ga', tag: 'Cocktail' },
  { id: 'm5', name: 'Trà Hoa Cúc Mật Ong', recipe: 'Trà thảo mộc hữu cơ thanh lọc, mật ong hoa nhãn (Non-alcohol)', tag: 'Mocktail' },
  { id: 'm6', name: 'Cà Phê Ý & Cappuccino', recipe: 'Cà phê hạt Arabica nguyên chất pha máy, bọt sữa mịn', tag: 'Hot Drinks' }
]

export const VipAmenitiesSection: React.FC<VipAmenitiesSectionProps> = ({
  palette,
  isMobileView
}) => {
  return (
    <section
      className={`w-full transition-colors border-b relative overflow-hidden ${
        isMobileView ? 'py-10 px-4' : 'py-16 px-4 sm:px-6 lg:px-8'
      }`}
      style={{
        backgroundColor: palette.bgSurface,
        borderColor: palette.borderPrimary,
        color: palette.textPrimary
      }}
    >
      {/* Decorative Glow */}
      <div
        className="absolute top-1/2 -left-32 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ backgroundColor: palette.accentColor }}
      />

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-xs"
            style={{
              backgroundColor: palette.badgeBg,
              borderColor: palette.borderPrimary,
              color: palette.badgeText
            }}
          >
            <Wine className="w-3.5 h-3.5" />
            <span>ĐẶC QUYỀN THƯ GIÃN HOÀNG GIA</span>
          </div>

          <h2 className={`font-black tracking-tight ${isMobileView ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>
            Complimentary Drinks & Bar Lounge
          </h2>

          <p className="text-sm sm:text-base leading-relaxed" style={{ color: palette.textSecondary }}>
            Nâng tầm trải nghiệm làm đẹp với menu cocktail, champagne, trà hữu cơ và đồ uống phục vụ hoàn toàn miễn phí trong suốt liệu trình chăm sóc của bạn.
          </p>
        </div>

        {/* Top 3 Signature Drink Cards */}
        <div className={`grid gap-6 ${isMobileView ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
          {SIGNATURE_DRINKS.map((drink) => {
            const Icon = drink.icon
            return (
              <div
                key={drink.id}
                className="p-6 rounded-3xl border shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-1 group relative overflow-hidden"
                style={{
                  backgroundColor: palette.bgPrimary,
                  borderColor: palette.borderPrimary
                }}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${drink.gradient} rounded-bl-full pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity`} />

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs"
                      style={{
                        backgroundColor: palette.badgeBg,
                        borderColor: palette.borderPrimary,
                        color: palette.accentColor
                      }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {drink.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold tracking-tight mb-1">
                      {drink.name}
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: palette.textSecondary }}>
                      {drink.ingredients}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t flex items-center justify-between relative z-10 text-[11px] font-bold" style={{ borderColor: palette.borderPrimary }}>
                  <span className="text-emerald-500 inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Miễn Phí 100%
                  </span>
                  <span style={{ color: palette.accentColor }}>VIP Service</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Curated Lounge Menu List */}
        <div
          className="p-6 sm:p-8 rounded-3xl border shadow-xs space-y-6"
          style={{
            backgroundColor: palette.bgPrimary,
            borderColor: palette.borderPrimary
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b" style={{ borderColor: palette.borderPrimary }}>
            <div>
              <h4 className="text-base font-bold flex items-center gap-2">
                <Coffee className="w-4 h-4" style={{ color: palette.accentColor }} />
                <span>Menu Đồ Uống Bar & Lounge Tuyển Chọn</span>
              </h4>
              <p className="text-xs pt-0.5" style={{ color: palette.textSecondary }}>
                Yêu cầu chuyên viên salon phục vụ bất kỳ lúc nào trong quá trình làm dịch vụ
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full w-fit">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Phục Vụ Tận Bàn</span>
            </div>
          </div>

          <div className={`grid gap-4 ${isMobileView ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {FULL_BAR_MENU.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                style={{ borderColor: palette.borderPrimary }}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{item.name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: palette.textSecondary }}>
                    {item.recipe}
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-500 shrink-0 mt-0.5">FREE</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
