"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, User, Palette, Sparkles, Bell, Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function SettingsDashboard() {
  const { user, checkAuth } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [aiEnabled, setAiEnabled] = useState(user?.ai_enabled ?? true);
  const [toastLimit, setToastLimit] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('toastLimit') || "3";
    }
    return "3";
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUpdateUsername = async () => {
    if (!newUsername || !currentPassword) {
      toast.error("Please provide new username and current password");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await authApi.updateUserField(user.username, {
        field: "username",
        value: newUsername,
        current_password: currentPassword
      });
      if (res.data.new_token) {
        localStorage.setItem("access_token", res.data.new_token);
        await checkAuth();
        toast.success("Username updated successfully!");
        setIsEditingUsername(false);
        setNewUsername("");
        setCurrentPassword("");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update username");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAi = async () => {
    const newValue = !aiEnabled;
    setAiEnabled(newValue);
    try {
      await authApi.updateUserField(user.username, {
        field: "ai_enabled",
        value: newValue
      });
      await checkAuth(); // Sync the global store so the state persists across tab changes
      toast.success(newValue ? "AI Features Enabled" : "AI Features Disabled");
    } catch (err: any) {
      setAiEnabled(!newValue); // revert
      toast.error("Failed to update AI preference");
    }
  };

  const handleToastLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const limit = e.target.value;
    setToastLimit(limit);
    if (typeof window !== 'undefined') {
      localStorage.setItem('toastLimit', limit);
      toast.success(`Max notifications set to ${limit}`);
    }
  };

  if (!mounted) return null;

  return (
    <div className="bg-transparent space-y-8 max-w-4xl mx-auto">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-foreground/70" />
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Profile Management</label>
        </div>
        
        <div className="flex flex-col gap-4 p-6 bg-card rounded-xl border border-border shadow-sm group transition-all">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-xl tracking-tight text-foreground">{user?.username}</p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">Public Account Identity</p>
            </div>
            <Button 
              variant="outline" 
              className={`rounded-lg px-4 font-bold text-[10px] uppercase tracking-widest transition-all h-8 border-border hover:bg-accent text-foreground`}
              onClick={() => setIsEditingUsername(!isEditingUsername)}
            >
              {isEditingUsername ? "Cancel" : "Manage"}
            </Button>
          </div>
          
          {isEditingUsername && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="pt-6 border-t border-border space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">New Username</Label>
                  <input 
                    type="text" 
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full h-10 bg-accent border border-transparent rounded-lg px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all font-medium"
                    placeholder="Enter new username"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Current Password</Label>
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full h-10 bg-accent border border-transparent rounded-lg px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <Button 
                onClick={handleUpdateUsername} 
                disabled={isSubmitting || !newUsername || !currentPassword}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-10 font-black text-[10px] uppercase tracking-widest transition-all"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Commit Changes"}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-4 h-4 text-foreground/70" />
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">App Preferences</label>
        </div>

        <div className="w-full rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground">Interface & Features</h3>
            <p className="text-muted-foreground text-xs font-medium mt-0.5">Personalize your cinematic experience.</p>
          </div>
          
          <div className="space-y-4">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg border border-transparent hover:border-border transition-all group">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor="theme-mode" className="text-sm font-bold cursor-pointer text-foreground">Theme Mode</Label>
                  {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-foreground" /> : <Sun className="w-3.5 h-3.5 text-foreground" />}
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">Switch between dark & light cinematic modes.</p>
              </div>
              <Switch 
                id="theme-mode"
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>

            {/* AI Toggle */}
            <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg border border-transparent hover:border-border transition-all group">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor="ai-toggle" className="text-sm font-bold cursor-pointer text-foreground">AI Eco Assistant</Label>
                  <Sparkles className="w-3.5 h-3.5 text-foreground" />
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">Enable deep cinematic analysis & chat memory.</p>
              </div>
              <Switch 
                id="ai-toggle"
                checked={aiEnabled}
                onCheckedChange={handleToggleAi}
              />
            </div>

            {/* Toast Limit */}
            <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg border border-transparent hover:border-border transition-all group">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor="toast-limit" className="text-sm font-bold cursor-pointer text-foreground">Feedback Frequency</Label>
                  <Bell className="w-3.5 h-3.5 text-foreground" />
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">Control the number of notification alerts.</p>
              </div>
              <div className="relative">
                <select 
                  id="toast-limit"
                  value={toastLimit} 
                  onChange={handleToastLimitChange}
                  className="bg-accent border border-transparent rounded-lg px-3 py-1.5 text-foreground font-bold text-[9px] uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-ring transition-all appearance-none cursor-pointer pr-7"
                >
                  <option value="1">1 Alert</option>
                  <option value="3">3 Max</option>
                  <option value="5">5 Max</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
