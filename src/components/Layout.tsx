import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { authStore } from '@/lib/pocketbase';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = authStore.isValid();
  const user = authStore.model();

  const navItems = [
    { path: '/', label: 'Главная', icon: 'Home' },
    { path: '/movies', label: 'Фильмы', icon: 'Film' },
    { path: '/series', label: 'Сериалы', icon: 'Tv' },
    { path: '/genres', label: 'Жанры', icon: 'Grid3X3' },
    { path: '/search', label: 'Поиск', icon: 'Search' },
  ];

  const userNavItems = [
    { path: '/profile', label: 'Профиль', icon: 'User' },
    { path: '/favorites', label: 'Избранное', icon: 'Heart' },
    { path: '/history', label: 'История', icon: 'History' },
  ];

  const isActivePath = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    return path !== '/' && location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center">
                <h1 className="text-2xl font-montserrat font-bold text-primary flex items-center">
                  <Icon name="Film" size={28} className="mr-2" />
                  CinemaMax
                </h1>
              </Link>
              
              <nav className="hidden lg:flex space-x-6">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors font-medium ${
                      isActivePath(item.path)
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    <Icon name={item.icon as any} size={18} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="hidden md:flex space-x-2">
                    {userNavItems.map((item) => (
                      <Link key={item.path} to={item.path}>
                        <Button
                          variant={isActivePath(item.path) ? 'default' : 'ghost'}
                          size="sm"
                          className={isActivePath(item.path) ? 'bg-primary text-primary-foreground' : ''}
                        >
                          <Icon name={item.icon as any} size={18} />
                        </Button>
                      </Link>
                    ))}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground hidden sm:block">
                      Привет, {user?.username}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => authStore.clear()}
                      className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      <Icon name="LogOut" size={16} className="mr-2" />
                      Выйти
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex space-x-2">
                  <Link to="/auth/login">
                    <Button variant="ghost" size="sm">
                      Войти
                    </Button>
                  </Link>
                  <Link to="/auth/register">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      Регистрация
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu */}
              <Button variant="ghost" size="sm" className="lg:hidden">
                <Icon name="Menu" size={20} />
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="lg:hidden mt-4 pt-4 border-t border-border/50">
            <div className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors text-sm ${
                    isActivePath(item.path)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <Icon name={item.icon as any} size={16} />
                  <span>{item.label}</span>
                </Link>
              ))}
              
              {isAuthenticated && userNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors text-sm ${
                    isActivePath(item.path)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <Icon name={item.icon as any} size={16} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border/50 mt-16">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-montserrat font-bold text-foreground mb-4 flex items-center">
                <Icon name="Film" size={24} className="mr-2 text-primary" />
                CinemaMax
              </h4>
              <p className="text-muted-foreground text-sm">
                Ваш источник лучшего контента в мире кино и сериалов.
              </p>
            </div>
            
            <div>
              <h5 className="font-medium text-foreground mb-4">Контент</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/movies" className="hover:text-primary transition-colors">Фильмы</Link></li>
                <li><Link to="/series" className="hover:text-primary transition-colors">Сериалы</Link></li>
                <li><Link to="/genres" className="hover:text-primary transition-colors">Жанры</Link></li>
                <li><Link to="/search" className="hover:text-primary transition-colors">Поиск</Link></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium text-foreground mb-4">Аккаунт</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/profile" className="hover:text-primary transition-colors">Профиль</Link></li>
                <li><Link to="/favorites" className="hover:text-primary transition-colors">Избранное</Link></li>
                <li><Link to="/history" className="hover:text-primary transition-colors">История</Link></li>
                {isAuthenticated && user?.username === 'admin' && (
                  <li><Link to="/admin" className="hover:text-primary transition-colors">Админ панель</Link></li>
                )}
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium text-foreground mb-4">Социальные сети</h5>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="hover:text-primary">
                  <Icon name="Twitter" size={20} />
                </Button>
                <Button variant="ghost" size="sm" className="hover:text-primary">
                  <Icon name="Facebook" size={20} />
                </Button>
                <Button variant="ghost" size="sm" className="hover:text-primary">
                  <Icon name="Instagram" size={20} />
                </Button>
                <Button variant="ghost" size="sm" className="hover:text-primary">
                  <Icon name="Youtube" size={20} />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border/50 mt-8 pt-8 text-center text-muted-foreground text-sm">
            <p>&copy; 2024 CinemaMax. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;