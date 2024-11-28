import React from 'react'

interface ResponsiveLayoutProps {
  children: React.ReactNode
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <main className="md:col-span-12 lg:col-span-9 xl:col-span-10 p-4">
          {children}
        </main>
      </div>
    </div>
  )
}

export default ResponsiveLayout
