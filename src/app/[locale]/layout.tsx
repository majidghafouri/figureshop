import { notFound } from "next/navigation";
import { Locale, isLocale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-dictionaries";
import { getSessionUser } from "@/lib/auth";
import { CartProvider } from "@/components/CartProvider";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import ThemeProvider from "@/components/ThemeProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = getDictionary(locale);
  const user = await getSessionUser();

  return (
    <ThemeProvider>
      <CartProvider>
        <AnalyticsProvider>
          <Header locale={locale} dict={dict} user={user} />
          <main>{children}</main>
          <Footer locale={locale} dict={dict} />
        </AnalyticsProvider>
      </CartProvider>
    </ThemeProvider>
  );
}
