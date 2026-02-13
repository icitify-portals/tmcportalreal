"use strict";
// import * as dotenv from 'dotenv';
// import path from 'path';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
// // Load environment variables explicitly
// // const envLocalPath = path.resolve(process.cwd(), '.env.local');
// // const envPath = path.resolve(process.cwd(), '.env');
// // dotenv.config({ path: envLocalPath });
// // dotenv.config({ path: envPath });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var permissions, _i, permissions_1, perm, nationalOrg, roles, _a, roles_1, roleData, rolePerms, roleInfo, role, _b, rolePerms_1, permCode, permission, nationalOrgForNav, MENU_ITEMS, _c, MENU_ITEMS_1, item, existing;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log('🌱 Seeding database...');
                    permissions = [
                        // Members
                        { code: 'members:create', name: 'Create Members', category: 'members', description: 'Create new member accounts' },
                        { code: 'members:read', name: 'View Members', category: 'members', description: 'View member information' },
                        { code: 'members:update', name: 'Update Members', category: 'members', description: 'Update member information' },
                        { code: 'members:delete', name: 'Delete Members', category: 'members', description: 'Delete member accounts' },
                        { code: 'members:approve', name: 'Approve Members', category: 'members', description: 'Approve pending member applications' },
                        // Officials
                        { code: 'officials:create', name: 'Create Officials', category: 'officials', description: 'Create official positions' },
                        { code: 'officials:read', name: 'View Officials', category: 'officials', description: 'View official information' },
                        { code: 'officials:update', name: 'Update Officials', category: 'officials', description: 'Update official information' },
                        { code: 'officials:delete', name: 'Delete Officials', category: 'officials', description: 'Remove officials' },
                        // Roles & Permissions
                        { code: 'roles:create', name: 'Create Roles', category: 'roles', description: 'Create new roles' },
                        { code: 'roles:read', name: 'View Roles', category: 'roles', description: 'View roles and permissions' },
                        { code: 'roles:update', name: 'Update Roles', category: 'roles', description: 'Update role information' },
                        { code: 'roles:delete', name: 'Delete Roles', category: 'roles', description: 'Delete roles' },
                        { code: 'roles:assign', name: 'Assign Roles', category: 'roles', description: 'Assign roles to users' },
                        { code: 'permissions:manage', name: 'Manage Permissions', category: 'roles', description: 'Manage role permissions' },
                        // Organizations
                        { code: 'organizations:create', name: 'Create Organizations', category: 'organizations', description: 'Create new organizations' },
                        { code: 'organizations:read', name: 'View Organizations', category: 'organizations', description: 'View organization information' },
                        { code: 'organizations:update', name: 'Update Organizations', category: 'organizations', description: 'Update organization information' },
                        { code: 'organizations:delete', name: 'Delete Organizations', category: 'organizations', description: 'Delete organizations' },
                        // Payments
                        { code: 'payments:create', name: 'Create Payments', category: 'payments', description: 'Create payment records' },
                        { code: 'payments:read', name: 'View Payments', category: 'payments', description: 'View payment information' },
                        { code: 'payments:update', name: 'Update Payments', category: 'payments', description: 'Update payment records' },
                        { code: 'payments:refund', name: 'Refund Payments', category: 'payments', description: 'Process refunds' },
                        // Documents
                        { code: 'documents:create', name: 'Upload Documents', category: 'documents', description: 'Upload documents' },
                        { code: 'documents:read', name: 'View Documents', category: 'documents', description: 'View documents' },
                        { code: 'documents:update', name: 'Update Documents', category: 'documents', description: 'Update document information' },
                        { code: 'documents:delete', name: 'Delete Documents', category: 'documents', description: 'Delete documents' },
                        // Audit & Reports
                        { code: 'audit:read', name: 'View Audit Logs', category: 'audit', description: 'View system audit logs' },
                        { code: 'reports:read', name: 'View Reports', category: 'reports', description: 'View reports' },
                        { code: 'reports:generate', name: 'Generate Reports', category: 'reports', description: 'Generate new reports' },
                        // Users
                        { code: 'users:create', name: 'Create Users', category: 'users', description: 'Create user accounts' },
                        { code: 'users:read', name: 'View Users', category: 'users', description: 'View user information' },
                        { code: 'users:update', name: 'Update Users', category: 'users', description: 'Update user accounts' },
                        { code: 'users:delete', name: 'Delete Users', category: 'users', description: 'Delete user accounts' },
                    ];
                    console.log('Creating permissions...');
                    _i = 0, permissions_1 = permissions;
                    _d.label = 1;
                case 1:
                    if (!(_i < permissions_1.length)) return [3 /*break*/, 4];
                    perm = permissions_1[_i];
                    return [4 /*yield*/, prisma.permission.upsert({
                            where: { code: perm.code },
                            update: perm,
                            create: perm,
                        })];
                case 2:
                    _d.sent();
                    _d.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log("\u2705 Created ".concat(permissions.length, " permissions"));
                    return [4 /*yield*/, prisma.organization.upsert({
                            where: { code: 'TMC-NAT' },
                            update: {},
                            create: {
                                name: 'The Muslim Congress (National)',
                                code: 'TMC-NAT',
                                level: 'NATIONAL', // Use string if enum not imported, or rely on Prisma types
                                description: 'National Headquarters',
                                country: 'Nigeria',
                                isActive: true,
                                welcomeMessage: 'Welcome to TMC Portal',
                                welcomeImageUrl: '/images/logo.png'
                            },
                        })];
                case 5:
                    nationalOrg = _d.sent();
                    console.log('✅ Created National Organization');
                    roles = [
                        {
                            name: 'Super Admin',
                            code: 'SUPER_ADMIN',
                            description: 'Full system access with no jurisdiction limits',
                            jurisdictionLevel: 'SYSTEM',
                            isSystem: true,
                            permissions: permissions.map(function (p) { return p.code; }), // All permissions
                        },
                        {
                            name: 'National Admin',
                            code: 'NATIONAL_ADMIN',
                            description: 'National level administrator with full access to national jurisdiction',
                            jurisdictionLevel: 'NATIONAL',
                            isSystem: true,
                            permissions: [
                                'members:create', 'members:read', 'members:update', 'members:approve',
                                'officials:create', 'officials:read', 'officials:update',
                                'organizations:read', 'organizations:update',
                                'payments:create', 'payments:read', 'payments:update',
                                'documents:create', 'documents:read', 'documents:update',
                                'audit:read', 'reports:read', 'reports:generate',
                                'roles:read', 'roles:assign',
                            ],
                        },
                        {
                            name: 'State Admin',
                            code: 'STATE_ADMIN',
                            description: 'State level administrator with full access to state jurisdiction',
                            jurisdictionLevel: 'STATE',
                            isSystem: true,
                            permissions: [
                                'members:create', 'members:read', 'members:update', 'members:approve',
                                'officials:read',
                                'organizations:read',
                                'payments:create', 'payments:read', 'payments:update',
                                'documents:create', 'documents:read', 'documents:update',
                                'reports:read',
                            ],
                        },
                        {
                            name: 'Local Government Admin',
                            code: 'LOCAL_GOVERNMENT_ADMIN',
                            description: 'Local Government level administrator',
                            jurisdictionLevel: 'LOCAL_GOVERNMENT',
                            isSystem: true,
                            permissions: [
                                'members:create', 'members:read', 'members:update',
                                'payments:create', 'payments:read',
                                'documents:create', 'documents:read', 'documents:update',
                            ],
                        },
                        {
                            name: 'Branch Admin',
                            code: 'BRANCH_ADMIN',
                            description: 'Branch level administrator',
                            jurisdictionLevel: 'BRANCH',
                            isSystem: true,
                            permissions: [
                                'members:create', 'members:read', 'members:update',
                                'payments:create', 'payments:read',
                                'documents:create', 'documents:read',
                            ],
                        },
                        {
                            name: 'Official',
                            code: 'OFFICIAL',
                            description: 'Organization official with jurisdiction-based access',
                            jurisdictionLevel: 'BRANCH',
                            isSystem: true,
                            permissions: [
                                'members:read',
                                'payments:read',
                                'documents:read',
                                'reports:read',
                            ],
                        },
                        {
                            name: 'Member',
                            code: 'MEMBER',
                            description: 'Regular member with limited access',
                            jurisdictionLevel: 'BRANCH',
                            isSystem: true,
                            permissions: [
                                'members:read', // Own profile
                                'payments:read', // Own payments
                                'documents:read', // Own documents
                            ],
                        },
                    ];
                    console.log('Creating roles...');
                    _a = 0, roles_1 = roles;
                    _d.label = 6;
                case 6:
                    if (!(_a < roles_1.length)) return [3 /*break*/, 13];
                    roleData = roles_1[_a];
                    rolePerms = roleData.permissions, roleInfo = __rest(roleData, ["permissions"]);
                    return [4 /*yield*/, prisma.role.upsert({
                            where: { code: roleInfo.code },
                            update: roleInfo,
                            create: roleInfo,
                        })
                        // Assign permissions to role
                    ];
                case 7:
                    role = _d.sent();
                    _b = 0, rolePerms_1 = rolePerms;
                    _d.label = 8;
                case 8:
                    if (!(_b < rolePerms_1.length)) return [3 /*break*/, 12];
                    permCode = rolePerms_1[_b];
                    return [4 /*yield*/, prisma.permission.findUnique({
                            where: { code: permCode },
                        })];
                case 9:
                    permission = _d.sent();
                    if (!permission) return [3 /*break*/, 11];
                    return [4 /*yield*/, prisma.rolePermission.upsert({
                            where: {
                                roleId_permissionId: {
                                    roleId: role.id,
                                    permissionId: permission.id,
                                },
                            },
                            update: { granted: true },
                            create: {
                                roleId: role.id,
                                permissionId: permission.id,
                                granted: true,
                            },
                        })];
                case 10:
                    _d.sent();
                    _d.label = 11;
                case 11:
                    _b++;
                    return [3 /*break*/, 8];
                case 12:
                    _a++;
                    return [3 /*break*/, 6];
                case 13:
                    console.log("\u2705 Created ".concat(roles.length, " roles with permissions"));
                    console.log('✅ Created roles with permissions');
                    console.log('Seeding navigation items...');
                    return [4 /*yield*/, prisma.organization.findUnique({
                            where: { code: 'TMC-NAT' }
                        })];
                case 14:
                    nationalOrgForNav = _d.sent();
                    if (!nationalOrgForNav) return [3 /*break*/, 21];
                    MENU_ITEMS = [
                        { label: "Home", path: "/", order: 0, type: "link" },
                        { label: "Dashboard", path: "/dashboard", order: 1, type: "link" },
                        { label: "Constitution", path: "/constitution", order: 2, type: "link" },
                        { label: "Adhkar Centres", path: "/adhkar", order: 3, type: "link" },
                        { label: "Teskiyah Centres", path: "/teskiyah", order: 4, type: "link" },
                        { label: "Connect", path: "/connect", order: 5, type: "link" },
                        { label: "Events", path: "/programmes", order: 6, type: "link" },
                        { label: "Donate", path: "/donate", order: 7, type: "link" },
                        { label: "Media Library", path: "/media", order: 8, type: "link" },
                    ];
                    _c = 0, MENU_ITEMS_1 = MENU_ITEMS;
                    _d.label = 15;
                case 15:
                    if (!(_c < MENU_ITEMS_1.length)) return [3 /*break*/, 20];
                    item = MENU_ITEMS_1[_c];
                    return [4 /*yield*/, prisma.navigationItem.findFirst({
                            where: {
                                label: item.label,
                                organizationId: nationalOrgForNav.id
                            }
                        })];
                case 16:
                    existing = _d.sent();
                    if (!!existing) return [3 /*break*/, 18];
                    return [4 /*yield*/, prisma.navigationItem.create({
                            data: {
                                label: item.label,
                                path: item.path,
                                order: item.order,
                                type: item.type,
                                isActive: true,
                                organizationId: nationalOrgForNav.id
                            }
                        })];
                case 17:
                    _d.sent();
                    console.log("+ Added: ".concat(item.label));
                    return [3 /*break*/, 19];
                case 18:
                    console.log("= Skipped: ".concat(item.label));
                    _d.label = 19;
                case 19:
                    _c++;
                    return [3 /*break*/, 15];
                case 20:
                    console.log('✅ Navigation items seeded');
                    return [3 /*break*/, 22];
                case 21:
                    console.error('❌ Could not find National Organization for navigation seeding');
                    _d.label = 22;
                case 22:
                    console.log('✅ Seeding completed!');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
