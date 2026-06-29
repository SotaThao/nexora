import { HomePageBridgeProvider } from './context/HomePageBridgeContext'
import HomePageSections from './sections/HomePageSections'
import './homepage.css'

export default function HomePageView() {
  return (
    <HomePageBridgeProvider>
      <div className="nx-homepage ds-page overflow-x-hidden antialiased">
        <HomePageSections />
      </div>
    </HomePageBridgeProvider>
  )
}
