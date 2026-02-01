import { NextRequest, NextResponse } from 'next/server';

const MIN_SATS = 100;
const MAX_SATS = 1000;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const amount = Math.min(MAX_SATS, Math.max(MIN_SATS, Number(body.amount) || MAX_SATS));

  const apiKey = process.env.PAYPERQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const response = await fetch('https://api.ppq.ai/topup/create/btc-lightning', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'SATS',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.message || 'Failed to create invoice' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({
      invoice_id: data.invoice_id,
      amount: data.amount,
      currency: data.currency,
      lightning_invoice: data.lightning_invoice,
      checkout_url: data.checkout_url,
      expires_at: data.expires_at,
    });
  } catch (error) {
    console.error('PayPerQ Topup error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get('invoice_id');
  const checkBalance = searchParams.get('balance');

  const apiKey = process.env.PAYPERQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  // 残高確認
  if (checkBalance === 'true') {
    try {
      const response = await fetch('https://api.ppq.ai/credits/balance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to get balance' }, { status: response.status });
      }

      const data = await response.json();
      return NextResponse.json({ balance: data.balance });
    } catch (error) {
      console.error('Balance check error:', error);
      return NextResponse.json({ error: 'Failed to get balance' }, { status: 500 });
    }
  }

  // Invoice状態確認
  if (!invoiceId) {
    return NextResponse.json({ error: 'invoice_id is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.ppq.ai/topup/status/${invoiceId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.message || 'Failed to get status' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({
      invoice_id: data.invoice_id,
      status: data.status,
      amount: data.amount,
      currency: data.currency,
    });
  } catch (error) {
    console.error('PayPerQ Status error:', error);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}
