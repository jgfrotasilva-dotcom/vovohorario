import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { usuarios, auditoria } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession, hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const result = await db.select({
      id: usuarios.id,
      nome: usuarios.nome,
      email: usuarios.email,
      cpf: usuarios.cpf,
      perfil: usuarios.perfil,
      ativo: usuarios.ativo,
      criadoEm: usuarios.criadoEm,
    }).from(usuarios);

    return NextResponse.json({ usuarios: result });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ usuarios: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const data = await request.json();

    if (!data.nome || !data.email || !data.cpf || !data.senha || !data.perfil) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    const [existente] = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.email, data.email)).limit(1);
    if (existente) return NextResponse.json({ error: 'Já existe um usuário com este e-mail' }, { status: 400 });

    const senhaHash = await hashPassword(data.senha);

    const [usuario] = await db.insert(usuarios).values({
      nome: data.nome,
      email: data.email,
      cpf: data.cpf,
      senha: senhaHash,
      perfil: data.perfil,
      ativo: true,
    }).returning();

    await db.insert(auditoria).values({
      usuarioId: session.userId,
      acao: 'CRIAR',
      tabela: 'usuarios',
      registroId: usuario.id,
      dadosDepois: { ...usuario, senha: '***' } as any,
    });

    return NextResponse.json({ usuario: { ...usuario, senha: undefined } }, { status: 201 });
  } catch (error: any) {
    console.error('Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro ao criar usuário' }, { status: 500 });
  }
}
