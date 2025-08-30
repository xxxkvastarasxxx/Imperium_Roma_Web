# Loading States Documentation

Цей документ описує систему станів завантаження, реалізовану в React додатку Domus.

## Компоненти

### LoadingOverlay
Головний компонент для відображення оверлею завантаження.

```jsx
import { LoadingOverlay } from '../components/ui';

<LoadingOverlay 
  isVisible={loading} 
  message="Loading data..." 
  fullScreen={true}
  className="custom-loading"
/>
```

**Props:**
- `isVisible` (boolean): Чи показувати оверлей
- `message` (string): Текст повідомлення (за замовчуванням: "Loading...")
- `fullScreen` (boolean): Чи займати весь екран
- `className` (string): Додаткові CSS класи

### LoadingButton
Кнопка з вбудованим станом завантаження.

```jsx
import { LoadingButton } from '../components/ui';

<LoadingButton
  loading={isSubmitting}
  loadingText="Saving..."
  onClick={handleSave}
>
  Save Changes
</LoadingButton>
```

**Props:**
- `loading` (boolean): Стан завантаження
- `loadingText` (string): Текст під час завантаження
- `loadingIcon` (ReactNode): Іконка завантаження
- Всі інші props від звичайного Button

### SkeletonLoader
Компонент для відображення скелетної анімації завантаження.

```jsx
import { SkeletonLoader } from '../components/ui';

<SkeletonLoader type="text" count={3} />
<SkeletonLoader type="card" height="200px" />
<SkeletonLoader type="avatar" />
```

**Props:**
- `type` (string): Тип скелету ("text", "card", "avatar")
- `width` (string): Ширина
- `height` (string): Висота
- `count` (number): Кількість елементів (для типу "text")
- `className` (string): Додаткові CSS класи

### LoadingForm
Форма з автоматичним управлінням станом завантаження.

```jsx
import { LoadingForm } from '../components/ui';

<LoadingForm
  onSubmit={handleSubmit}
  submitText="Save Settings"
  submitLoadingText="Saving..."
  showOverlay={true}
  loadingMessage="Processing your request..."
>
  {/* Form fields */}
</LoadingForm>
```

**Props:**
- `onSubmit` (function): Обробник відправки форми
- `loading` (boolean): Зовнішній стан завантаження
- `submitText` (string): Текст кнопки відправки
- `submitLoadingText` (string): Текст кнопки під час завантаження
- `showOverlay` (boolean): Показувати оверлей під час завантаження
- `loadingMessage` (string): Повідомлення оверлею

## Хуки

### useLoading
Хук для управління простими станами завантаження.

```jsx
import { useLoading } from '../hooks/useLoading';

const { loading, error, startLoading, stopLoading, withLoading } = useLoading();

// Використання
const handleSave = async () => {
  await withLoading(async () => {
    // Ваш асинхронний код
    await saveData();
  });
};
```

### useMultipleLoading
Хук для управління кількома станами завантаження.

```jsx
import { useMultipleLoading } from '../hooks/useLoading';

const { 
  startLoading, 
  stopLoading, 
  isLoading, 
  isAnyLoading 
} = useMultipleLoading({
  save: false,
  upload: false,
  delete: false
});

// Використання
const handleSave = async () => {
  startLoading('save');
  try {
    await saveData();
  } finally {
    stopLoading('save');
  }
};
```

### useApi
Хук для API запитів з автоматичним управлінням станами завантаження.

```jsx
import { useApi } from '../hooks/useApi';

const { data, loading, error, refetch } = useApi(
  () => fetchUserData(),
  [], // dependencies
  {
    onSuccess: (data) => console.log('Success:', data),
    onError: (error) => console.error('Error:', error)
  }
);
```

### usePaginatedApi
Хук для пагінованих API запитів.

```jsx
import { usePaginatedApi } from '../hooks/useApi';

const {
  data,
  pagination,
  loading,
  goToPage,
  nextPage,
  previousPage,
  changePageSize
} = usePaginatedApi(fetchPaginatedData);
```

## Стилі

### CSS Класи
- `.loading-overlay` - Основний оверлей
- `.loading-overlay.full-screen` - Повноекранний оверлей
- `.skeleton` - Базовий скелет
- `.skeleton-text`, `.skeleton-card`, `.skeleton-avatar` - Типи скелетів
- `.loading-form` - Форма з завантаженням
- `.inline-loading` - Інлайн індикатор завантаження

### Анімації
- `spin` - Обертання спінера
- `shimmer` - Shimmer ефект для скелетів
- `fadeInScale` - Появлення оверлею
- `loadingDots` - Анімація точок
- `progressIndeterminate` - Прогрес бар

## Приклади використання

### Dashboard з повноекранним завантаженням
```jsx
function Dashboard() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="dashboard-container">
      <LoadingOverlay 
        isVisible={loading} 
        message="Loading dashboard data..." 
        fullScreen={true}
      />
      {/* Dashboard content */}
    </div>
  );
}
```

### Форма з локальним завантаженням
```jsx
function SettingsForm() {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      await saveSettings(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <LoadingOverlay isVisible={saving} message="Saving settings..." />
      {/* Form content */}
    </Card>
  );
}
```

### Список з скелетним завантаженням
```jsx
function CoinList() {
  const { data: coins, loading } = useApi(fetchCoins);

  if (loading) {
    return (
      <div>
        {Array.from({length: 5}, (_, i) => (
          <SkeletonLoader key={i} type="card" height="120px" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {coins.map(coin => <CoinCard key={coin.id} coin={coin} />)}
    </div>
  );
}
```

## Рекомендації

1. **Використовуйте повноекранне завантаження** для початкової загрузки сторінки
2. **Використовуйте локальне завантаження** для окремих компонентів або форм
3. **Використовуйте скелетне завантаження** для списків та карток
4. **Завжди надавайте зрозумілі повідомлення** про те, що відбувається
5. **Обробляйте помилки** та показуйте відповідні повідомлення
6. **Не блокуйте UI** без необхідності - використовуйте локальні стани завантаження

## Доступність

- Всі компоненти підтримують screen readers
- Використовуються ARIA атрибути для індикації завантаження
- Клавіатурна навігація працює навіть під час завантаження
- Контрастні кольори для кращої видимості
