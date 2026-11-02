import mysql from 'mysql2/promise';

function norm(label) {
    return label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

const isCorporateLabel = (label) => norm(label).includes("corporate");
const isNonMemberLabel = (label) => norm(label).startsWith("non");

const OFFICIAL_KEYWORDS = {
    NATIONAL: ["national", "nec"],
    STATE: ["state"],
    LOCAL_GOVERNMENT: ["lga", "local government", "local", "government"],
    BRANCH: ["branch"],
};

const MEMBER_KEYWORDS = ["ordinary", "general member", "delegate", "general", "member"];

const containsAny = (candidate, words) =>
    words.some((w) => candidate.includes(w));

function resolveEntitlement(input) {
    const tiers = input.pricingTiers || {};
    const tierEntries = Object.entries(tiers);

    const amount = Number(input.amount ?? 0);
    const standard = amount;

    if (input.signedIn) {
        const eligible = tierEntries.filter(([label]) => !isCorporateLabel(label) && !isNonMemberLabel(label));
        console.log('ELIGIBLE TIERS:', eligible);

        const level = (input.officialLevel || "").toUpperCase();
        console.log('INPUT OFFICIAL LEVEL:', level);
        if (level && OFFICIAL_KEYWORDS[level]) {
            const match = eligible.find(([label]) => containsAny(norm(label), OFFICIAL_KEYWORDS[level]));
            console.log('OFFICIAL MATCH:', match);
            if (match) return { kind: "member-tier", baseAmount: match[1], tierLabel: match[0] };
        }

        if (input.hasActiveMemberRecord || level) {
            const memberTier = MEMBER_KEYWORDS
                .map((kw) => eligible.find(([label]) => norm(label).includes(kw)))
                .find((m) => m);
            console.log('MEMBER TIER MATCH:', memberTier);
            if (memberTier) return { kind: "member-tier", baseAmount: memberTier[1], tierLabel: memberTier[0] };
        }

        return { kind: "member-standard", baseAmount: standard, tierLabel: null };
    }

    const nonMember = tierEntries.find(([label]) => isNonMemberLabel(label) && !isCorporateLabel(label));
    if (nonMember) return { kind: "guest", baseAmount: nonMember[1], tierLabel: nonMember[0] };
    return { kind: "guest", baseAmount: standard, tierLabel: null };
}

async function main() {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    const [p] = await conn.query('SELECT * FROM programmes WHERE id = ?', ['28cda84e-42bb-48fe-9581-0d4d556df53e']);
    const prog = p[0];

    console.log('--- TEST 1: user signed in, officialLevel is NATIONAL ---');
    console.log(resolveEntitlement({
        pricingTiers: prog.pricingTiers,
        amount: prog.amount,
        signedIn: true,
        officialLevel: 'NATIONAL',
        hasActiveMemberRecord: true
    }));

    console.log('\n--- TEST 2: user signed in, officialLevel is undefined / null ---');
    console.log(resolveEntitlement({
        pricingTiers: prog.pricingTiers,
        amount: prog.amount,
        signedIn: true,
        officialLevel: undefined,
        hasActiveMemberRecord: true
    }));

    console.log('\n--- TEST 3: user NOT signed in (guest / public registration page) ---');
    console.log(resolveEntitlement({
        pricingTiers: prog.pricingTiers,
        amount: prog.amount,
        signedIn: false,
        officialLevel: undefined,
        hasActiveMemberRecord: false
    }));

    await conn.end();
}

main().catch(console.error);
