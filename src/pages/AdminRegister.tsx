
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AdminRegister = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('code');
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteValid, setInviteValid] = useState(false);
  const [checkingInvite, setCheckingInvite] = useState(true);

  useEffect(() => {
    if (!inviteCode) {
      toast.error("Code d'invitation requis");
      navigate('/login');
      return;
    }

    const checkInvite = async () => {
      const { data, error } = await supabase
        .from('admin_invitations')
        .select('*')
        .eq('invite_code', inviteCode)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        toast.error("Code d'invitation invalide ou expiré");
        navigate('/login');
        return;
      }

      setInviteValid(true);
      setFormData(prev => ({ ...prev, email: data.email }));
      setCheckingInvite(false);
    };

    checkInvite();
  }, [inviteCode, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    if (!formData.acceptTerms) {
      toast.error("Veuillez accepter les conditions d'utilisation");
      setIsLoading(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/admin`;
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          }
        }
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (authData.user) {
        // Mark invitation as used
        await supabase
          .from('admin_invitations')
          .update({ 
            used_at: new Date().toISOString(),
            used_by: authData.user.id 
          })
          .eq('invite_code', inviteCode);

        // Update user role to admin
        await supabase
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', authData.user.id);

        toast.success("Compte administrateur créé avec succès !");
        navigate('/admin');
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de la création du compte");
      console.error('Admin register error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingInvite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div>Vérification de l'invitation...</div>
      </div>
    );
  }

  if (!inviteValid) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-10 w-10 text-blue-600" />
            <span className="text-3xl font-bold text-gray-900">ReclamAssur</span>
          </div>
          <p className="text-gray-600">Création de compte administrateur</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Compte Administrateur</CardTitle>
            <CardDescription className="text-center">
              Créez votre compte administrateur avec le code d'invitation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    placeholder="Votre prénom"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    placeholder="Votre nom"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Choisissez un mot de passe fort"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirmez votre mot de passe"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => setFormData({...formData, acceptTerms: checked as boolean})}
                />
                <Label htmlFor="acceptTerms" className="text-sm">
                  J'accepte les conditions d'utilisation en tant qu'administrateur
                </Label>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Création du compte..." : "Créer le compte administrateur"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Déjà un compte ?{" "}
                <Link to="/login" className="text-blue-600 hover:underline font-medium">
                  Se connecter
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminRegister;
