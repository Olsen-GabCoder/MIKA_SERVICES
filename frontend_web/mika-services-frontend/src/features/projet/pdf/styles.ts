import { StyleSheet } from '@react-pdf/renderer'

const colors = {
  primary: '#1e40af',
  primaryDark: '#1e3a8a',
  text: '#111827',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  background: '#f9fafb',
  white: '#ffffff',
  success: '#059669',
  danger: '#dc2626',
}

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: colors.text,
  },
  // En-tête
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 9,
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  headerMeta: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginTop: 8,
    gap: 12,
  },
  badge: {
    fontSize: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.background,
    borderRadius: 2,
  },
  // Sections
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  // Tableaux
  table: {
    width: '100%',
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row' as const,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRowHeader: {
    backgroundColor: colors.background,
    fontWeight: 'bold',
    fontSize: 9,
    color: colors.textMuted,
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
  },
  tableCellRight: {
    flex: 1,
    fontSize: 9,
    textAlign: 'right' as const,
  },
  tableCellFixed: {
    width: 90,
    fontSize: 9,
  },
  tableCellFixedRight: {
    width: 70,
    fontSize: 9,
    textAlign: 'right' as const,
  },
  // Blocs texte
  row: {
    flexDirection: 'row' as const,
    marginBottom: 6,
  },
  label: {
    width: 140,
    fontSize: 9,
    color: colors.textMuted,
  },
  labelInline: {
    fontSize: 9,
    color: colors.textMuted,
  },
  value: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold' as const,
  },
  paragraph: {
    fontSize: 9,
    color: colors.text,
    marginBottom: 6,
    lineHeight: 1.4,
  },
  // KPIs / synthèse
  kpiRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 16,
    marginBottom: 12,
  },
  kpiBox: {
    flex: 1,
    minWidth: 100,
    padding: 10,
    backgroundColor: colors.background,
    borderRadius: 2,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  kpiLabel: {
    fontSize: 8,
    color: colors.textMuted,
    marginTop: 2,
  },
  // Alertes
  alert: {
    padding: 8,
    marginBottom: 6,
    backgroundColor: '#fef3c7',
    borderRadius: 2,
    borderLeftWidth: 3,
    borderLeftColor: '#d97706',
  },
  alertTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  alertText: {
    fontSize: 8,
    color: colors.textMuted,
  },
  // Pied de page
  footer: {
    position: 'absolute' as const,
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 7,
    color: colors.textMuted,
    textAlign: 'center' as const,
  },
})
