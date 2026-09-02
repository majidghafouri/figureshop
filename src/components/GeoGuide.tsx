import { Dictionary } from "@/lib/i18n-dictionaries";
import Reveal from "@/components/Reveal";

export default function GeoGuide({ dict }: { dict: Dictionary }) {
  const geo = dict.homeGeo;
  return (
    <section
      id="collectors-guide"
      className="relative overflow-hidden py-[78px] max-sm:py-[58px] scroll-mt-[76px]"
      style={{
        background:
          "radial-gradient(circle at 14% 16%,rgba(var(--teal-rgb),0.09),transparent_30%), radial-gradient(circle at 88% 24%,rgba(var(--primary-rgb),0.07),transparent_28%), linear-gradient(180deg,var(--bg),var(--bg-grad))",
      }}
    >
      <div className="container-page">
        <div className="text-center max-w-[780px] mx-auto">
          <Reveal>
            <span className="kicker-pill">{geo.kicker}</span>
            <h2 className="mt-3 text-[clamp(26px,3vw,42px)] max-sm:text-[28px] leading-[1.35] tracking-[-0.9px] font-[1000] text-[var(--text)]">
              {geo.title}
            </h2>
            <p className="mt-3 text-[14px] font-[800] text-[var(--muted)]">{geo.updated} · {geo.yr}</p>
          </Reveal>
        </div>

        {/* Table of Contents */}
        <Reveal>
          <nav
            aria-label={geo.tocTitle}
            className="mt-8 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5"
          >
            <h3 className="text-[14px] font-[1000] text-[var(--primary)]">{geo.tocTitle}</h3>
            <ol className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              {geo.sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="flex items-start gap-2 text-[13.5px] font-[800] text-[var(--text-2)] hover:text-[var(--primary)]"
                  >
                    <span className="text-[var(--primary)] font-[950]">{i + 1}.</span> {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </Reveal>

        {/* Key Takeaways (TL;DR) */}
        <Reveal>
          <div className="mt-8 rounded-[28px] border border-[var(--primary)]/25 bg-[var(--surface)] p-6 shadow-[0_14px_44px_rgba(20,45,90,0.08)]">
            <h3 className="text-[17px] font-[1000] text-[var(--primary)] flex items-center gap-2">
              <span>✦</span> {geo.tlDrTitle}
            </h3>
            <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {geo.tlDr.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13.5px] font-[750] text-[var(--text-2)] leading-[1.9]">
                  <span className="mt-[7px] w-1.5 h-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* Data points / stats */}
        {geo.quickStats && geo.quickStats.length > 0 && (
          <Reveal>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              {geo.quickStats.map((stat, i) => (
                <div
                  key={i}
                  className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5 text-center shadow-[0_10px_30px_rgba(20,45,90,0.06)]"
                >
                  <div className="text-[clamp(20px,2.4vw,30px)] font-[1000] text-[var(--primary)] leading-none">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-[12px] font-[800] text-[var(--muted)] leading-[1.6]">{stat.label}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] font-[750] text-[var(--muted)] text-center">{geo.statsRef}</p>
          </Reveal>
        )}

        {/* Sections */}
        <div className="mt-8 space-y-5">
          {geo.sections.map((s, i) => (
            <Reveal key={s.id} delay={i % 2 ? 60 : 0}>
              <div id={s.id} className="scroll-mt-[100px] rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6 md:p-7 hover:shadow-[0_18px_48px_rgba(20,45,90,0.10)] transition-all duration-300">
                <h2 className="text-[19px] font-[1000] text-[var(--text)]">{s.heading}</h2>
                <p className="mt-3 text-[14px] leading-[2] font-[700] text-[var(--text-2)]">
                  {s.bold ? (
                    <>
                      {s.body} <strong className="text-[var(--text)] font-[950]">{s.bold}</strong>
                    </>
                  ) : (
                    s.body
                  )}
                </p>

                {s.comparison && s.comparisonB && (
                  <figure className="mt-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-[18px] border border-[var(--success-soft-3)] bg-[var(--success-soft)] p-5">
                        <p className="text-[13px] font-[1000] text-[var(--success)]">{s.comparison.title}</p>
                        <ul className="mt-3 space-y-1.5">
                          {s.comparison.items.map((it, j) => (
                            <li key={j} className="text-[13px] font-[750] text-[var(--text-2)]">✓ {it}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-[18px] border border-[var(--warning-soft-3)] bg-[var(--warning-soft)] p-5">
                        <p className="text-[13px] font-[1000] text-[var(--warning-strong)]">{s.comparisonB.title}</p>
                        <ul className="mt-3 space-y-1.5">
                          {s.comparisonB.items.map((it, j) => (
                            <li key={j} className="text-[13px] font-[750] text-[var(--text-2)]">✕ {it}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <figcaption className="mt-2 text-[12.5px] font-[750] text-[var(--muted)]">
                      {s.comparison.title} vs. {s.comparisonB.title} — {s.quote ?? ""}
                    </figcaption>
                  </figure>
                )}

                {s.quote && (
                  <figure className="mt-5">
                    <blockquote cite={geo.quoteCite} className="rounded-[16px] border-r-4 border-[var(--teal)] bg-[var(--glass-tint)] p-4 text-[13.5px] font-[700] text-[var(--text-3)] italic leading-[1.9]">
                      {s.quote}
                    </blockquote>
                    <figcaption className="mt-2 text-[12px] font-[750] text-[var(--muted)]">
                      <a href={geo.quoteCite} target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--primary)]">
                        {geo.quoteSource ?? geo.quoteCite}
                      </a>
                    </figcaption>
                  </figure>
                )}

                {s.list && s.list.length > 0 && (
                  <ol className="mt-4 space-y-2">
                    {s.list.map((it, j) => (
                      <li key={j} className="flex items-start gap-3 text-[14px] font-[700] text-[var(--text-2)] leading-[1.9]">
                        <span className="mt-[3px] shrink-0 w-6 h-6 rounded-full bg-[var(--soft)] border border-[var(--line-3)] text-[var(--primary)] text-[12px] font-[950] flex items-center justify-center">
                          {j + 1}
                        </span>
                        {it}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        {/* Comparison (machine vs hand-finished) */}
        <Reveal>
          <div className="mt-8 rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_14px_44px_rgba(20,45,90,0.08)]">
            <h3 className="text-[17px] font-[1000] text-[var(--text)]">{geo.vsTitle ?? geo.sections[0].heading}</h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {geo.vsCommon.map((v, i) => (
                <div key={i} className="flex items-start gap-3 rounded-[18px] border border-[var(--line)] p-4">
                  <span className="text-[22px]">{v.icon}</span>
                  <div>
                    <p className="text-[14px] font-[1000] text-[var(--text)]">{v.title}</p>
                    <p className="mt-1 text-[13px] font-[700] text-[var(--muted)] leading-[1.8]">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Specifications table */}
        {geo.specs && geo.specs.length > 0 && (
          <Reveal>
            <div className="mt-8 rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6 overflow-hidden">
              <h3 className="text-[17px] font-[1000] text-[var(--text)]">{geo.specsTitle}</h3>
              <table className="mt-4 w-full border-collapse text-[13.5px]">
                <tbody>
                  {geo.specs.map((row, i) => (
                    <tr key={i} className={i % 2 ? "bg-[var(--soft)]" : "bg-transparent"}>
                      <th
                        scope="row"
                        className="text-left font-[950] text-[var(--text)] px-4 py-2.5 border-b border-[var(--line)] whitespace-nowrap"
                      >
                        {row.k}
                      </th>
                      <td className="px-4 py-2.5 border-b border-[var(--line)] font-[700] text-[var(--text-2)]">
                        {row.v}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        )}

        {/* FAQ with details/summary */}
        {geo.faq && geo.faq.length > 0 && (
          <Reveal>
            <div className="mt-8 rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6">
              <h3 className="text-[17px] font-[1000] text-[var(--text)]">{geo.faqTitle}</h3>
              <div className="mt-4 space-y-3">
                {geo.faq.map((item, i) => (
                  <details
                    key={i}
                    className="group rounded-[16px] border border-[var(--line)] bg-[var(--soft)] open:bg-[var(--surface)]"
                  >
                    <summary className="flex items-center justify-between gap-3 cursor-pointer px-5 py-3.5 text-[14px] font-[950] text-[var(--text)] list-none">
                      <span className="flex items-center gap-2">{item.q}</span>
                      <span className="text-[var(--primary)] text-[18px] leading-none transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="px-5 pb-4 text-[13.5px] font-[700] text-[var(--text-2)] leading-[1.9]">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </Reveal>
        )}

        {/* Concluding */}
        <Reveal>
          <p className="mt-8 text-center text-[15px] leading-[2] font-[800] text-[var(--text-2)] max-w-[760px] mx-auto">
            {geo.concluding}
          </p>
        </Reveal>

        {/* Authoritative sources */}
        <Reveal>
          <div className="mt-8 rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6">
            <h3 className="text-[15px] font-[1000] text-[var(--text)] flex items-center gap-2">
              <span>🔗</span> {geo.sourcesTitle ?? "Authoritative sources & references"}
            </h3>
            <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {geo.resourceLinks.map((link, i) => (
                <li key={i}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[13.5px] font-[800] text-[var(--primary)] hover:underline"
                  >
                    <span>↗</span> {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}