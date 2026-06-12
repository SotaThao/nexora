/**
 * Auth adapter — exports the API auth adapter directly.
 * The storage/mock adapter switching has been removed;
 * the app now exclusively uses the real API backend.
 */
import { apiAuthAdapter } from './apiAuthAdapter'

export const authAdapter = apiAuthAdapter
