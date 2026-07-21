import type { Metadata } from "next";
import { AttendanceLedger } from "@/components/attendance/AttendanceLedger";

export const metadata: Metadata = {
  title: "Attendance Ledger",
  description:
    "Leaders submit weekly small-group attendance with photos for First Love Church.",
};

export default function AttendancePage() {
  return <AttendanceLedger />;
}
