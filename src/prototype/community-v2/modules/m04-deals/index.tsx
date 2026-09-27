import type { ScreenComponent, ScreenRegistry } from "../../screenRegistry";
import { CategoriesScreen } from "./community/CategoriesScreen";
import { ClaimedScreen } from "./community/ClaimedScreen";
import { CouponScreen } from "./community/CouponScreen";
import { DealDetailScreen } from "./community/DealDetailScreen";
import { NearbyScreen } from "./community/NearbyScreen";
import { PublicClaimScreen } from "./community/PublicClaimScreen";
import { WalletScreen } from "./community/WalletScreen";
import { WishlistScreen } from "./community/WishlistScreen";
import { ToastLayer } from "./ui/toast";
import { CheckInScreen } from "./pos/CheckInScreen";
import { CreateProgramScreen } from "./pos/CreateProgramScreen";
import { PosterScreen } from "./pos/PosterScreen";
import { ProgramsScreen } from "./pos/ProgramsScreen";
import { RedeemScreen } from "./pos/RedeemScreen";
import { ReportsScreen } from "./pos/ReportsScreen";

/** Every M04 screen renders the module toast layer (see ui/toast.tsx for why). */
function withToasts(Screen: ScreenComponent): ScreenComponent {
  const Wrapped: ScreenComponent = (props) => (
    <>
      <Screen {...props} />
      <ToastLayer />
    </>
  );
  return Wrapped;
}

const raw: ScreenRegistry = {
  "S04-01": NearbyScreen,
  "S04-02": CategoriesScreen,
  "S04-03": DealDetailScreen,
  "S04-04": ClaimedScreen,
  "S04-05": WalletScreen,
  "S04-06": CouponScreen,
  "S04-07": WishlistScreen,
  "S04-08": PublicClaimScreen,
  "S04-09": ProgramsScreen,
  "S04-10": CreateProgramScreen,
  "S04-11": CheckInScreen,
  "S04-12": RedeemScreen,
  "S04-13": ReportsScreen,
  "S04-14": PosterScreen,
};

/** M04 · Deal & Coupon ↔ POS Promotion — S04-01 … S04-14. */
export const screens: ScreenRegistry = Object.fromEntries(
  Object.entries(raw).map(([id, Screen]) => [id, withToasts(Screen)]),
);
