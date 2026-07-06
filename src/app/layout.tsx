import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OnlineBooking",
  description: "Simple online booking management starter"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
