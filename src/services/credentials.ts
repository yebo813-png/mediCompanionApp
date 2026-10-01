export interface DemoCredential {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'demo';
  subscriptionStatus: 'active' | 'trial';
}

export const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    email: 'admin@mmmedi.com',
    password: 'Admin@2026',
    name: 'System Admin',
    role: 'admin',
    subscriptionStatus: 'active',
  },
  {
    email: 'demo@demo.com',
    password: 'mediCompanion',
    name: 'Dr. Thabo Ndlovu',
    role: 'demo',
    subscriptionStatus: 'trial',
  },
];

export function findCredential(email: string, password: string): DemoCredential | null {
  return DEMO_CREDENTIALS.find(
    (c) => c.email.toLowerCase() === email.toLowerCase() && c.password === password
  ) || null;
}
