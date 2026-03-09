"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Info } from "lucide-react"
import { EditMeetingGroupDialog } from "./edit-meeting-group-dialog"
import { DeleteMeetingGroupButton } from "./delete-meeting-group-button"
import { Badge } from "@/components/ui/badge"

interface Group {
    id: string
    name: string
    memberCount: number
    members: { userId: string }[]
}

interface GroupsListProps {
    groups: Group[]
    availableMembers: { id: string, name: string | null }[]
}

export function GroupsList({ groups, availableMembers }: GroupsListProps) {
    if (groups.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground border rounded-md border-dashed">
                <Users className="mx-auto h-12 w-12 opacity-20 mb-4" />
                <p>No meeting groups found.</p>
                <p className="text-sm">Create groups to reuse them when scheduling meetings.</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Group Name</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {groups.map((group) => (
                        <TableRow key={group.id}>
                            <TableCell className="font-medium">{group.name}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">
                                        <Users className="mr-1 h-3 w-3" />
                                        {group.memberCount} members
                                    </Badge>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <EditMeetingGroupDialog group={group} availableMembers={availableMembers} />
                                    <DeleteMeetingGroupButton groupId={group.id} groupName={group.name} />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
