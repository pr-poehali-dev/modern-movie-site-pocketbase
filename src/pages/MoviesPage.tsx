import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import Icon from '@/components/ui/icon';
import { Video, Genre, collections } from '@/lib/pocketbase';

const MoviesPage: React.FC = () => {
  const [movies, setMovies] = useState<Video[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const perPage = 12;

  useEffect(() => {
    fetchGenres();
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [searchTerm, selectedGenre, selectedYear, sortBy, currentPage]);

  const fetchGenres = async () => {
    try {
      const result = await collections.genres().getList(1, 50);
      setGenres(result.items as Genre[]);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const fetchMovies = async () => {
    setLoading(true);
    try {
      let filter = 'type = "movie"';
      
      if (searchTerm) {
        filter += ` && (title ~ "${searchTerm}" || description ~ "${searchTerm}")`;
      }
      
      if (selectedGenre !== 'all') {
        filter += ` && genre ~ "${selectedGenre}"`;
      }
      
      if (selectedYear !== 'all') {
        filter += ` && year = ${selectedYear}`;
      }

      const sort = sortBy === 'created' ? '-created' : 
                   sortBy === 'title' ? 'title' :
                   sortBy === 'year' ? '-year' : '-created';

      const result = await collections.videos().getList(currentPage, perPage, {
        filter,
        sort,
        expand: 'genre,createdBy'
      });

      setMovies(result.items as Video[]);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const MovieCard = ({ movie }: { movie: Video }) => (
    <Link to={`/watch/${movie.id}`}>
      <Card className="group hover:scale-105 transition-all duration-300 hover:shadow-2xl bg-card border-border/50 overflow-hidden">
        <div className="relative">
          {movie.thumbnail ? (
            <img 
              src={movie.thumbnail} 
              alt={movie.title}
              className="w-full h-80 object-cover group-hover:brightness-110 transition-all duration-300"
            />
          ) : (
            <div className="w-full h-80 bg-muted flex items-center justify-center">
              <Icon name="Film" size={48} className="text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
          <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
            Фильм
          </Badge>
          <Button 
            size="sm" 
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/50 backdrop-blur-sm hover:bg-primary"
          >
            <Icon name="Heart" size={16} />
          </Button>
        </div>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <h3 className="text-xl font-montserrat font-bold text-foreground line-clamp-1">{movie.title}</h3>
            <span className="text-muted-foreground text-sm ml-2">{movie.year || 'N/A'}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {movie.expand?.genre?.slice(0, 3).map((g) => (
              <Badge key={g.id} variant="outline" className="text-xs border-primary/30 text-muted-foreground">
                {g.title}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
            {movie.description || 'Описание отсутствует'}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{movie.country || 'N/A'}</span>
            <Button size="sm" className="bg-primary hover:bg-primary/80 transition-colors">
              <Icon name="Play" size={16} className="mr-1" />
              Смотреть
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const years = Array.from({length: 25}, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-montserrat font-bold text-foreground mb-4">
            <Icon name="Film" size={32} className="inline mr-3 text-primary" />
            Каталог фильмов
          </h1>
          <p className="text-muted-foreground">Откройте для себя лучшие фильмы всех времен</p>
        </div>

        {/* Filters */}
        <Card className="mb-8 bg-card border-border/50">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Icon name="Search" size={20} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input 
                    placeholder="Поиск фильмов..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-input border-border/50 focus:ring-primary"
                  />
                </div>
              </div>
              
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="bg-input border-border/50">
                  <SelectValue placeholder="Жанр" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50">
                  <SelectItem value="all">Все жанры</SelectItem>
                  {genres.map((genre) => (
                    <SelectItem key={genre.id} value={genre.id}>
                      {genre.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="bg-input border-border/50">
                  <SelectValue placeholder="Год" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50">
                  <SelectItem value="all">Все годы</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-input border-border/50">
                  <SelectValue placeholder="Сортировка" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50">
                  <SelectItem value="created">Новые</SelectItem>
                  <SelectItem value="title">По алфавиту</SelectItem>
                  <SelectItem value="year">По году</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({length: 12}).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-80 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : movies.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="justify-center">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                    const page = Math.max(1, currentPage - 2) + i;
                    if (page > totalPages) return null;
                    
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink 
                          onClick={() => setCurrentPage(page)}
                          isActive={page === currentPage}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <Icon name="Film" size={64} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Фильмы не найдены</h3>
            <p className="text-muted-foreground">Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoviesPage;