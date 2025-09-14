import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { pb } from '@/lib/pocketbase';
import { toast } from '@/hooks/use-toast';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    passwordConfirm: '',
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (formData.password !== formData.passwordConfirm) {
      setError('Пароли не совпадают');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return false;
    }

    if (!formData.agreeToTerms) {
      setError('Необходимо согласиться с условиями использования');
      return false;
    }

    return true;
  };

  const generateSlug = (username: string) => {
    return username.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Register the user
      const userData = {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        slug: generateSlug(formData.username),
        bio: '',
        meta_title: formData.username,
        meta_description: `Профиль пользователя ${formData.username}`,
      };

      const user = await pb.collection('users').create(userData);
      
      // Auto-login after registration
      await pb.collection('users').authWithPassword(formData.email, formData.password);
      
      toast({
        title: 'Регистрация успешна!',
        description: 'Добро пожаловать в CinemaMax',
      });

      navigate('/');
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Handle specific errors
      let errorMessage = 'Ошибка регистрации. Попробуйте еще раз.';
      
      if (err?.response?.data) {
        const data = err.response.data;
        if (data.email?.message) {
          errorMessage = 'Этот email уже используется';
        } else if (data.username?.message) {
          errorMessage = 'Это имя пользователя уже занято';
        } else if (data.password?.message) {
          errorMessage = data.password.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center">
            <Icon name="Film" size={40} className="text-primary mr-3" />
            <h1 className="text-3xl font-montserrat font-bold text-foreground">CinemaMax</h1>
          </Link>
          <p className="text-muted-foreground mt-2">Создайте новый аккаунт</p>
        </div>

        <Card className="border-border/50 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-montserrat text-center">Регистрация</CardTitle>
            <CardDescription className="text-center">
              Заполните форму для создания аккаунта
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <Icon name="AlertCircle" size={16} />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Имя пользователя</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder="myusername"
                  required
                  disabled={loading}
                  className="border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="example@email.com"
                  required
                  disabled={loading}
                  className="border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="border-border/50"
                />
                <p className="text-xs text-muted-foreground">
                  Минимум 8 символов
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">Подтвердите пароль</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  value={formData.passwordConfirm}
                  onChange={(e) => handleChange('passwordConfirm', e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="border-border/50"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => handleChange('agreeToTerms', checked as boolean)}
                  disabled={loading}
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Я согласен с{' '}
                  <Link to="/terms" className="text-primary hover:underline">
                    условиями использования
                  </Link>{' '}
                  и{' '}
                  <Link to="/privacy" className="text-primary hover:underline">
                    политикой конфиденциальности
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                {loading ? (
                  <>
                    <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                    Создаем аккаунт...
                  </>
                ) : (
                  <>
                    <Icon name="UserPlus" size={18} className="mr-2" />
                    Создать аккаунт
                  </>
                )}
              </Button>
            </form>

            {/* Social Registration */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">или</span>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <Button variant="outline" disabled className="border-border/50">
                  <Icon name="Mail" size={18} className="mr-2" />
                  Регистрация через Google (скоро)
                </Button>
              </div>
            </div>

            {/* Login Link */}
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Уже есть аккаунт? </span>
              <Link
                to="/auth/login"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Войти
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center"
          >
            <Icon name="ArrowLeft" size={16} className="mr-1" />
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;