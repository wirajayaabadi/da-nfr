'use client';

import Image from 'next/image';
import { useState } from 'react';
import { getInitials } from '@/lib/team';

interface AvatarProps {
  src: string;
  name: string;
  /** Lebar tampil maksimum (px), untuk atribut sizes. */
  sizes: string;
  className?: string;
  initialsClassName?: string;
}

/** Foto profil yang dimuat bertahap; menampilkan inisial bila foto kosong atau gagal dimuat. */
export default function Avatar({ src, name, sizes, className = '', initialsClassName = 'text-3xl' }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={`Inisial ${name}`}
        className={`grid place-items-center bg-gradient-to-br from-[#eef2f7] to-[#dfe5ee] font-bold text-subtle ${className}`}
      >
        <span className={initialsClassName}>{getInitials(name)}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-canvas ${className}`}>
      <Image
        src={src}
        alt={`Foto ${name}`}
        fill
        sizes={sizes}
        loading="lazy"
        unoptimized={src.endsWith('.svg')}
        onError={() => setFailed(true)}
        className="object-cover object-top"
      />
    </div>
  );
}
