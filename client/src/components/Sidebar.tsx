import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PieChart, 
  TrendingUp, 
  Settings, 
  Wallet, 
  History
} from 'lucide-react';

interface SidebarItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const sidebarItems: SidebarItem[] = [
  {
    to: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    label: 'Dashboard',
  },
  {
    to: '/portfolio',
    icon: <PieChart className="w-5 h-5" />,
    label: 'Portfolio',
  },
  {
    to: '/market',
    icon: <TrendingUp className="w-5 h-5" />,
    label: 'Market',
  },
  {
    to: '/settings',
    icon: <Settings className="w-5 h-5" />,
    label: 'Settings',
  },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="fixed left-0 top-16 w-64 h-full bg-white border-r border-gray-200 z-40">
      <nav className="p-6">
        <ul className="space-y-2">
          {sidebarItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Quick Stats Section */}
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Wallet className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Quick Stats</span>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Total Portfolio</div>
            <div className="text-lg font-bold text-gray-900">$0.00</div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-6">
          <div className="flex items-center space-x-2 mb-3">
            <History className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Recent Activity</span>
          </div>
          <div className="text-xs text-gray-500 text-center py-4">
            No recent transactions
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;