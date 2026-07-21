import type { Metadata } from "next";
import { AttendanceLedger } from "@/components/attendance/AttendanceLedger";

export const metadata: Metadata = {
  title: "Attendance Ledger",
  description:
    "Track small-group church attendance by date, mark present or absent, and export CSV.",
};

export default function AttendancePage() {
  return <AttendanceLedger />;
}
