// Every Time Clock string lives under one namespace — building keys through tk() keeps the prefix
// in a single place instead of repeating it inline in each of the five components.
const I18N_PREFIX = 'components.dashboard.views.pos.TimeClock'

export const tk = (suffix: string) => `${I18N_PREFIX}.${suffix}`
