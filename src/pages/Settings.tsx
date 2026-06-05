import {
  Bell,
  Lock,
  Moon,
  Sun,
  Save,
  ChevronRight,
  Shield,
  Users,
  Info,
  Mail,
  User as UserIcon,
  LogOut,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser,
  signOut,
} from 'firebase/auth';
import {
  collection,
  getDocs,
  query,
  where,
  setDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { auth } from '../firebase';
import { getFirestore } from 'firebase/firestore';

const db = getFirestore();

interface UserProfile {
  name: string;
  email: string;
  role: 'Administrator' | 'AM Revenue' | 'BM' | 'Operator';
  lastLogin: string;
  profilePicture?: string;
}

interface NotificationSettings {
  revenueAlerts: boolean;
  loadFactorAlerts: boolean;
  schemeAlerts: boolean;
  emailNotifications: boolean;
}

interface UserPreferences {
  theme: 'dark' | 'light';
  defaultBusType: 'Ordinary' | 'AC' | 'All';
  defaultView: 'Executive' | 'Operations' | 'Depot Performance';
}

interface NotificationMessage {
  type: 'success' | 'error';
  message: string;
}

function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    role: 'Operator',
    lastLogin: 'Never',
  });
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({});
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [notifications, setNotifications] = useState<NotificationSettings>({
    revenueAlerts: true,
    loadFactorAlerts: true,
    schemeAlerts: true,
    emailNotifications: true,
  });
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'dark',
    defaultBusType: 'All',
    defaultView: 'Executive',
  });
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [notification, setNotification] = useState<NotificationMessage | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [addingUser, setAddingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'Operator' as const,
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setProfile({
          name: currentUser.displayName || 'User',
          email: currentUser.email || '',
          role: 'Operator',
          lastLogin: new Intl.DateTimeFormat('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(new Date()),
        });
        setProfileForm({
          name: currentUser.displayName || '',
          email: currentUser.email || '',
        });

        // Load user preferences from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.preferences) {
              setPreferences(data.preferences);
              setTheme(data.preferences.theme);
            }
            if (data.notifications) {
              setNotifications(data.notifications);
            }
            if (data.profile) {
              setProfile((prev) => ({ ...prev, ...data.profile }));
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    });

    return unsubscribe;
  }, []);

  const loadUsers = async () => {
    if (profile.role !== 'Administrator') return;
    try {
      const usersCollection = collection(db, 'users');
      const snapshot = await getDocs(usersCollection);
      setUsers(
        snapshot.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        }))
      );
    } catch (error) {
      console.error('Error loading users:', error);
      showNotification('error', 'Failed to load users');
    }
  };

  useEffect(() => {
    if (profile.role === 'Administrator') {
      loadUsers();
    }
  }, [profile.role]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleProfileEdit = () => {
    setProfileEditing(!profileEditing);
    if (!profileEditing) {
      setProfileForm({
        name: profile.name,
        email: profile.email,
      });
    }
  };

  const handleProfileSave = async () => {
    if (!user) return;
    try {
      // Update profile in Firestore
      await setDoc(
        doc(db, 'users', user.uid),
        {
          profile: {
            name: profileForm.name,
            email: profileForm.email,
            role: profile.role,
          },
        },
        { merge: true }
      );

      setProfile((prev) => ({
        ...prev,
        name: profileForm.name || prev.name,
        email: profileForm.email || prev.email,
      }));

      setProfileEditing(false);
      showNotification('success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      showNotification('error', 'Failed to save profile');
    }
  };

  const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user || !user.email) {
      showNotification('error', 'User not found');
      return;
    }

    if (passwordForm.new !== passwordForm.confirm) {
      showNotification('error', 'Passwords do not match');
      return;
    }

    if (passwordForm.new.length < 6) {
      showNotification('error', 'New password must be at least 6 characters');
      return;
    }

    if (!passwordForm.current) {
      showNotification('error', 'Please enter your current password');
      return;
    }

    setPasswordChanging(true);

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, passwordForm.current);
      await reauthenticateWithCredential(user, credential);

      // Update password in Firebase
      await updatePassword(user, passwordForm.new);

      // Clear the form
      setPasswordForm({ current: '', new: '', confirm: '' });
      
      // Show success notification
      showNotification('success', 'Password changed successfully! Signing out for security...');

      // Wait a moment to show the notification, then sign out and redirect
      setTimeout(async () => {
        try {
          // Sign out the user
          await signOut(auth);
          
          // Redirect to login page
          navigate('/login');
        } catch (signOutError) {
          console.error('Error signing out:', signOutError);
          // Still redirect even if sign-out fails
          navigate('/login');
        }
      }, 1500);
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        showNotification('error', 'Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        showNotification('error', 'Password is too weak');
      } else if (error.code === 'auth/requires-recent-login') {
        showNotification('error', 'Please sign out and sign in again before changing password');
      } else {
        showNotification('error', 'Failed to change password. Please try again.');
      }
    } finally {
      setPasswordChanging(false);
    }
  };

  const handleNotificationChange = async (key: keyof NotificationSettings) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);

    if (!user) return;
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        { notifications: updated },
        { merge: true }
      );
      showNotification('success', 'Notification settings updated');
    } catch (error) {
      console.error('Error updating notifications:', error);
      showNotification('error', 'Failed to update settings');
    }
  };

  const handlePreferencesChange = async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);

    if (key === 'theme') {
      setTheme(value as 'dark' | 'light');
    }

    if (!user) return;
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        { preferences: updated },
        { merge: true }
      );
      showNotification('success', 'Preferences saved');
    } catch (error) {
      console.error('Error saving preferences:', error);
      showNotification('error', 'Failed to save preferences');
    }
  };

  const handleAddUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (profile.role !== 'Administrator') {
      showNotification('error', 'Only administrators can add users');
      return;
    }

    try {
      await setDoc(doc(db, 'users', newUserForm.email.split('@')[0]), {
        profile: {
          name: newUserForm.name,
          email: newUserForm.email,
          role: newUserForm.role,
        },
        createdAt: new Date(),
        status: 'active',
      });

      setNewUserForm({ name: '', email: '', role: 'Operator' });
      setAddingUser(false);
      showNotification('success', 'User added successfully');
      loadUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      showNotification('error', 'Failed to add user');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#E2E8F0] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#E2E8F0]">Settings</h1>
          <p className="mt-2 text-[#94A3B8]">Manage your profile, preferences, and account security</p>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-lg border px-4 py-3 ${
              notification.type === 'success'
                ? 'border-emerald-900/60 bg-emerald-950/40 text-emerald-200'
                : 'border-rose-900/60 bg-rose-950/40 text-rose-200'
            }`}
          >
            {notification.type === 'success' ? (
              <Check size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            {notification.message}
          </div>
        )}

        {/* Settings Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* User Profile Section */}
            <section className="rounded-lg border border-[#1E293B] bg-[#111827] p-6 shadow-lg">
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#0EA5E9] text-[#0B1220]">
                  <UserIcon size={20} />
                </div>
                <h2 className="text-lg font-bold">User Profile</h2>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                      Full Name
                    </label>
                    {profileEditing ? (
                      <input
                        type="text"
                        value={profileForm.name || ''}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="w-full rounded-lg border border-[#1E293B] bg-[#0F172A] px-3 py-2 text-[#E2E8F0] focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 outline-none transition"
                      />
                    ) : (
                      <p className="text-[#E2E8F0]">{profile.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                      Email Address
                    </label>
                    {profileEditing ? (
                      <input
                        type="email"
                        value={profileForm.email || ''}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, email: e.target.value }))
                        }
                        className="w-full rounded-lg border border-[#1E293B] bg-[#0F172A] px-3 py-2 text-[#E2E8F0] focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 outline-none transition"
                      />
                    ) : (
                      <p className="text-[#E2E8F0]">{profile.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                      Role
                    </label>
                    <p className="inline-flex items-center gap-2 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 px-3 py-1 text-sm font-semibold text-[#0EA5E9]">
                      {profile.role}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                      Last Login
                    </label>
                    <p className="text-[#E2E8F0]">{profile.lastLogin}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  {profileEditing ? (
                    <>
                      <button
                        onClick={handleProfileSave}
                        className="flex items-center gap-2 rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-semibold text-[#0B1220] hover:bg-[#0891b2] transition"
                      >
                        <Save size={16} /> Save Changes
                      </button>
                      <button
                        onClick={() => setProfileEditing(false)}
                        className="flex items-center gap-2 rounded-lg border border-[#1E293B] bg-[#0F172A] px-4 py-2 text-sm font-semibold text-[#E2E8F0] hover:bg-[#11203b] transition"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleProfileEdit}
                      className="flex items-center gap-2 rounded-lg border border-[#1E293B] bg-[#0F172A] px-4 py-2 text-sm font-semibold text-[#E2E8F0] hover:bg-[#11203b] transition"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Appearance Section */}
            <section className="rounded-lg border border-[#1E293B] bg-[#111827] p-6 shadow-lg">
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#0EA5E9] text-[#0B1220]">
                  <Sun size={20} />
                </div>
                <h2 className="text-lg font-bold">Appearance</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#94A3B8] mb-3">
                    Theme
                  </label>
                  <div className="flex gap-3">
                    {(['dark', 'light'] as const).map((themeOption) => (
                      <button
                        key={themeOption}
                        onClick={() => handlePreferencesChange('theme', themeOption)}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 transition ${
                          preferences.theme === themeOption
                            ? 'bg-[#0EA5E9] text-[#0B1220]'
                            : 'border border-[#1E293B] bg-[#0F172A] text-[#E2E8F0] hover:bg-[#11203b]'
                        }`}
                      >
                        {themeOption === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                        {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)} Mode
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#94A3B8] mb-3">
                    Default Bus Type
                  </label>
                  <select
                    value={preferences.defaultBusType}
                    onChange={(e) =>
                      handlePreferencesChange(
                        'defaultBusType',
                        e.target.value as 'Ordinary' | 'AC' | 'All'
                      )
                    }
                    className="w-full rounded-lg border border-[#1E293B] bg-[#0F172A] px-4 py-2 text-[#E2E8F0] focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 outline-none transition"
                  >
                    <option value="Ordinary">Ordinary</option>
                    <option value="AC">AC</option>
                    <option value="All">All</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#94A3B8] mb-3">
                    Default Dashboard View
                  </label>
                  <select
                    value={preferences.defaultView}
                    onChange={(e) =>
                      handlePreferencesChange(
                        'defaultView',
                        e.target.value as 'Executive' | 'Operations' | 'Depot Performance'
                      )
                    }
                    className="w-full rounded-lg border border-[#1E293B] bg-[#0F172A] px-4 py-2 text-[#E2E8F0] focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 outline-none transition"
                  >
                    <option value="Executive">Executive</option>
                    <option value="Operations">Operations</option>
                    <option value="Depot Performance">Depot Performance</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Notifications Section */}
            <section className="rounded-lg border border-[#1E293B] bg-[#111827] p-6 shadow-lg">
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#0EA5E9] text-[#0B1220]">
                  <Bell size={20} />
                </div>
                <h2 className="text-lg font-bold">Notifications</h2>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'revenueAlerts', label: 'Revenue Alerts', description: 'Get notified of significant revenue changes' },
                  { key: 'loadFactorAlerts', label: 'Load Factor Alerts', description: 'Alerts when load factor exceeds thresholds' },
                  { key: 'schemeAlerts', label: 'Govt Scheme Alerts', description: 'Updates on government reimbursement scheme' },
                  { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive updates via email' },
                ].map(({ key, label, description }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-[#1E293B] bg-[#0F172A] p-4 hover:border-[#0EA5E9]/30 transition"
                  >
                    <div>
                      <p className="font-semibold text-[#E2E8F0]">{label}</p>
                      <p className="text-sm text-[#94A3B8]">{description}</p>
                    </div>
                    <button
                      onClick={() =>
                        handleNotificationChange(key as keyof NotificationSettings)
                      }
                      className={`relative h-6 w-11 rounded-full transition ${
                        notifications[key as keyof NotificationSettings]
                          ? 'bg-[#22C55E]'
                          : 'bg-[#1E293B]'
                      }`}
                    >
                      <div
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                          notifications[key as keyof NotificationSettings]
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Security Section */}
            <section className="rounded-lg border border-[#1E293B] bg-[#111827] p-6 shadow-lg">
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#0EA5E9] text-[#0B1220]">
                  <Lock size={20} />
                </div>
                <h2 className="text-lg font-bold">Security</h2>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.current}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({ ...prev, current: e.target.value }))
                      }
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0F172A] px-4 py-2 pr-10 text-[#E2E8F0] focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 outline-none transition"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          current: !prev.current,
                        }))
                      }
                      className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#E2E8F0]"
                    >
                      {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.new}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({ ...prev, new: e.target.value }))
                      }
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0F172A] px-4 py-2 pr-10 text-[#E2E8F0] focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 outline-none transition"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          new: !prev.new,
                        }))
                      }
                      className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#E2E8F0]"
                    >
                      {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirm}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({ ...prev, confirm: e.target.value }))
                      }
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0F172A] px-4 py-2 pr-10 text-[#E2E8F0] focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 outline-none transition"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          confirm: !prev.confirm,
                        }))
                      }
                      className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#E2E8F0]"
                    >
                      {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={passwordChanging}
                  className="w-full rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-semibold text-[#0B1220] hover:bg-[#0891b2] disabled:opacity-60 transition"
                >
                  {passwordChanging ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </section>

            {/* Admin: User Management */}
            {profile.role === 'Administrator' && (
              <section className="rounded-lg border border-[#1E293B] bg-[#111827] p-6 shadow-lg">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#0EA5E9] text-[#0B1220]">
                      <Users size={20} />
                    </div>
                    <h2 className="text-lg font-bold">User Management</h2>
                  </div>
                  <button
                    onClick={() => setAddingUser(!addingUser)}
                    className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-semibold text-[#0B1220] hover:bg-[#0891b2] transition"
                  >
                    + Add User
                  </button>
                </div>

                {addingUser && (
                  <form onSubmit={handleAddUser} className="mb-6 space-y-4 rounded-lg border border-[#0EA5E9]/30 bg-[#0F172A] p-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newUserForm.name}
                        onChange={(e) =>
                          setNewUserForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="w-full rounded-lg border border-[#1E293B] bg-[#0B1220] px-3 py-2 text-[#E2E8F0] focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 outline-none transition"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={newUserForm.email}
                        onChange={(e) =>
                          setNewUserForm((prev) => ({ ...prev, email: e.target.value }))
                        }
                        className="w-full rounded-lg border border-[#1E293B] bg-[#0B1220] px-3 py-2 text-[#E2E8F0] focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 outline-none transition"
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#94A3B8] mb-2">
                        Role
                      </label>
                      <select
                        value={newUserForm.role}
                        onChange={(e) =>
                          setNewUserForm((prev) => ({
                            ...prev,
                            role: e.target.value as any,
                          }))
                        }
                        className="w-full rounded-lg border border-[#1E293B] bg-[#0B1220] px-3 py-2 text-[#E2E8F0] focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 outline-none transition"
                      >
                        <option value="Administrator">Administrator</option>
                        <option value="AM Revenue">AM Revenue</option>
                        <option value="BM">BM</option>
                        <option value="Operator">Operator</option>
                      </select>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="flex-1 rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-semibold text-[#0B1220] hover:bg-[#16a34a] transition"
                      >
                        Add User
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddingUser(false)}
                        className="flex-1 rounded-lg border border-[#1E293B] bg-[#0B1220] px-4 py-2 text-sm font-semibold text-[#E2E8F0] hover:bg-[#0F172A] transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {users.map((u) => (
                    <div
                      key={u.uid}
                      className="flex items-center justify-between rounded-lg border border-[#1E293B] bg-[#0F172A] p-4 hover:border-[#0EA5E9]/30 transition"
                    >
                      <div>
                        <p className="font-semibold text-[#E2E8F0]">
                          {u.profile?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-[#94A3B8]">{u.profile?.email}</p>
                        <p className="text-xs text-[#0EA5E9] mt-1">{u.profile?.role}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="rounded-lg border border-[#1E293B] bg-[#0B1220] px-3 py-1 text-xs font-semibold text-[#F59E0B] hover:bg-[#0F172A] transition">
                          Reset Pass
                        </button>
                        <button className="rounded-lg border border-[#1E293B] bg-[#0B1220] px-3 py-1 text-xs font-semibold text-[#F87171] hover:bg-[#0F172A] transition">
                          Disable
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* About Section */}
            <section className="rounded-lg border border-[#1E293B] bg-[#111827] p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#0EA5E9] text-[#0B1220]">
                  <Info size={20} />
                </div>
                <h3 className="font-bold">About</h3>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-[#94A3B8] font-semibold">MTC Chennai Analytics Portal</p>
                  <p className="text-[#E2E8F0] font-bold mt-1">Version 1.0.0</p>
                </div>

                <div>
                  <p className="text-[#94A3B8] font-semibold mb-2">Built With</p>
                  <ul className="space-y-1 text-[#E2E8F0]">
                    <li className="flex items-center gap-2">
                      <ChevronRight size={14} />
                      React 19
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight size={14} />
                      Firebase
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight size={14} />
                      Vercel
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight size={14} />
                      Recharts
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="text-[#94A3B8] font-semibold mb-2">Developer</p>
                  <p className="text-[#E2E8F0]">Lohith</p>
                </div>
              </div>
            </section>

            {/* Quick Links */}
            <section className="rounded-lg border border-[#1E293B] bg-[#111827] p-6 shadow-lg">
              <h3 className="font-bold mb-4">Quick Links</h3>
              <div className="space-y-2">
                {[
                  { label: 'Privacy Policy', icon: Shield },
                  { label: 'Terms of Service', icon: Shield },
                  { label: 'Documentation', icon: Info },
                ].map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    className="w-full flex items-center gap-2 rounded-lg border border-[#1E293B] bg-[#0F172A] px-4 py-2 text-sm font-semibold text-[#E2E8F0] hover:border-[#0EA5E9] hover:bg-[#11203b] transition"
                  >
                    <Icon size={16} />
                    {label}
                    <ChevronRight size={14} className="ml-auto" />
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
