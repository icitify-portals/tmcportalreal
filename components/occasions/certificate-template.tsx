import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Create styles
// Create styles matching the image
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FEFCE8', // Light cream background
        padding: 0,
    },
    borderContainer: {
        margin: 10,
        flex: 1,
        border: '5px solid #1e3a8a', // Blue/Navy outer border
        borderRadius: 20,
        backgroundColor: '#fff',
        padding: 5,
    },
    innerBorder: {
        flex: 1,
        border: '2px solid #FCD34D', // Yellow/Gold inner border
        borderRadius: 15,
        padding: 20,
        backgroundColor: '#FEFCE8', // Light yellowish background inside
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    logoContainer: {
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 70,
        height: 70,
    },
    headerTextContainer: {
        flex: 1,
        alignItems: 'center',
    },
    bismillah: {
        fontSize: 10,
        fontStyle: 'italic',
        marginBottom: 5,
        color: '#047857', // Green
    },
    orgName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#065F46', // Dark Green
        textTransform: 'uppercase',
        fontFamily: 'Helvetica-Bold',
        marginBottom: 2,
    },
    orgSubtitle: {
        fontSize: 14,
        color: '#BE123C', // Red/Pink
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 5,
    },
    addressBlock: {
        fontSize: 8,
        textAlign: 'center',
        color: '#374151',
        lineHeight: 1.2,
    },
    certTypeContainer: {
        alignSelf: 'center',
        marginVertical: 15,
        paddingHorizontal: 40,
        paddingVertical: 10,
        border: '3px solid #EF4444', // Red border
        borderRadius: 30,
        backgroundColor: '#fff',
    },
    certType: {
        fontSize: 24,
        color: '#EF4444', // Red text
        fontFamily: 'Helvetica-BoldOblique', // Script-like
        textTransform: 'uppercase',
    },
    certNo: {
        position: 'absolute',
        bottom: -20,
        right: 0,
        fontSize: 12,
        fontWeight: 'bold',
    },
    bodyContainer: {
        marginTop: 10,
        paddingHorizontal: 20,
    },
    certifyText: {
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 1.5,
        fontFamily: 'Times-Roman',
    },
    fieldRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-end', // Align text to bottom of line
    },
    fieldLabel: {
        fontSize: 12,
        fontFamily: 'Times-Bold',
        marginRight: 10,
        minWidth: 100,
    },
    fieldValue: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'Times-BoldItalic', // Handwritten style
        borderBottom: '1px solid #000',
        paddingBottom: 2,
        paddingLeft: 5,
    },
    dateRow: {
        flexDirection: 'row',
        marginBottom: 10,
        gap: 20,
    },
    quranQuote: {
        marginTop: 20,
        padding: 10,
        borderWidth: 1,
        borderColor: '#065F46',
        borderRadius: 10,
        backgroundColor: '#ECFDF5',
        width: '45%',
    },
    quranText: {
        fontSize: 9,
        fontStyle: 'italic',
        textAlign: 'center',
        color: '#064E3B',
    },
    footer: {
        marginTop: 'auto',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: 20,
    },
    seal: {
        width: 80,
        height: 80,
        backgroundColor: '#EF4444',
        borderRadius: 40, // Circle
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.8,
    },
    signatureBlock: {
        alignItems: 'center',
        width: 150,
    },
    signatureLine: {
        width: '100%',
        borderBottom: '1px solid #000',
        marginBottom: 5,
    },
    signatureLabel: {
        fontSize: 9,
        textAlign: 'center',
        color: '#374151',
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
    husbandWitness?: string;

    // Naming
    babyName?: string;
    fatherName?: string;
    motherName?: string;
    dob?: Date | string;
}

