import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { Video, Episode, Comment, Genre, collections, pb, authStore } from '@/lib/pocketbase';
import { toast } from '@/hooks/use-toast';

const WatchPage: React.FC = () => {
  const { id, episodeId } = useParams<{ id: string; episodeId?: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const isAuthenticated = authStore.isValid();
  const currentUser = authStore.model();

  useEffect(() => {
    if (id) {
      fetchVideoData();
    }
  }, [id, episodeId]);

  const fetchVideoData = async () => {
    try {
      // Fetch video details
      const videoResponse = await collections.videos().getOne(id!, {
        expand: 'genre,createdBy'
      });
      const videoData = videoResponse as Video;
      setVideo(videoData);

      // If it's a series, fetch episodes
      if (videoData.type === 'serias') {
        const episodesResponse = await collections.episodes().getList(1, 100, {
          filter: `video = "${id}"`,
          sort: 'season,episodeNumber',
          expand: 'createdBy'
        });
        setEpisodes(episodesResponse.items as Episode[]);

        // Set current episode
        if (episodeId) {
          const episode = episodesResponse.items.find(ep => ep.id === episodeId);
          setCurrentEpisode(episode as Episode || null);
        } else {
          setCurrentEpisode(episodesResponse.items[0] as Episode || null);
        }
      }

      // Fetch comments
      const commentsResponse = await collections.comments().getList(1, 50, {
        filter: `video = "${id}"`,
        sort: '-created',
        expand: 'createdBy'
      });
      setComments(commentsResponse.items as Comment[]);

      // Fetch related videos
      if (videoData.expand?.genre && Array.isArray(videoData.expand.genre)) {
        const genreIds = videoData.expand.genre.map((g: Genre) => g.id);
        const relatedResponse = await collections.videos().getList(1, 6, {
          filter: `genre ~ "${genreIds[0]}" && id != "${id}"`,
          sort: '-created',
          expand: 'genre'
        });
        setRelatedVideos(relatedResponse.items as Video[]);
      }

      // Check if video is in favorites
      if (isAuthenticated) {
        try {
          const favResponse = await collections.favorites().getList(1, 1, {
            filter: `video = "${id}" && user = "${currentUser?.id}"`
          });
          setIsFavorite(favResponse.items.length > 0);
        } catch (error) {
          console.error('Error checking favorites:', error);
        }

        // Add to watch history
        try {
          await collections.watchHistory().create({
            video: id,
            user: currentUser?.id,
            progress: 0
          });
        } catch (error) {
          // History entry might already exist, ignore error
        }

        // Record view
        try {
          await collections.views().create({
            video: id,
            episodes: episodeId || undefined,
            user: currentUser?.id,
            session: Date.now().toString()
          });
        } catch (error) {
          console.error('Error recording view:', error);
        }
      }

    } catch (error) {
      console.error('Error fetching video data:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить видео',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Необходима авторизация',
        description: 'Войдите в аккаунт, чтобы добавить в избранное',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (isFavorite) {
        // Remove from favorites
        const favResponse = await collections.favorites().getList(1, 1, {
          filter: `video = "${id}" && user = "${currentUser?.id}"`
        });
        if (favResponse.items.length > 0) {
          await collections.favorites().delete(favResponse.items[0].id);
          setIsFavorite(false);
          toast({
            title: 'Удалено из избранного',
            description: video?.title
          });
        }
      } else {
        // Add to favorites
        await collections.favorites().create({
          video: id,
          user: currentUser?.id
        });
        setIsFavorite(true);
        toast({
          title: 'Добавлено в избранное',
          description: video?.title
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить избранное',
        variant: 'destructive'
      });
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast({
        title: 'Необходима авторизация',
        description: 'Войдите в аккаунт, чтобы оставить комментарий',
        variant: 'destructive'
      });
      return;
    }

    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const comment = await collections.comments().create({
        content: newComment.trim(),
        video: id,
        createdBy: currentUser?.id
      });

      const commentWithUser = await collections.comments().getOne(comment.id, {
        expand: 'createdBy'
      });

      setComments(prev => [commentWithUser as Comment, ...prev]);
      setNewComment('');
      toast({
        title: 'Комментарий добавлен',
        description: 'Ваш комментарий успешно опубликован'
      });
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить комментарий',
        variant: 'destructive'
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const getVideoSource = () => {
    if (video?.type === 'serias' && currentEpisode) {
      return currentEpisode.videoSourceUrl || currentEpisode.videoFile;
    }
    return video?.videoSourceUrl || video?.videoFile;
  };

  const getVideoTitle = () => {
    if (video?.type === 'serias' && currentEpisode) {
      return `${video.title} - С${currentEpisode.season}Э${currentEpisode.episodeNumber}: ${currentEpisode.title}`;
    }
    return video?.title || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse space-y-8">
            <div className="aspect-video bg-muted rounded-lg" />
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-5/6" />
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="AlertCircle" size={64} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Видео не найдено</h2>
          <p className="text-muted-foreground mb-4">Запрашиваемое видео не существует или было удалено</p>
          <Link to="/">
            <Button>
              <Icon name="Home" size={16} className="mr-2" />
              На главную
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const videoSource = getVideoSource();
  const videoTitle = getVideoTitle();

  // Group episodes by season
  const episodesBySeason = episodes.reduce((acc, episode) => {
    if (!acc[episode.season]) {
      acc[episode.season] = [];
    }
    acc[episode.season].push(episode);
    return acc;
  }, {} as Record<number, Episode[]>);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Video Player */}
        <div className="mb-8">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {videoSource ? (
              <video 
                controls 
                className="w-full h-full"
                poster={video.type === 'serias' ? currentEpisode?.thumbnail : video.thumbnail}
                autoPlay
              >
                <source src={videoSource} type="video/mp4" />
                <source src={videoSource} type="video/webm" />
                Ваш браузер не поддерживает воспроизведение видео.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <Icon name="PlayCircle" size={64} className="mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Видео недоступно</h3>
                  <p className="text-muted-foreground">Источник видео не найден</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Video Info */}
            <div className="mb-6">
              <h1 className="text-3xl font-montserrat font-bold text-foreground mb-4">
                {videoTitle}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <Badge variant={video.type === 'movie' ? 'default' : 'secondary'} className="text-sm">
                  <Icon name={video.type === 'movie' ? 'Film' : 'Tv'} size={16} className="mr-2" />
                  {video.type === 'movie' ? 'Фильм' : 'Сериал'}
                </Badge>
                
                {video.year && (
                  <Badge variant="outline">{video.year}</Badge>
                )}
                
                {video.country && (
                  <Badge variant="outline">{video.country}</Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {video.expand?.genre && Array.isArray(video.expand.genre) && 
                  video.expand.genre.map((genre: Genre) => (
                    <Link key={genre.id} to={`/movies?genre=${genre.id}`}>
                      <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                        {genre.title}
                      </Badge>
                    </Link>
                  ))
                }
              </div>

              <div className="flex space-x-4 mb-6">
                <Button onClick={toggleFavorite} variant={isFavorite ? 'default' : 'outline'}>
                  <Icon name={isFavorite ? 'Heart' : 'Heart'} size={16} className={`mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'В избранном' : 'В избранное'}
                </Button>
                
                <Button variant="outline">
                  <Icon name="Share" size={16} className="mr-2" />
                  Поделиться
                </Button>
              </div>

              {video.description && (
                <div className="prose prose-sm max-w-none text-muted-foreground" 
                     dangerouslySetInnerHTML={{ __html: video.description }} 
                />
              )}
            </div>

            {/* Episodes (for series) */}
            {video.type === 'serias' && Object.keys(episodesBySeason).length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-montserrat font-bold text-foreground mb-4">Эпизоды</h3>
                
                <Tabs defaultValue={Object.keys(episodesBySeason)[0]} className="w-full">
                  <TabsList className="grid w-full grid-cols-auto mb-4">
                    {Object.keys(episodesBySeason).map(season => (
                      <TabsTrigger key={season} value={season}>Сезон {season}</TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {Object.entries(episodesBySeason).map(([season, seasonEpisodes]) => (
                    <TabsContent key={season} value={season}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {seasonEpisodes.map((episode) => (
                          <Link 
                            key={episode.id} 
                            to={`/watch/${video.id}/episode/${episode.id}`}
                            className={`group ${currentEpisode?.id === episode.id ? 'ring-2 ring-primary' : ''}`}
                          >
                            <Card className="hover:shadow-md transition-shadow border-border/50">
                              <div className="flex">
                                <div className="relative w-32 aspect-video bg-muted rounded-l overflow-hidden">
                                  {episode.thumbnail ? (
                                    <img 
                                      src={episode.thumbnail} 
                                      alt={episode.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Icon name="Play" size={24} className="text-muted-foreground" />
                                    </div>
                                  )}
                                  {currentEpisode?.id === episode.id && (
                                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                      <Icon name="Play" size={20} className="text-primary" />
                                    </div>
                                  )}
                                </div>
                                <CardContent className="p-4 flex-1">
                                  <div className="text-sm text-muted-foreground mb-1">
                                    Эпизод {episode.episodeNumber}
                                  </div>
                                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                    {episode.title}
                                  </h4>
                                </CardContent>
                              </div>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}

            {/* Comments */}
            <div>
              <h3 className="text-2xl font-montserrat font-bold text-foreground mb-4">
                Комментарии ({comments.length})
              </h3>

              {/* Add Comment */}
              {isAuthenticated ? (
                <form onSubmit={submitComment} className="mb-6">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Напишите ваш комментарий..."
                    className="mb-4"
                    rows={3}
                  />
                  <Button type="submit" disabled={submittingComment || !newComment.trim()}>
                    {submittingComment ? (
                      <>
                        <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                        Отправляем...
                      </>
                    ) : (
                      <>
                        <Icon name="Send" size={16} className="mr-2" />
                        Отправить
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <Alert className="mb-6">
                  <Icon name="Info" size={16} />
                  <AlertDescription>
                    <Link to="/auth/login" className="text-primary hover:underline">
                      Войдите в аккаунт
                    </Link>, чтобы оставлять комментарии
                  </AlertDescription>
                </Alert>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <Card key={comment.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <Icon name="User" size={16} className="text-primary" />
                            </div>
                            <span className="font-medium text-foreground">
                              {comment.expand?.createdBy?.username || 'Пользователь'}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created).toLocaleDateString()}
                          </span>
                        </div>
                        <div 
                          className="text-muted-foreground prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: comment.content }}
                        />
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon name="MessageCircle" size={48} className="mx-auto mb-4" />
                    <p>Пока нет комментариев. Станьте первым!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Related Videos */}
            {relatedVideos.length > 0 && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Icon name="PlaySquare" size={20} className="mr-2 text-primary" />
                    Похожее
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {relatedVideos.map((relatedVideo, index) => (
                      <div key={relatedVideo.id}>
                        <Link 
                          to={`/watch/${relatedVideo.id}`}
                          className="flex p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="relative w-24 aspect-video bg-muted rounded overflow-hidden mr-3">
                            {relatedVideo.thumbnail ? (
                              <img 
                                src={relatedVideo.thumbnail} 
                                alt={relatedVideo.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Icon name="Image" size={16} className="text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute bottom-1 right-1">
                              <Badge variant={relatedVideo.type === 'movie' ? 'default' : 'secondary'} className="text-xs">
                                {relatedVideo.type === 'movie' ? 'Фильм' : 'Сериал'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground line-clamp-2 text-sm mb-1">
                              {relatedVideo.title}
                            </h4>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              {relatedVideo.year && <span>{relatedVideo.year}</span>}
                              {relatedVideo.country && (
                                <>
                                  <span>•</span>
                                  <span>{relatedVideo.country}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </Link>
                        {index < relatedVideos.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchPage;