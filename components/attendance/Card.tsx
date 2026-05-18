"use client";

import {
  AcademicCapIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/solid";

type StudentAttendance = {
  studentId: string;
  name: string;
  section: string;
  major: string;

  status: "มาเรียน" | "มาสาย" | "ลา" | "ขาด";

  score: number;
  checkInTime: string | null;

  totalScore: number;

  days: number;
  lateDays: number;

  averageScore: number;
};

type Props = {
  students: StudentAttendance[];
};

export default function StudentSummaryCard({
  students,
}: Props) {
  const totalStudents = students.length;

  const normalCount = students.filter(
    (s) => s.status === "มาเรียน",
  ).length;

  const lateCount = students.filter(
    (s) => s.status === "มาสาย",
  ).length;

  const leaveCount = students.filter(
    (s) => s.status === "ลา",
  ).length;

  const absentCount = students.filter(
    (s) => s.status === "ขาด",
  ).length;

  const averageScore =
    totalStudents > 0
      ? (
          students.reduce((sum, s) => sum + s.score, 0) /
          totalStudents
        ).toFixed(1)
      : "0";

  const cards = [
    {
      title: "นักศึกษาทั้งหมด",
      value: totalStudents,
      icon: AcademicCapIcon,
      iconBg: "bg-gradient-to-br from-slate-100 to-slate-200",
      iconColor: "text-slate-600",
      valueColor: "text-slate-800",
      borderColor: "border-slate-200",
      progress: "w-[95%]",
      progressColor: "bg-slate-400",
    },

    {
      title: "มาเรียน",
      value: normalCount,
      icon: CheckCircleIcon,
      iconBg: "bg-gradient-to-br from-green-100 to-green-200",
      iconColor: "text-green-600",
      valueColor: "text-green-600",
      borderColor: "border-green-100",
      progress: "w-[85%]",
      progressColor: "bg-green-500",
    },

    {
      title: "มาสาย",
      value: lateCount,
      icon: ClockIcon,
      iconBg: "bg-gradient-to-br from-yellow-100 to-yellow-200",
      iconColor: "text-yellow-600",
      valueColor: "text-yellow-600",
      borderColor: "border-yellow-100",
      progress: "w-[55%]",
      progressColor: "bg-yellow-500",
    },

    {
      title: "ลา",
      value: leaveCount,
      icon: DocumentTextIcon,
      iconBg: "bg-gradient-to-br from-orange-100 to-orange-200",
      iconColor: "text-orange-600",
      valueColor: "text-orange-600",
      borderColor: "border-orange-100",
      progress: "w-[45%]",
      progressColor: "bg-orange-500",
    },

    {
      title: "ขาด",
      value: absentCount,
      icon: XCircleIcon,
      iconBg: "bg-gradient-to-br from-red-100 to-red-200",
      iconColor: "text-red-600",
      valueColor: "text-red-600",
      borderColor: "border-red-100",
      progress: "w-[35%]",
      progressColor: "bg-red-500",
    },

    {
      title: "คะแนนเฉลี่ย",
      value: averageScore,
      icon: ChartBarIcon,
      iconBg: "bg-gradient-to-br from-blue-100 to-blue-200",
      iconColor: "text-blue-600",
      valueColor: "text-blue-600",
      borderColor: "border-blue-100",
      progress: "w-[75%]",
      progressColor: "bg-blue-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-5 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className={`
              relative overflow-hidden
              bg-white/90 backdrop-blur-sm
              border ${card.borderColor}
              rounded-2xl
              px-5 py-5
              shadow-sm
              hover:shadow-lg
              hover:-translate-y-1
              transition-all duration-300
              group
            `}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-opacity" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 font-medium tracking-wide">
                  {card.title}
                </p>

                <p
                  className={`mt-3 text-3xl font-bold tracking-tight ${card.valueColor}`}
                >
                  {card.value}
                </p>
              </div>

              <div
                className={`
                  w-14 h-14 rounded-2xl
                  flex items-center justify-center
                  shadow-inner
                  ${card.iconBg}
                `}
              >
                <Icon className={`w-7 h-7 ${card.iconColor}`} />
              </div>
            </div>

            <div className="mt-5 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`
                  h-full rounded-full
                  ${card.progress}
                  ${card.progressColor}
                `}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}