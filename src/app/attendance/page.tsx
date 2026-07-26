import type { Metadata, Viewport } from "next";
import { AttendanceLedger } from "@/components/attendance/AttendanceLedger";

export const metadata: Metadata = {
  title: "Attendance Ledger",
  description:
    "Leaders submit weekly small-group attendance with photos for First Love Church.",
  applicationName: "Attendance Ledger",
  manifest: "/attendance/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Attendance",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/attendance/icons/apple-touch-icon.png",
    icon: [
      {
        url: "/attendance/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/attendance/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#1a3327",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function AttendancePage() {
  return <AttendanceLedger />;
}
