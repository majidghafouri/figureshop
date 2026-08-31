import { Locale } from "@/lib/i18n";

export default function Logo({ locale }: { locale: Locale }) {
  const word =
    locale === "fa" ? "فیگرفورج" : locale === "ar" ? "فيجرفورج" : "Figureforge";
  return (
    <a
      href={locale === "fa" ? "/" : `/${locale}`}
      aria-label="Figureforge"
      className="flex items-center gap-2.5 shrink-0 group"
    >
      <span className="relative flex items-center justify-center w-[44px] h-[44px] max-sm:w-[38px] max-sm:h-[38px] rounded-[14px] overflow-hidden transition-transform duration-300 group-hover:scale-105 shadow-[0_10px_24px_rgba(var(--primary-rgb),0.3)]">
        <img src="/logo-icon.svg" alt={word} width={40} height={40} className="w-[40px] h-[40px] max-sm:w-[34px] max-sm:h-[34px]" />
      </span>
      <span className="text-[26px] max-sm:text-[22px] font-[1000] tracking-tight text-[var(--text)]">
        {word}
      </span>
    </a>
  );
}
