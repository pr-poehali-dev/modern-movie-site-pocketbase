import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { Video, User, Favorite, WatchHistory, collections, authStore, pb } from '@/lib/pocketbase';
import { toast } from '@/hooks/use-toast';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    name: '',
    bio: ''
  });
  const [settingsData, setSettingsData] = useState({
    emailNotifications: true,
    autoplay: true,
    darkMode: true,
    language: 'ru'
  });

  const currentUser = authStore.model();
  const isAuthenticated = authStore.isValid();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }

    fetchUserData();
  }, [isAuthenticated, navigate]);

  const fetchUserData = async () => {
    try {
      if (!currentUser) return;

      // Fetch user details
      const userData = await collections.users().getOne(currentUser.id);
      setUser(userData as User);
      setProfileData({
        username: userData.username || '',
        email: userData.email || '',
        name: userData.name || '',
        bio: userData.bio || ''
      });

      // Fetch favorites
      const favoritesResponse = await collections.favorites().getList(1, 50, {
        filter: `user = "${currentUser.id}"`,
        sort: '-created',
        expand: 'video,video.genre'
      });
      setFavorites(favoritesResponse.items as Favorite[]);

      // Fetch watch history
      const historyResponse = await collections.watchHistory().getList(1, 50, {
        filter: `user = "${currentUser.id}"`,
        sort: '-updated',
        expand: 'video,video.genre'
      });
      setWatchHistory(historyResponse.items as WatchHistory[]);

      // Load settings (from localStorage or user preferences)
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        setSettingsData(JSON.parse(savedSettings));
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные профиля',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setUpdating(true);
    try {
      await collections.users().update(currentUser.id, {
        username: profileData.username,
        name: profileData.name,
        bio: profileData.bio
      });

      // Update auth store
      authStore.save(pb.authStore.token, {
        ...currentUser,
        username: profileData.username,
        name: profileData.name,
        bio: profileData.bio
      });

      toast({
        title: 'Профиль обновлен',
        description: 'Ваши данные успешно сохранены'
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Ошибка обновления',
        description: error.message || 'Не удалось обновить профиль',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const updateSettings = async () => {
    try {
      localStorage.setItem('userSettings', JSON.stringify(settingsData));
      
      // Apply theme changes
      if (settingsData.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      toast({
        title: 'Настройки сохранены',
        description: 'Ваши предпочтения успешно обновлены'
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      await collections.favorites().delete(favoriteId);
      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
      toast({
        title: 'Удалено из избранного',
        description: 'Видео убрано из избранного'
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить из избранного',
        variant: 'destructive'
      });
    }
  };

  const clearWatchHistory = async () => {
    try {
      // Delete all watch history records for this user
      const historyItems = await collections.watchHistory().getList(1, 500, {
        filter: `user = "${currentUser?.id}"`
      });

      for (const item of historyItems.items) {
        await collections.watchHistory().delete(item.id);
      }

      setWatchHistory([]);
      toast({
        title: 'История очищена',
        description: 'Ваша история просмотров успешно удалена'
      });
    } catch (error) {
      console.error('Error clearing watch history:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось очистить историю',
        variant: 'destructive'
      });
    }
  };

  const logout = () => {
    authStore.clear();
    navigate('/');
    toast({
      title: 'Выход выполнен',
      description: 'Вы успешно вышли из аккаунта'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse space-y-8">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-muted rounded-full" />
              <div className="space-y-2">
                <div className="h-6 bg-muted rounded w-48" />
                <div className="h-4 bg-muted rounded w-32" />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Icon name="UserX" size={64} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Профиль не найден</h2>
            <p className="text-muted-foreground mb-4">
              Произошла ошибка при загрузке профиля
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

  const VideoCard = ({ video }: { video: Video }) => (
    <Link to={`/watch/${video.id}`}>
      <Card className="group hover:scale-105 transition-all duration-300 hover:shadow-lg border-border/50 overflow-hidden">
        <div className="relative aspect-video bg-muted">
          {video.thumbnail ? (
            <img 
              src={video.thumbnail} 
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon name="Image" size={32} className="text-muted-foreground" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
            <Button 
              size="sm" 
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary hover:bg-primary/90"
            >
              <Icon name="Play" size={16} className="mr-1" />
              Смотреть
            </Button>
          </div>

          <Badge 
            variant={video.type === 'movie' ? 'default' : 'secondary'}
            className="absolute top-2 left-2"
          >
            {video.type === 'movie' ? 'Фильм' : 'Сериал'}
          </Badge>
        </div>
        
        <CardContent className="p-4">
          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {video.title}
          </h4>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {video.year || 'N/A'}
            </span>
            {video.country && (
              <Badge variant="outline" className="text-xs">{video.country}</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center space-x-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user.avatar} alt={user.username} />
              <AvatarFallback className="text-2xl">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-3xl font-montserrat font-bold text-foreground">
                {user.name || user.username}
              </h1>
              <p className="text-muted-foreground">{user.email}</p>
              {user.bio && (
                <p className="text-muted-foreground mt-2 max-w-md">{user.bio}</p>
              )}
              <div className="flex items-center space-x-4 mt-3">
                <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                  {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Регистрация: {new Date(user.created).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <Button onClick={logout} variant="outline">
            <Icon name="LogOut" size={16} className="mr-2" />
            Выйти
          </Button>
        </div>

        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="favorites">Избранное ({favorites.length})</TabsTrigger>
            <TabsTrigger value="history">История ({watchHistory.length})</TabsTrigger>
            <TabsTrigger value="profile">Профиль</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>

          {/* Favorites */}
          <TabsContent value="favorites" className="mt-6">
            {favorites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {favorites.map((favorite) => (
                  <div key={favorite.id} className="relative group">
                    {favorite.expand?.video && (
                      <VideoCard video={favorite.expand.video} />
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        removeFavorite(favorite.id);
                      }}
                    >
                      <Icon name="X" size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="border-border/50">
                <CardContent className="p-12 text-center">
                  <Icon name="Heart" size={64} className="mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Нет избранных видео</h3>
                  <p className="text-muted-foreground mb-6">
                    Добавляйте видео в избранное, чтобы быстро находить их позже
                  </p>
                  <Link to="/movies">
                    <Button>
                      <Icon name="Film" size={16} className="mr-2" />
                      Посмотреть каталог
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Watch History */}
          <TabsContent value="history" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">История просмотров</h3>
              {watchHistory.length > 0 && (
                <Button onClick={clearWatchHistory} variant="destructive" size="sm">
                  <Icon name="Trash2" size={16} className="mr-2" />
                  Очистить историю
                </Button>
              )}
            </div>

            {watchHistory.length > 0 ? (
              <div className="space-y-4">
                {watchHistory.map((historyItem) => (
                  <Card key={historyItem.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-24 aspect-video bg-muted rounded overflow-hidden">
                          {historyItem.expand?.video?.thumbnail ? (
                            <img 
                              src={historyItem.expand.video.thumbnail} 
                              alt={historyItem.expand.video.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Icon name="Image" size={16} className="text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <Link 
                            to={`/watch/${historyItem.video}`}
                            className="font-semibold text-foreground hover:text-primary transition-colors"
                          >
                            {historyItem.expand?.video?.title || 'Неизвестное видео'}
                          </Link>
                          
                          <div className="flex items-center space-x-2 mt-1">
                            {historyItem.expand?.video?.type && (
                              <Badge variant={historyItem.expand.video.type === 'movie' ? 'default' : 'secondary'} className="text-xs">
                                {historyItem.expand.video.type === 'movie' ? 'Фильм' : 'Сериал'}
                              </Badge>
                            )}
                            <span className="text-sm text-muted-foreground">
                              Просмотрено: {new Date(historyItem.updated).toLocaleDateString()}
                            </span>
                          </div>

                          {historyItem.progress > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                <span>Прогресс просмотра</span>
                                <span>{Math.round(historyItem.progress)}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1">
                                <div 
                                  className="bg-primary h-1 rounded-full transition-all duration-300" 
                                  style={{ width: `${historyItem.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-border/50">
                <CardContent className="p-12 text-center">
                  <Icon name="History" size={64} className="mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">История пуста</h3>
                  <p className="text-muted-foreground mb-6">
                    Здесь будут отображаться просмотренные вами видео
                  </p>
                  <Link to="/movies">
                    <Button>
                      <Icon name="Play" size={16} className="mr-2" />
                      Начать просмотр
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Profile Settings */}
          <TabsContent value="profile" className="mt-6">
            <Card className="border-border/50 max-w-2xl">
              <CardHeader>
                <CardTitle>Настройки профиля</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={updateProfile} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="username">Имя пользователя</Label>
                    <Input
                      id="username"
                      value={profileData.username}
                      onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Введите имя пользователя"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email нельзя изменить после регистрации
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Полное имя</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Введите ваше полное имя"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">О себе</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Расскажите немного о себе..."
                      rows={4}
                    />
                  </div>

                  <Button type="submit" disabled={updating}>
                    {updating ? (
                      <>
                        <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                        Сохраняем...
                      </>
                    ) : (
                      <>
                        <Icon name="Save" size={16} className="mr-2" />
                        Сохранить изменения
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* App Settings */}
          <TabsContent value="settings" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Уведомления</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email уведомления</Label>
                      <p className="text-sm text-muted-foreground">
                        Получать уведомления о новом контенте
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={settingsData.emailNotifications}
                      onCheckedChange={(checked) => 
                        setSettingsData(prev => ({ ...prev, emailNotifications: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Воспроизведение</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoplay">Автовоспроизведение</Label>
                      <p className="text-sm text-muted-foreground">
                        Автоматически воспроизводить следующий эпизод
                      </p>
                    </div>
                    <Switch
                      id="autoplay"
                      checked={settingsData.autoplay}
                      onCheckedChange={(checked) => 
                        setSettingsData(prev => ({ ...prev, autoplay: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Внешний вид</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="dark-mode">Темная тема</Label>
                      <p className="text-sm text-muted-foreground">
                        Использовать темное оформление
                      </p>
                    </div>
                    <Switch
                      id="dark-mode"
                      checked={settingsData.darkMode}
                      onCheckedChange={(checked) => 
                        setSettingsData(prev => ({ ...prev, darkMode: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Опасная зона</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="border-destructive/50 mb-4">
                    <Icon name="AlertTriangle" size={16} />
                    <AlertDescription>
                      Эти действия нельзя отменить. Будьте осторожны!
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={clearWatchHistory} 
                      variant="destructive" 
                      size="sm" 
                      className="w-full"
                    >
                      <Icon name="History" size={16} className="mr-2" />
                      Очистить историю просмотров
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <Button onClick={updateSettings}>
                <Icon name="Save" size={16} className="mr-2" />
                Сохранить настройки
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;