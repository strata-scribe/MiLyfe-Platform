import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

/**
 * PDF generation for Will & POA documents using @react-pdf/renderer.
 * 
 * Usage (in API route or server action):
 * ```ts
 * import { renderToBuffer } from '@react-pdf/renderer';
 * import { WillDocument } from '@/lib/pdf/will-template';
 * 
 * const buffer = await renderToBuffer(<WillDocument data={willData} />);
 * // Return as download or save to Supabase Storage
 * ```
 */

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: 'Helvetica', fontSize: 11, lineHeight: 1.6 },
  header: { textAlign: 'center', marginBottom: 30 },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#666' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 4 },
  paragraph: { marginBottom: 8, textAlign: 'justify' as any },
  listItem: { marginBottom: 4, paddingLeft: 15 },
  signatureLine: { marginTop: 30, borderTopWidth: 1, borderTopColor: '#000', width: '60%', paddingTop: 4 },
  signatureLabel: { fontSize: 9, color: '#666' },
  footer: { position: 'absolute', bottom: 30, left: 50, right: 50, textAlign: 'center', fontSize: 8, color: '#999' },
  bold: { fontFamily: 'Helvetica-Bold' },
});

interface WillData {
  full_name: string;
  date_of_birth: string;
  address: string;
  executor_name: string;
  executor_relationship: string;
  beneficiaries: { name: string; relationship: string; percentage: number }[];
  guardian_name?: string;
  final_wishes?: string;
  date_created: string;
}

export function WillDocument({ data }: { data: WillData }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>LAST WILL AND TESTAMENT</Text>
          <Text style={styles.subtitle}>of {data.full_name}</Text>
        </View>

        {/* Declaration */}
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            I, {data.full_name}, of {data.address}, born on {data.date_of_birth}, being of sound mind, memory, and understanding, and not acting under duress or undue influence, do hereby declare this instrument to be my Last Will and Testament, revoking all previous wills and codicils.
          </Text>
        </View>

        {/* Article I - Executor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article I — Executor</Text>
          <Text style={styles.paragraph}>
            I appoint {data.executor_name} ({data.executor_relationship}) as the Executor of this Will. My Executor shall have full power and authority to manage my estate, pay debts and expenses, and distribute assets as directed herein.
          </Text>
        </View>

        {/* Article II - Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Article II — Distribution of Estate</Text>
          <Text style={styles.paragraph}>
            I direct that my estate be distributed as follows:
          </Text>
          {data.beneficiaries.map((b, i) => (
            <Text key={i} style={styles.listItem}>
              • {b.percentage}% to {b.name} ({b.relationship})
            </Text>
          ))}
        </View>

        {/* Article III - Guardian */}
        {data.guardian_name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Article III — Guardian of Minor Children</Text>
            <Text style={styles.paragraph}>
              In the event that I have minor children at the time of my death, I designate {data.guardian_name} as guardian of my minor children.
            </Text>
          </View>
        )}

        {/* Article IV - Final Wishes */}
        {data.final_wishes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Article {data.guardian_name ? 'IV' : 'III'} — Final Wishes</Text>
            <Text style={styles.paragraph}>{data.final_wishes}</Text>
          </View>
        )}

        {/* Signature */}
        <View style={{ marginTop: 40 }}>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureLabel}>Testator Signature — Date: {data.date_created}</Text>
          </View>
          <View style={{ marginTop: 20 }}>
            <Text style={[styles.bold, { marginBottom: 8 }]}>WITNESSES:</Text>
          </View>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureLabel}>Witness 1 — Print Name, Sign, Date</Text>
          </View>
          <View style={[styles.signatureLine, { marginTop: 20 }]}>
            <Text style={styles.signatureLabel}>Witness 2 — Print Name, Sign, Date</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by MiLyfe Platform — Self-Help Document (Not Legal Advice) — {data.date_created}
        </Text>
      </Page>
    </Document>
  );
}

interface POAData {
  principal_name: string;
  principal_address: string;
  agent_name: string;
  agent_address: string;
  powers: string[];
  effective_date: string;
  durable: boolean;
}

export function POADocument({ data }: { data: POAData }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>POWER OF ATTORNEY</Text>
          <Text style={styles.subtitle}>{data.durable ? 'Durable' : 'General'} Power of Attorney</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.paragraph}>
            I, {data.principal_name}, of {data.principal_address} (the &quot;Principal&quot;), hereby appoint {data.agent_name}, of {data.agent_address} (the &quot;Agent&quot;), as my attorney-in-fact with the following powers:
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Granted Powers</Text>
          {data.powers.map((power, i) => (
            <Text key={i} style={styles.listItem}>• {power}</Text>
          ))}
        </View>

        {data.durable && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Durability</Text>
            <Text style={styles.paragraph}>
              This Power of Attorney shall not be affected by the subsequent disability or incapacity of the Principal. This is a Durable Power of Attorney.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.paragraph}>
            Effective Date: {data.effective_date}
          </Text>
        </View>

        <View style={{ marginTop: 30 }}>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureLabel}>Principal Signature — Date</Text>
          </View>
          <View style={[styles.signatureLine, { marginTop: 20 }]}>
            <Text style={styles.signatureLabel}>Witness / Notary</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Generated by MiLyfe Platform — Self-Help Document (Not Legal Advice) — {data.effective_date}
        </Text>
      </Page>
    </Document>
  );
}
