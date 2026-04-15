const getRequiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

type OrganizationResponse = {
  id: string;
  name: string;
  description?: string | null;
};

type LogtoUserResponse = {
  id: string;
  primaryEmail?: string | null;
  name?: string | null;
};

let _tokenCache: { token: string; expiresAt: number } | null = null;

const getManagementToken = async () => {
  const now = Date.now();
  if (_tokenCache && _tokenCache.expiresAt > now) {
    return _tokenCache.token;
  }

  const endpoint = getRequiredEnv('LOGTO_ENDPOINT');
  const clientId = getRequiredEnv('LOGTO_M2M_APP_ID');
  const clientSecret = getRequiredEnv('LOGTO_M2M_APP_SECRET');
  const resource = process.env.LOGTO_MANAGEMENT_API_RESOURCE ?? 'https://admin.logto.app/api';

  const response = await fetch(`${endpoint}/oidc/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      resource,
      scope: 'all',
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch Logto management token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const token = data.access_token as string;
  const ttl = ((data.expires_in as number) ?? 3600) - 60;
  _tokenCache = { token, expiresAt: now + ttl * 1000 };
  return token;
};

const callManagementApi = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const endpoint = getRequiredEnv('LOGTO_ENDPOINT');
  const token = await getManagementToken();

  const response = await fetch(`${endpoint}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Logto management API error (${response.status}): ${errorText}`);
  }

  // Some endpoints return 201/204 with no JSON body (e.g. POST /organizations/:id/users → "Created")
  const contentType = response.headers.get('content-type') ?? '';
  if (response.status === 204 || !contentType.includes('application/json')) {
    return null as T;
  }

  return (await response.json()) as T;
};

export const verifyUserExists = async (userId: string): Promise<boolean> => {
  try {
    await callManagementApi<LogtoUserResponse>(`/api/users/${userId}`);
    return true;
  } catch {
    return false;
  }
};

export const inviteEmployeeToOrg = async (params: {
  email: string;
  firstName: string;
  lastName: string;
  orgId: string;
}): Promise<{ logtoUserId: string; tempPassword: string; alreadyExists: boolean }> => {
  // Try to find existing Logto user by email first
  let logtoUserId: string | null = null;
  let alreadyExists = false;

  try {
    const existing = await callManagementApi<LogtoUserResponse[]>(
      `/api/users?search=${encodeURIComponent(params.email)}&searchFields=primaryEmail&limit=1`
    );
    if (existing && existing.length > 0 && existing[0].primaryEmail === params.email) {
      logtoUserId = existing[0].id;
      alreadyExists = true;
    }
  } catch {
    // ignore search errors, will try to create
  }

  // Create user if they don't exist
  if (!logtoUserId) {
    const newUser = await callManagementApi<LogtoUserResponse>('/api/users', {
      method: 'POST',
      body: JSON.stringify({
        primaryEmail: params.email,
        name: `${params.firstName} ${params.lastName}`,
        username: params.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_') + '_' + Array.from(crypto.getRandomValues(new Uint8Array(3))).map(b => b.toString(16).padStart(2, '0')).join(''),
      }),
    });
    logtoUserId = newUser.id;
  }

  // Add user to org (idempotent — ignore if already member)
  try {
    await callManagementApi<null>(`/api/organizations/${params.orgId}/users`, {
      method: 'POST',
      body: JSON.stringify({ userIds: [logtoUserId] }),
    });
  } catch {
    // May already be a member — that's fine
  }

  // Assign 'employee' org role (look up role ID by name)
  try {
    const roles = await callManagementApi<Array<{ id: string; name: string }>>(
      `/api/organizations/${params.orgId}/roles`
    );
    const employeeRole = roles?.find((r) => r.name === 'employee');
    if (employeeRole) {
      await callManagementApi<null>(
        `/api/organizations/${params.orgId}/users/${logtoUserId}/roles`,
        {
          method: 'POST',
          body: JSON.stringify({ organizationRoleIds: [employeeRole.id] }),
        }
      );
    }
  } catch {
    // Role assignment failure is non-fatal
  }

  // Generate a temporary password
  const tempPassword = generateTempPassword();

  // Set the temporary password so the user can log in immediately
  await callManagementApi<null>(`/api/users/${logtoUserId}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ password: tempPassword }),
  });

  return { logtoUserId, tempPassword, alreadyExists };
};

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

export const createOrganizationWithMembership = async (params: {
  name: string;
  userId: string;
}) => {
  // Verify user exists before creating org (prevents orphaned orgs on stale sessions)
  const userExists = await verifyUserExists(params.userId);
  if (!userExists) {
    throw new Error('USER_NOT_FOUND');
  }

  const organization = await callManagementApi<OrganizationResponse>('/api/organizations', {
    method: 'POST',
    body: JSON.stringify({ name: params.name }),
  });

  try {
    await callManagementApi<null>(`/api/organizations/${organization.id}/users`, {
      method: 'POST',
      body: JSON.stringify({ userIds: [params.userId] }),
    });
  } catch (error) {
    // Clean up: delete the orphaned org
    await callManagementApi<null>(`/api/organizations/${organization.id}`, {
      method: 'DELETE',
    }).catch(() => {});
    throw error;
  }

  return organization;
};
