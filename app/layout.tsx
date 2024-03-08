import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavMenu from "@/components/navmenu";
import "./globals.css";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Extract APK Data",
  description: "View AndroidManifest, resources, and assets from APK files",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="en">
      <body className={inter.className}>

        <NavMenu></NavMenu>

        {children}

         {/* full width footer with tailwind */}
        <footer className="bg-gray-800 text-white p-4 text-center">
          <p>
            Made with{" "}
            <span role="img" aria-label="heart">
              ❤️
            </span>{" "}
            by{" "}
            <a
              className="underline"
              href="https://github.com/bagusindrayana/">Dev</a>
          </p>
        </footer>

      </body>
    </html>
  );
}
