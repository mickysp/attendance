"use client";

type StudentAttendance = {
  id: string;
  name: string;
  present: number;
  absent: number;
  percent: number;
  score: number;
};

type Props = {
  data: StudentAttendance[];
};

export default function AttendanceTable({ data }: Props) {
  const getStatus = (percent: number, score: number) => {
    if (percent < 60 || score < 50) return "danger";
    if (percent < 80 || score < 70) return "warning";
    return "good";
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-green-600 bg-green-50";
      case "warning":
        return "text-yellow-600 bg-yellow-50";
      case "danger":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="text-left p-3">นักศึกษา</th>
            <th className="text-center p-3">เข้าเรียน</th>
            <th className="text-center p-3">ขาด</th>
            <th className="text-center p-3">% เข้าเรียน</th>
            <th className="text-center p-3">คะแนน</th>
            <th className="text-center p-3">สถานะ</th>
          </tr>
        </thead>

        <tbody>
          {data.map((s) => {
            const status = getStatus(s.percent, s.score);

            return (
              <tr key={s.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{s.name}</td>

                <td className="p-3 text-center">{s.present}</td>
                <td className="p-3 text-center">{s.absent}</td>
                <td className="p-3 text-center">{s.percent}%</td>
                <td className="p-3 text-center">{s.score}</td>

                <td className="p-3 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(
                      status
                    )}`}
                  >
                    {status === "good"
                      ? "ปกติ"
                      : status === "warning"
                      ? "เฝ้าระวัง"
                      : "เสี่ยง"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}