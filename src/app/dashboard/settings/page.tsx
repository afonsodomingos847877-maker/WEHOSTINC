'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User as UserIcon, Lock, Bell, Shield, Key, Camera, Upload, BellOff, RefreshCw, ShoppingBag
} from 'lucide-react';
import { auth, User } from '@/lib/auth';
import { useAuth } from '@/lib/useAuth';
import DashboardNav from '@/components/DashboardNav';
import DashboardSidebar from '@/components/DashboardSidebar';
import PageLoader from '@/components/PageLoader';
import ConfirmModal from '@/components/ConfirmModal';
import ReauthenticationModal from '@/components/ReauthenticationModal';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { soundEffects } from '@/lib/soundEffects';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState(false);
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [reauthAction, setReauthAction] = useState<'password' | 'delete_account' | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  
  const {
    permission,
    subscription,
    requestPermission,
    unsubscribe,
    isSupported
  } = usePushNotifications();

  useEffect(() => {
    if (user && !loading) {
      setName(user.name);
      setEmail(user.email);
      setBirthdate(user.birthdate || '');
    }
  }, [user, loading]);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      // Update user data in localStorage
      const userData = JSON.parse(localStorage.getItem(`user_${user.id}`) || '{}');
      userData.name = name;
      userData.email = email;
      userData.birthdate = birthdate || null;
      localStorage.setItem(`user_${user.id}`, JSON.stringify(userData));

      // Update session
      const session = localStorage.getItem('wehosthere_auth');
      if (session) {
        const parsed = JSON.parse(session);
        parsed.user.name = name;
        parsed.user.email = email;
        parsed.user.birthdate = birthdate || null;
        localStorage.setItem('wehosthere_auth', JSON.stringify(parsed));
      }

      // Sincronizar com o servidor MongoDB
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          user: {
            id: user.id,
            email: email,
            name: name,
            birthdate: birthdate || null,
          }
        })
      }).catch(err => console.warn('[Settings] Erro ao sincronizar birthdate no servidor:', err));

      showMessage('Perfil atualizado com sucesso!', 'success');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      showMessage('Por favor, selecione apenas imagens (JPG, PNG, etc.)', 'error');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('A imagem não pode ter mais de 5MB', 'error');
      return;
    }

    soundEffects.playAttachSound();
    setAvatarUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          // Atualizar avatar no usuário
          auth.updateUserAvatar(user.id, data.url);
          showMessage('Foto de perfil atualizada com sucesso!', 'success');
        }
      } else {
        showMessage('Erro ao fazer upload da imagem', 'error');
      }
    } catch (err) {
      console.error('Erro no upload:', err);
      showMessage('Erro ao fazer upload da imagem', 'error');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showMessage('As senhas não coincidem', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showMessage('A senha deve ter pelo menos 6 caracteres', 'error');
      return;
    }

    if (user) {
      const userData = JSON.parse(localStorage.getItem(`user_${user.id}`) || '{}');
      
      if (userData.password !== currentPassword) {
        showMessage('Senha atual incorreta', 'error');
        return;
      }

      // Requer Reautenticação via código de 6 dígitos
      setReauthAction('password');
      setShowReauthModal(true);
    }
  };

  const handleReauthSuccess = () => {
    if (reauthAction === 'password') {
      if (user) {
        const userData = JSON.parse(localStorage.getItem(`user_${user.id}`) || '{}');
        userData.password = newPassword;
        localStorage.setItem(`user_${user.id}`, JSON.stringify(userData));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showMessage('Senha atualizada com sucesso!', 'success');
      }
    } else if (reauthAction === 'delete_account') {
      if (user) {
        auth.deleteUser(user.id, user.email);
        auth.logout();
        router.push('/');
      }
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    if (type === 'success') {
      soundEffects.playSuccessSound();
    } else {
      soundEffects.playErrorSound();
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const testPushNotification = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        showMessage('User ID não encontrado', 'error');
        return;
      }

      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: '🔔 Teste de Notificação',
          message: 'Se você recebeu esta notificação, o sistema push está funcionando!'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('Notificação de teste enviada! Verifique seu dispositivo.', 'success');
      } else {
        showMessage('Erro ao enviar notificação: ' + data.error, 'error');
      }
    } catch (err) {
      showMessage('Erro ao enviar notificação de teste', 'error');
      console.error(err);
    }
  };

  const simulatePayment = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        showMessage('User ID não encontrado', 'error');
        return;
      }

      const amount = prompt('Valor do pagamento (MZN):', '5000');
      if (!amount) return;

      const planName = prompt('Nome do plano:', 'Plano Pro');
      if (!planName) return;

      const response = await fetch('/api/test/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: parseInt(amount),
          planName
        })
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage(`Pagamento simulado com sucesso! Pedido: ${data.simulationDetails.orderNumber}`, 'success');
      } else {
        showMessage('Erro ao simular pagamento: ' + data.error, 'error');
      }
    } catch (err) {
      showMessage('Erro ao simular pagamento', 'error');
      console.error(err);
    }
  };

  if (loading) {
    return <PageLoader text="A carregar as suas configurações..." />;
  }

  if (!user) return null;

  const handleLogout = () => {
    auth.logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Responsivo */}
      <DashboardNav userName={user.name} userAvatar={user.avatar} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <DashboardSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {message && (
              <div className={`p-4 rounded-lg ${
                messageType === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {message}
              </div>
            )}

            {/* Profile Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <UserIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Perfil</h2>
                  <p className="text-gray-600">Atualize suas informações pessoais</p>
                </div>
              </div>

              {/* Avatar Upload Section */}
              <div className="mb-6 flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  {avatarUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Upload className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold">
                    <Camera className="h-4 w-4" />
                    <span>Alterar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={avatarUploading}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">JPG, PNG ou GIF. Máximo 5MB</p>
                </div>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                    <span>Data de Nascimento 🎂</span>
                    <span className="text-xs text-primary-600 font-normal">Para felicitações e ofertas</span>
                  </label>
                  <input
                    id="birthdate"
                    type="date"
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">A WEHOSTHERE envia felicitações e benefícios exclusivos no seu aniversário!</p>
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
                >
                  Salvar Alterações
                </button>
              </form>
            </div>

            {/* Password Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <Lock className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Senha</h2>
                  <p className="text-gray-600">Alterar sua senha de acesso</p>
                </div>
              </div>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Senha Atual
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Nova Senha
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nova Senha
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
                >
                  Atualizar Senha
                </button>
              </form>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Bell className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Notificações Push</h2>
                  <p className="text-gray-600">Receba notificações no seu dispositivo mesmo com a plataforma fechada</p>
                </div>
              </div>
              
              {isSupported ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Status das Notificações</p>
                      <p className="text-sm text-gray-600">
                        {subscription ? 'Ativado' : 'Desativado'}
                      </p>
                    </div>
                    <button
                      onClick={subscription ? unsubscribe : requestPermission}
                      className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition font-semibold ${
                        subscription 
                          ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200' 
                          : 'bg-emerald-500 text-white hover:bg-emerald-600 border border-emerald-600 shadow-md'
                      }`}
                    >
                      {subscription ? (
                        <>
                          <BellOff className="h-4 w-4" />
                          <span>Desativar</span>
                        </>
                      ) : (
                        <>
                          <Bell className="h-4 w-4" />
                          <span>Ativar</span>
                        </>
                      )}
                    </button>
                  </div>

                  {subscription && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={testPushNotification}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg transition"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Testar Push</span>
                      </button>
                      <button
                        onClick={simulatePayment}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg transition"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        <span>Simular Pagamento</span>
                      </button>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Como funciona:</strong> As notificações push aparecem no seu dispositivo mesmo com a plataforma fechada, similar ao Utmify e outras grandes plataformas.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Seu navegador não suporta notificações push. Por favor, use um navegador moderno como Chrome, Firefox ou Safari.
                  </p>
                </div>
              )}
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <Shield className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Informações da Conta</h2>
                  <p className="text-gray-600">Detalhes da sua conta</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">ID da Conta</p>
                    <p className="font-semibold text-gray-900">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Plano</p>
                    <p className="font-semibold text-gray-900 capitalize">{user.plan}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Membro desde</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-semibold text-green-600">Ativo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-red-100 p-3 rounded-lg">
                  <Key className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-900">Zona de Perigo</h2>
                  <p className="text-red-700">Ações irreversíveis</p>
                </div>
              </div>
              <div className="space-y-4">
                <button
                  onClick={() => { setReauthAction('delete_account'); setShowReauthModal(true); }}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold cursor-pointer"
                >
                  Excluir Conta Permanentemente
                </button>
                <p className="text-sm text-red-700">
                  Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente removidos.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Confirm Modal Excluir Conta */}
      <ConfirmModal
        isOpen={deleteAccountConfirm}
        title="Excluir Conta Permanentemente"
        message="Tem certeza que deseja ELIMINAR permanentemente a sua conta? Todos os seus dados (sites, emails, faturas) serão removidos e esta ação NÃO pode ser desfeita."
        confirmText="Sim, Eliminar Minha Conta"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={() => {
          if (user) {
            auth.deleteUser(user.id, user.email);
            auth.logout();
            router.push('/');
          }
        }}
        onCancel={() => setDeleteAccountConfirm(false)}
      />
      {/* Modal de Reautenticação para Ações Sensíveis */}
      <ReauthenticationModal
        isOpen={showReauthModal}
        onClose={() => setShowReauthModal(false)}
        userEmail={user?.email || ''}
        onSuccess={handleReauthSuccess}
        title="Reauthenticate"
        actionDescription={
          reauthAction === 'delete_account'
            ? 'Para confirmar a exclusão definitiva da sua conta e de todos os serviços, insira o código enviado para '
            : 'Para autorizar a atualização da sua senha de acesso, insira o código enviado para '
        }
        lang="pt"
      />
    </div>
  );
}
