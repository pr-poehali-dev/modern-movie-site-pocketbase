import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Icon from '@/components/ui/icon';
import { Video, Episode, Genre, collections } from '@/lib/pocketbase';

const SeriesPage: React.FC = () => {
  const [series, setSeries] = useState<Video[]>([]);
  const [episodes, setEpisodes] = useState<{[key: string]: Episode[]}>({});
  const [genres, setGenres] = useState<Genre[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGenres();
    fetchSeries();
  }, [searchTerm, selectedGenre, selectedYear]);

  const fetchGenres = async () => {
    try {
      const result = await collections.genres().getList(1, 50);
      setGenres(result.items as Genre[]);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const fetchSeries = async () => {
    setLoading(true);
    try {
      let filter = 'type = "serias"';
      
      if (searchTerm) {
        filter += ` && (title ~ "${searchTerm}" || description ~ "${searchTerm}")`;
      }
      
      if (selectedGenre !== 'all') {
        filter += ` && genre ~ "${selectedGenre}"`;
      }
      
      if (selectedYear !== 'all') {
        filter += ` && year = ${selectedYear}`;
      }

      const result = await collections.videos().getList(1, 50, {
        filter,
        sort: '-created',
        expand: 'genre,createdBy'
      });

      setSeries(result.items as Video[]);
    } catch (error) {
      console.error('Error fetching series:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEpisodesForSeries = async (seriesId: string) => {
    if (episodes[seriesId]) return episodes[seriesId];
    
    try {
      const result = await collections.episodes().getList(1, 100, {
        filter: `video = "${seriesId}"`,
        sort: 'season,episodeNumber',
        expand: 'video'
      });
      
      const seriesEpisodes = result.items as Episode[];
      setEpisodes(prev => ({ ...prev, [seriesId]: seriesEpisodes }));
      return seriesEpisodes;
    } catch (error) {
      console.error('Error fetching episodes:', error);
      return [];
    }
  };

  const groupEpisodesBySeason = (episodes: Episode[]) => {
    return episodes.reduce((acc, episode) => {
      const season = episode.season;
      if (!acc[season]) acc[season] = [];
      acc[season].push(episode);
      return acc;
    }, {} as {[key: number]: Episode[]});
  };

  const SeriesCard = ({ seriesItem }: { seriesItem: Video }) => {
    const [seriesEpisodes, setSeriesEpisodes] = useState<Episode[]>([]);
    const [loadingEpisodes, setLoadingEpisodes] = useState(false);

    const handleAccordionChange = async (value: string) => {
      if (value && !episodes[seriesItem.id]) {
        setLoadingEpisodes(true);
        const eps = await fetchEpisodesForSeries(seriesItem.id);
        setSeriesEpisodes(eps);
        setLoadingEpisodes(false);
      }
    };

    const seasonGroups = groupEpisodesBySeason(episodes[seriesItem.id] || seriesEpisodes);

    return (
      <Card className="bg-card border-border/50 overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Thumbnail */}
          <div className="lg:w-80 relative">
            {seriesItem.thumbnail ? (
              <img 
                src={seriesItem.thumbnail} 
                alt={seriesItem.title}
                className="w-full h-64 lg:h-full object-cover"
              />
            ) : (
              <div className="w-full h-64 lg:h-full bg-muted flex items-center justify-center">
                <Icon name="Tv" size={48} className="text-muted-foreground" />
              </div>
            )}
            <Badge className="absolute top-4 left-4 bg-secondary text-secondary-foreground">
              Сериал
            </Badge>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-montserrat font-bold text-foreground mb-2">{seriesItem.title}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {seriesItem.expand?.genre?.slice(0, 3).map((g) => (
                    <Badge key={g.id} variant="outline" className="text-sm border-primary/30 text-muted-foreground">
                      {g.title}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground">{seriesItem.year || 'N/A'}</span>
                <div className="flex space-x-2 mt-2">
                  <Button size="sm" variant="outline" className="border-primary/30 hover:bg-primary/10">
                    <Icon name="Heart" size={16} />
                  </Button>
                  <Link to={`/watch/${seriesItem.id}`}>
                    <Button size="sm" className="bg-primary hover:bg-primary/80 transition-colors">
                      <Icon name="Play" size={16} className="mr-1" />
                      Смотреть
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground mb-6 line-clamp-3">
              {seriesItem.description || 'Описание отсутствует'}
            </p>

            {/* Episodes by seasons */}
            <Accordion type="single" collapsible onValueChange={handleAccordionChange}>
              <AccordionItem value={seriesItem.id}>
                <AccordionTrigger className="text-lg font-semibold">
                  <div className="flex items-center">
                    <Icon name="List" size={20} className="mr-2" />
                    Сезоны и эпизоды
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {loadingEpisodes ? (
                    <div className="animate-pulse space-y-2">
                      {Array.from({length: 3}).map((_, i) => (
                        <div key={i} className="h-12 bg-muted rounded"></div>
                      ))}
                    </div>
                  ) : Object.keys(seasonGroups).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(seasonGroups).map(([season, seasonEpisodes]) => (
                        <div key={season} className="border border-border/30 rounded-lg p-4">
                          <h4 className="font-semibold text-foreground mb-3 flex items-center">
                            <Icon name="Play" size={16} className="mr-2 text-primary" />
                            Сезон {season} ({seasonEpisodes.length} эпизодов)
                          </h4>
                          <div className="grid gap-2 max-h-48 overflow-y-auto">
                            {seasonEpisodes.map((episode) => (
                              <Link key={episode.id} to={`/watch/${seriesItem.id}/episode/${episode.id}`}>
                                <div className="flex items-center justify-between p-3 rounded bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-sm font-medium text-muted-foreground min-w-[3rem]">
                                      Эп. {episode.episodeNumber}
                                    </span>
                                    <span className="text-sm text-foreground">{episode.title}</span>
                                  </div>
                                  <Icon name="Play" size={16} className="text-primary" />
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Эпизоды не найдены</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </Card>
    );
  };

  const years = Array.from({length: 25}, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-montserrat font-bold text-foreground mb-4">
            <Icon name="Tv" size={32} className="inline mr-3 text-primary" />
            Каталог сериалов
          </h1>
          <p className="text-muted-foreground">Погрузитесь в мир захватывающих сериалов по сезонам</p>
        </div>

        {/* Filters */}
        <Card className="mb-8 bg-card border-border/50">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Icon name="Search" size={20} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input 
                    placeholder="Поиск сериалов..."
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
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {loading ? (
          <div className="space-y-6">
            {Array.from({length: 5}).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : series.length > 0 ? (
          <div className="space-y-6">
            {series.map((seriesItem) => (
              <SeriesCard key={seriesItem.id} seriesItem={seriesItem} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Icon name="Tv" size={64} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Сериалы не найдены</h3>
            <p className="text-muted-foreground">Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeriesPage;