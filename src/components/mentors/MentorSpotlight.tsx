import { site } from '@/config/site';
import { mentors } from '@/data/team';
import Avatar from '@/components/team/Avatar';

/** Sorotan mentor: tampil paling awal di bagian tim, dengan perlakuan visual khusus. */
export default function MentorSpotlight() {
  if (mentors.length === 0) return null;

  return (
    <section aria-labelledby="mentor-title" className="mt-10 sm:mt-12">
      <h3 id="mentor-title" className="sr-only">
        {site.team.mentorLabel}
      </h3>
      <div className="space-y-6">
        {mentors.map((mentor) => (
          <article
            key={mentor.id}
            className="relative isolate overflow-hidden rounded-[28px] bg-[#0b2545] text-white shadow-[0_24px_60px_-24px_rgb(11_37_69/0.55)]"
          >
            {/* Latar dekoratif: cahaya lembut dan garis identitas tiga warna. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_90%_at_100%_0%,rgb(0_108_184/0.55),transparent_60%),radial-gradient(ellipse_50%_70%_at_0%_100%,rgb(237_27_47/0.18),transparent_65%)]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(rgb(255_255_255)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255)_1px,transparent_1px)] [background-size:32px_32px]"
            />
            <div aria-hidden="true" className="absolute inset-x-0 top-0 flex h-1.5">
              <span className="flex-1 bg-brand-red" />
              <span className="flex-1 bg-brand-blue" />
              <span className="flex-1 bg-brand-green" />
            </div>

            <div className="grid gap-8 p-6 pt-9 sm:p-10 sm:pt-12 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)] md:items-center lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-12 lg:p-14">
              <div className="relative mx-auto w-44 sm:w-56 md:w-full">
                <div aria-hidden="true" className="absolute -inset-2 rounded-[26px] bg-gradient-to-br from-white/25 via-white/5 to-transparent" />
                <Avatar
                  src={mentor.photo}
                  name={mentor.name}
                  sizes="(min-width: 1024px) 300px, 240px"
                  className="relative aspect-[4/5] w-full rounded-[20px] ring-1 ring-white/20"
                  initialsClassName="text-5xl"
                />
              </div>

              <div className="min-w-0 text-center md:text-left">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold tracking-[0.1em] uppercase backdrop-blur">
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className="text-[#f5c451]">
                    <path d="M10 1.8l2.5 5.1 5.6.8-4 3.9.9 5.6L10 14.6l-5 2.6.9-5.6-4-3.9 5.6-.8z" />
                  </svg>
                  {site.team.mentorBadge}
                </p>
                <h4 className="mt-5 text-3xl leading-tight font-extrabold tracking-[-0.02em] text-balance sm:text-4xl lg:text-[2.75rem]">
                  {mentor.name}
                </h4>
                <p className="mt-3 text-lg font-semibold text-white/90 sm:text-xl">{mentor.position}</p>
                {mentor.institution && <p className="mt-1 text-base text-white/70">{mentor.institution}</p>}

                <div aria-hidden="true" className="mx-auto mt-6 h-px w-16 bg-white/25 md:mx-0" />

                <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/80 md:mx-0 sm:text-lg">
                  {mentor.description}
                </p>

                {mentor.focusAreas && mentor.focusAreas.length > 0 && (
                  <ul aria-label="Area fokus pendampingan" className="mt-6 flex flex-wrap justify-center gap-2 md:justify-start">
                    {mentor.focusAreas.map((area) => (
                      <li key={area} className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white ring-1 ring-white/15">
                        {area}
                      </li>
                    ))}
                  </ul>
                )}

                {mentor.message && (
                  <figure className="mt-8 rounded-2xl bg-white/[0.07] p-5 text-left ring-1 ring-white/10 sm:p-6">
                    <svg aria-hidden="true" width="28" height="22" viewBox="0 0 28 22" fill="currentColor" className="text-brand-red">
                      <path d="M0 22V12.6C0 5.5 4 1.2 11 0l1.2 3.4C8.4 4.6 6.6 7 6.4 10.4H12V22zm16 0V12.6C16 5.5 20 1.2 27 0l1.2 3.4c-3.8 1.2-5.6 3.6-5.8 7H28V22z" />
                    </svg>
                    <blockquote className="mt-3 text-base leading-relaxed text-white/90 italic sm:text-lg">{mentor.message}</blockquote>
                    <figcaption className="mt-3 text-sm font-semibold text-white/60">— {mentor.name}</figcaption>
                  </figure>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
