# WhoIsIn — Design System

> Сгенерировано с помощью UI/UX Pro Max skill

## Стиль: Minimalism (Swiss Style)

- Чистый, воздушный интерфейс — фото в центре внимания
- Subtle hover transitions (200-250ms)
- Minimal shadows, sharp or slightly rounded corners
- Grid-based layout (12-16 columns)
- Высокий контраст текста

## Цветовая палитра: Micro SaaS (Indigo)

| Token | Hex | Назначение |
|---|---|---|
| `primary` | `#6366F1` | Основные кнопки, акценты, навигация |
| `primary-hover` | `#4F46E5` | Hover состояние primary |
| `secondary` | `#818CF8` | Вторичные элементы, бейджи |
| `cta` | `#10B981` | CTA кнопки, успех, совпадения |
| `cta-hover` | `#059669` | Hover состояние CTA |
| `background` | `#F5F3FF` | Основной фон страницы |
| `surface` | `#FFFFFF` | Карточки, панели |
| `text` | `#1E1B4B` | Основной текст |
| `text-muted` | `#6B7280` | Вторичный текст |
| `border` | `#E0E7FF` | Границы, разделители |
| `destructive` | `#EF4444` | Удаление, ошибки |

## Типографика: Tech Startup

| Роль | Шрифт | Weight | Применение |
|---|---|---|---|
| Heading | Space Grotesk | 500-700 | H1, H2, H3, навигация |
| Body | DM Sans | 400-500 | Текст, описания, кнопки |
| Mono | JetBrains Mono | 400 | Confidence %, метрики, ETA |

### Google Fonts Import
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400&display=swap');
```

## Компоненты

### Кнопки
- **Primary:** bg-indigo-500 text-white rounded-lg px-4 py-2 hover:bg-indigo-600 transition-colors duration-200
- **CTA:** bg-emerald-500 text-white rounded-lg px-4 py-2 hover:bg-emerald-600
- **Ghost:** text-indigo-600 hover:bg-indigo-50 rounded-lg px-4 py-2

### Карточки
- bg-white rounded-xl border border-indigo-100 hover:shadow-md transition-shadow duration-200
- Padding: p-4 или p-6

### Бейджи
- Статус: bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 text-sm
- Количество: bg-indigo-100 text-indigo-700

### Progress Bar
- Track: bg-indigo-100 rounded-full h-2
- Fill: bg-indigo-500 rounded-full transition-all duration-300

## Spacing System
- xs: 4px (gap-1)
- sm: 8px (gap-2)
- md: 16px (gap-4)
- lg: 24px (gap-6)
- xl: 32px (gap-8)
- 2xl: 48px (gap-12)

## Border Radius
- Cards: rounded-xl (12px)
- Buttons: rounded-lg (8px)
- Badges: rounded-full
- Avatars: rounded-full
