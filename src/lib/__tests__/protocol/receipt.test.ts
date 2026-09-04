import { describe, it, expect, beforeAll } from 'vitest';
import {
  createReceipt,
  signReceipt,
  verifyReceipt,
  exportToJSONLD,
  ReceiptSubject
} from '../../protocol/receipt';

describe('MiLyfe Cryptographic Action Receipts', () => {
  const issuerDid = 'did:milyfe:issuer:12345';
  const publicKeyId = `${issuerDid}#key-1`;

  const mockSubject: ReceiptSubject = {
    id: 'subject-1',
    actionId: 'action-123',
    actionType: 'pocket.thank',
    actor: 'did:milyfe:user:alice',
    whatHappened: '50 $MLY transferred from Alice to Bob',
    whatDidNotHappen: 'No data shared beyond recipient name and amount',
    policyApplied: 'milyfe-legal:1.0:pocket-thank',
    visibility: 'named',
    reversible: false,
    reversalWindow: null,
    expiresAt: null,
    appealRoute: '/support/appeal/action-123'
  };

  let keyPair: CryptoKeyPair;

  beforeAll(async () => {
    // Generate ECDSA key pair for testing
    keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true, // extractable
      ['sign', 'verify']
    );
  });

  describe('createReceipt', () => {
    it('generates a valid JSON-LD structure', () => {
      const receipt = createReceipt(issuerDid, mockSubject);

      expect(receipt['@context']).toContain('https://www.w3.org/2018/credentials/v1');
      expect(receipt.type).toContain('VerifiableCredential');
      expect(receipt.type).toContain('MiLyfeActionReceipt');
      expect(receipt.issuer).toBe(issuerDid);
      expect(receipt.credentialSubject).toEqual(mockSubject);
      expect(receipt.proof).toBeUndefined();

      // Verify ID is generated if not provided
      expect(receipt.id).toMatch(/^urn:uuid:/);
    });

    it('uses provided receipt ID if supplied', () => {
      const customId = 'urn:uuid:custom-123';
      const receipt = createReceipt(issuerDid, mockSubject, customId);

      expect(receipt.id).toBe(customId);
    });
  });

  describe('signReceipt', () => {
    it('appends a valid proof to the receipt', async () => {
      const unsignedReceipt = createReceipt(issuerDid, mockSubject);
      const signedReceipt = await signReceipt(unsignedReceipt, keyPair.privateKey, publicKeyId);

      expect(signedReceipt.proof).toBeDefined();
      expect(signedReceipt.proof?.type).toBe('EcdsaSecp256r1Signature2019');
      expect(signedReceipt.proof?.verificationMethod).toBe(publicKeyId);
      expect(signedReceipt.proof?.proofPurpose).toBe('assertionMethod');
      expect(signedReceipt.proof?.jws).toBeDefined();

      // Ensure original data is unchanged
      expect(signedReceipt.credentialSubject).toEqual(unsignedReceipt.credentialSubject);
    });
  });

  describe('verifyReceipt', () => {
    it('returns true for a valid signature and unmodified receipt', async () => {
      const unsignedReceipt = createReceipt(issuerDid, mockSubject);
      const signedReceipt = await signReceipt(unsignedReceipt, keyPair.privateKey, publicKeyId);

      const isValid = await verifyReceipt(signedReceipt, keyPair.publicKey);
      expect(isValid).toBe(true);
    });

    it('returns false for an unsigned receipt', async () => {
      const unsignedReceipt = createReceipt(issuerDid, mockSubject);

      const isValid = await verifyReceipt(unsignedReceipt, keyPair.publicKey);
      expect(isValid).toBe(false);
    });

    it('returns false if the receipt content is tampered with', async () => {
      const unsignedReceipt = createReceipt(issuerDid, mockSubject);
      const signedReceipt = await signReceipt(unsignedReceipt, keyPair.privateKey, publicKeyId);

      // Tamper with the data
      const tamperedReceipt = {
        ...signedReceipt,
        credentialSubject: {
          ...signedReceipt.credentialSubject,
          whatHappened: '1000000 $MLY transferred from Alice to Hacker'
        }
      };

      const isValid = await verifyReceipt(tamperedReceipt, keyPair.publicKey);
      expect(isValid).toBe(false);
    });

    it('returns false if verified with a different public key', async () => {
      const unsignedReceipt = createReceipt(issuerDid, mockSubject);
      const signedReceipt = await signReceipt(unsignedReceipt, keyPair.privateKey, publicKeyId);

      // Generate a new, different key pair
      const differentKeyPair = await crypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: 'P-256'
        },
        true,
        ['sign', 'verify']
      );

      const isValid = await verifyReceipt(signedReceipt, differentKeyPair.publicKey);
      expect(isValid).toBe(false);
    });
  });

  describe('exportToJSONLD', () => {
    it('outputs a clean JSON object format suitable for external systems', async () => {
      const unsignedReceipt = createReceipt(issuerDid, mockSubject);
      const signedReceipt = await signReceipt(unsignedReceipt, keyPair.privateKey, publicKeyId);

      const jsonLd = exportToJSONLD(signedReceipt);

      expect(jsonLd).toEqual(signedReceipt);

      // Verify it's a pure JSON object (no methods, etc)
      expect(typeof jsonLd).toBe('object');
      expect(jsonLd.constructor).toBe(Object);
      expect(JSON.parse(JSON.stringify(jsonLd))).toEqual(jsonLd);
    });
  });
});
