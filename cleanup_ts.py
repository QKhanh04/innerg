import os

files_to_delete = [
    r'web\src\components\hr\invitations\BulkInviteModal.tsx',
    r'web\src\components\hr\invitations\InvitationActionMenu.tsx',
    r'web\src\components\hr\invitations\InvitationFilters.tsx',
    r'web\src\components\hr\invitations\InvitationTable.tsx',
    r'web\src\components\hr\invitations\SingleInviteModal.tsx',
    r'web\src\components\members\EditMemberModal.tsx',
    r'web\src\components\members\MemberActionMenu.tsx',
    r'web\src\components\members\MemberDetailDrawer.tsx',
    r'web\src\components\members\MemberTable.tsx',
    r'web\src\layouts\Header.tsx',
    r'web\src\layouts\Sidebar.tsx',
    r'web\src\lib\RoleContext.tsx',
    r'web\src\pages\hr\AnalyticsPage\AnalyticsPage.tsx',
    r'web\src\pages\hr\DepartmentsPage\DepartmentsPage.tsx',
    r'web\src\pages\hr\HrWishlistsPage\HrWishlistsPage.tsx',
    r'web\src\pages\hr\HrWishlistsPage\InternalMentorModal.tsx',
    r'web\src\pages\hr\MembersPage\MembersPage.tsx',
    r'web\src\pages\hr\ModerationPage\ModerationPage.tsx',
    r'web\src\pages\hr\NotificationsPage\NotificationsPage.tsx',
    r'web\src\pages\hr\invitations\InvitationsPage.tsx',
    r'web\src\api\hrApi.ts',
    r'web\src\api\invitationsApi.ts',
    r'web\src\api\memberApi.ts',
    r'web\src\hooks\hr\useBulkInvite.ts',
    r'web\src\hooks\hr\useHrAnalytics.ts',
    r'web\src\hooks\hr\useInvitationActions.ts',
    r'web\src\hooks\hr\useInvitations.ts',
    r'web\src\hooks\useMemberActions.ts',
    r'web\src\hooks\useMemberDetail.ts',
    r'web\src\hooks\useMembers.ts',
    r'web\src\lib\utils.ts',
    r'web\src\types\invitation.types.ts'
]

base_path = r'c:\Users\ACER\Desktop\Ky 8\EXE102\innerg'

for f in files_to_delete:
    full_path = os.path.join(base_path, f)
    if os.path.exists(full_path):
        try:
            os.remove(full_path)
            print(f"Deleted: {f}")
        except Exception as e:
            print(f"Error deleting {f}: {e}")
    else:
        print(f"Not found: {f}")
