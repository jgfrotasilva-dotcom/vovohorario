import { db } from './index';
import { usuarios } from './schema';
import { hashPassword } from '@/lib/auth';

async function seedAdmin() {
  console.log('🌱 Criando usuário administrador...');

  try {
    const senhaHash = await hashPassword('admin123');
    
    await db.insert(usuarios).values({
      nome: 'Administrador',
      cpf: '00000000000',
      email: 'admin@sistema.com',
      senha: senhaHash,
      perfil: 'ADMINISTRADOR',
      ativo: true,
    });

    console.log('✅ Usuário administrador criado com sucesso!');
    console.log('\n📝 Credenciais de acesso:');
    console.log('Email: admin@sistema.com');
    console.log('Senha: admin123');
    
  } catch (error) {
    console.error('❌ Erro ao criar administrador:', error);
    throw error;
  }
}

seedAdmin()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
