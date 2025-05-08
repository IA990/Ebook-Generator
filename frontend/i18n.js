// Simple vanilla JS i18n system with language detection, pluralization, gender, and formatting

class I18n {
  constructor(options) {
    this.supportedLanguages = options.supportedLanguages || ['en', 'fr'];
    this.fallbackLanguage = options.fallbackLanguage || 'en';
    this.translations = options.translations || {};
    this.currentLanguage = this.detectLanguage();
  }

  detectLanguage() {
    const lang = navigator.language || navigator.userLanguage || this.fallbackLanguage;
    const shortLang = lang.split('-')[0];
    if (this.supportedLanguages.includes(shortLang)) {
      return shortLang;
    }
    return this.fallbackLanguage;
  }

  setLanguage(lang) {
    if (this.supportedLanguages.includes(lang)) {
      this.currentLanguage = lang;
    }
  }

  t(key, options = {}) {
    const keys = key.split('.');
    let translation = this.translations[this.currentLanguage];
    for (const k of keys) {
      if (!translation) break;
      translation = translation[k];
    }
    if (!translation) {
      // fallback
      translation = this.translations[this.fallbackLanguage];
      for (const k of keys) {
        if (!translation) break;
        translation = translation[k];
      }
    }
    if (typeof translation === 'function') {
      return translation(options);
    }
    if (typeof translation === 'string') {
      // Handle simple pluralization
      if (options.count !== undefined) {
        if (options.count > 1 && this.translations[this.currentLanguage][key + '_plural']) {
          return this.translations[this.currentLanguage][key + '_plural'].replace('{{count}}', options.count);
        }
        return translation.replace('{{count}}', options.count);
      }
      return translation;
    }
    return key;
  }

  formatDate(date, options = {}) {
    try {
      return new Intl.DateTimeFormat(this.currentLanguage, options).format(date);
    } catch {
      return date.toLocaleDateString();
    }
  }

  formatNumber(number, options = {}) {
    try {
      return new Intl.NumberFormat(this.currentLanguage, options).format(number);
    } catch {
      return number.toString();
    }
  }
}

export default I18n;
