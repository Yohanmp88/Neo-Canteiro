import "./globals.css";

export const metadata = {
  title: "NeoCanteiro",
  description: "Gestão profissional de obras em um painel executivo dark.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