export const CertificateTemplate = ({ data }: { data: CertificateProps }) => {
    const isNikkah = data.type?.toLowerCase().includes('nikkah') || data.type?.toLowerCase().includes('marriage');
    const isNaming = data.type?.toLowerCase().includes('naming');

    const title = isNikkah ? 'Marriage Certificate' : 'Birth Certificate';

    // Logic for certificate text
    const certifyText = isNikkah
        ? "This is to certify that Aqdun-Nikkah (Marriage Solemnisation) was conducted between"
        : "In the name of Allah, the Beneficent, the Merciful.\nThrough the Naibul Amir Cultural Affairs having conducted the Aqeeqah according to the Qur'an and Sunnah of Prophet Muhammad (SAW) and without any legal hindrance\npresents this";

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.borderContainer}>
                    <View style={styles.innerBorder}>
                        {/* Header Section */}
                        <View style={styles.header}>
                            {/* Left Logo Placeholder */}
                            <View style={styles.logoContainer}>
                                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#065F46' }} />
                            </View>

                            <View style={styles.headerTextContainer}>
                                <Text style={styles.bismillah}>In the name of Allah, the Beneficent, the Merciful</Text>
                                <Text style={styles.orgName}>THE MUSLIM CONGRESS</Text>
                                <Text style={styles.orgSubtitle}>NATIONAL HEADQUARTERS</Text>
                                <Text style={styles.addressBlock}>
                                    Address: 1, Thanni Olodo Street, Along Jibowu-Ikorodu Road, Jibowu, Lagos.{'\n'}
                                    Website: www.tmcng.net | Email: info@tmcng.net
                                </Text>
                            </View>

                            {/* Right Logo Placeholder */}
                            <View style={styles.logoContainer}>
                                <View style={{ width: 60, height: 60, backgroundColor: '#BE123C' }} />
                            </View>
                        </View>

                        {/* Certificate Title */}
                        <View style={styles.certTypeContainer}>
                            <Text style={styles.certType}>{title}</Text>
                            <Text style={styles.certNo}>{data.certificateNo}</Text>
                        </View>

                        <Text style={{ textAlign: 'center', marginBottom: 5 }}>to</Text>

                        {/* Body Logic */}
                        <View style={styles.bodyContainer}>

                            <Text style={styles.certifyText}>{certifyText}</Text>

                            {isNaming && (
                                <>
                                    <View style={styles.fieldRow}>
                                        <Text style={styles.fieldLabel}>Name of Baby:</Text>
                                        <Text style={styles.fieldValue}>{data.babyName}</Text>
                                    </View>

                                    <View style={styles.dateRow}>
                                        <View style={[styles.fieldRow, { flex: 1, marginRight: 20 }]}>
                                            <Text style={styles.fieldLabel}>Date of Birth:</Text>
                                            <Text style={styles.fieldValue}>{data.dob ? format(new Date(data.dob), 'MMMM do, yyyy') : ''}</Text>
                                        </View>
                                        <View style={[styles.fieldRow, { flex: 1 }]}>
                                            <Text style={styles.fieldLabel}>Date of Aqeeqah:</Text>
                                            <Text style={styles.fieldValue}>{data.date ? format(new Date(data.date), 'MMMM do, yyyy') : ''}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.fieldRow}>
                                        <Text style={styles.fieldLabel}>Father's Name:</Text>
                                        <Text style={styles.fieldValue}>{data.fatherName}</Text>
                                    </View>

                                    <View style={styles.dateRow}>
                                        <View style={[styles.fieldRow, { flex: 1, marginRight: 20 }]}>
                                            <Text style={styles.fieldLabel}>Place of Birth:</Text>
                                            <Text style={styles.fieldValue}>{data.location}</Text>
                                        </View>
                                        <View style={[styles.fieldRow, { flex: 1 }]}>
                                            {/* Spacer or extra field if needed */}
                                        </View>
                                    </View>

                                    <View style={styles.fieldRow}>
                                        <Text style={styles.fieldLabel}>Address of Parents:</Text>
                                        <Text style={styles.fieldValue}></Text>
                                    </View>
                                </>
                            )}

                            {isNikkah && (
                                <>
                                    <View style={styles.fieldRow}>
                                        <Text style={styles.fieldLabel}>Name of Husband:</Text>
                                        <Text style={styles.fieldValue}>{data.husbandName}</Text>
                                    </View>
                                    <View style={styles.fieldRow}>
                                        <Text style={styles.fieldLabel}>Name of Wife:</Text>
                                        <Text style={styles.fieldValue}>{data.wifeName}</Text>
                                    </View>
                                    <View style={styles.dateRow}>
                                        <View style={[styles.fieldRow, { flex: 1, marginRight: 20 }]}>
                                            <Text style={styles.fieldLabel}>Date of Nikkah:</Text>
                                            <Text style={styles.fieldValue}>{data.date ? format(new Date(data.date), 'MMMM do, yyyy') : ''}</Text>
                                        </View>
                                        <View style={[styles.fieldRow, { flex: 1 }]}>
                                            <Text style={styles.fieldLabel}>Dowry:</Text>
                                            <Text style={styles.fieldValue}>{data.dowry}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.fieldRow}>
                                        <Text style={styles.fieldLabel}>Venue:</Text>
                                        <Text style={styles.fieldValue}>{data.location}</Text>
                                    </View>
                                </>
                            )}
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            {/* Left Side: Quran Quote & Seal */}
                            <View style={{ width: '40%' }}>
                                <View style={styles.seal}>
                                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>SEAL</Text>
                                </View>
                                <View style={styles.quranQuote}>
                                    <Text style={styles.quranText}>
                                        "To Allah belongs the dominion of the heavens and the earth. He creates what He wills. He bestows (children) male and female according to His will." - Qur'an 42:49
                                    </Text>
                                </View>
                            </View>

                            {/* Right Side: Signatures */}
                            <View style={{ width: '60%', alignItems: 'flex-end' }}>
                                <View style={[styles.signatureBlock, { marginBottom: 20 }]}>
                                    <View style={styles.signatureLine} />
                                    <Text style={styles.signatureLabel}>
                                        Signature and Date by Naibul Amir{'\n'}
                                        Cultural Affairs Representative
                                    </Text>
                                </View>

                                <View style={[styles.signatureBlock]}>
                                    <View style={styles.signatureLine} />
                                    <Text style={styles.signatureLabel}>
                                        {isNaming ? "Father's Name, Signature and Date" : "Husband's Signature and Date"}
                                    </Text>
                                </View>

                                {isNikkah && (
                                    <View style={[styles.signatureBlock, { marginTop: 20 }]}>
                                        <View style={styles.signatureLine} />
                                        <Text style={styles.signatureLabel}>
                                            Wife's Signature and Date
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                    </View>
                </View>
            </Page>
        </Document>
    );
};
