import type { ScreenRegistry } from "../../screenRegistry";
import { AiScreen } from "./AiScreen";
import { JobBoardScreen } from "./BoardScreen";
import { MethodScreen, TemplateScreen } from "./CreateScreens";
import { DetailScreen } from "./DetailScreen";
import { InvitesScreen } from "./InvitesScreen";
import { MyPostsScreen } from "./MyPostsScreen";
import { PosApplicationsScreen } from "./PosApplicationsScreen";
import { PosHiringScreen } from "./PosHiringScreen";
import { PosSuggestionsScreen } from "./PosSuggestionsScreen";
import { ProfileScreen } from "./ProfileScreen";
import { StepsScreen } from "./StepsScreen";

export const screens: ScreenRegistry = {
  "S02-01": JobBoardScreen,
  "S02-02": ProfileScreen,
  "S02-03": MethodScreen,
  "S02-04": TemplateScreen,
  "S02-05": AiScreen,
  "S02-06": StepsScreen,
  "S02-07": MyPostsScreen,
  "S02-08": InvitesScreen,
  "S02-09": DetailScreen,
  "S02-10": PosHiringScreen,
  "S02-11": PosSuggestionsScreen,
  "S02-12": PosApplicationsScreen,
};
