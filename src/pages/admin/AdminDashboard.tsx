import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Video, User, Genre, collections, authStore } from '@/lib/pocketbase';

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const isMainDashboard = location.pathname === '/admin';
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalUsers: 0,
    totalGenres: 0,
    recentVideos: [] as Video[],
    recentUsers: [] as User[]
  });
  const [loading, setLoading] = useState(true);

  const currentUser = authStore.model();
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (isMainDashboard) {
      fetchDashboardStats();
    }
  }, [isMainDashboard]);

  const fetchDashboardStats = async () => {
    try {
      // Fetch total counts
      const [videosCount, usersCount, genresCount] = await Promise.all([
        collections.videos().getList(1, 1),
        collections.users().getList(1, 1),
        collections.genres().getList(1, 1)
      ]);

      // Fetch recent data
      const [recentVideos, recentUsers] = await Promise.all([
        collections.videos().getList(1, 5, {
          sort: '-created',
          expand: 'genre,createdBy'
        }),
        collections.users().getList(1, 5, {
          sort: '-created'
        })
      ]);

      setStats({
        totalVideos: videosCount.totalItems,
        totalUsers: usersCount.totalItems,
        totalGenres: genresCount.totalItems,
        recentVideos: recentVideos.items as Video[],
        recentUsers: recentUsers.items as User[]
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Icon name="Shield" size={64} className="mx-auto text-destructive mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Доступ запрещен</h2>
            <p className="text-muted-foreground mb-4">
              У вас нет прав для доступа к админ панели
            </p>
            <Link to="/">
              <Button>
                <Icon name="Home" size={16} className="mr-2" />
                На главную
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sidebarItems = [
    { path: '/admin', label: 'Обзор', icon: 'BarChart3' },
    { path: '/admin/videos', label: 'Видео', icon: 'Film' },
    { path: '/admin/genres', label: 'Жанры', icon: 'Tags' },
    { path: '/admin/users', label: 'Пользователи', icon: 'Users' },
    { path: '/admin/comments', label: 'Комментарии', icon: 'MessageCircle' }
  ];

  if (isMainDashboard) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-card border-r border-border/50 min-h-screen">
            <div className="p-6">
              <h2 className="text-2xl font-montserrat font-bold text-foreground mb-6">
                <Icon name="Shield" size={24} className="inline mr-2 text-primary" />
                Админ панель
              </h2>
              
              <nav className="space-y-2">
                {sidebarItems.map((item) => (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={location.pathname === item.path ? 'default' : 'ghost'}
                      className="w-full justify-start"
                    >
                      <Icon name={item.icon as any} size={16} className="mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8">
            <div className="mb-8">
              <h1 className="text-4xl font-montserrat font-bold text-foreground mb-2">
                Обзор системы
              </h1>
              <p className="text-muted-foreground">
                Добро пожаловать в админ панель, {currentUser?.username}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-16 bg-muted rounded mb-4" />
                      <div className="h-8 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-muted-foreground text-sm">Всего видео</p>
                          <p className="text-3xl font-bold text-foreground">{stats.totalVideos}</p>
                        </div>
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                          <Icon name="Film" size={24} className="text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-muted-foreground text-sm">Пользователи</p>
                          <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
                        </div>
                        <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center">
                          <Icon name="Users" size={24} className="text-secondary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-muted-foreground text-sm">Жанры</p>
                          <p className="text-3xl font-bold text-foreground">{stats.totalGenres}</p>
                        </div>
                        <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                          <Icon name="Tags" size={24} className="text-accent" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Tabs defaultValue="videos" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="videos">Последние видео</TabsTrigger>
                    <TabsTrigger value="users">Новые пользователи</TabsTrigger>
                  </TabsList>

                  <TabsContent value="videos" className="mt-6">
                    <Card className="border-border/50">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Последние добавленные видео</CardTitle>
                        <Link to="/admin/videos">
                          <Button variant="outline" size="sm">
                            <Icon name="ArrowRight" size={16} className="mr-2" />
                            Все видео
                          </Button>
                        </Link>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {stats.recentVideos.map((video) => (
                            <div key={video.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                              <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-muted rounded overflow-hidden">
                                  {video.thumbnail ? (
                                    <img 
                                      src={video.thumbnail} 
                                      alt={video.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Icon name="Image" size={16} className="text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-foreground">{video.title}</h4>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant={video.type === 'movie' ? 'default' : 'secondary'} className="text-xs">
                                      {video.type === 'movie' ? 'Фильм' : 'Сериал'}
                                    </Badge>
                                    {video.year && (
                                      <Badge variant="outline" className="text-xs">{video.year}</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">
                                  {new Date(video.created).toLocaleDateString()}
                                </p>
                                <div className="flex space-x-2 mt-2">
                                  <Link to={`/admin/videos/edit/${video.id}`}>
                                    <Button size="sm" variant="outline">
                                      <Icon name="Edit" size={14} />
                                    </Button>
                                  </Link>
                                  <Link to={`/watch/${video.id}`}>
                                    <Button size="sm" variant="outline">
                                      <Icon name="Eye" size={14} />
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="users" className="mt-6">
                    <Card className="border-border/50">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Недавно зарегистрированные пользователи</CardTitle>
                        <Link to="/admin/users">
                          <Button variant="outline" size="sm">
                            <Icon name="ArrowRight" size={16} className="mr-2" />
                            Все пользователи
                          </Button>
                        </Link>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {stats.recentUsers.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                                  <Icon name="User" size={20} className="text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-foreground">{user.username}</h4>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant={user.role === 'admin' ? 'destructive' : 'default'} className="text-xs">
                                  {user.role === 'admin' ? 'Админ' : 'Пользователь'}
                                </Badge>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {new Date(user.created).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Quick Actions */}
                <div className="mt-8">
                  <h3 className="text-xl font-montserrat font-semibold text-foreground mb-4">
                    Быстрые действия
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link to="/admin/videos/add">
                      <Card className="hover:shadow-md transition-shadow cursor-pointer border-border/50">
                        <CardContent className="p-6 text-center">
                          <Icon name="Plus" size={32} className="mx-auto text-primary mb-2" />
                          <p className="font-medium text-foreground">Добавить видео</p>
                        </CardContent>
                      </Card>
                    </Link>

                    <Link to="/admin/genres/add">
                      <Card className="hover:shadow-md transition-shadow cursor-pointer border-border/50">
                        <CardContent className="p-6 text-center">
                          <Icon name="Tag" size={32} className="mx-auto text-primary mb-2" />
                          <p className="font-medium text-foreground">Добавить жанр</p>
                        </CardContent>
                      </Card>
                    </Link>

                    <Link to="/admin/users">
                      <Card className="hover:shadow-md transition-shadow cursor-pointer border-border/50">
                        <CardContent className="p-6 text-center">
                          <Icon name="UserCog" size={32} className="mx-auto text-primary mb-2" />
                          <p className="font-medium text-foreground">Управление пользователями</p>
                        </CardContent>
                      </Card>
                    </Link>

                    <Link to="/admin/comments">
                      <Card className="hover:shadow-md transition-shadow cursor-pointer border-border/50">
                        <CardContent className="p-6 text-center">
                          <Icon name="MessageSquare" size={32} className="mx-auto text-primary mb-2" />
                          <p className="font-medium text-foreground">Модерация комментариев</p>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render nested admin pages with sidebar
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r border-border/50 min-h-screen">
          <div className="p-6">
            <Link to="/admin">
              <h2 className="text-2xl font-montserrat font-bold text-foreground mb-6 hover:text-primary transition-colors">
                <Icon name="Shield" size={24} className="inline mr-2 text-primary" />
                Админ панель
              </h2>
            </Link>
            
            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={location.pathname.startsWith(item.path) ? 'default' : 'ghost'}
                    className="w-full justify-start"
                  >
                    <Icon name={item.icon as any} size={16} className="mr-2" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>

            <div className="mt-8 pt-8 border-t border-border/50">
              <Link to="/">
                <Button variant="outline" className="w-full justify-start">
                  <Icon name="ArrowLeft" size={16} className="mr-2" />
                  К сайту
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;