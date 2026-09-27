import type { ScreenRegistry } from "../../screenRegistry";
import { migrateM01 } from "../../store/slices/m01";
import { StepContent } from "./composer/StepContent";
import { StepDestinations } from "./composer/StepDestinations";
import { FeaturedPaymentScreen, StepFeatured } from "./composer/StepFeatured";
import { CreateGroupScreen } from "./CreateGroupScreen";
import { FeedScreen } from "./FeedScreen";
import { GroupDetailScreen } from "./GroupDetailScreen";
import { GroupsScreen } from "./GroupsScreen";
import { MarketDetailScreen } from "./MarketDetailScreen";
import { MarketScreen } from "./MarketScreen";
import { withToasts } from "./toast";

// Persisted states from the earlier draft used a different post/group shape.
migrateM01();

export const screens: ScreenRegistry = {
  "S01-01": withToasts(FeedScreen),
  "S01-02": withToasts(StepContent),
  "S01-03": withToasts(StepDestinations),
  "S01-04": withToasts(StepFeatured),
  "S01-05": withToasts(GroupsScreen),
  "S01-06": withToasts(GroupDetailScreen),
  "S01-07": withToasts(CreateGroupScreen),
  "S01-08": withToasts(MarketScreen),
  "S01-09": withToasts(MarketDetailScreen),
  "S01-10": withToasts(FeaturedPaymentScreen),
};
