import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import Modal from './Modal';
import { Mail, Lock, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp: () => void;
}

const GoogleSignInButton: React.FC<{onSuccess: () => void, onError: (msg: string) => void}> = ({onSuccess, onError}) => (
    <button
      onClick={async () => {
        if (!auth || !googleProvider) {
          onError("Firebase is not configured. Authentication is disabled.");
          return;
        }
        try {
          await signInWithPopup(auth, googleProvider);
          onSuccess();
        } catch (error: any) {
          onError("Failed to sign in with Google. Please try again.");
        }
      }}
      className="w-full flex justify-center items-center gap-3 py-2.5 px-4 border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      <svg className="h-5 w-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.012,35.24,44,30.024,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
      <span>Sign in with Google</span>
    </button>
);


const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSwitchToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!auth) {
      setError("Firebase is not configured. Authentication is disabled.");
      setLoading(false);
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
    } catch (error: any) {
      setError(error.message.includes('auth/invalid-credential') ? 'Invalid email or password.' : 'Failed to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Login to OS_VLab">
      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
            <div className="flex items-center gap-2 bg-red-500/10 text-red-500 text-sm p-3 rounded-lg">
                <AlertCircle size={18} />
                <span>{error}</span>
            </div>
        )}
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark" size={20} />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-10 pr-3 py-2.5 border border-border-light dark:border-border-dark rounded-lg bg-transparent focus:ring-2 focus:ring-accent focus:outline-none"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark" size={20} />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full pl-10 pr-3 py-2.5 border border-border-light dark:border-border-dark rounded-lg bg-transparent focus:ring-2 focus:ring-accent focus:outline-none"
          />
        </div>
        <button type="submit" disabled={loading} className="w-full py-2.5 px-4 bg-accent text-white font-semibold rounded-lg hover:bg-accent-hover disabled:bg-accent/50 disabled:cursor-not-allowed transition-colors">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div className="relative my-6 flex items-center">
        <div className="flex-grow border-t border-border-light dark:border-border-dark"></div>
        <span className="flex-shrink mx-4 text-xs text-text-muted-light dark:text-text-muted-dark">OR</span>
        <div className="flex-grow border-t border-border-light dark:border-border-dark"></div>
      </div>
      <GoogleSignInButton onSuccess={onClose} onError={setError} />
      <p className="mt-6 text-center text-sm">
        Don't have an account?{' '}
        <button onClick={onSwitchToSignUp} className="font-semibold text-accent hover:underline">
          Sign Up
        </button>
      </p>
    </Modal>
  );
};

export default LoginModal;