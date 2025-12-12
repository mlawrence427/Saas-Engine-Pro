// app/accessoff/page.tsx
import { redirect } from 'next/navigation';

export default function AccessOffRedirect() {
  redirect('/deny-signal');
}

