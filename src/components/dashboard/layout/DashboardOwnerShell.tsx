import type { ComponentProps } from 'react'
import Dashboard from '../../Dashboard'

type DashboardOwnerShellProps = ComponentProps<typeof Dashboard>

export default function DashboardOwnerShell(props: DashboardOwnerShellProps) {
  return <Dashboard {...props} />
}
