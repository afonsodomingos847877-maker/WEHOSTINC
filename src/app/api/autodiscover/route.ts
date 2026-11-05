import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function extractEmail(bodyText: string, searchParams: URLSearchParams): string {
  // 1. Tentar ler de query params
  const queryEmail = searchParams.get('Email') || searchParams.get('email') || searchParams.get('emailaddress');
  if (queryEmail && queryEmail.includes('@')) {
    return queryEmail.trim().toLowerCase();
  }

  // 2. Tentar extrair do XML padrão da Microsoft: <EMailAddress>...</EMailAddress>
  const match = bodyText.match(/<EMailAddress[^>]*>(.*?)<\/EMailAddress>/i);
  if (match && match[1] && match[1].includes('@')) {
    return match[1].trim().toLowerCase();
  }

  // 3. Regex genérica para e-mails no payload
  const genericMatch = bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (genericMatch && genericMatch[0]) {
    return genericMatch[0].trim().toLowerCase();
  }

  return 'user@wehosthere.com';
}

function generateAutodiscoverXml(email: string, domain: string): string {
  // Servidores padrão de destino (Migadu) com suporte futuro a hostnames personalizados
  const imapServer = process.env.DEFAULT_IMAP_SERVER || 'imap.migadu.com';
  const smtpServer = process.env.DEFAULT_SMTP_SERVER || 'smtp.migadu.com';

  return `<?xml version="1.0" encoding="utf-8" ?>
<Autodiscover xmlns="http://schemas.microsoft.com/exchange/autodiscover/responseschema/2006">
  <Response xmlns="http://schemas.microsoft.com/exchange/autodiscover/outlook/responseschema/2006a">
    <User>
      <DisplayName>${email}</DisplayName>
      <AutoDiscoverSMTPAddress>${email}</AutoDiscoverSMTPAddress>
    </User>
    <Account>
      <AccountType>email</AccountType>
      <Action>settings</Action>
      <Protocol>
        <Type>IMAP</Type>
        <Server>${imapServer}</Server>
        <Port>993</Port>
        <DomainRequired>off</DomainRequired>
        <LoginName>${email}</LoginName>
        <SPA>off</SPA>
        <SSL>on</SSL>
        <AuthRequired>on</AuthRequired>
      </Protocol>
      <Protocol>
        <Type>SMTP</Type>
        <Server>${smtpServer}</Server>
        <Port>465</Port>
        <DomainRequired>off</DomainRequired>
        <LoginName>${email}</LoginName>
        <SPA>off</SPA>
        <SSL>on</SSL>
        <AuthRequired>on</AuthRequired>
        <UsePOPAuth>on</UsePOPAuth>
        <SMTPLast>off</SMTPLast>
      </Protocol>
    </Account>
  </Response>
</Autodiscover>`;
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const bodyText = await req.text().catch(() => '');
    const email = extractEmail(bodyText, url.searchParams);
    const domain = email.includes('@') ? email.split('@')[1] : 'wehosthere.com';

    // Suporte a Autodiscover v2 JSON
    const acceptHeader = req.headers.get('accept') || '';
    if (acceptHeader.includes('application/json') || url.pathname.endsWith('.json')) {
      return NextResponse.json({
        Protocol: 'Autodiscoverv1',
        Url: `${url.origin}/autodiscover/autodiscover.xml`
      });
    }

    const xml = generateAutodiscoverXml(email, domain);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'max-age=3600, must-revalidate'
      }
    });
  } catch (err) {
    console.error('[Autodiscover POST] Erro ao responder:', err);
    return new NextResponse('<error>Falha ao processar Autodiscover</error>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' }
    });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = extractEmail('', url.searchParams);
    const domain = email.includes('@') ? email.split('@')[1] : 'wehosthere.com';

    // Suporte a Autodiscover v2 JSON (Microsoft 365 / Outlook moderno)
    const acceptHeader = req.headers.get('accept') || '';
    if (acceptHeader.includes('application/json') || url.pathname.endsWith('.json') || url.searchParams.get('Protocol') === 'Autodiscoverv1') {
      return NextResponse.json({
        Protocol: 'Autodiscoverv1',
        Url: `${url.origin}/autodiscover/autodiscover.xml`
      });
    }

    const xml = generateAutodiscoverXml(email, domain);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'max-age=3600, must-revalidate'
      }
    });
  } catch (err) {
    console.error('[Autodiscover GET] Erro ao responder:', err);
    return new NextResponse('<error>Falha ao processar Autodiscover</error>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' }
    });
  }
}
