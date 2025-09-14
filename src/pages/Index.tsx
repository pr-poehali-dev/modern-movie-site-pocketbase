import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

interface Movie {
  id: string;
  title: string;
  type: 'movie' | 'serias';
  description: string;
  thumbnail: string;
  year: number;
  genre: string[];
  country: string;
  rating: number;
}

const Index: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  // Mock data inspired by PocketBase schema
  const movies: Movie[] = [
    {
      id: '1',
      title: 'Квантовый Прорыв',
      type: 'movie',
      description: 'Захватывающий научно-фантастический триллер о путешествиях во времени и параллельных вселенных.',
      thumbnail: '/img/38323b92-a678-446b-8210-6b5e5ad7ebc2.jpg',
      year: 2024,
      genre: ['Фантастика', 'Триллер'],
      country: 'США',
      rating: 8.5
    },
    {
      id: '2', 
      title: 'Тень Города',
      type: 'movie',
      description: 'Мрачный детектив о расследовании серии загадочных преступлений в современном мегаполисе.',
      thumbnail: '/img/cfb20e55-1823-425d-9cde-3ed6814ac78b.jpg',
      year: 2024,
      genre: ['Детектив', 'Триллер'],
      country: 'США',
      rating: 9.1
    },
    {
      id: '3',
      title: 'Восхождение',
      type: 'serias',
      description: 'Эпическая драма о борьбе за власть в мире корпораций и высоких технологий.',
      thumbnail: '/img/c2a24c68-3c74-4047-bd16-da5f4eef99d6.jpg',
      year: 2023,
      genre: ['Драма', 'Боевик'],
      country: 'Великобритания',
      rating: 8.8
    }
  ];

  const genres = ['Все жанры', 'Фантастика', 'Триллер', 'Детектив', 'Драма', 'Боевик', 'Комедия'];
  const years = ['Все годы', '2024', '2023', '2022', '2021', '2020'];

  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movie.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || selectedGenre === 'Все жанры' || 
                        movie.genre.includes(selectedGenre);
    const matchesYear = selectedYear === 'all' || selectedYear === 'Все годы' || 
                       movie.year.toString() === selectedYear;
    
    return matchesSearch && matchesGenre && matchesYear;
  });

  const MovieCard = ({ movie }: { movie: Movie }) => (
    <Card className="group hover:scale-105 transition-all duration-300 hover:shadow-2xl bg-card border-border/50 overflow-hidden">
      <div className="relative">
        <img 
          src={movie.thumbnail} 
          alt={movie.title}
          className="w-full h-80 object-cover group-hover:brightness-110 transition-all duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
        <Badge 
          variant={movie.type === 'movie' ? 'default' : 'secondary'} 
          className="absolute top-4 left-4 bg-primary text-primary-foreground"
        >
          {movie.type === 'movie' ? 'Фильм' : 'Сериал'}
        </Badge>
        <div className="absolute top-4 right-4 flex items-center space-x-1 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
          <Icon name="Star" size={16} className="text-yellow-400 fill-current" />
          <span className="text-white text-sm font-medium">{movie.rating}</span>
        </div>
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-montserrat font-bold text-foreground line-clamp-1">{movie.title}</h3>
          <span className="text-muted-foreground text-sm ml-2">{movie.year}</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {movie.genre.map((g, idx) => (
            <Badge key={idx} variant="outline" className="text-xs border-primary/30 text-muted-foreground">
              {g}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{movie.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{movie.country}</span>
          <div className="flex space-x-2">
            <Button size="sm" className="bg-primary hover:bg-primary/80 transition-colors">
              <Icon name="Play" size={16} className="mr-1" />
              Смотреть
            </Button>
            <Button size="sm" variant="outline" className="border-primary/30 hover:bg-primary/10">
              <Icon name="Heart" size={16} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background font-roboto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-montserrat font-bold text-primary flex items-center">
                <Icon name="Film" size={28} className="mr-2" />
                CinemaMax
              </h1>
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="text-foreground hover:text-primary transition-colors font-medium">Главная</a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Фильмы</a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Сериалы</a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Жанры</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Icon name="Search" size={20} />
              </Button>
              <Button variant="ghost" size="sm">
                <Icon name="User" size={20} />
              </Button>
              <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                Войти
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-96 bg-gradient-to-br from-primary/20 via-background to-secondary/10 flex items-center">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl">
            <h2 className="text-5xl font-montserrat font-bold text-foreground mb-4 animate-fade-in">
              Лучшие фильмы и сериалы
            </h2>
            <p className="text-xl text-muted-foreground mb-8 animate-fade-in" style={{animationDelay: '0.2s'}}>
              Смотрите премьеры, популярные фильмы и эксклюзивные сериалы в высоком качестве
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/80 text-primary-foreground font-medium animate-scale-in" style={{animationDelay: '0.4s'}}>
              <Icon name="Play" size={20} className="mr-2" />
              Начать просмотр
            </Button>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="container mx-auto px-6 py-8">
        <div className="bg-card border border-border/50 rounded-xl p-6 mb-8 animate-scale-in">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Icon name="Search" size={20} className="absolute left-3 top-3 text-muted-foreground" />
                <Input 
                  placeholder="Поиск фильмов и сериалов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-input border-border/50 focus:ring-primary"
                />
              </div>
            </div>
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-full lg:w-48 bg-input border-border/50">
                <SelectValue placeholder="Жанр" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/50">
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre === 'Все жанры' ? 'all' : genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full lg:w-32 bg-input border-border/50">
                <SelectValue placeholder="Год" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/50">
                {years.map((year) => (
                  <SelectItem key={year} value={year === 'Все годы' ? 'all' : year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 mb-8">
            <TabsTrigger value="all" className="font-medium">Все</TabsTrigger>
            <TabsTrigger value="movie" className="font-medium">Фильмы</TabsTrigger>
            <TabsTrigger value="serias" className="font-medium">Сериалы</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="movie" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMovies.filter(m => m.type === 'movie').map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="serias" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMovies.filter(m => m.type === 'serias').map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Popular Genres */}
        <section className="mt-16">
          <h3 className="text-2xl font-montserrat font-bold text-foreground mb-8">Популярные жанры</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {genres.slice(1).map((genre) => (
              <Card key={genre} className="group hover:scale-105 transition-all duration-300 cursor-pointer hover:bg-primary/5 border-border/50">
                <CardContent className="p-6 text-center">
                  <Icon name="PlaySquare" size={32} className="mx-auto mb-2 text-primary group-hover:text-primary" />
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">{genre}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="mt-16 bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-montserrat font-bold text-primary mb-2">10K+</div>
              <p className="text-muted-foreground">Фильмов</p>
            </div>
            <div>
              <div className="text-3xl font-montserrat font-bold text-primary mb-2">5K+</div>
              <p className="text-muted-foreground">Сериалов</p>
            </div>
            <div>
              <div className="text-3xl font-montserrat font-bold text-primary mb-2">1M+</div>
              <p className="text-muted-foreground">Пользователей</p>
            </div>
            <div>
              <div className="text-3xl font-montserrat font-bold text-primary mb-2">24/7</div>
              <p className="text-muted-foreground">Доступ</p>
            </div>
          </div>
        </section>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border/50 mt-16">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-montserrat font-bold text-foreground mb-4 flex items-center">
                <Icon name="Film" size={24} className="mr-2 text-primary" />
                CinemaMax
              </h4>
              <p className="text-muted-foreground text-sm">Ваш источник лучшего контента в мире кино и сериалов.</p>
            </div>
            <div>
              <h5 className="font-medium text-foreground mb-4">Контент</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Фильмы</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Сериалы</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Новинки</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">ТОП-100</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-foreground mb-4">Компания</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">О нас</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Карьера</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Поддержка</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Контакты</a></li>
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

export default Index;