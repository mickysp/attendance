export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-[60%_40%] font-noto">

      <div className="flex flex-col justify-center bg-[#F0F4FB] p-20 pl-34">
        <h1 className="text-7xl font-semibold text-zinc-800">
          Attendance
        </h1>

        <h2 className="mt-2 text-6xl text-blue-900">
          for university classrooms
        </h2>

        <p className="mt-6 max-w-md text-zinc-500 text-base">
          Record and monitor student attendance in your classroom.
        </p>
      </div>

      <div className="flex items-center justify-center bg-white-100">
        {children}
      </div>

    </div>
  );
}