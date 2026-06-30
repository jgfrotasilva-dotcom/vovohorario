'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  UserCircle, 
  Clock, 
  Calendar,
  FileText,
  Settings,
  LogOut,
  TrendingUp,
  Lock,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  perfil: string;
}

const menuItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    perfis: ['ADMINISTRADOR', 'RH', 'GESTOR', 'SECRETARIO'],
  },
  {
    label: 'Meu Ponto',
    icon: Clock,
    href: '/dashboard/meu-ponto',
    perfis: ['SERVIDOR'],
  },
  {
    label: 'Minha Senha',
    icon: Lock,
    href: '/dashboard/minha-senha',
    perfis: ['ADMINISTRADOR', 'RH', 'GESTOR', 'SECRETARIO', 'SERVIDOR'],
  },
  {
    label: 'Usuários',
    icon: Users,
    href: '/dashboard/usuarios',
    perfis: ['ADMINISTRADOR', 'RH'],
  },
  {
    label: 'Servidores',
    icon: UserCircle,
    href: '/dashboard/servidores',
    perfis: ['ADMINISTRADOR', 'RH', 'SECRETARIO'],
  },
  {
    label: 'Registro de Ponto',
    icon: Clock,
    href: '/dashboard/registro-ponto',
    perfis: ['ADMINISTRADOR', 'RH'],
  },
  {
    label: 'Ausências',
    icon: Calendar,
    href: '/dashboard/ausencias',
    perfis: ['ADMINISTRADOR', 'RH'],
  },
  {
    label: 'Banco de Horas',
    icon: TrendingUp,
    href: '/dashboard/banco-horas',
    perfis: ['ADMINISTRADOR', 'RH', 'GESTOR'],
  },
  {
    label: 'Relatórios',
    icon: ClipboardList,
    href: '/dashboard/relatorios',
    perfis: ['ADMINISTRADOR', 'RH', 'GESTOR'],
  },
  {
    label: 'Folha Ponto',
    icon: FileText,
    href: '/dashboard/folha-ponto',
    perfis: ['ADMINISTRADOR', 'RH', 'GESTOR'],
  },
  {
    label: 'Configurações',
    icon: Settings,
    href: '/dashboard/configuracoes',
    perfis: ['ADMINISTRADOR'],
  },
];

export function Sidebar({ perfil }: SidebarProps) {
  const pathname = usePathname();

  const filteredItems = menuItems.filter((item) =>
    item.perfis.includes(perfil)
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">Ponto</h1>
            <p className="text-xs text-gray-500">
              {perfil === 'SERVIDOR' ? 'Meu Registro' : 'Sistema de Gestão'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
