import { create } from "zustand";
import { getStorage, setStorage, generateId } from "@/utils/storage";

export interface MoodRecord {
  id: string;
  mood: string;
  emoji: string;
  timestamp: number;
  date: string;
}

type ViewRange = "week" | "month";

interface MoodDiaryState {
  records: MoodRecord[];
  viewRange: ViewRange;
  addMoodRecord: (mood: string, emoji: string) => void;
  removeMoodRecord: (id: string) => void;
  setViewRange: (range: ViewRange) => void;
  getRecordsByDate: (date: string) => MoodRecord[];
  getRecordsInRange: () => MoodRecord[];
}

const STORAGE_KEY = "mood_diary";

function loadFromStorage(): MoodRecord[] {
  return getStorage<MoodRecord[]>(STORAGE_KEY, []);
}

function saveToStorage(records: MoodRecord[]): void {
  setStorage(STORAGE_KEY, records);
}

function getDateString(timestamp: number): string {
  return new Date(timestamp).toISOString().split("T")[0];
}

function getStartOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - diff);
  return start;
}

function getStartOfMonth(): Date {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

export const useMoodDiaryStore = create<MoodDiaryState>((set, get) => {
  const records = loadFromStorage();

  return {
    records,
    viewRange: "week",

    addMoodRecord: (mood, emoji) => {
      const now = Date.now();
      const newRecord: MoodRecord = {
        id: generateId(),
        mood,
        emoji,
        timestamp: now,
        date: getDateString(now),
      };
      const newRecords = [newRecord, ...get().records];
      set({ records: newRecords });
      saveToStorage(newRecords);
    },

    removeMoodRecord: (id) => {
      const newRecords = get().records.filter((r) => r.id !== id);
      set({ records: newRecords });
      saveToStorage(newRecords);
    },

    setViewRange: (range) => {
      set({ viewRange: range });
    },

    getRecordsByDate: (date) => {
      return get().records.filter((r) => r.date === date);
    },

    getRecordsInRange: () => {
      const { viewRange, records } = get();
      const startDate =
        viewRange === "week" ? getStartOfWeek() : getStartOfMonth();
      return records.filter((r) => r.timestamp >= startDate.getTime());
    },
  };
});
