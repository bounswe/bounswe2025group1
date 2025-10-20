import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '../i18n/config';

describe('Internationalization (i18n)', () => {
  beforeEach(async () => {
    // Reset to English before each test
    await i18n.changeLanguage('en');
  });

  describe('Language Detection and Switching', () => {
    it('should initialize with English as default language', () => {
      expect(i18n.language).toBe('en');
    });

    it('should switch to Turkish when requested', async () => {
      await i18n.changeLanguage('tr');
      expect(i18n.language).toBe('tr');
    });

    it('should switch back to English from Turkish', async () => {
      await i18n.changeLanguage('tr');
      await i18n.changeLanguage('en');
      expect(i18n.language).toBe('en');
    });

    it('should fallback to English for unsupported languages', async () => {
      await i18n.changeLanguage('fr'); // Unsupported language
      expect(i18n.language).toBe('en');
    });
  });

  describe('Translation Keys - Navigation', () => {
    it('should translate navigation items correctly in English', () => {
      expect(i18n.t('navigation.home')).toBe('Home');
      expect(i18n.t('navigation.gardens')).toBe('Gardens');
      expect(i18n.t('navigation.forum')).toBe('Forum');
      expect(i18n.t('navigation.profile')).toBe('Profile');
    });

    it('should translate navigation items correctly in Turkish', async () => {
      await i18n.changeLanguage('tr');
      expect(i18n.t('navigation.home')).toBe('Ana Sayfa');
      expect(i18n.t('navigation.gardens')).toBe('Bahçeler');
      expect(i18n.t('navigation.forum')).toBe('Forum');
      expect(i18n.t('navigation.profile')).toBe('Profil');
    });
  });

  describe('Translation Keys - Authentication', () => {
    it('should translate login form correctly in English', () => {
      expect(i18n.t('auth.login.title')).toBe('Sign In');
      expect(i18n.t('auth.login.email')).toBe('Email Address');
      expect(i18n.t('auth.login.password')).toBe('Password');
      expect(i18n.t('auth.login.signInButton')).toBe('Sign In');
    });

    it('should translate login form correctly in Turkish', async () => {
      await i18n.changeLanguage('tr');
      expect(i18n.t('auth.login.title')).toBe('Giriş Yap');
      expect(i18n.t('auth.login.email')).toBe('E-posta Adresi');
      expect(i18n.t('auth.login.password')).toBe('Şifre');
      expect(i18n.t('auth.login.signInButton')).toBe('Giriş Yap');
    });

    it('should translate register form correctly in English', () => {
      expect(i18n.t('auth.register.title')).toBe('Sign Up');
      expect(i18n.t('auth.register.firstName')).toBe('First Name');
      expect(i18n.t('auth.register.lastName')).toBe('Last Name');
      expect(i18n.t('auth.register.signUpButton')).toBe('Sign Up');
    });

    it('should translate register form correctly in Turkish', async () => {
      await i18n.changeLanguage('tr');
      expect(i18n.t('auth.register.title')).toBe('Kayıt Ol');
      expect(i18n.t('auth.register.firstName')).toBe('Ad');
      expect(i18n.t('auth.register.lastName')).toBe('Soyad');
      expect(i18n.t('auth.register.signUpButton')).toBe('Kayıt Ol');
    });
  });

  describe('Translation Keys - Home Page', () => {
    it('should translate home page content correctly in English', () => {
      expect(i18n.t('home.welcomeGuest')).toBe('Welcome to Community Garden Planner!');
      expect(i18n.t('home.subtitle')).toBe('Connect with local gardeners, manage tasks, track your garden, and grow together 🌱');
      expect(i18n.t('home.joinCommunity')).toBe('Join Our Community');
      expect(i18n.t('home.aboutTitle')).toBe('What is Community Garden Planner?');
    });

    it('should translate home page content correctly in Turkish', async () => {
      await i18n.changeLanguage('tr');
      expect(i18n.t('home.welcomeGuest')).toBe('Topluluk Bahçe Planlayıcısına Hoş Geldiniz!');
      expect(i18n.t('home.subtitle')).toBe('Yerel bahçıvanlarla bağlantı kurun, görevleri yönetin, bahçenizi takip edin ve birlikte büyüyün 🌱');
      expect(i18n.t('home.joinCommunity')).toBe('Topluluğumuza Katılın');
      expect(i18n.t('home.aboutTitle')).toBe('Topluluk Bahçe Planlayıcısı Nedir?');
    });
  });

  describe('Translation Keys - Gardens', () => {
    it('should translate gardens page correctly in English', () => {
      expect(i18n.t('gardens.title')).toBe('Community Gardens');
      expect(i18n.t('gardens.subtitle')).toBe('Explore and join community gardens in your area or create your own.');
      expect(i18n.t('gardens.createGarden')).toBe('Create New Garden');
      expect(i18n.t('gardens.searchPlaceholder')).toBe('Search gardens...');
    });

    it('should translate gardens page correctly in Turkish', async () => {
      await i18n.changeLanguage('tr');
      expect(i18n.t('gardens.title')).toBe('Topluluk Bahçeleri');
      expect(i18n.t('gardens.subtitle')).toBe('Bölgenizdeki topluluk bahçelerini keşfedin ve katılın veya kendinizinkini oluşturun.');
      expect(i18n.t('gardens.createGarden')).toBe('Yeni Bahçe Oluştur');
      expect(i18n.t('gardens.searchPlaceholder')).toBe('Bahçelerde ara...');
    });
  });

  describe('Translation Keys - Theme and Language', () => {
    it('should translate theme options correctly in English', () => {
      expect(i18n.t('theme.light')).toBe('Light Mode');
      expect(i18n.t('theme.dark')).toBe('Dark Mode');
      expect(i18n.t('theme.highContrast')).toBe('High Contrast');
    });

    it('should translate theme options correctly in Turkish', async () => {
      await i18n.changeLanguage('tr');
      expect(i18n.t('theme.light')).toBe('Açık Tema');
      expect(i18n.t('theme.dark')).toBe('Koyu Tema');
      expect(i18n.t('theme.highContrast')).toBe('Yüksek Kontrast');
    });

    it('should translate language options correctly', () => {
      expect(i18n.t('language.english')).toBe('English');
      expect(i18n.t('language.turkish')).toBe('Türkçe');
    });
  });

  describe('Translation Keys - Common Elements', () => {
    it('should translate common buttons and actions in English', () => {
      expect(i18n.t('common.loading')).toBe('Loading...');
      expect(i18n.t('common.save')).toBe('Save');
      expect(i18n.t('common.cancel')).toBe('Cancel');
      expect(i18n.t('common.search')).toBe('Search');
    });

    it('should translate common buttons and actions in Turkish', async () => {
      await i18n.changeLanguage('tr');
      expect(i18n.t('common.loading')).toBe('Yükleniyor...');
      expect(i18n.t('common.save')).toBe('Kaydet');
      expect(i18n.t('common.cancel')).toBe('İptal');
      expect(i18n.t('common.search')).toBe('Ara');
    });
  });

  describe('Interpolation and Pluralization', () => {
    it('should handle interpolation correctly in English', () => {
      const result = i18n.t('home.welcome', { username: ', John' });
      expect(result).toBe('Welcome, John!');
    });

    it('should handle interpolation correctly in Turkish', async () => {
      await i18n.changeLanguage('tr');
      const result = i18n.t('home.welcome', { username: ', Ahmet' });
      expect(result).toBe('Hoş geldin, Ahmet!');
    });

    it('should handle theme interpolation correctly', () => {
      const result = i18n.t('theme.currentTheme', { theme: 'Dark Mode' });
      expect(result).toBe('Current theme: Dark Mode');
    });

    it('should handle language interpolation correctly', async () => {
      await i18n.changeLanguage('tr');
      const result = i18n.t('language.currentLanguage', { language: 'Türkçe' });
      expect(result).toBe('Mevcut dil: Türkçe');
    });
  });

  describe('Missing Translation Keys', () => {
    it('should return the key itself for missing translations', () => {
      const result = i18n.t('nonexistent.key');
      expect(result).toBe('nonexistent.key');
    });

    it('should handle nested missing keys gracefully', () => {
      const result = i18n.t('some.deeply.nested.missing.key');
      expect(result).toBe('some.deeply.nested.missing.key');
    });
  });

  describe('HTML Lang Attribute', () => {
    it('should update document lang attribute when language changes', async () => {
      await i18n.changeLanguage('tr');
      expect(document.documentElement.lang).toBe('tr');
      
      await i18n.changeLanguage('en');
      expect(document.documentElement.lang).toBe('en');
    });
  });
});
