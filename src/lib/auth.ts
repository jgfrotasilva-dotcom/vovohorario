import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro-aqui';

export interface JWTPayload {
  userId: string;
  email: string;
  perfil: string;
  nome: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}

export async function setSession(payload: JWTPayload): Promise<void> {
  const token = generateToken(payload);
  const cookieStore = await cookies();
  
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('token');
}

export function checkPermission(perfil: string, recurso: string, acao: string): boolean {
  // Administrador tem acesso total
  if (perfil === 'ADMINISTRADOR') {
    return true;
  }

  // RH tem acesso a quase tudo exceto configurações críticas
  if (perfil === 'RH') {
    if (recurso === 'usuarios' && acao === 'excluir') return false;
    if (recurso === 'configuracoes' && acao === 'atualizar') return false;
    return true;
  }

  // Gestor pode visualizar e criar relatórios
  if (perfil === 'GESTOR') {
    if (recurso === 'relatorios') return true;
    if (recurso === 'servidores' && acao === 'ler') return true;
    if (recurso === 'registros' && acao === 'ler') return true;
    return false;
  }

  // Secretário tem acesso limitado
  if (perfil === 'SECRETARIO') {
    if (recurso === 'servidores' && ['ler', 'criar', 'atualizar'].includes(acao)) return true;
    if (recurso === 'registros' && acao === 'ler') return true;
    return false;
  }

  // Servidor só pode ver seus próprios dados
  if (perfil === 'SERVIDOR') {
    if (recurso === 'meu-ponto') return true;
    return false;
  }

  return false;
}
