import React from 'react'
import { TourCatalog } from '../components/tour/TourCatalog'

const ToursByRegionPage: React.FC = () => {
  return (
    <main className="flex-grow pt-16 pb-16 px-4 md:px-8 lg:px-16 container mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Explore Trekking Tours</h1>
        <p className="text-text-secondary">Browse all available tours, search, and filter by your preferences.</p>
      </div>
      <TourCatalog />
    </main>
  )
}

export default ToursByRegionPage

