'use client';

import { useEffect, useRef } from 'react';
import type { Member } from '@/types/team';
import { accentClasses, getWorkgroup, hasLink } from '@/lib/team';
import Avatar from './Avatar';

interface MemberDetailProps {
  member: Member | null;
  onClose: () => void;
}

/**
 * Panel profil berbasis <dialog> modal: fokus terkunci di dalam panel, Escape menutup,
 * dan konten di belakangnya tidak dapat dijangkau selama panel terbuka.
 */
export default function MemberDetail({ member, onClose }: MemberDetailProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (member && !dialog.open) dialog.showModal();
    if (!member && dialog.open) dialog.close();
  }, [member]);

  const close = () => dialogRef.current?.close();
  const group = member ? getWorkgroup(member.teamId) : null;
  const accent = group ? accentClasses[group.accent] : null;
  const linkedin = hasLink(member?.linkedinUrl) ? member?.linkedinUrl : undefined;
  const cv = hasLink(member?.cvUrl) ? member?.cvUrl : undefined;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="member-detail-name"
      className="profile-dialog"
      onClose={onClose}
      onClick={(e) => {
        // Klik pada latar (di luar isi panel) menutup panel.
        if (e.target === e.currentTarget) close();
      }}
    >
      {member && group && accent && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-3 sm:px-6">
            <p className="text-sm font-semibold text-subtle">Profil Anggota</p>
            <button
              type="button"
              onClick={close}
              aria-label="Tutup profil"
              className="grid size-11 place-items-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink"
            >
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pt-6 pb-8 sm:px-6">
            <div className="flex items-center gap-4">
              <Avatar
                src={member.photo}
                name={member.name}
                sizes="96px"
                className="size-24 shrink-0 rounded-2xl"
                initialsClassName="text-2xl"
              />
              <div className="min-w-0">
                <h2 id="member-detail-name" className="text-2xl leading-tight font-bold text-ink">
                  {member.name}
                </h2>
                <p className="mt-1 text-sm font-medium text-muted">{member.company}</p>
                <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${accent.tag}`}>
                  <span aria-hidden="true" className={`size-1.5 rounded-full ${accent.dot}`} />
                  {group.name}
                </span>
              </div>
            </div>

            <dl className="mt-8 space-y-7">
              <DetailBlock title="Bio singkat">
                <p>{member.bio}</p>
              </DetailBlock>
              <DetailBlock title="Peran dalam ALP">
                <p className="font-semibold text-ink">{member.role}</p>
                <p className="mt-1">{member.summary}</p>
              </DetailBlock>
              {member.skills.length > 0 && (
                <DetailBlock title="Keahlian">
                  <ul className="flex flex-wrap gap-2">
                    {member.skills.map((skill) => (
                      <li key={skill} className="rounded-full border border-line bg-canvas px-3 py-1 text-sm font-medium text-ink">
                        {skill}
                      </li>
                    ))}
                  </ul>
                </DetailBlock>
              )}
              <DetailBlock title="Hal yang ingin saya pelajari melalui ALP">
                <p>{member.learningGoal}</p>
              </DetailBlock>
            </dl>
          </div>

          {(linkedin || cv) && (
            <div className="flex flex-wrap gap-3 border-t border-line px-5 py-4 sm:px-6">
              {linkedin && (
                <a
                  href={linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-blue px-5 text-sm font-semibold text-white hover:bg-brand-blue-strong"
                >
                  LinkedIn
                  <span className="sr-only"> (membuka tab baru)</span>
                </a>
              )}
              {cv && (
                <a
                  href={cv}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-ink hover:bg-canvas"
                >
                  Lihat CV
                  <span className="sr-only"> (membuka tab baru)</span>
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-bold tracking-[0.08em] text-subtle uppercase">{title}</dt>
      <dd className="mt-2 text-[15px] leading-relaxed text-muted">{children}</dd>
    </div>
  );
}
