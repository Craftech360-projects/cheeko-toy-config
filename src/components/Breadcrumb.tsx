import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const breadcrumbMap: { [key: string]: string } = {
    'add-toy': 'Add Toy',
    'settings': 'Settings',
  };

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      <Link to="/" className="flex items-center hover:text-gray-900">
        <Home className="h-4 w-4" />
      </Link>
      
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        
        // Skip numeric IDs in breadcrumb
        if (!isNaN(Number(name))) return null;
        
        return (
          <React.Fragment key={name}>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            {isLast ? (
              <span className="text-gray-900 font-medium">
                {breadcrumbMap[name] || name}
              </span>
            ) : (
              <Link
                to={routeTo}
                className="hover:text-gray-900"
              >
                {breadcrumbMap[name] || name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}