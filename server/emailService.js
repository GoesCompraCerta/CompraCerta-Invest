import { Resend } from 'resend';

const resetUrl = (token) => {
  const link = new URL('https://compracerta-invest.onrender.com/reset-password');
  link.searchParams.set('token', token);
  return link.toString();
};

export const sendPasswordResetEmail = async (email, token) => {
  const link = resetUrl(token);
  if (!process.env.RESEND_API_KEY) {
    console.log(`Password reset link: ${link}`);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: 'CompraCerta-Invest <onboarding@resend.dev>',
    to: email,
    subject: 'Redefinir sua senha - CompraCerta-Invest',
    html: `<p>Clique no link para redefinir sua senha: <a href="${link}">${link}</a></p>`,
    text: `Clique no link para redefinir sua senha: ${link}`
  });

  if (error) throw new Error(error.message || 'Resend não conseguiu enviar o e-mail.');
};
