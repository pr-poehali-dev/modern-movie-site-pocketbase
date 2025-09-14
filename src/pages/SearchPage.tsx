import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Video, Genre, collections } from '@/lib/pocketbase';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || 'all');
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || 'all');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'all');
  const [results, setResults] = useState<Video[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchGenres();
  }, []);

  useEffect(() => {
    const query = searchParams.get('q');
    const genre = searchParams.get('genre');
    const year = searchParams.get('year');
    const type = searchParams.get('type');

    if (query || genre || year || type) {
      performSearch();
    }
  }, [searchParams]);

  const fetchGenres = async () => {
    try {
      const response = await collections.genres().getList(1, 50, {
        sort: 'title'
      });
      setGenres(response.items as Genre[]);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const buildSearchFilters = useCallback(() => {
    const filters = [];
    
    if (searchQuery.trim()) {
      filters.push(`(title ~ "${searchQuery}" || description ~ "${searchQuery}")`);
    }
    
    if (selectedGenre !== 'all') {
      filters.push(`genre ~ "${selectedGenre}"`);
    }
    
    if (selectedYear !== 'all') {
      filters.push(`year = ${selectedYear}`);
    }
    
    if (selectedType !== 'all') {
      filters.push(`type = "${selectedType}"`);
    }
    
    return filters.length > 0 ? filters.join(' && ') : '';
  }, [searchQuery, selectedGenre, selectedYear, selectedType]);

  const performSearch = async (page = 1) => {
    setLoading(true);
    try {
      const filters = buildSearchFilters();
      
      const response = await collections.videos().getList(page, 20, {
        filter: filters,
        sort: '-created',
        expand: 'genre'
      });

      setResults(response.items as Video[]);
      setTotalPages(response.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error performing search:', error);
      setResults([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams();
  };

  const updateSearchParams = () => {
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedGenre !== 'all') params.set('genre', selectedGenre);
    if (selectedYear !== 'all') params.set('year', selectedYear);
    if (selectedType !== 'all') params.set('type', selectedType);
    
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('all');
    setSelectedYear('all');
    setSelectedType('all');
    setSearchParams({});
    setResults([]);
  };

  const MovieCard = ({ video }: { video: Video }) => (
    <Card className="group hover:scale-105 transition-all duration-300 hover:shadow-2xl bg-card border-border/50 overflow-hidden">
      <div className="relative aspect-[2/3] bg-muted">
        {video.thumbnail ? (
          <img 
            src={video.thumbnail} 
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon name="Image" size={48} className="text-muted-foreground" />
          </div>
        )}
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center">
          <Link to={`/watch/${video.id}`}>
            <Button 
              size="lg" 
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Icon name="Play" size={24} className="mr-2" />
              Смотреть
            </Button>
          </Link>
        </div>

        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <Badge variant={video.type === 'movie' ? 'default' : 'secondary'}>
            <Icon name={video.type === 'movie' ? 'Film' : 'Tv'} size={12} className="mr-1" />
            {video.type === 'movie' ? 'Фильм' : 'Сериал'}
          </Badge>
        </div>

        {/* Year Badge */}
        {video.year && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="bg-background/80">
              {video.year}
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <Link to={`/watch/${video.id}`}>
          <h3 className="font-montserrat font-bold text-foreground hover:text-primary transition-colors mb-2 line-clamp-2">
            {video.title}
          </h3>
        </Link>
        
        {video.expand?.genre && Array.isArray(video.expand.genre) && (
          <div className="flex flex-wrap gap-1 mb-2">
            {video.expand.genre.slice(0, 2).map((genre: Genre) => (
              <Badge key={genre.id} variant="outline" className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                {genre.title}
              </Badge>
            ))}
          </div>
        )}

        {video.description && (
          <p className="text-xs text-muted-foreground line-clamp-3 mb-2" 
             dangerouslySetInnerHTML={{ __html: video.description }} 
          />
        )}

        {video.country && (
          <p className="text-xs text-muted-foreground">{video.country}</p>
        )}
      </CardContent>
    </Card>
  );

  const years = Array.from({ length: 20 }, (_, i) => 2024 - i);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-montserrat font-bold text-foreground mb-4">
            <Icon name="Search" size={32} className="inline mr-3 text-primary" />
            Поиск контента
          </h1>
          <p className="text-muted-foreground">Найдите свои любимые фильмы и сериалы</p>
        </div>

        {/* Search Form */}
        <Card className="border-border/50 mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-6">
              {/* Search Input */}
              <div className="relative">
                <Icon name="Search" size={20} className="absolute left-3 top-3 text-muted-foreground z-10" />
                <Input 
                  placeholder="Введите название фильма или сериала..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-base"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Тип контента" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    <SelectItem value="movie">Фильмы</SelectItem>
                    <SelectItem value="serias">Сериалы</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger>
                    <SelectValue placeholder="Жанр" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все жанры</SelectItem>
                    {genres.map((genre) => (
                      <SelectItem key={genre.id} value={genre.id}>
                        {genre.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Год" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все годы</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex space-x-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                        Поиск...
                      </>
                    ) : (
                      <>
                        <Icon name="Search" size={16} className="mr-2" />
                        Найти
                      </>
                    )}
                  </Button>
                  
                  <Button type="button" variant="outline" onClick={clearFilters}>
                    <Icon name="X" size={16} />
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Array.from({length: 12}).map((_, i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="aspect-[2/3] bg-muted rounded" />
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-montserrat font-bold text-foreground">
                Найдено {results.length} результатов
              </h2>
              
              {/* Results Type Filter */}
              <Tabs value={selectedType} onValueChange={setSelectedType} className="w-auto">
                <TabsList>
                  <TabsTrigger value="all">Все</TabsTrigger>
                  <TabsTrigger value="movie">Фильмы</TabsTrigger>
                  <TabsTrigger value="serias">Сериалы</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-8">
              {results.map((video) => (
                <MovieCard key={video.id} video={video} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2">
                <Button 
                  variant="outline" 
                  disabled={currentPage === 1}
                  onClick={() => performSearch(currentPage - 1)}
                >
                  <Icon name="ChevronLeft" size={16} />
                </Button>
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (page > totalPages) return null;
                  
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      onClick={() => performSearch(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                
                <Button 
                  variant="outline" 
                  disabled={currentPage === totalPages}
                  onClick={() => performSearch(currentPage + 1)}
                >
                  <Icon name="ChevronRight" size={16} />
                </Button>
              </div>
            )}
          </>
        ) : searchParams.toString() ? (
          <div className="text-center py-16">
            <Icon name="SearchX" size={64} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Ничего не найдено</h3>
            <p className="text-muted-foreground mb-6">
              Попробуйте изменить параметры поиска или очистить фильтры
            </p>
            <Button onClick={clearFilters} variant="outline">
              <Icon name="RotateCcw" size={16} className="mr-2" />
              Сбросить фильтры
            </Button>
          </div>
        ) : (
          <div className="text-center py-16">
            <Icon name="Search" size={64} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Начните поиск</h3>
            <p className="text-muted-foreground">
              Введите название фильма или сериала в поисковую строку выше
            </p>
          </div>
        )}

        {/* Popular Searches */}
        {!searchParams.toString() && (
          <section className="mt-16">
            <h3 className="text-2xl font-montserrat font-bold text-foreground mb-6">Популярные запросы</h3>
            <div className="flex flex-wrap gap-3">
              {['Marvel', 'Ужасы', 'Комедии', '2024', 'Детектив', 'Фантастика', 'Драма', 'Боевик'].map((term) => (
                <Button
                  key={term}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery(term);
                    const params = new URLSearchParams();
                    params.set('q', term);
                    setSearchParams(params);
                  }}
                  className="hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {term}
                </Button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default SearchPage;