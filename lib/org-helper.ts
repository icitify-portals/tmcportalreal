import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export interface StateNode {
    id: string;
    name: string;
    code: string;
    level: "STATE";
    lgas: LgaNode[];
}

export interface BranchNode {
    id: string;
    name: string;
    code: string;
    level: "BRANCH";
    parentId: string;
}

export interface LgaNode {
    id: string;
    name: string;
    code: string;
    level: "LOCAL_GOVERNMENT";
    parentId: string;
    branches: BranchNode[];
}

export interface NationalNode {
    id: string;
    name: string;
    code: string;
    level: "NATIONAL";
    states: StateNode[];
}

export async function getOrganizationTree() {
    // 1. Fetch all organizations
    const allOrgs = await db.query.organizations.findMany({
        orderBy: [asc(organizations.name)],
    });

    // 2. Separate by levels
    const national = allOrgs.filter(o => o.level === 'NATIONAL');
    const states = allOrgs.filter(o => o.level === 'STATE');
    const lgas = allOrgs.filter(o => o.level === 'LOCAL_GOVERNMENT');
    const branches = allOrgs.filter(o => o.level === 'BRANCH');

    // 3. Build Tree
    const tree: NationalNode[] = national.map(nat => {
        // Find States for this National (usually all states, but following the structure)
        const natStates = states.filter(s => s.parentId === nat.id || !s.parentId);

        const stateNodes: StateNode[] = natStates.map(state => {
            // Find LGAs for this state
            const stateLgas = lgas.filter(l => l.parentId === state.id);

            const lgaNodes: LgaNode[] = stateLgas.map(lga => {
                // Find Branches for this LGA
                const lgaBranches = branches.filter(b => b.parentId === lga.id);

                return {
                    id: lga.id,
                    name: lga.name,
                    code: lga.code,
                    level: "LOCAL_GOVERNMENT",
                    parentId: lga.parentId!,
                    branches: lgaBranches.map(b => ({
                        id: b.id,
                        name: b.name,
                        code: b.code,
                        level: "BRANCH",
                        parentId: b.parentId!
                    }))
                };
            });

            return {
                id: state.id,
                name: state.name,
                code: state.code,
                level: "STATE",
                lgas: lgaNodes
            };
        });

        return {
            id: nat.id,
            name: nat.name,
            code: nat.code,
            level: "NATIONAL",
            states: stateNodes
        };
    });

    return tree;
}

export async function getOrganizationAncestry(orgId: string) {
    // Basic implementation - can be optimized with CTEs in raw SQL if needed later
    // For now, simpler repetitive fetch or fetching all is okay since depth is max 4.

    let current = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId)
    });

    const path = [];
    while (current) {
        path.unshift(current);
        if (!current.parentId) break;
        current = await db.query.organizations.findFirst({
            where: eq(organizations.id, current.parentId)
        });
    }
    return path;
}
