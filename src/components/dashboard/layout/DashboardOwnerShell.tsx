import type { ComponentProps } from 'react'
import Dashboard from '../../Dashboard'
import MerchantDirectPaymentsWatcher from '../MerchantDirectPaymentsWatcher'

type DashboardOwnerShellProps = ComponentProps<typeof Dashboard>

export default function DashboardOwnerShell(props: DashboardOwnerShellProps) {
  return (
    <>
      <MerchantDirectPaymentsWatcher />
      <Dashboard {...props} />
    </>
  )
}
