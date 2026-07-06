import { HomePageBridgeProvider } from './context/HomePageBridgeContext'
import HomePageAuthenticatedLayout from './layout/HomePageAuthenticatedLayout'
import HomePageSections from './sections/HomePageSections'
import './homepage.css'

export default function HomePageView() {
  return (
    <HomePageBridgeProvider>
      <HomePageAuthenticatedLayout>
        <div className="nx-homepage ds-page overflow-x-hidden antialiased">
          <HomePageSections />
        </div>
      </HomePageAuthenticatedLayout>
    </HomePageBridgeProvider>
  )
}
