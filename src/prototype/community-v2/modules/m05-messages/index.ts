import type { ScreenRegistry } from "../../screenRegistry";
import { subscribeSimulation } from "../../events";
import { getState } from "../../store";
import { receiveIncoming } from "../../store/slices/m05";
import {
  CallScreen, CommunityScreen, FindScreen, GroupCallScreen, HistoryScreen, IdScreen, InboxScreen, IncomingScreen,
  PrivacyRoute, RequestScreen, RoomScreen, SalonScreen,
} from "./screens";
import { paths } from "./lib";

export const screens: ScreenRegistry = {
  "S05-01": InboxScreen,
  "S05-02": RoomScreen,
  "S05-03": RequestScreen,
  "S05-04": SalonScreen,
  "S05-05": CommunityScreen,
  "S05-06": FindScreen,
  "S05-07": CallScreen,
  "S05-08": CallScreen,
  "S05-09": IncomingScreen,
  "S05-10": HistoryScreen,
  "S05-11": GroupCallScreen,
  "S05-12": PrivacyRoute,
  "S05-13": IdScreen,
};

// `call.incoming` (demo bar "Mô phỏng → Có cuộc gọi đến") is owned by M05. The shell does not mount
// module listeners, so subscribe once at module load and route with the History API (BrowserRouter
// listens to popstate) — this works from any Community screen, not only M05 ones.
const FLAG = "__nxc2M05CallListener";
const host = window as unknown as Record<string, boolean>;
if (!host[FLAG]) {
  host[FLAG] = true;
  subscribeSimulation((event) => {
    if (event !== "call.incoming") return;
    const state = getState();
    const viewer = state.currentPersonId ?? "jessica";
    receiveIncoming(viewer === "kayla" ? "jessica" : "kayla", "voice");
    if (window.location.pathname !== paths.incoming) {
      window.history.pushState({}, "", paths.incoming);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  });
}
