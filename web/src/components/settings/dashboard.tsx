"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { authApi, getFullUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Camera,
  Loader2,
  Globe,
  Smartphone,
  Server,
  Fingerprint,
  Palette,
  Moon,
  Sun,
  Sparkles,
  Shield,
  Edit3,
  Check,
  ChevronRight,
  ShieldCheck,
  LayoutGrid,
  X,
  Link as LinkIcon,
  MapPin,
  Calendar,
  Users,
  AlertCircle
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * SettingsDashboard - A clean, tabbed settings interface.
 * Simplified language for better usability while maintaining premium aesthetics.
 */
export function SettingsDashboard() {
  const { user, checkAuth } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'privacy' | 'security'>('profile');
  
  const [isUploading, setIsUploading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [profileValues, setProfileValues] = useState({
    username: user?.username || "",
    nickname: user?.nickname || "",
    bio: user?.bio || "",
    gender: user?.gender || "",
    age: user?.age?.toString() || "",
    location: user?.location || "",
    social_link: user?.social_link || ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [aiEnabled, setAiEnabled] = useState(user?.ai_enabled ?? true);

  useEffect(() => {
    setMounted(true);
    setAiEnabled(user?.ai_enabled ?? true);
    setImgError(false);
    if (user) {
      setProfileValues({
        username: user.username || "",
        nickname: user.nickname || "",
        bio: user.bio || "",
        gender: user.gender || "",
        age: user.age?.toString() || "",
        location: user.location || "",
        social_link: user.social_link || ""
      });
    }
  }, [user]);

  useEffect(() => {
    const newErrors: Record<string, string> = {};
    if (profileValues.age) {
      const ageNum = parseInt(profileValues.age);
      if (isNaN(ageNum) || ageNum < 13) newErrors.age = "Minimum age is 13";
      else if (ageNum > 120) newErrors.age = "Invalid age";
    }
    if (!profileValues.username) newErrors.username = "Required";
    else if (profileValues.username.length < 3) newErrors.username = "Too short";
    if (profileValues.nickname && profileValues.nickname.length > 50) newErrors.nickname = "Too long";
    setErrors(newErrors);
  }, [profileValues]);

  if (!mounted) return null;

  const handleUpdateProfile = async () => {
    if (Object.keys(errors).length > 0) return;
    setIsSubmitting(true);
    try {
      await authApi.updateProfile({
        username: profileValues.username,
        nickname: profileValues.nickname,
        bio: profileValues.bio,
        gender: profileValues.gender,
        age: profileValues.age ? parseInt(profileValues.age) : null,
        location: profileValues.location,
        social_link: profileValues.social_link
      });
      await checkAuth(true);
      toast.success("Profile updated");
      setIsEditModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.detail;
      toast.error(Array.isArray(msg) ? msg[0]?.msg : (msg || "Error updating profile"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setIsUploading(true);
    try {
      const res = await authApi.uploadAvatar(formData);
      if (res.data.avatar_url) {
        setImgError(false);
        useAuthStore.getState().updateUser({ avatar_url: res.data.avatar_url });
      }
      await checkAuth(true);
      toast.success("Avatar updated");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const NavButton = ({ id, label, icon: Icon }: { id: any, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all relative group",
        activeTab === id 
          ? "bg-[#101010] text-primary border border-[#1a1a1a] shadow-lg" 
          : "text-muted-foreground hover:text-foreground hover:bg-[#101010]/50"
      )}
    >
      <Icon className={cn("size-3.5", activeTab === id ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      {label}
      {activeTab === id && (
        <motion.div layoutId="activeTab" className="absolute left-0 w-1 h-4 bg-primary rounded-full" />
      )}
    </button>
  );

  const SectionBox = ({ children, title, sub }: { children: React.ReactNode, title: string, sub: string }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <div className="px-1">
        <h2 className="text-xl font-black tracking-tighter text-white">{title}</h2>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">{sub}</p>
      </div>
      <div className="bg-[#101010] border border-[#1a1a1a] rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
        {children}
      </div>
    </motion.div>
  );

  const inputBaseStyles = "h-12 bg-[#101010] border-[#1a1a1a] pl-11 font-bold transition-all focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary/50 outline-none";
  const errorStyles = "border-red-500/50 bg-red-500/5 focus:border-red-500 focus:bg-red-500/10";

  return (
    <div className="bg-transparent max-w-5xl mx-auto px-4 py-8 relative">
      <style jsx global>{`
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        .settings-input:focus-visible { outline: none !important; ring: 0 !important; box-shadow: none !important; }
      `}</style>

      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-[#0a0a0a] border border-[#1a1a1a] rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black tracking-tighter text-white">Edit Profile</h2>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Update your profile information</p>
                  </div>
                  <button onClick={() => setIsEditModalOpen(false)} className="size-10 rounded-full bg-[#101010] border border-[#1a1a1a] flex items-center justify-center hover:bg-[#1a1a1a] transition-colors"><X className="size-5 text-muted-foreground" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Username</Label>
                      <div className="relative group">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input value={profileValues.username} onChange={e => setProfileValues({...profileValues, username: e.target.value})} className={cn(inputBaseStyles, "settings-input", errors.username && errorStyles)} />
                      </div>
                      {errors.username && <p className="text-[9px] text-red-500 font-bold uppercase ml-1 flex items-center gap-1"><AlertCircle className="size-2.5" /> {errors.username}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Nickname</Label>
                      <div className="relative group">
                        <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input value={profileValues.nickname} onChange={e => setProfileValues({...profileValues, nickname: e.target.value})} placeholder="Display Name" className={cn(inputBaseStyles, "settings-input", errors.nickname && errorStyles)} />
                      </div>
                      {errors.nickname && <p className="text-[9px] text-red-500 font-bold uppercase ml-1 flex items-center gap-1"><AlertCircle className="size-2.5" /> {errors.nickname}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Age</Label>
                        <div className="relative group">
                          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input type="number" value={profileValues.age} onChange={e => setProfileValues({...profileValues, age: e.target.value})} placeholder="25" className={cn(inputBaseStyles, "settings-input appearance-none", errors.age && errorStyles)} />
                        </div>
                        {errors.age && <p className="text-[9px] text-red-500 font-bold uppercase ml-1 flex items-center gap-1"><AlertCircle className="size-2.5" /> {errors.age}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Gender</Label>
                        <div className="relative group">
                          <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input value={profileValues.gender} onChange={e => setProfileValues({...profileValues, gender: e.target.value})} placeholder="Gender" className={cn(inputBaseStyles, "settings-input")} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Location</Label>
                      <div className="relative group">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input value={profileValues.location} onChange={e => setProfileValues({...profileValues, location: e.target.value})} placeholder="City, Country" className={cn(inputBaseStyles, "settings-input")} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Social Link</Label>
                      <div className="relative group">
                        <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input value={profileValues.social_link} onChange={e => setProfileValues({...profileValues, social_link: e.target.value})} placeholder="Link to profile" className={cn(inputBaseStyles, "settings-input")} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Bio</Label>
                      <textarea value={profileValues.bio} onChange={e => setProfileValues({...profileValues, bio: e.target.value})} placeholder="Short bio..." className="w-full h-28 bg-[#101010] border border-[#1a1a1a] rounded-xl p-4 text-xs focus:outline-none focus:border-primary/50 resize-none font-medium transition-all" />
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex items-center justify-between gap-4 border-t border-[#1a1a1a]">
                  <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest max-w-[200px]">Profile changes are saved to your account.</p>
                  <div className="flex gap-3">
                    <Button onClick={() => setIsEditModalOpen(false)} variant="ghost" className="h-11 px-6 text-[11px] font-black uppercase tracking-widest hover:bg-[#101010]">Cancel</Button>
                    <Button onClick={handleUpdateProfile} disabled={isSubmitting || Object.keys(errors).length > 0} className={cn("h-11 px-8 text-[11px] font-black uppercase tracking-widest transition-all", Object.keys(errors).length > 0 ? "bg-red-500/10 text-red-500 border border-red-500/20 cursor-not-allowed" : "bg-white text-black hover:bg-zinc-200")}>
                      {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        <div className="w-full md:w-64 shrink-0">
          <div className="flex flex-col gap-1.5 sticky top-8">
            <NavButton id="profile" label="Profile" icon={User} />
            <NavButton id="preferences" label="Settings" icon={LayoutGrid} />
            <NavButton id="privacy" label="Privacy" icon={Shield} />
            <NavButton id="security" label="Security" icon={ShieldCheck} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <SectionBox key="profile" title="Public Profile" sub="Manage your presence">
                <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
                  <div className="relative group/avatar">
                    <div className="size-28 rounded-[2.5rem] bg-[#0a0a0a] border-2 border-[#1a1a1a] flex items-center justify-center text-4xl font-black text-white shadow-2xl overflow-hidden relative">
                      {user?.avatar_url && !imgError ? ( <img src={getFullUrl(user.avatar_url)} alt="Avatar" className="w-full h-full object-cover" onError={() => setImgError(true)} /> ) : user?.username?.[0]?.toUpperCase()}
                      {isUploading && ( <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div> )}
                    </div>
                    <label className="absolute -bottom-1 -right-1 size-9 bg-[#101010] border border-[#1a1a1a] rounded-2xl flex items-center justify-center cursor-pointer shadow-xl hover:scale-110 transition-transform">
                      <Camera className="size-4" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
                    </label>
                  </div>
                  <div className="flex-1 w-full space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary">Profile Info</h3>
                        <p className="text-[9px] text-muted-foreground font-medium">UID: #{user?.id || 0}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditModalOpen(true)} className="h-8 text-[10px] font-black uppercase tracking-widest bg-primary/5 hover:bg-primary/10 text-primary">
                        <Edit3 className="size-3 mr-1.5" /> Edit Profile
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ProfileInfo icon={User} label="Nickname" value={user?.nickname || user?.username} />
                      <ProfileInfo icon={MapPin} label="Location" value={user?.location || "N/A"} />
                      <ProfileInfo icon={Calendar} label="Age" value={user?.age?.toString() || "N/A"} />
                      <ProfileInfo icon={LinkIcon} label="Social Link" value={user?.social_link || "N/A"} />
                      <div className="sm:col-span-2 p-4 bg-[#0a0a0a]/50 rounded-2xl border border-[#1a1a1a]/50 space-y-2">
                        <div className="flex items-center gap-2">
                          <Edit3 className="size-3 text-muted-foreground" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Bio</span>
                        </div>
                        <p className="text-xs text-muted-foreground italic leading-relaxed">{user?.bio || "No bio yet."}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionBox>
            )}
            {activeTab === 'preferences' && (
              <SectionBox key="preferences" title="App Settings" sub="General preferences">
                <div className="space-y-4">
                  <PreferenceRow icon={Moon} label="Dark Mode" sub="Toggle dark interface" checked={theme === 'dark'} onToggle={(val) => setTheme(val ? 'dark' : 'light')} />
                  <PreferenceRow icon={Sparkles} label="AI Eco Assistant" sub="Enable cinematic AI chat" checked={aiEnabled} onToggle={async (val) => {
                    setAiEnabled(val);
                    await authApi.updateUserField({ field: "ai_enabled", value: val });
                    await checkAuth(true);
                  }} />
                </div>
              </SectionBox>
            )}
            {activeTab === 'privacy' && (
              <SectionBox key="privacy" title="Privacy Settings" sub="What others can see">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'show_bio', label: 'Show Bio', icon: User },
                    { id: 'show_favorites', label: 'Show Favorites', icon: LayoutGrid },
                    { id: 'show_age', label: 'Show Age', icon: Fingerprint },
                    { id: 'show_location', label: 'Show Location', icon: Globe }
                  ].map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-2xl hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-3">
                        <item.icon className="size-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                      </div>
                      <Switch checked={(user as any)?.[item.id] ?? true} onCheckedChange={async (val) => { await authApi.updateUserField({ field: item.id, value: val }); await checkAuth(true); }} />
                    </div>
                  ))}
                </div>
              </SectionBox>
            )}
            {activeTab === 'security' && (
              <SectionBox key="security" title="Account Security" sub="Protect your access">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SecurityInfo icon={Mail} label="Email Address" value={user?.email} />
                    <SecurityInfo icon={Fingerprint} label="Username" value={user?.username} />
                  </div>
                  <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-primary/10 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Lock className="size-4" /></div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary">Password</h4>
                        <p className="text-[10px] text-primary/60">Change your login credentials.</p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </SectionBox>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ProfileInfo({ icon: Icon, label, value }: { icon: any, label: string, value: any }) {
  return (
    <div className="p-4 bg-[#0a0a0a]/50 rounded-2xl border border-[#1a1a1a]/50 space-y-1">
      <div className="flex items-center gap-2">
        <Icon className="size-3 text-muted-foreground" />
        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</span>
      </div>
      <p className="text-xs font-bold truncate">{value}</p>
    </div>
  );
}

function PreferenceRow({ icon: Icon, label, sub, checked, onToggle }: { icon: any, label: string, sub: string, checked: boolean, onToggle: (val: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-2xl group hover:border-primary/30 transition-all">
      <div className="flex items-center gap-4">
        <div className="size-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center shadow-lg"><Icon className={cn("size-4", label.includes("AI") ? "text-primary" : "")} /></div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest">{label}</h4>
          <p className="text-[10px] text-muted-foreground">{sub}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </div>
  );
}

function SecurityInfo({ icon: Icon, label, value }: { icon: any, label: string, value: any }) {
  return (
    <div className="p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="size-3 text-primary" />
        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <p className="text-xs font-bold truncate">{value}</p>
    </div>
  );
}
