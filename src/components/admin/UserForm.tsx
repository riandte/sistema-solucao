import { useState } from 'react';
import { User, Role } from '@/lib/types';

interface UserFormProps {
  initialData?: Partial<User>;
  roles: Role[];
  onSubmit: (data: Partial<User>) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export default function UserForm({ initialData, roles, onSubmit, onCancel, isEditing = false }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    // Login logic: for now login is same as email or separate? 
    // Types.ts doesn't strictly have 'login', uses 'email' often or 'id'.
    // Prompt says "Email / Login". I will use email as login.
    password: '',
    role: initialData?.roles?.[0] || '', // Simple single role selection for MVP
    active: initialData?.active ?? true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.name || !formData.email || !formData.role) {
        throw new Error('Preencha os campos obrigatórios.');
      }
      if (!isEditing && !formData.password) {
        throw new Error('Senha é obrigatória para novos usuários.');
      }

      await onSubmit({
        ...formData,
        roles: [formData.role] // Wrap in array
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: João Silva"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Email / Login</label>
          <input
            type="email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="usuario@empresa.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            {isEditing ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="********"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Papel (Função)</label>
          <select
            value={formData.role}
            onChange={e => setFormData({ ...formData, role: e.target.value })}
            className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione...</option>
            {roles.map(role => (
              <option key={role.name} value={role.name}>{role.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="active"
            checked={formData.active}
            onChange={e => setFormData({ ...formData, active: e.target.checked })}
            className="w-5 h-5 rounded bg-gray-900 border-white/10 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
          />
          <label htmlFor="active" className="text-sm text-gray-300 select-none cursor-pointer">
            Usuário Ativo
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
        </button>
      </div>
    </form>
  );
}
