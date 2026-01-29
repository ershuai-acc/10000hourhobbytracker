
export const COLOR_OPTIONS = [
  { name: 'Blue', value: 'blue' },
  { name: 'Pink', value: 'pink' },
  { name: 'Amber', value: 'amber' },
  { name: 'Emerald', value: 'emerald' },
  { name: 'Rose', value: 'rose' },
];

export const BUTTON_COLORS = [
  { level: 5, label: 'Great!', char: 'A', bg: 'bg-blue-500', washi: 'bg-blue-200' },
  { level: 4, label: 'Good', char: 'B', bg: 'bg-pink-500', washi: 'bg-pink-200' },
  { level: 3, label: 'Meh', char: 'C', bg: 'bg-amber-500', washi: 'bg-amber-200' },
  { level: 2, label: 'Sad', char: 'D', bg: 'bg-emerald-500', washi: 'bg-emerald-200' },
  { level: 1, label: 'Bad', char: 'E', bg: 'bg-rose-500', washi: 'bg-rose-200' },
];

// Mapping of project color base to Tailwind text color classes for GalleryView
export const TEXT_SHADES: Record<string, string> = {
  blue: 'text-blue-500',
  pink: 'text-pink-500',
  amber: 'text-amber-500',
  emerald: 'text-emerald-500',
  rose: 'text-rose-500',
};

export const INITIAL_PROJECTS = [
  {
    id: '1',
    name: 'Be Happy',
    description: '记录每天的心情',
    mode: 'calendar',
    colorBase: '#3b82f6',
    goalHours: 10000,
    hoursPerCheckIn: 1,
    checkInLevels: [1, 2, 3, 4, 5],
    logs: {},
    photos: [],
    createdAt: Date.now(),
  },
  {
    id: '2',
    name: 'Daily Reading',
    description: '我的阅读相册',
    mode: 'gallery',
    colorBase: '#ec4899',
    goalHours: 10000,
    hoursPerCheckIn: 1,
    checkInLevels: [1, 2, 3, 4, 5],
    logs: {},
    photos: [],
    photoAspectRatio: '1:1',
    createdAt: Date.now(),
  }
];
