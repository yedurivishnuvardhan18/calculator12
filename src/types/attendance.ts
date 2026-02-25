export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface TimetableEntry {
  day: DayOfWeek;
  period: number;
  subjectCode: string;
}

export interface TimetableSchedule {
  [day: string]: string[]; // day -> array of subject codes per period
}

export interface SubjectAttendance {
  code: string;
  name: string;
  present: number;
  total: number;
  percentage: number;
}

export interface AttendanceConfig {
  fromDate: Date;
  toDate: Date;
  workingDays: DayOfWeek[];
  holidays: Date[];
  targetPercentage: number;
}

export interface SubjectResult {
  code: string;
  name: string;
  currentPercentage: number;
  present: number;
  total: number;
  futureClasses: number;
  requiredClasses: number;
  bunkableClasses: number;
  projectedPercentage: number;
  status: 'safe' | 'warning' | 'critical';
}

export interface OverallResult {
  totalConducted: number;
  totalAttended: number;
  overallPercentage: number;
  safeBunkLimit: number;
  requiredClasses: number;
  totalFutureClasses: number;
}
