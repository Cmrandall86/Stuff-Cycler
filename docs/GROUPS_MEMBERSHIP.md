# Groups Membership & Invitations

This document describes the Groups membership and invitation system implemented in Stuff Cycler.

## Overview

The Groups system allows users to create and manage private communities for sharing items. Groups support different membership types, invitation flows, and role-based permissions.

## Group Types

### Invite-Only Groups

- `is_invite_only = true`
- Members can only join via explicit invitations from the owner or admins
- Non-members see an "Invite Only" badge and cannot request to join
- Owner/admins use the "Invite Members" button to send email-based invitations

### Open Groups

- `is_invite_only = false`
- Anyone can request to join the group
- Non-members see a "Join Group" button
- Requests appear in the Join Requests panel for owner/admin approval
- Owner/admins can still send direct invitations

## Role Hierarchy

### Owner

- Exactly one owner per group (enforced by unique index)
- Full control over the group
- Can promote/demote members between admin and member roles
- Can remove any member (except themselves)
- Can edit group settings (name, description, invite-only status)
- Cannot leave the group
- Automatically added to `group_members` on group creation (via trigger)

### Admin

- Can invite new members
- Can approve/reject join requests
- Can see all group members
- Cannot remove the owner
- Cannot change roles
- Can leave the group

### Member

- Can see all group members
- Can leave the group
- Cannot invite others or manage membership

## Invitation Flow

1. **Send Invitation**
   - Owner/admin enters an email address
   - System creates a `group_invitations` record with `status = 'pending'`
   - `invitee_id` is left null (resolved on acceptance)
   - Unique constraint prevents duplicate pending invitations

2. **Pending Invitations**
   - Listed in InviteMemberModal for the inviter
   - Owner/admin can revoke before acceptance (sets `status = 'revoked'`)
   - Invitee sees pending invitations in their account (via `useMyInvitations`)

3. **Accept Invitation**
   - Invitee clicks "Accept" on their invitation
   - System updates invitation `status = 'accepted'`
   - System upserts to `group_members` with `role = 'member'`
   - Invitee now appears in the group's member list

4. **Edge Cases**
   - If invitee is already a member, invitation acceptance is graceful (upsert)
   - Revoked invitations cannot be accepted

## Join Request Flow (Open Groups Only)

1. **Request to Join**
   - User clicks "Join Group" button on an open group
   - System creates a `group_join_requests` record with `status = 'pending'`
   - User can optionally add a note to the owner/admin
   - Unique constraint prevents duplicate pending requests

2. **Pending Requests**
   - Listed in JoinRequestsPanel for owner/admin
   - Shows requester's display name and note
   - Owner/admin sees "Approve" and "Reject" buttons

3. **Approve Request**
   - Owner/admin clicks "Approve"
   - System updates request `status = 'approved'`
   - System inserts into `group_members` with `role = 'member'`
   - User now appears in the group's member list

4. **Reject Request**
   - Owner/admin clicks "Reject"
   - System updates request `status = 'rejected'`
   - User can submit a new request later

## Role Management

### Promote/Demote

- Only owners can change member roles
- Owners see a dropdown next to each member (except themselves)
- Can promote members to admin or demote admins to member
- Cannot promote a second owner (enforced by unique index and client validation)
- Cannot demote the only owner (enforced by client validation and RLS)

### Remove Member

- Owner/admin can remove any non-owner member
- Click "Remove" button next to member
- RLS policy prevents removing the last owner
- Removed members can re-join via invitation or request

### Leave Group

- Non-owners can leave any group they belong to
- Click "Leave Group" button at top of Members panel
- Owner cannot leave (must transfer ownership or delete group)

## Item Visibility

### Public Items

- `visibility = 'public'`
- Visible to all users (authenticated and unauthenticated)
- No entries in `item_visibility_groups`

### Group-Restricted Items

- `visibility = 'groups'`
- Only visible to members of specified groups
- Selected groups stored in `item_visibility_groups` table
- Item creator selects groups via multi-select in ItemForm
- Can publish to multiple groups simultaneously

### Creating/Editing Items

1. User fills out item details (title, description, condition, category, location)
2. "Who can see this?" section offers two options:
   - **Public**: Anyone can see this item
   - **Specific Groups**: Only members of selected groups

3. If "Specific Groups" is selected:
   - Multi-select checkbox list shows all user's groups
   - At least one group must be selected
   - System creates/updates `item_visibility_groups` entries on save

4. Edit mode pre-selects currently visible groups

## Database Schema

### Tables

- `groups`: Group metadata (name, description, owner_id, is_invite_only)
- `group_members`: Members and their roles (unique: owner per group)
- `group_invitations`: Pending/accepted/revoked invitations by email
- `group_join_requests`: Pending/approved/rejected join requests
- `item_visibility_groups`: Maps items to groups for restricted visibility

### Indexes

- `idx_group_members_user`: Fast member lookups by user
- `idx_group_invitations_group`: Fast invitation queries per group
- `idx_group_invitations_email`: Fast invitation lookups by email
- `idx_group_join_requests_group`: Fast join request queries per group
- `uq_group_single_owner`: Unique constraint on (group_id) where role='owner'

