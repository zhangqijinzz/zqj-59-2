import { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  Trash2,
  ChevronLeft,
  AlertTriangle,
  Heart,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMoodDiaryStore, MoodRecord } from "@/stores/useMoodDiaryStore";
import { getMoodColor } from "@/components/common/MoodPicker";
import { formatTime } from "@/utils/storage";

const WEEKDAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

function getWeekDates(): Date[] {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - diff);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function getMonthDates(): Date[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const dates: Date[] = [];
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - startDayOfWeek);
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (formatDate(date) === formatDate(today)) return "今天";
  if (formatDate(date) === formatDate(yesterday)) return "昨天";
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAYS[date.getDay() === 0 ? 6 : date.getDay() - 1];
  return `${month}月${day}日 ${weekday}`;
}

interface DeleteConfirmModalProps {
  record: MoodRecord | null;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteConfirmModal({ record, onCancel, onConfirm }: DeleteConfirmModalProps) {
  useEffect(() => {
    if (!record) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [record, onCancel]);

  if (!record) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl shadow-card max-w-sm w-full p-6 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
        </div>
        <h3 className="font-display text-xl text-gray-800 text-center mb-2">
          删除这条心情？
        </h3>
        <p className="text-gray-500 text-center text-sm mb-4">
          删除后就找不回来啦，确定要删除 {formatDateLabel(record.date)}{" "}
          {formatTime(record.timestamp)} 的「{record.mood}」吗？
        </p>
        <div className="flex items-center justify-center gap-3 mb-6">
          <div
            className={`px-4 py-2 rounded-2xl border-2 ${getMoodColor(
              record.mood
            )}`}
          >
            <span className="text-3xl">{record.emoji}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-all btn-bounce"
          >
            再想想
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all btn-bounce shadow-warm"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyMoodDiary({ onNavigateHome }: { onNavigateHome: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in-up">
      <div className="relative mb-8">
        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-warm-100 to-wheat-100 flex items-center justify-center">
          <div className="text-8xl animate-float-slow">📔</div>
        </div>
        <div className="absolute -top-2 -right-2 text-4xl animate-bounce-gentle">
          ✨
        </div>
        <div className="absolute bottom-2 -left-4 text-3xl animate-float">
          🌟
        </div>
      </div>
      <h3 className="font-display text-2xl text-warm-600 mb-3">
        心情日记还是空的哦～
      </h3>
      <p className="text-gray-500 text-center mb-2 max-w-xs">
        每次在首页记录心情，都会自动写进这本小日记里
      </p>
      <p className="text-gray-400 text-center text-sm mb-8 max-w-xs">
        以后翻开来看看，就能知道自己这段时间过得怎么样啦 🌈
      </p>
      <button
        onClick={onNavigateHome}
        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-warm-500 text-white font-medium shadow-warm hover:bg-warm-600 transition-all btn-bounce"
      >
        <Sparkles size={20} />
        去首页记录心情
      </button>
    </div>
  );
}

interface MoodCalendarProps {
  viewRange: "week" | "month";
  records: MoodRecord[];
}

function MoodCalendar({ viewRange, records }: MoodCalendarProps) {
  const dates = viewRange === "week" ? getWeekDates() : getMonthDates();
  const now = new Date();
  const todayStr = formatDate(now);
  const currentMonth = now.getMonth();

  const moodMap = useMemo(() => {
    const map = new Map<string, MoodRecord[]>();
    records.forEach((r) => {
      const existing = map.get(r.date) ?? [];
      existing.push(r);
      map.set(r.date, existing);
    });
    return map;
  }, [records]);

  return (
    <div className="bg-white rounded-3xl p-4 shadow-soft mb-6">
      <div className="grid grid-cols-7 gap-2 mb-2">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-xs text-gray-400 font-medium py-1"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {dates.map((date, idx) => {
          const dateStr = formatDate(date);
          const isToday = dateStr === todayStr;
          const isCurrentMonth =
            viewRange === "month" ? date.getMonth() === currentMonth : true;
          const dayRecords = moodMap.get(dateStr) ?? [];
          const hasRecords = dayRecords.length > 0;
          const latestMood = hasRecords
            ? dayRecords.sort((a, b) => b.timestamp - a.timestamp)[0]
            : null;

          return (
            <div
              key={idx}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm relative transition-all ${
                isCurrentMonth ? "" : "opacity-30"
              } ${
                isToday
                  ? "bg-warm-500 text-white shadow-warm font-bold"
                  : hasRecords
                  ? getMoodColor(latestMood!.mood) + " border-2"
                  : "bg-gray-50 text-gray-400"
              }`}
            >
              <span>{date.getDate()}</span>
              {hasRecords && (
                <span className="text-lg leading-none mt-0.5">
                  {latestMood!.emoji}
                </span>
              )}
              {hasRecords && dayRecords.length > 1 && (
                <span
                  className={`absolute top-0.5 right-0.5 text-[10px] px-1 rounded-full ${
                    isToday ? "bg-white/25 text-white" : "bg-white/60 text-gray-600"
                  }`}
                >
                  {dayRecords.length}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface MoodTimelineProps {
  records: MoodRecord[];
  onDelete: (record: MoodRecord) => void;
}

function MoodTimeline({ records, onDelete }: MoodTimelineProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, MoodRecord[]>();
    records.forEach((r) => {
      const existing = map.get(r.date) ?? [];
      existing.push(r);
      map.set(r.date, existing);
    });
    const sortedDates = Array.from(map.keys()).sort((a, b) => (a < b ? 1 : -1));
    return sortedDates.map((date) => ({
      date,
      records: map
        .get(date)!
        .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)),
    }));
  }, [records]);

  return (
    <div className="space-y-6">
      {grouped.map(({ date, records: dayRecords }) => (
        <div key={date} className="animate-fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-warm-400"></div>
            <h3 className="font-display text-lg text-gray-700">
              {formatDateLabel(date)}
            </h3>
            <span className="text-xs text-gray-400">
              {dayRecords.length} 条心情
            </span>
          </div>
          <div className="ml-1 border-l-2 border-dashed border-warm-200 pl-4 space-y-3">
            {dayRecords.map((record) => (
              <div
                key={record.id}
                className={`relative rounded-2xl border-2 p-4 transition-all group ${getMoodColor(
                  record.mood
                )}`}
              >
                <div className="absolute -left-[25px] top-5 w-4 h-4 rounded-full bg-white border-2 border-warm-300 shadow-soft"></div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-4xl flex-shrink-0">
                      {record.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800">
                          {record.mood}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(record.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onDelete(record)}
                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-2 rounded-xl hover:bg-red-100 active:bg-red-200 text-gray-400 hover:text-red-500 flex-shrink-0"
                    title="删除这条心情"
                    aria-label="删除这条心情"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MoodDiary() {
  const navigate = useNavigate();
  const { records, viewRange, setViewRange, removeMoodRecord, getRecordsInRange } =
    useMoodDiaryStore();
  const [deleteTarget, setDeleteTarget] = useState<MoodRecord | null>(null);

  const recordsInRange = useMemo(() => getRecordsInRange(), [getRecordsInRange]);

  const stats = useMemo(() => {
    const total = recordsInRange.length;
    const moodCount = new Map<string, number>();
    recordsInRange.forEach((r) => {
      moodCount.set(r.mood, (moodCount.get(r.mood) ?? 0) + 1);
    });
    const sorted = Array.from(moodCount.entries()).sort((a, b) => b[1] - a[1]);
    return {
      total,
      topMood: sorted[0]?.[0] ?? null,
      topCount: sorted[0]?.[1] ?? 0,
    };
  }, [recordsInRange]);

  const handleDeleteClick = (record: MoodRecord) => {
    setDeleteTarget(record);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      removeMoodRecord(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
  };

  const hasAnyRecords = records.length > 0;

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white shadow-soft flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all btn-bounce"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl text-warm-600 flex items-center gap-2">
              <Heart size={24} className="text-warm-500" />
              心情日记
            </h1>
            <p className="text-sm text-gray-500">记录每一天的心情小波浪 🌊</p>
          </div>
        </div>
      </div>

      {!hasAnyRecords ? (
        <EmptyMoodDiary onNavigateHome={() => navigate("/")} />
      ) : (
        <>
          {recordsInRange.length > 0 && (
            <div className="bg-gradient-to-r from-warm-50 to-wheat-50 rounded-3xl p-5 mb-6 shadow-soft animate-fade-in-up">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-soft">
                    📊
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-0.5">
                      本{viewRange === "week" ? "周" : "月"}心情小结
                    </p>
                    <p className="text-gray-700">
                      共记录了{" "}
                      <span className="font-bold text-warm-600">
                        {stats.total}
                      </span>{" "}
                      条心情
                      {stats.topMood && (
                        <>
                          ，最多的是「
                          <span className="font-bold text-wheat-600">
                            {stats.topMood}
                          </span>
                          」({stats.topCount} 次)
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 bg-white rounded-full p-1 shadow-soft">
              <button
                onClick={() => setViewRange("week")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                  viewRange === "week"
                    ? "bg-warm-500 text-white shadow-warm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Calendar size={16} />
                本周
              </button>
              <button
                onClick={() => setViewRange("month")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                  viewRange === "month"
                    ? "bg-warm-500 text-white shadow-warm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Calendar size={16} />
                本月
              </button>
            </div>
            <div className="text-sm text-gray-400">
              共 {recordsInRange.length} 条记录
            </div>
          </div>

          <MoodCalendar viewRange={viewRange} records={recordsInRange} />

          {recordsInRange.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl shadow-soft animate-fade-in-up">
              <div className="text-6xl mb-4 animate-float-slow">🌤️</div>
              <p className="text-gray-500 mb-2">
                这
                {viewRange === "week" ? "周" : "个月"}
                还没有记录心情哦～
              </p>
              <p className="text-gray-400 text-sm">
                去首页选一个心情，开始记录吧！
              </p>
            </div>
          ) : (
            <MoodTimeline records={recordsInRange} onDelete={handleDeleteClick} />
          )}
        </>
      )}

      <DeleteConfirmModal
        record={deleteTarget}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
