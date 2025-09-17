import { serve } from 'https://deno.land/std/http/server.ts';

serve(async (req) => {
  const { email, code } = await req.json();

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer re_9Jr94WAA_7y2K8eaZMvchrTMc5tVgvLMw',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        //Please update this with our domain zach
      from: 'ajrockwell@email.neit.edu.com',
      to: email,
      subject: 'Your Budget Buddy Verification Code',
      html: `<p>Your verification code is <strong>${code}</strong></p>`,
    }),
  });

  const result = await res.json();
  return new Response(JSON.stringify(result), { status: 200 });
});