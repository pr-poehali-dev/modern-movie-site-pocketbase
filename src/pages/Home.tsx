import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Video, collections } from '@/lib/pocketbase';

const Home: React.FC = () => {
  const [popularMovies, setPopularMovies] = useState<Video[]>([]);
  const [recentSeries, setRecentSeries] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Fetch popular movies
        const movies = await collections.videos().getList(1, 8, {
          filter: 'type = "movie"',
          sort: '-created',
          expand: 'genre,createdBy'
        });
        
        // Fetch recent series  
        const series = await collections.videos().getList(1, 8, {
          filter: 'type = "serias"',
          sort: '-created',
          expand: 'genre,createdBy'
        });

        setPopularMovies(movies.items as Video[]);
        setRecentSeries(series.items as Video[]);
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  const ContentCard = ({ video }: { video: Video }) => (
    <Link to={`/watch/${video.id}`}>
      <Card className="group hover:scale-105 transition-all duration-300 hover:shadow-2xl bg-card border-border/50 overflow-hidden">
        <div className="relative">
          {video.thumbnail ? (
            <img 
              src={video.thumbnail} 
              alt={video.title}
              className="w-full h-64 object-cover group-hover:brightness-110 transition-all duration-300"
            />
          ) : (
            <div className="w-full h-64 bg-muted flex items-center justify-center">
              <Icon name="Image" size={48} className="text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
          <Badge 
            variant={video.type === 'movie' ? 'default' : 'secondary'} 
            className="absolute top-4 left-4 bg-primary text-primary-foreground"
          >
            {video.type === 'movie' ? 'Фильм' : 'Сериал'}
          </Badge>
        </div>
        <CardHeader className="pb-3">
          <h3 className="text-lg font-montserrat font-bold text-foreground line-clamp-1">{video.title}</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {video.expand?.genre?.slice(0, 2).map((g) => (
              <Badge key={g.id} variant="outline" className="text-xs border-primary/30 text-muted-foreground">
                {g.title}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
            {video.description || 'Описание отсутствует'}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{video.year || 'N/A'}</span>
            <Button size="sm" className="bg-primary hover:bg-primary/80 transition-colors">
              <Icon name="Play" size={16} className="mr-1" />
              Смотреть
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({length: 8}).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="h-64 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-96 bg-gradient-to-br from-primary/20 via-background to-secondary/10 flex items-center">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-montserrat font-bold text-foreground mb-4 animate-fade-in">
              Лучшие фильмы и сериалы
            </h1>
            <p className="text-xl text-muted-foreground mb-8 animate-fade-in" style={{animationDelay: '0.2s'}}>
              Смотрите премьеры, популярные фильмы и эксклюзивные сериалы в высоком качестве
            </p>
            <div className="flex space-x-4 animate-scale-in" style={{animationDelay: '0.4s'}}>
              <Link to="/movies">
                <Button size="lg" className="bg-primary hover:bg-primary/80 text-primary-foreground font-medium">
                  <Icon name="Film" size={20} className="mr-2" />
                  Каталог фильмов
                </Button>
              </Link>
              <Link to="/series">
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  <Icon name="Tv" size={20} className="mr-2" />
                  Каталог сериалов
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        {/* Popular Movies */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-montserrat font-bold text-foreground">Популярные фильмы</h2>
            <Link to="/movies">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                Все фильмы
                <Icon name="ArrowRight" size={16} className="ml-2" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularMovies.map((video) => (
              <ContentCard key={video.id} video={video} />
            ))}
          </div>
        </section>

        {/* Recent Series */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-montserrat font-bold text-foreground">Новые сериалы</h2>
            <Link to="/series">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                Все сериалы
                <Icon name="ArrowRight" size={16} className="ml-2" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentSeries.map((video) => (
              <ContentCard key={video.id} video={video} />
            ))}
          </div>
        </section>

        {/* Quick Access */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/genres">
            <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer hover:bg-primary/5 border-border/50 text-center p-8">
              <CardContent className="p-0">
                <Icon name="Grid3X3" size={48} className="mx-auto mb-4 text-primary group-hover:text-primary" />
                <h3 className="text-xl font-montserrat font-bold text-foreground mb-2">Жанры</h3>
                <p className="text-muted-foreground">Откройте контент по жанрам</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/search">
            <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer hover:bg-primary/5 border-border/50 text-center p-8">
              <CardContent className="p-0">
                <Icon name="Search" size={48} className="mx-auto mb-4 text-primary group-hover:text-primary" />
                <h3 className="text-xl font-montserrat font-bold text-foreground mb-2">Поиск</h3>
                <p className="text-muted-foreground">Найдите любимый контент</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/profile">
            <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer hover:bg-primary/5 border-border/50 text-center p-8">
              <CardContent className="p-0">
                <Icon name="User" size={48} className="mx-auto mb-4 text-primary group-hover:text-primary" />
                <h3 className="text-xl font-montserrat font-bold text-foreground mb-2">Профиль</h3>
                <p className="text-muted-foreground">Избранное и история</p>
              </CardContent>
            </Card>
          </Link>
        </section>
      </div>
    </div>
  );
};

export default Home;