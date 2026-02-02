/**
 * bKash Tokenized Checkout API helpers.
 * @see https://developer.bka.sh/docs
 */

let cachedToken: string | null = null
let tokenExpiry = 0

export async function getGrantToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  const username = process.env.BKASH_USERNAME
  const password = process.env.BKASH_PASSWORD
  const appKey = process.env.BKASH_APP_KEY
  const appSecret = process.env.BKASH_APP_SECRET
  const grantUrl = process.env.BKASH_GRANT_TOKEN_URL

  if (!username || !password || !appKey || !appSecret || !grantUrl) {
    throw new Error('bKash credentials not configured')
  }

  const res = await fetch(grantUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      username,
      password,
    },
    body: JSON.stringify({ app_key: appKey, app_secret: appSecret }),
  })

  const data = (await res.json()) as {
    id_token?: string
    expires_in?: number
    statusCode?: string
    statusMessage?: string
    errorCode?: string
    errorMessage?: string
  }

  if (!res.ok || !data.id_token) {
    const err = data.errorMessage ?? data.statusMessage ?? 'Failed to get bKash token'
    throw new Error(err)
  }

  cachedToken = data.id_token
  tokenExpiry = Date.now() + ((data.expires_in ?? 3600) - 60) * 1000
  return data.id_token
}

export interface CreatePaymentParams {
  amount: string
  currency?: string
  merchantInvoiceNumber: string
  callbackURL: string
  payerReference?: string
}

export interface CreatePaymentResult {
  bkashURL: string
  paymentID: string
  statusCode?: string
  statusMessage?: string
}

export async function createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
  const token = await getGrantToken()
  const appKey = process.env.BKASH_APP_KEY
  const createUrl = process.env.BKASH_CREATE_PAYMENT_URL

  if (!appKey || !createUrl) {
    throw new Error('bKash create payment URL not configured')
  }

  const body = {
    mode: '0011',
    payerReference: params.payerReference ?? 'DEMO',
    callbackURL: params.callbackURL,
    amount: params.amount,
    currency: params.currency ?? 'BDT',
    intent: 'sale',
    merchantInvoiceNumber: params.merchantInvoiceNumber,
  }

  const res = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: token,
      'X-App-Key': appKey,
    },
    body: JSON.stringify(body),
  })

  const data = (await res.json()) as {
    bkashURL?: string
    paymentID?: string
    paymentId?: string
    statusCode?: string
    statusMessage?: string
    errorCode?: string
    errorMessage?: string
  }

  const paymentID = data.paymentID ?? data.paymentId
  if (!res.ok || !data.bkashURL || !paymentID) {
    const err = data.errorMessage ?? data.statusMessage ?? 'Failed to create bKash payment'
    throw new Error(err)
  }

  return {
    bkashURL: data.bkashURL,
    paymentID,
    statusCode: data.statusCode,
    statusMessage: data.statusMessage,
  }
}

export interface ExecutePaymentResult {
  success: boolean
  trxID?: string
  transactionStatus?: string
  amount?: string
  merchantInvoiceNumber?: string
  errorCode?: string
  errorMessage?: string
}

export async function executePayment(paymentID: string): Promise<ExecutePaymentResult> {
  const token = await getGrantToken()
  const appKey = process.env.BKASH_APP_KEY
  const executeUrl = process.env.BKASH_EXECUTE_PAYMENT_URL

  if (!appKey || !executeUrl) {
    throw new Error('bKash execute payment URL not configured')
  }

  const res = await fetch(executeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: token,
      'X-App-Key': appKey,
    },
    body: JSON.stringify({ paymentID }),
  })

  const data = (await res.json()) as {
    transactionStatus?: string
    trxID?: string
    amount?: string
    merchantInvoiceNumber?: string
    statusCode?: string
    statusMessage?: string
    errorCode?: string
    errorMessage?: string
  }

  const success = data.transactionStatus === 'Completed'

  if (!success) {
    console.error('bKash executePayment failed:', {
      paymentID,
      statusCode: data.statusCode,
      transactionStatus: data.transactionStatus,
      errorCode: data.errorCode,
      errorMessage: data.errorMessage ?? data.statusMessage,
      raw: data,
    })
  }

  return {
    success,
    trxID: data.trxID,
    transactionStatus: data.transactionStatus,
    amount: data.amount,
    merchantInvoiceNumber: data.merchantInvoiceNumber,
    errorCode: data.errorCode,
    errorMessage: data.errorMessage ?? data.statusMessage,
  }
}
