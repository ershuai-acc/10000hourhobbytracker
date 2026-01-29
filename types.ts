
export type Intensity = 1 | 2 | 3 | 4 | 5;

export interface DailyLog {
  [date: string]: Intensity; // date format: YYYY-MM-DD
}

export type ProjectMode = 'calendar' | 'gallery';

export type PhotoAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface Project {
  id: string;
  name: string;
  description?: string;
  mode: ProjectMode;
  colorBase: string; // hex color like '#3b82f6' or legacy Tailwind name
  themeImage?: string; // base64 image as theme instead of color
  goalHours: number;
  logs: DailyLog;
  photos?: string[]; // base64 strings for gallery mode
  photoAspectRatio?: PhotoAspectRatio; // aspect ratio for gallery mode photos
  createdAt: number;
}

export type Tab = 'calendar' | 'progress';

export interface UserProfile {
  name: string;
  avatar: string;
}
