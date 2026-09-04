/**
 * MiLyfe Cryptographic Action Receipts
 *
 * Provides human-readable action receipts with W3C Verifiable Credentials
 * compatible JSON-LD structure and portable cryptographic proofs using Web Crypto API.
 */

export interface ReceiptSubject {
  id: string;
  actionId: string;
  actionType: string;
  actor: string;
  whatHappened: string;
  whatDidNotHappen: string;
  policyApplied: string;
  visibility: string;
  reversible: boolean;
  reversalWindow: string | null;
  expiresAt: string | null;
  appealRoute: string;
  metadata?: Record<string, any>;
}

export interface ReceiptProof {
  type: 'Ed25519Signature2018' | 'EcdsaSecp256r1Signature2019';
  created: string;
  verificationMethod: string;
  proofPurpose: 'assertionMethod';
  jws: string;
}

export interface ActionReceipt {
  '@context': string[];
  type: string[];
  id: string;
  issuer: string;
  issuanceDate: string;
  credentialSubject: ReceiptSubject;
  proof?: ReceiptProof;
}

/**
 * Creates a new, unsigned human-readable action receipt.
 */
export function createReceipt(
  issuerDid: string,
  subject: ReceiptSubject,
  receiptId?: string
): ActionReceipt {
  return {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://milyfe.io/credentials/v1' // Hypothetical custom context
    ],
    type: ['VerifiableCredential', 'MiLyfeActionReceipt'],
    id: receiptId || `urn:uuid:${crypto.randomUUID()}`,
    issuer: issuerDid,
    issuanceDate: new Date().toISOString(),
    credentialSubject: subject
  };
}

/**
 * Deterministic JSON stringify helper.
 */
function deterministicStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map(deterministicStringify).join(',') + ']';
  }

  const keys = Object.keys(obj).sort();
  const parts = keys.map(key => {
    return JSON.stringify(key) + ':' + deterministicStringify(obj[key]);
  });

  return '{' + parts.join(',') + '}';
}

/**
 * Deterministically serializes the credential, excluding the proof.
 * This ensures the signature is consistent regardless of property ordering.
 */
export function serializeForSigning(receipt: ActionReceipt): string {
  // Create a copy without the proof
  const { proof, ...receiptWithoutProof } = receipt;

  // Custom simple deterministic JSON stringify for this specific object structure
  // In a full implementation, we might use json-canonicalize (JCS) RFC 8785
  return deterministicStringify(receiptWithoutProof);
}

/**
 * Base64 URL encodes an ArrayBuffer
 */
function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64 URL decodes a string to an ArrayBuffer
 */
function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Signs a receipt using the Web Crypto API (ECDSA P-256)
 */
export async function signReceipt(
  receipt: ActionReceipt,
  privateKey: CryptoKey,
  publicKeyId: string
): Promise<ActionReceipt> {
  const serialized = serializeForSigning(receipt);

  const encoder = new TextEncoder();
  const data = encoder.encode(serialized);

  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' }
    },
    privateKey,
    data
  );

  // Create a simple JWS-like structure for the proof (detached payload)
  // Header: {"alg":"ES256","b64":false,"crit":["b64"]}
  const header = btoa(JSON.stringify({ alg: 'ES256', b64: false, crit: ['b64'] }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const encodedSignature = bufferToBase64url(signature);
  const jws = `${header}..${encodedSignature}`;

  return {
    ...receipt,
    proof: {
      type: 'EcdsaSecp256r1Signature2019',
      created: new Date().toISOString(),
      verificationMethod: publicKeyId,
      proofPurpose: 'assertionMethod',
      jws
    }
  };
}

/**
 * Verifies a signed receipt using the Web Crypto API
 */
export async function verifyReceipt(
  receipt: ActionReceipt,
  publicKey: CryptoKey
): Promise<boolean> {
  if (!receipt.proof) {
    return false;
  }

  try {
    const serialized = serializeForSigning(receipt);
    const encoder = new TextEncoder();
    const data = encoder.encode(serialized);

    // Parse JWS
    const parts = receipt.proof.jws.split('..');
    if (parts.length !== 2) return false;

    const signatureBuffer = base64urlToBuffer(parts[1]);

    return await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' }
      },
      publicKey,
      signatureBuffer,
      data
    );
  } catch (error) {
    console.error('Failed to verify receipt signature:', error);
    return false;
  }
}

/**
 * Exports the receipt to standard JSON-LD format
 * (In this simple implementation, the internal representation is already JSON-LD compatible)
 */
export function exportToJSONLD(receipt: ActionReceipt): Record<string, any> {
  // Deep clone to ensure it's a pure JSON object
  return JSON.parse(JSON.stringify(receipt));
}
