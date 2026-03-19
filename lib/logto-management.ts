const getRequiredEnv = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

type OrganizationResponse = {
  id: string;
  name: string;
  description?: string | null;
};

const getManagementToken = async () => {
  const endpoint = getRequiredEnv('LOGTO_ENDPOINT');
  const clientId = getRequiredEnv('LOGTO_M2M_APP_ID');
  const clientSecret = getRequiredEnv('LOGTO_M2M_APP_SECRET');
  const resource = process.env.LOGTO_MANAGEMENT_API_RESOURCE ?? 'https://admin.logto.app/api';

  const response = await fetch(`${endpoint}/oidc/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
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
    throw new Error(`Failed to fetch Logto management token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token as string;
};

const callManagementApi = async <T>(path: string, init?: RequestInit) => {
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

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
};

export const createOrganizationWithMembership = async (params: {
  name: string;
  userId: string;
}) => {
  const organization = await callManagementApi<OrganizationResponse>('/api/organizations', {
    method: 'POST',
    body: JSON.stringify({
      name: params.name,
    }),
  });

  await callManagementApi<null>(`/api/organizations/${organization.id}/users`, {
    method: 'POST',
    body: JSON.stringify({
      userIds: [params.userId],
    }),
  });

  return organization;
};
