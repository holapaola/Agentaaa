import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, Mail, Lock, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [profileType, setProfileType] = useState<"personal" | "agency">("personal");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        // Update profile type after signup
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").update({ profile_type: profileType, full_name: fullName }).eq("user_id", user.id);
        }

        toast({
          title: "Check your email",
          description: "We sent you a verification link to confirm your account.",
        });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const PLANS = {
    personal: { name: "Personal", price: "$29", period: "/mo", features: ["1 Brand Profile", "50 Posts/month", "Basic Analytics", "Email Support"] },
    agency: { name: "Agency", price: "$99", period: "/mo", features: ["Unlimited Clients", "Unlimited Posts", "Advanced Analytics", "Priority Support", "White-label Reports"] },
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 font-body">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-display font-bold">{isLogin ? "Welcome Back" : "Create Account"}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block font-body">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="h-12 pl-10 bg-secondary border-border font-body" required />
                    </div>
                  </div>

                  {/* Profile Type Selection */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block font-body">Account Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(["personal", "agency"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setProfileType(type)}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            profileType === type
                              ? "border-primary bg-primary/10"
                              : "border-border bg-secondary/50 hover:border-muted-foreground/30"
                          }`}
                        >
                          <div className="font-display font-semibold text-sm capitalize">{type}</div>
                          <div className="text-primary font-display font-bold text-lg mt-1">{PLANS[type].price}<span className="text-xs text-muted-foreground font-normal">{PLANS[type].period}</span></div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-sm text-muted-foreground mb-2 block font-body">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-12 pl-10 bg-secondary border-border font-body" required />
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block font-body">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-12 pl-10 bg-secondary border-border font-body" required minLength={6} />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 font-display glow-gold" disabled={loading}>
                {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground text-center mt-6 font-body">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium">
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </motion.div>

          {/* Pricing Preview */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block">
            <div className="space-y-4">
              {(["personal", "agency"] as const).map((type) => (
                <div
                  key={type}
                  className={`glass-card rounded-xl p-6 transition-all ${
                    !isLogin && profileType === type ? "border-primary ring-1 ring-primary/30" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-lg capitalize">{PLANS[type].name}</h3>
                    <div className="font-display font-bold text-2xl text-primary">
                      {PLANS[type].price}<span className="text-sm text-muted-foreground font-normal">{PLANS[type].period}</span>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {PLANS[type].features.map((f) => (
                      <li key={f} className="text-sm text-muted-foreground font-body flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
