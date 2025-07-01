
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Loader2, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const PaymentRedirect = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // Simulate payment processing
    const timer = setTimeout(() => {
      setIsProcessing(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handlePaymentSuccess = () => {
    toast.success("Paiement effectué avec succès !");
    navigate('/dashboard');
  };

  const simulateStripePayment = () => {
    // In real implementation, this would redirect to Stripe Checkout
    toast.info("Redirection vers le paiement sécurisé Stripe...");
    
    // Simulate successful payment after a delay
    setTimeout(() => {
      handlePaymentSuccess();
    }, 2000);
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Préparation de votre dossier...</h2>
            <p className="text-gray-600">
              Nous préparons votre espace personnel et votre dossier de réclamation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Finaliser votre inscription</CardTitle>
            <CardDescription>
              Pour accéder à nos services et lancer votre dossier de réclamation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pricing Card */}
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white p-6 rounded-lg">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Service Premium</h3>
                <div className="text-4xl font-bold mb-2">
                  99€
                  <span className="text-lg font-normal opacity-80"> TTC</span>
                </div>
                <p className="opacity-90">Paiement unique - Pas d'abonnement</p>
              </div>
            </div>

            {/* What's included */}
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Ce qui est inclus :</h4>
              <div className="space-y-2">
                {[
                  "Analyse complète de votre dossier par IA",
                  "Génération d'un courrier de contestation personnalisé",
                  "Validation par nos experts juridiques",
                  "Envoi recommandé à votre assureur",
                  "Suivi complet de votre dossier",
                  "Support client dédié"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Guarantee */}
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold text-emerald-800">Garantie satisfait ou remboursé</span>
              </div>
              <p className="text-emerald-700 text-sm">
                Si votre courrier n'est pas envoyé dans les 7 jours, nous vous remboursons intégralement.
              </p>
            </div>

            {/* Payment button */}
            <Button 
              onClick={simulateStripePayment}
              className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
              size="lg"
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Procéder au paiement sécurisé
            </Button>

            <p className="text-center text-sm text-gray-500">
              Paiement sécurisé par Stripe - Vos données sont protégées
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentRedirect;
