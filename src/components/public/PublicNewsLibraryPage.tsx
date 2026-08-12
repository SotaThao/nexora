import NewsLibraryView from '../dashboard/views/NewsLibraryView'
import { HomePageBridgeProvider } from '../homepage/context/HomePageBridgeContext'
import HomePageAuthenticatedLayout from '../homepage/layout/HomePageAuthenticatedLayout'
import HomePageHeaderSection from '../homepage/sections/HomePageHeaderSection'
import '../homepage/homepage.css'

export default function PublicNewsLibraryPage() {
  return (
    <HomePageBridgeProvider mode="header-only">
      <HomePageAuthenticatedLayout>
        <div className="nx-homepage ds-page min-h-dvh overflow-x-hidden bg-nexoraCanvas antialiased">
          <HomePageHeaderSection />
          <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <NewsLibraryView showMobileHeading />
          </div>
        </div>
      </HomePageAuthenticatedLayout>
    </HomePageBridgeProvider>
  )
}
