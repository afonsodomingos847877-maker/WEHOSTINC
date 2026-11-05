import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = (url.searchParams.get('emailaddress') || url.searchParams.get('email') || '').trim().toLowerCase();
    const domain = email.includes('@') ? email.split('@')[1] : 'wehosthere.com';

    const imapServer = process.env.DEFAULT_IMAP_SERVER || 'imap.migadu.com';
    const smtpServer = process.env.DEFAULT_SMTP_SERVER || 'smtp.migadu.com';

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<clientConfig version="1.1">
  <emailProvider id="${domain}">
    <domain>${domain}</domain>
    <displayName>${domain} Email Profissional</displayName>
    <displayShortName>Email</displayShortName>
    <incomingServer type="imap">
      <hostname>${imapServer}</hostname>
      <port>993</port>
      <socketType>SSL</socketType>
      <authentication>password-cleartext</authentication>
      <username>${email || '%EMAILADDRESS%'}</username>
    </incomingServer>
    <outgoingServer type="smtp">
      <hostname>${smtpServer}</hostname>
      <port>465</port>
      <socketType>SSL</socketType>
      <authentication>password-cleartext</authentication>
      <username>${email || '%EMAILADDRESS%'}</username>
    </outgoingServer>
  </emailProvider>
</clientConfig>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'max-age=3600, must-revalidate'
      }
    });
  } catch (err) {
    console.error('[Autoconfig GET] Erro ao responder:', err);
    return new NextResponse('<error>Falha ao processar Autoconfig</error>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' }
    });
  }
}
