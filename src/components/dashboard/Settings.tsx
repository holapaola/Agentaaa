import { useState, useEffect } from 'react';
import { Check, Lock, Building2, CreditCard, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '../../hooks/useAuth';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();

  // Profile
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Agency
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [agencyName, setAgencyName] = useState("");
  const [savingAgency, setSavingAgency] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase.from("profiles").select("agency_id, full_name").eq("id", user.id).single();
      if (profile?.full_name) setFullName(profile.full_name);
      if (profile?.agency_id) {
        setAgencyId(profile.agency_id);
        const { data: agency } = await supabase.from("agencies").select("name").eq("id", profile.agency_id).single();
        if (agency?.name) setAgencyName(agency.name);
      }
    })();
  }, [user]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user!.id);
    if (error) toast.error("Failed to update profile.");
    else toast.success("Profile updated!");
    setSavingProfile(false);
  }

  async function saveAgency(e: React.FormEvent) {
    e.preventDefault();
    if (!agencyId) return;
    setSavingAgency(true);
    const { error } = await supabase.from("agencies").update({ name: agencyName }).eq("id", agencyId);
    if (error) toast.error("Failed to update agency.");
    else toast.success("Agency name updated!");
    setSavingAgency(false);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match."); return; }
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error("Failed to update password.");
    else { toast.success("Password updated!"); setNewPassword(""); setConfirmPassword(""); }
    setSavingPassword(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-foreground">Settings</h2>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your personal account details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Full Name</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Email</label>
              <Input type="email" value={user?.email ?? ""} disabled />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here</p>
            </div>
            <Button type="submit" className="self-start gap-2" disabled={savingProfile}>
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={16} />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Agency */}
      {agencyId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Agency</CardTitle>
            <CardDescription>Your agency name shown to clients</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveAgency} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Agency Name</label>
                <Input value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="Agency name" />
              </div>
              <Button type="submit" className="self-start gap-2" disabled={savingAgency}>
                {savingAgency ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={16} />}
                Save Agency Name
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</CardTitle>
          <CardDescription>Update your login password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">New Password</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Confirm Password</label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" />
            </div>
            <Button type="submit" className="self-start gap-2" disabled={savingPassword || !newPassword}>
              {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock size={16} />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Billing placeholder */}
      <Card className="opacity-70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Billing</CardTitle>
          <CardDescription>Subscription and billing management</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Billing management coming soon. Your current plan: <span className="font-semibold text-foreground">Pro</span></p>
        </CardContent>
      </Card>
    </div>
  );
}
