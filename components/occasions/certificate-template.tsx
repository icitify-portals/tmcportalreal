import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Create styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#fff',
        padding: 30,
    },
    border: {
        border: '4px solid #F59E0B', // Gold-ish border
        height: '100%',
        padding: 20,
        borderRadius: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottom: '2px solid #10B981',
        paddingBottom: 10,
    },
    logo: {
        width: 60,
        height: 60,
    },
    headerText: {
        textAlign: 'center',
        flexGrow: 1,
    },
    orgName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#065F46', // Dark Green
        textTransform: 'uppercase',
    },
    orgSubtitle: {
        fontSize: 10,
        color: '#374151',
    },
    titleContainer: {
        backgroundColor: '#FEF3C7',
        padding: 10,
        borderRadius: 20,
        marginVertical: 10,
        alignSelf: 'center',
        width: '80%',
    },
    title: {
        fontSize: 28,
        fontFamily: 'Helvetica-Bold', // Use standard font for now
        color: '#D97706',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    certificateNo: {
        fontSize: 10,
        textAlign: 'right',
        marginBottom: 5,
        color: '#EF4444',
    },
    body: {
        fontSize: 12,
        lineHeight: 1.5,
        marginTop: 10,
        color: '#1F2937',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'center',
    },
    label: {
        width: 120,
        fontSize: 11,
        color: '#4B5563',
        fontWeight: 'bold',
    },
    value: {
        flex: 1,
        fontSize: 12,
        borderBottom: '1px dotted #9CA3AF',
        paddingBottom: 2,
        fontFamily: 'Helvetica-Bold',
    },
    grid: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 10,
    },
    col: {
        flex: 1,
    },
    witnessSection: {
        marginTop: 20,
        borderTop: '1px solid #E5E7EB',
        paddingTop: 10,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#059669',
        textDecoration: 'underline',
    },
    signatureSection: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBlock: {
        alignItems: 'center',
        width: '30%',
    },
    signatureLine: {
        width: '100%',
        borderBottom: '1px solid #000',
        marginBottom: 5,
    },
    signatureText: {
        fontSize: 10,
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 9,
        color: '#9CA3AF',
    }
});

export type CertificateProps = {
    type: 'nikkah' | 'naming_ceremony' | string;
    certificateNo: string;
    date: Date | string;
    // Common
    location?: string;

    // Nikkah
    husbandName?: string;
    wifeName?: string;
    dowry?: string;
    husbandWitness?: string; // Optional simplify

    // Naming
    babyName?: string;
    fatherName?: string;
    motherName?: string;
    dob?: Date | string;
}

export const CertificateTemplate = ({ data }: { data: CertificateProps }) => {
    const isNikkah = data.type.toLowerCase().includes('nikkah') || data.type.toLowerCase().includes('marriage');
    const isNaming = data.type.toLowerCase().includes('naming');

    const title = isNikkah ? 'Marriage Certificate' : 'Birth Certificate';
    const subTitle = isNikkah ? 'This is to certify that Aqdun-Nikkah (Marriage Solemnisation) was conducted between' : 'This is to certify that the Naming Ceremony was conducted for';

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.border}>
                    {/* Header */}
                    <View style={styles.header}>
                        {/* Placeholder Logo */}
                        <View style={[styles.logo, { backgroundColor: '#10B981', borderRadius: 30 }]}></View>
                        <View style={styles.headerText}>
                            <Text style={styles.orgName}>The Muslim Congress</Text>
                            <Text style={styles.orgSubtitle}>National Headquarters</Text>
                            <Text style={{ fontSize: 9, marginTop: 4 }}>Motto: Intansurullah Yansurkum</Text>
                        </View>
                        {/* TMC Logo Right placeholder */}
                        <View style={[styles.logo, { backgroundColor: '#10B981', borderRadius: 5 }]}></View>
                    </View>

                    <Text style={styles.certificateNo}>Certificate No: {data.certificateNo}</Text>

                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{title}</Text>
                    </View>

                    <View style={styles.body}>
                        <Text style={{ textAlign: 'center', marginBottom: 20, fontStyle: 'italic' }}>{subTitle}</Text>

                        {isNikkah && (
                            <>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Name of Husband:</Text>
                                    <Text style={styles.value}>{data.husbandName}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Name of Wife:</Text>
                                    <Text style={styles.value}>{data.wifeName}</Text>
                                </View>

                                <View style={styles.row}>
                                    <Text style={styles.label}>Dowry Paid:</Text>
                                    <Text style={styles.value}>{data.dowry || '_____________'}</Text>
                                    <Text style={styles.label}>Date:</Text>
                                    <Text style={[styles.value, { flex: 0.3 }]}>{format(new Date(data.date), 'MMMM do, yyyy')}</Text>
                                </View>

                                <View style={styles.witnessSection}>
                                    <Text style={styles.sectionTitle}>Witnesses</Text>
                                    <View style={styles.row}>
                                        <Text style={styles.label}>Husband's Side:</Text>
                                        <Text style={styles.value}></Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.label}>Wife's Side:</Text>
                                        <Text style={styles.value}></Text>
                                    </View>
                                </View>
                            </>
                        )}

                        {isNaming && (
                            <>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Name of Baby:</Text>
                                    <Text style={styles.value}>{data.babyName}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Date of Birth:</Text>
                                    <Text style={styles.value}>{data.dob ? format(new Date(data.dob), 'MMMM do, yyyy') : 'N/A'}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Father's Name:</Text>
                                    <Text style={styles.value}>{data.fatherName}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Mother's Name:</Text>
                                    <Text style={styles.value}>{data.motherName}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Date of Event:</Text>
                                    <Text style={styles.value}>{format(new Date(data.date), 'MMMM do, yyyy')}</Text>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Signatures */}
                    <View style={styles.signatureSection}>
                        <View style={styles.signatureBlock}>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureText}>{isNikkah ? "Husband's Signature" : "Father's Signature"}</Text>
                        </View>
                        <View style={styles.signatureBlock}>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureText}>Officiating Imam</Text>
                        </View>
                        <View style={styles.signatureBlock}>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureText}>Naibul Amir (Da'wah)</Text>
                        </View>
                    </View>

                    <Text style={styles.footer}>
                        Powered by TMS Studio | The Muslim Congress
                    </Text>
                </View>
            </Page>
        </Document>
    );
};
