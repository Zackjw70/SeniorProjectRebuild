import { serve } from 'https://deno.land/std/http/server.ts';

serve(async (req) => {
  const { email, code } = await req.json();

  const resendKey = Deno.env.get('RESEND_API_KEY');
  console.log('RESEND_API_KEY:', resendKey);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Your Budget Buddy Verification Code',
      html: `<p>Your verification code is <strong>${code}</strong></p>`,
    }),
  });

  const result = await res.json();
  return new Response(JSON.stringify(result), { status: 200 });
});