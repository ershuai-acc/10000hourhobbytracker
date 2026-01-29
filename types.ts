
export type Intensity = 1 | 2 | 3 | 4 | 5;

export interface DailyLog {
  [date: string]: number;
}

export type ProjectMode = 'calendar' | 'gallery';

export type PhotoAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export type CheckInShape = 'square' | 'circle';

export interface Project {
  id: string;
  name: string;
  description?: string;
  mode: ProjectMode;
  colorBase: string;
  goalHours: number;
  hoursPerCheckIn: number;
  checkInLevels: number[];
  checkInShape?: CheckInShape;
  logs: DailyLog;
  photos?: string[];
  photoAspectRatio?: PhotoAspectRatio;
  createdAt: number;
}

export type Tab = 'calendar' | 'progress';

export interface UserProfile {
  name: string;
  avatar: string;
}
