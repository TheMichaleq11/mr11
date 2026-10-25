'use client';
import { useEffect } from 'react';
import { clearClientCache } from '@/lib/client';

/** Na ekranie logowania czyścimy dane zapamiętane na urządzeniu (wylogowanie / inne konto). */
export default function ClearCache() {
  useEffect(() => clearClientCache(), []);
  return null;
}
