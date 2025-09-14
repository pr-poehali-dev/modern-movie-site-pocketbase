import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { Rating, collections, authStore } from '@/lib/pocketbase';
import { toast } from '@/hooks/use-toast';

interface RatingComponentProps {
  videoId: string;
  showDistribution?: boolean;
  className?: string;
}

interface RatingStats {
  average: number;
  total: number;
  distribution: { [key: number]: number };
  userRating?: number;
}

const RatingComponent: React.FC<RatingComponentProps> = ({ 
  videoId, 
  showDistribution = true, 
  className = '' 
}) => {
  const [stats, setStats] = useState<RatingStats>({
    average: 0,
    total: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const currentUser = authStore.model();
  const isAuthenticated = authStore.isValid();

  useEffect(() => {
    fetchRatingStats();
  }, [videoId]);

  const fetchRatingStats = async () => {
    try {
      // Fetch all ratings for this video
      const ratingsResponse = await collections.ratings().getList(1, 500, {
        filter: `video = "${videoId}"`
      });
      const ratings = ratingsResponse.items as Rating[];

      // Calculate statistics
      let total = ratings.length;
      let sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
      let average = total > 0 ? sum / total : 0;

      // Calculate distribution
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach(rating => {
        distribution[rating.rating] = (distribution[rating.rating] || 0) + 1;
      });

      // Find user's rating if authenticated
      let userRating = undefined;
      if (isAuthenticated && currentUser) {
        const userRatingItem = ratings.find(rating => rating.user === currentUser.id);
        userRating = userRatingItem?.rating;
      }

      setStats({
        average,
        total,
        distribution,
        userRating
      });
    } catch (error) {
      console.error('Error fetching rating stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async (rating: number) => {
    if (!isAuthenticated || !currentUser) {
      toast({
        title: 'Необходима авторизация',
        description: 'Войдите в аккаунт, чтобы оценить видео',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      // Check if user already rated this video
      const existingRating = await collections.ratings().getList(1, 1, {
        filter: `video = "${videoId}" && user = "${currentUser.id}"`
      });

      if (existingRating.items.length > 0) {
        // Update existing rating
        await collections.ratings().update(existingRating.items[0].id, {
          rating
        });
        toast({
          title: 'Оценка обновлена',
          description: `Вы поставили ${rating} звезд${rating === 1 ? 'у' : rating < 5 ? 'ы' : ''}`
        });
      } else {
        // Create new rating
        await collections.ratings().create({
          video: videoId,
          user: currentUser.id,
          rating
        });
        toast({
          title: 'Оценка добавлена',
          description: `Вы поставили ${rating} звезд${rating === 1 ? 'у' : rating < 5 ? 'ы' : ''}`
        });
      }

      // Refresh stats
      await fetchRatingStats();
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось отправить оценку',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const removeRating = async () => {
    if (!isAuthenticated || !currentUser) return;

    setSubmitting(true);
    try {
      const existingRating = await collections.ratings().getList(1, 1, {
        filter: `video = "${videoId}" && user = "${currentUser.id}"`
      });

      if (existingRating.items.length > 0) {
        await collections.ratings().delete(existingRating.items[0].id);
        await fetchRatingStats();
        toast({
          title: 'Оценка удалена',
          description: 'Ваша оценка была удалена'
        });
      }
    } catch (error: any) {
      console.error('Error removing rating:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить оценку',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (interactive = false, size = 20) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const filled = interactive 
        ? (hoverRating >= i || (!hoverRating && (stats.userRating || 0) >= i))
        : stats.average >= i - 0.5;

      stars.push(
        <button
          key={i}
          className={`transition-colors ${
            interactive 
              ? 'hover:text-yellow-400 cursor-pointer' 
              : 'cursor-default'
          } ${
            filled ? 'text-yellow-400' : 'text-muted-foreground'
          } disabled:opacity-50`}
          onClick={interactive ? () => submitRating(i) : undefined}
          onMouseEnter={interactive ? () => setHoverRating(i) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
          disabled={submitting}
        >
          <Icon 
            name={filled ? 'Star' : 'Star'} 
            size={size} 
            className={filled ? 'fill-current' : ''}
          />
        </button>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <Card className={`border-border/50 animate-pulse ${className}`}>
        <CardContent className="p-4">
          <div className="h-6 bg-muted rounded mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-border/50 ${className}`}>
      <CardContent className="p-4">
        {/* Rating Summary */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              {renderStars(false, 16)}
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {stats.average.toFixed(1)}
              </span>
              {' '}из 5 ({stats.total} оценок)
            </div>
          </div>
          {stats.average > 0 && (
            <Badge variant="secondary" className="text-xs">
              {stats.average >= 4.5 ? '⭐ Отлично' :
               stats.average >= 3.5 ? '👍 Хорошо' :
               stats.average >= 2.5 ? '👌 Неплохо' :
               stats.average >= 1.5 ? '👎 Плохо' : '💩 Ужасно'}
            </Badge>
          )}
        </div>

        {/* User Rating */}
        {isAuthenticated && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Ваша оценка:
              </span>
              {stats.userRating && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={removeRating}
                  disabled={submitting}
                  className="text-xs text-destructive hover:text-destructive"
                >
                  <Icon name="X" size={12} className="mr-1" />
                  Удалить
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-1">
              {renderStars(true, 20)}
            </div>
            {stats.userRating && (
              <p className="text-xs text-muted-foreground mt-1">
                Вы поставили {stats.userRating} звезд{stats.userRating === 1 ? 'у' : stats.userRating < 5 ? 'ы' : ''}
              </p>
            )}
          </div>
        )}

        {!isAuthenticated && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              <Icon name="User" size={16} className="inline mr-1" />
              Войдите в аккаунт, чтобы оценить видео
            </p>
          </div>
        )}

        {/* Rating Distribution */}
        {showDistribution && stats.total > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground mb-3">Распределение оценок:</h4>
            {[5, 4, 3, 2, 1].map(rating => {
              const count = stats.distribution[rating] || 0;
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 w-12">
                    <span className="text-xs text-muted-foreground">{rating}</span>
                    <Icon name="Star" size={12} className="text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1">
                    <Progress value={percentage} className="h-2" />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {stats.total === 0 && (
          <div className="text-center py-4">
            <Icon name="Star" size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Пока нет оценок. Станьте первым!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RatingComponent;