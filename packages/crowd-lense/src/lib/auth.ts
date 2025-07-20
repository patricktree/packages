import assert from 'assert';
import type { NextRequest } from 'next/server';

export async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.split(' ')[1];
  if (!base64Credentials) {
    return false;
  }

  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  if (!username || !password) {
    return false;
  }

  return verifyCredentials(username, password);
}

async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  assert(adminUsername, 'ADMIN_USERNAME must be set');
  assert(adminPassword, 'ADMIN_PASSWORD must be set');

  return username === adminUsername && password === adminPassword;
}
