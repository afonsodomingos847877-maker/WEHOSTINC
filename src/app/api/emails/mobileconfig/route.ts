import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = (url.searchParams.get('email') || url.searchParams.get('emailaddress') || '').trim();
    const name = url.searchParams.get('name') || email.split('@')[0] || 'Utilizador';
    const domain = email.includes('@') ? email.split('@')[1] : 'wehosthere.com';

    const imapServer = process.env.DEFAULT_IMAP_SERVER || 'imap.migadu.com';
    const smtpServer = process.env.DEFAULT_SMTP_SERVER || 'smtp.migadu.com';

    // Gerar UUIDs consistentes para a carga útil da Apple
    const profileUuid = 'WEHOST-' + Buffer.from(`profile-${email}`).toString('hex').slice(0, 32);
    const payloadUuid = 'WEHOST-' + Buffer.from(`payload-${email}`).toString('hex').slice(0, 32);

    const mobileconfig = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>EmailAccountDescription</key>
      <string>${email}</string>
      <key>EmailAccountName</key>
      <string>${name}</string>
      <key>EmailAccountType</key>
      <string>EmailTypeIMAP</string>
      <key>EmailAddress</key>
      <string>${email}</string>
      
      <!-- Servidor de Entrada (IMAP) -->
      <key>IncomingMailServerAuthentication</key>
      <string>EmailAuthPassword</string>
      <key>IncomingMailServerHostName</key>
      <string>${imapServer}</string>
      <key>IncomingMailServerPortNumber</key>
      <integer>993</integer>
      <key>IncomingMailServerUseSSL</key>
      <true/>
      <key>IncomingMailServerUsername</key>
      <string>${email}</string>
      
      <!-- Servidor de Saída (SMTP) -->
      <key>OutgoingMailServerAuthentication</key>
      <string>EmailAuthPassword</string>
      <key>OutgoingMailServerHostName</key>
      <string>${smtpServer}</string>
      <key>OutgoingMailServerPortNumber</key>
      <integer>465</integer>
      <key>OutgoingMailServerUseSSL</key>
      <true/>
      <key>OutgoingMailServerUsername</key>
      <string>${email}</string>
      <key>OutgoingPasswordSameAsIncomingPassword</key>
      <true/>
      
      <key>PayloadDescription</key>
      <string>Configuração de E-mail Profissional WEHOSTHERE</string>
      <key>PayloadDisplayName</key>
      <string>${email}</string>
      <key>PayloadIdentifier</key>
      <string>com.wehosthere.email.${payloadUuid}</string>
      <key>PayloadType</key>
      <string>com.apple.mail.managed</string>
      <key>PayloadUUID</key>
      <string>${payloadUuid}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Perfil de configuração automática de correio para ${email}</string>
  <key>PayloadDisplayName</key>
  <string>E-mail ${email} (WEHOSTHERE)</string>
  <key>PayloadIdentifier</key>
  <string>com.wehosthere.profile.${profileUuid}</string>
  <key>PayloadOrganization</key>
  <string>WEHOSTHERE</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${profileUuid}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;

    return new NextResponse(mobileconfig, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-apple-aspen-config; charset=utf-8',
        'Content-Disposition': `attachment; filename="${domain}-email.mobileconfig"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (err) {
    console.error('[Mobileconfig GET] Erro ao gerar perfil:', err);
    return NextResponse.json({ success: false, error: 'Erro ao gerar perfil Apple' }, { status: 500 });
  }
}

