import React, { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const ResponsiveSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleSidebar = () => setIsOpen(!isOpen)

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Stores', path: '/stores' },
    { name: 'Products', path: '/products' },
    { name: 'Admin', path: '/admin' }
  ]

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button 
        onClick={toggleSidebar} 
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-500 text-white p-2 rounded"
      >
        {isOpen ? <X /> : <Menu />}
      </button>

      {/* Sidebar */}
      <nav 
        className={`
          fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          z-40 pt-16 md:pt-0
        `}
      >
        <div className="space-y-2 px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                block py-2 px-4 rounded 
                ${isActive 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-100'}
              `}
            >
              {item.name}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          onClick={toggleSidebar} 
          className="fixed inset-0 bg-black opacity-50 md:hidden z-30"
        />
      )}
    </>
  )
}

export default ResponsiveSidebar
