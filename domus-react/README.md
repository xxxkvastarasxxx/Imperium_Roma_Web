# Domus React - Roman Numismatics Collection Manager

Сучасний React додаток для управління колекціями римських монет з повноцінною системою станів завантаження.

## Особливості

- 🏛️ **Управління колекцією** - Додавання, редагування та перегляд римських монет
- 📋 **Список бажань** - Відстеження монет, які ви хочете придбати
- 📊 **Аналітика** - Статистика та графіки вашої колекції
- ⚙️ **Налаштування** - Персоналізація профілю та параметрів
- 🔄 **Стани завантаження** - Повноцінна система індикації завантаження
- 📱 **Адаптивний дизайн** - Працює на всіх пристроях

## Система станів завантаження

Додаток включає комплексну систему управління станами завантаження:

### Компоненти
- **LoadingOverlay** - Оверлей завантаження для повноекранних та локальних станів
- **LoadingButton** - Кнопки з вбудованими станами завантаження
- **SkeletonLoader** - Скелетна анімація для плавного завантаження контенту
- **LoadingForm** - Форми з автоматичним управлінням завантаженням

### Хуки
- **useLoading** - Простое управління станами завантаження
- **useMultipleLoading** - Управління кількома станами одночасно
- **useApi** - API запити з автоматичними станами завантаження
- **usePaginatedApi** - Пагіновані запити з завантаженням

## Початок роботи

### Встановлення залежностей
\`\`\`bash
npm install
\`\`\`

### Запуск в режимі розробки
\`\`\`bash
npm run dev
\`\`\`

### Збірка для продакшну
\`\`\`bash
npm run build
\`\`\`

### Перегляд збірки
\`\`\`bash
npm run preview
\`\`\`

## Структура проекту

\`\`\`
src/
├── components/
│   ├── ui/                    # UI компоненти
│   │   ├── LoadingOverlay.jsx # Оверлей завантаження
│   │   ├── LoadingButton.jsx  # Кнопка з завантаженням
│   │   ├── SkeletonLoader.jsx # Скелетна анімація
│   │   └── LoadingForm.jsx    # Форма з завантаженням
│   ├── layout/               # Компоненти розмітки
│   └── features/             # Функціональні компоненти
├── pages/                    # Сторінки додатку
│   ├── Dashboard.jsx         # Головна сторінка
│   ├── Collection.jsx        # Управління колекцією
│   ├── Wishlist.jsx          # Список бажань
│   ├── Settings.jsx          # Налаштування
│   └── Profile.jsx           # Профіль користувача
├── hooks/                    # Custom хуки
│   ├── useLoading.js         # Хуки для завантаження
│   └── useApi.js             # API хуки
├── contexts/                 # React контексти
├── services/                 # Сервіси (API, Supabase)
├── styles/                   # Стилі
│   ├── components/           # Стилі компонентів
│   └── pages/                # Стилі сторінок
└── utils/                    # Утиліти
\`\`\`

## Використання станів завантаження

### Повноекранне завантаження
\`\`\`jsx
import { LoadingOverlay } from '../components/ui';

<LoadingOverlay 
  isVisible={loading} 
  message="Loading dashboard data..." 
  fullScreen={true}
/>
\`\`\`

### Кнопка з завантаженням
\`\`\`jsx
import { LoadingButton } from '../components/ui';

<LoadingButton
  loading={saving}
  loadingText="Saving..."
  onClick={handleSave}
>
  Save Changes
</LoadingButton>
\`\`\`

### Скелетне завантаження
\`\`\`jsx
import { SkeletonLoader } from '../components/ui';

{loading ? (
  <SkeletonLoader type="card" count={5} height="200px" />
) : (
  renderActualContent()
)}
\`\`\`

### Хук для API
\`\`\`jsx
import { useApi } from '../hooks/useApi';

const { data, loading, error, refetch } = useApi(fetchData);
\`\`\`

## Технології

- **React 18** - Бібліотека для побудови UI
- **Vite** - Швидкий збирач та dev сервер
- **Lucide React** - Іконки
- **Supabase** - Backend as a Service
- **Chart.js** - Графіки та діаграми
- **CSS Modules** - Стилізація компонентів

## Налаштування середовища

Створіть файл \`.env.local\` в корені проекту:

\`\`\`env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

## Розгортання

Проект готовий для розгортання на платформах як Vercel, Netlify, або GitHub Pages:

\`\`\`bash
npm run build
\`\`\`

## Документація

Детальна документація доступна в папці \`docs/\`:
- [Loading States](./docs/LoadingStates.md) - Система станів завантаження
- [Components](./docs/Components.md) - Опис компонентів
- [API](./docs/API.md) - Документація API

## Внесок у розвиток

1. Зробіть fork репозиторію
2. Створіть feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Зафіксуйте зміни (\`git commit -m 'Add some AmazingFeature'\`)
4. Відправте в branch (\`git push origin feature/AmazingFeature\`)
5. Відкрийте Pull Request

## Ліцензія

Цей проект ліцензовано під MIT License - дивіться файл [LICENSE](LICENSE) для деталей.
