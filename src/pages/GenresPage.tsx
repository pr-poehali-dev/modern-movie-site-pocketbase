import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Genre, Video, collections } from '@/lib/pocketbase';

const GenresPage: React.FC = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genreContent, setGenreContent] = useState<{[key: string]: Video[]}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const result = await collections.genres().getList(1, 50, {
        sort: 'title'
      });
      const genresData = result.items as Genre[];
      setGenres(genresData);
      
      // Fetch content for each genre
      const contentPromises = genresData.map(async (genre) => {
        try {
          const videos = await collections.videos().getList(1, 6, {
            filter: `genre ~ "${genre.id}"`,
            sort: '-created',
            expand: 'genre'
          });
          return { genreId: genre.id, videos: videos.items as Video[] };
        } catch (error) {
          console.error(`Error fetching content for genre ${genre.id}:`, error);
          return { genreId: genre.id, videos: [] };
        }
      });

      const contentResults = await Promise.all(contentPromises);
      const contentMap = contentResults.reduce((acc, { genreId, videos }) => {
        acc[genreId] = videos;
        return acc;
      }, {} as {[key: string]: Video[]});
      
      setGenreContent(contentMap);
    } catch (error) {
      console.error('Error fetching genres:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGenreIcon = (genre: Genre) => {
    // Map genre names to appropriate icons
    const iconMap: {[key: string]: string} = {
      'фантастика': 'Zap',
      'драма': 'Heart',
      'комедия': 'Smile',
      'триллер': 'Eye',
      'боевик': 'Sword',
      'ужасы': 'Ghost',
      'детектив': 'Search',
      'мелодрама': 'HeartHandshake',
      'приключения': 'Map',
      'документальный': 'FileText'
    };
    
    const lowerTitle = genre.title.toLowerCase();
    const iconName = Object.keys(iconMap).find(key => lowerTitle.includes(key));
    return iconMap[iconName || ''] || genre.icon || 'PlaySquare';
  };

  const GenreCard = ({ genre }: { genre: Genre }) => {
    const videos = genreContent[genre.id] || [];
    const movieCount = videos.filter(v => v.type === 'movie').length;
    const seriesCount = videos.filter(v => v.type === 'serias').length;

    return (
      <Card className="group hover:scale-105 transition-all duration-300 hover:shadow-2xl bg-card border-border/50 overflow-hidden">
        <div className="relative bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/5 p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <Icon name={getGenreIcon(genre) as any} size={32} className="text-primary" />
            </div>
            <h3 className="text-xl font-montserrat font-bold text-foreground mb-2">{genre.title}</h3>
            <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
              <span>{movieCount} фильмов</span>
              <span>•</span>
              <span>{seriesCount} сериалов</span>
            </div>
          </div>
          
          <Link 
            to={`/movies?genre=${genre.id}`}
            className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 bg-gradient-to-t from-primary/20 to-transparent transition-all duration-300 flex items-center justify-center"
          >
            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium text-sm">
              Открыть жанр
            </div>
          </Link>
        </div>

        {/* Preview Content */}
        {videos.length > 0 && (
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-2">
              {videos.slice(0, 3).map((video) => (
                <Link key={video.id} to={`/watch/${video.id}`}>
                  <div className="group/item relative aspect-video rounded overflow-hidden bg-muted">
                    {video.thumbnail ? (
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon name="Image" size={20} className="text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/20 transition-colors flex items-center justify-center">
                      <Icon name="Play" size={16} className="text-white opacity-0 group-hover/item:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {videos.length > 3 && (
              <div className="mt-3 text-center">
                <Link to={`/movies?genre=${genre.id}`}>
                  <Badge variant="outline" className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                    +{videos.length - 3} еще
                  </Badge>
                </Link>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({length: 12}).map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="h-48 bg-muted rounded"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-montserrat font-bold text-foreground mb-4">
            <Icon name="Grid3X3" size={32} className="inline mr-3 text-primary" />
            Жанры
          </h1>
          <p className="text-muted-foreground">Исследуйте контент по жанрам и найдите что-то новое</p>
        </div>

        {/* Popular Genres Grid */}
        {genres.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {genres.map((genre) => (
              <GenreCard key={genre.id} genre={genre} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Icon name="Grid3X3" size={64} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Жанры не найдены</h3>
            <p className="text-muted-foreground">Добавьте жанры в админ панели</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/movies">
            <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer hover:bg-primary/5 border-border/50 p-8">
              <CardContent className="p-0 text-center">
                <Icon name="Film" size={48} className="mx-auto mb-4 text-primary group-hover:text-primary" />
                <h3 className="text-xl font-montserrat font-bold text-foreground mb-2">Все фильмы</h3>
                <p className="text-muted-foreground">Просмотреть полный каталог фильмов</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/series">
            <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer hover:bg-primary/5 border-border/50 p-8">
              <CardContent className="p-0 text-center">
                <Icon name="Tv" size={48} className="mx-auto mb-4 text-primary group-hover:text-primary" />
                <h3 className="text-xl font-montserrat font-bold text-foreground mb-2">Все сериалы</h3>
                <p className="text-muted-foreground">Погрузитесь в мир сериалов</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GenresPage;