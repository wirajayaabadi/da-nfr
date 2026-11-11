import { site } from '@/config/site';
import { assistants } from '@/data/team';
import Avatar from '@/components/team/Avatar';

export default function AssistantSection() {
  if (assistants.length === 0) return null;

  return (
    <section aria-labelledby="assistant-title" className="mt-16 border-t border-line pt-14 sm:mt-20 sm:pt-16">
      <div className="max-w-2xl">
        <h3 id="assistant-title" className="text-2xl leading-tight font-extrabold tracking-[-0.015em] text-ink sm:text-3xl">
          {site.team.assistantsTitle}
        </h3>
        <p className="mt-3 text-base leading-relaxed text-muted">{site.team.assistantsDescription}</p>
      </div>

      <ul className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        {assistants.map((person) => (
          <li key={person.id}>
            <article className="flex h-full gap-4 rounded-2xl border border-line bg-white p-5 shadow-card sm:gap-5">
              <Avatar
                src={person.photo}
                name={person.name}
                sizes="112px"
                className="size-20 shrink-0 rounded-2xl sm:size-24"
                initialsClassName="text-xl sm:text-2xl"
              />
              <div className="min-w-0">
                <span className="inline-flex rounded-full bg-brand-blue-soft px-2.5 py-1 text-xs font-semibold text-brand-blue-strong">
                  Asisten Kelas
                </span>
                <h4 className="mt-2.5 text-lg leading-snug font-bold text-ink">{person.name}</h4>
                {person.institution && <p className="mt-0.5 text-sm font-medium text-muted">{person.institution}</p>}
                <p className="mt-2 text-sm leading-relaxed text-muted">{person.description}</p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