### RLS Policies

All tables use Row Level Security to enforce permissions:

- **groups**: Read by members, write by owner only
- **group_members**: Read by group members, write by owner/admin (with guards)
- **group_invitations**: Read by inviter/invitee/admins, write by owner/admin
- **group_join_requests**: Read by requester/owner/admin, write varies
- **profiles**: Read by authenticated users (for displaying names)

### Triggers

- `trg_groups_add_owner`: Automatically adds owner to `group_members` on group creation

## UI Components

### Groups Page (`/groups`)

- Lists all groups user belongs to
- Shows "Create Group" button at top
- Each group card displays:
  - Group name and "Invite only" badge (if applicable)
  - Group description
  - Edit button (owner only)
  - Invite Members button (owner/admin)
  - Join Group button or "Request Pending" badge (non-members, open groups only)
  - Join Requests panel (owner/admin, open groups only)
  - Members panel with role badges and management

### InviteMemberModal

- Email input for inviting new members
- "Send Invitation" button
- List of pending invitations with "Revoke" buttons
- Shown when owner/admin clicks "Invite Members"

### JoinRequestsPanel

- Only visible to owner/admin of open groups
- Lists pending join requests with requester names and notes
- "Approve" and "Reject" buttons for each request
- Auto-hides if no pending requests

### GroupMembersPanel

- Lists all group members with display names
- Shows role badges (Owner/Admin/Member)
- Owner sees role dropdown to promote/demote (except self)
- Owner sees "Remove" button for non-owner members
- Non-owners see "Leave Group" button at top

### GroupHeaderActions

- Conditionally renders based on user status:
  - Owner/admin: "Invite Members" button
  - Non-member + open group: "Join Group" button
  - Non-member + pending request: "Request Pending" badge
  - Non-member + invite-only: "Invite Only" badge

### ItemForm (`/items/new`, `/item/:id/edit`)

- Standard item fields (title, description, condition, category, location)
- "Who can see this?" section with radio buttons:
  - Public
  - Specific Groups (shows multi-select of user's groups)
- Validates at least one group selected if "Specific Groups" chosen
- Pre-loads existing visibility groups in edit mode

## API Hooks (React Query)

### Groups

- `useMyGroups()`: Fetch all groups user belongs to
- `useGroup(groupId)`: Fetch single group details
- `useGroupMembers(groupId)`: Fetch members with profiles
- `useCreateGroup()`: Create new group
- `useUpdateGroup(groupId)`: Update group metadata
- `useLeaveGroup(groupId)`: Leave group (non-owner)
- `useRemoveMember(groupId)`: Remove member (owner/admin)

### Invitations

- `useListInvitations(groupId)`: Fetch invitations for a group
- `useMyInvitations()`: Fetch user's pending invitations
- `useInviteMember(groupId)`: Send invitation by email
- `useAcceptInvitation(invitationId)`: Accept invitation and join group
- `useRevokeInvitation(invitationId)`: Revoke pending invitation

### Join Requests

- `useListJoinRequests(groupId)`: Fetch join requests for a group
- `useRequestToJoin(groupId)`: Submit join request (open groups)
- `useApproveJoinRequest(requestId)`: Approve request and add member
- `useRejectJoinRequest(requestId)`: Reject join request

### Role Management

- `useUpdateMemberRole(groupId)`: Change member's role (owner only)

### Items

- `useItemGroups(itemId)`: Fetch visibility groups for item
- `useCreateItem()`: Create item with visibility settings
- `useUpdateItem(itemId)`: Update item with visibility settings

## Security & Validation

### Database Level

- RLS policies enforce role-based permissions
- Unique indexes prevent duplicate owners
- Foreign key constraints maintain referential integrity
- `SECURITY DEFINER` trigger bypasses RLS for owner membership

### Client Level

- Validate exactly one owner per group before role changes
- Validate cannot remove/demote last owner
- Validate visibility="groups" requires at least one group
- Hide management UI from non-privileged users
- Use JWT email claims (fast, secure) for invitation matching

### Edge Cases Handled

- Duplicate pending invitations (unique constraint)
- Duplicate pending join requests (unique constraint)
- Accepting invitation when already a member (upsert)
- Removing last owner (blocked by RLS + client validation)
- Promoting second owner (blocked by unique index + client validation)
- Owner trying to leave (blocked by client logic)
- Non-owner trying to manage roles (hidden UI + blocked by RLS)

## Performance Considerations

- Separate queries for groups/members, client-side join (avoids PostgREST recursion)
- Separate queries for members/profiles, client-side join (avoids FK issues)
- Indexes on foreign keys for fast lookups
- JWT-based email checks (no auth.users subquery in policies)
- Query invalidation on mutations keeps cache fresh
- Conditional rendering reduces unnecessary queries

## Future Enhancements

- Transfer ownership to another member
- Delete group (owner only, cascade deletes members/invitations/requests)
- Invitation expiration (currently status='expired' exists but unused)
- Email notifications for invitations and join requests
- Group avatars/images
- Group activity feed
- Bulk invite via CSV
- Public group discovery page

