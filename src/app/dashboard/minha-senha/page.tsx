'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Loader2, CheckCircle, AlertCircle, X, Eye, EyeOff } from 'lucide-react';

export default function MinhaSenhaPage() {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showSenha, setShowSenha] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (novaSenha !== confirmarSenha) {
      setToast({ type: 'error', message: 'As senhas não coincidem!' });
      return;
    }

    if (novaSenha.length < 6) {
      setToast({ type: 'error', message: 'A nova senha deve ter no mínimo 6 caracteres!' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao alterar senha');
      }

      setToast({ type: 'success', message: 'Senha alterada com sucesso!' });
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (error: any) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Alterar Senha</h1>
        <p className="text-gray-600 mt-1">Mantenha sua conta segura</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Nova Senha
          </CardTitle>
          <CardDescription>
            Digite sua senha atual e a nova senha desejada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="senhaAtual">Senha Atual *</Label>
              <div className="relative">
                <Input
                  id="senhaAtual"
                  type={showSenha ? 'text' : 'password'}
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  required
                  placeholder="Digite sua senha atual"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="novaSenha">Nova Senha *</Label>
              <div className="relative">
                <Input
                  id="novaSenha"
                  type={showSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirmarSenha">Confirmar Nova Senha *</Label>
              <div className="relative">
                <Input
                  id="confirmarSenha"
                  type={showSenha ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Repita a nova senha"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showSenha ? 'Ocultar senhas' : 'Mostrar senhas'}
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Alterando...</>
              ) : (
                <><Lock className="mr-2 h-4 w-4" /> Alterar Senha</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Dicas de Segurança:</h3>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>Use no mínimo 6 caracteres</li>
            <li>Combine letras, números e símbolos</li>
            <li>Não use dados pessoais (CPF, nome, data de nascimento)</li>
            <li>Altere sua senha regularmente</li>
            <li>Não compartilhe sua senha com outros</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
