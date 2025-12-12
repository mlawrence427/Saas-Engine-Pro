// app/actiontimer/page.tsx

import { redirect } from 'next/navigation';

export default function ActionTimerRedirect() {
  redirect('/expiry-signal');
}
