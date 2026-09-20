'use client';

import { useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui';
import { FeedbackState } from '@/components/feedback-state';
import { KontenUtama } from '@/components/layout-konten';

export default function Galat({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <KontenUtama>
      <FeedbackState
        jenis="galat"
        ikon={WifiOff}
        judul="Halaman belum bisa dimuat"
        deskripsi="Data belum dapat dimuat. Periksa koneksi lalu coba lagi."
        aksi={<Button onClick={() => retry()}>Coba lagi</Button>}
      />
    </KontenUtama>
  );
}
