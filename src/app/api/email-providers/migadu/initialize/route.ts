import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/emailProviders/base';
import crypto from 'crypto';
import { EmailDomain } from '@/models/EmailDomain';
import { EmailMailbox } from '@/models/EmailMailbox';
import { connectDB } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/serverAuth';

// Initialize default domain and emails for admin
export async function POST(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (adminAuth.error) return adminAuth.error;

  try {
    const { domainName = 'wehosthere.com', createDefaultEmails = true } = await request.json();

    const provider = getEmailProvider();
    console.log('[Initialize] Provider configured:', provider.isConfigured());
    
    if (!provider.isConfigured()) {
      return NextResponse.json(
        { error: 'Email provider not configured. Please check MIGADU_USERNAME and MIGADU_API_KEY environment variables.' },
        { status: 500 }
      );
    }

    console.log('[Initialize] Starting initialization for domain:', domainName);

    // Step 1: Check if domain already exists in our database
    await connectDB();
    const existingDomain = await EmailDomain.findOne({ domainName });
    
    let domain;
    const customerId = adminAuth.user.email || adminAuth.user.id || 'admin_default';

    if (existingDomain) {
      console.log('[Initialize] Domain already exists in DB:', domainName);
      domain = existingDomain;
    } else {
      // Step 2: Create domain in Migadu or fetch if it already exists there
      console.log('[Initialize] Checking if domain exists in Migadu:', domainName);
      try {
        const existingMigadu = await provider.getDomain(domainName);
        console.log('[Initialize] Domain already exists in Migadu, saving to DB');
        domain = new EmailDomain({
          ...existingMigadu,
          customerId,
          id: existingMigadu.id
        });
        await domain.save();
      } catch (checkError: any) {
        // If it's a 404, it doesn't exist, so we can create it
        console.log('[Initialize] Domain not found in Migadu, attempting to create');
        try {
          const migaduDomain = await provider.createDomain({
            domainName,
            createDefaultAddresses: false,
            hostedDns: false
          });

          // Save to MongoDB
          domain = new EmailDomain({
            ...migaduDomain,
            customerId,
            id: migaduDomain.id
          });
          await domain.save();
          console.log('[Initialize] Domain created and saved:', domain._id);
        } catch (createError: any) {
          // If we still get a 400 (perhaps already exists but getDomain failed, or rate limited)
          throw createError;
        }
      }
    }

    // Step 3: Create default emails if requested (senhas aleatórias criptográficas)
    const defaultEmails = createDefaultEmails ? [
      { localPart: 'admin', name: 'WEHOSTHERE Admin', password: crypto.randomBytes(12).toString('base64url') },
      { localPart: 'info', name: 'WEHOSTHERE Info', password: crypto.randomBytes(12).toString('base64url') },
      { localPart: 'suporte', name: 'WEHOSTHERE Suporte', password: crypto.randomBytes(12).toString('base64url') }
    ] : [];

    const createdEmails = [];

    for (const emailConfig of defaultEmails) {
      try {
        console.log('[Initialize] Creating mailbox:', emailConfig.localPart);
        
        // Check if mailbox already exists
        const existingMailbox = await EmailMailbox.findOne({ 
          email: `${emailConfig.localPart}@${domainName}` 
        });

        if (existingMailbox) {
          console.log('[Initialize] Mailbox already exists:', emailConfig.localPart);
          createdEmails.push({
            email: existingMailbox.email,
            status: 'already_exists'
          });
          continue;
        }

        // Create mailbox in Migadu
        const mailbox = await provider.createMailbox(domainName, {
          name: emailConfig.name,
          localPart: emailConfig.localPart,
          password: emailConfig.password,
          passwordMethod: 'generated',
          maySend: true,
          mayReceive: true,
          mayAccessImap: true,
          mayAccessPop3: false
        });

        // Save to MongoDB
        const newMailbox = new EmailMailbox({
          ...mailbox,
          domainId: domain._id.toString(),
          customerId,
          email: `${emailConfig.localPart}@${domainName}`
        });
        await newMailbox.save();

        createdEmails.push({
          email: newMailbox.email,
          status: 'created',
          password: emailConfig.password // Return password for initial setup
        });

        console.log('[Initialize] Mailbox created:', newMailbox.email);
      } catch (error: any) {
        console.error('[Initialize] Failed to create mailbox:', emailConfig.localPart, error);
        createdEmails.push({
          email: `${emailConfig.localPart}@${domainName}`,
          status: 'failed',
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      domain: {
        domainName: domain.domainName,
        customerId: domain.customerId,
        status: domain.status
      },
      emails: createdEmails,
      message: 'Initialization completed successfully'
    });
  } catch (error) {
    console.error('[Initialize] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to initialize: ${errorMessage}`, details: String(error) },
      { status: 500 }
    );
  }
}
