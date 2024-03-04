import type { Metadata } from "next";
import { Inter } from "next/font/google";
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

        {/* full width navbar with tailwind */}
        
        <div className="flex justify-between items-center bg-gray-800 p-4">
          <div className="flex items-center">
            {/* <img
              src="/android.svg"
              alt="Android logo"
              className="h-8 w-8 mr-2"
            /> */}
            <h1 className="text-2xl text-white">Extract APK Data</h1>
          </div>
         </div>

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
              href="https://github.com/bagusindrayana/">Bagus Indrayana</a>
          </p>
        </footer>

      </body>
    </html>
  );
}
