
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Shield, FileText, MessageSquare, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useState(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  const features = [
    {
      icon: <FileText className="h-12 w-12 text-emerald-600" />,
      title: "Analyse Intelligente",
      description: "Notre IA analyse votre dossier et génère un courrier de contestation personnalisé et juridiquement solide."
    },
    {
      icon: <Shield className="h-12 w-12 text-blue-600" />,
      title: "Expertise Juridique",
      description: "Nos experts valident chaque courrier pour maximiser vos chances de succès face à votre assureur."
    },
    {
      icon: <MessageSquare className="h-12 w-12 text-orange-600" />,
      title: "Accompagnement Personnalisé",
      description: "Communication directe avec nos experts tout au long du processus de contestation."
    }
  ];

  const testimonials = [
    {
      name: "Marie L.",
      text: "Grâce à ReclamAssur, j'ai obtenu l'indemnisation de mon sinistre automobile que mon assureur avait refusé. Un service efficace !",
      case: "Refus indemnisation auto"
    },
    {
      name: "Pierre M.",
      text: "Après 6 mois de bataille, ReclamAssur a réussi à débloquer ma situation en quelques semaines seulement. Remarquable !",
      case: "Refus prise en charge santé"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">ReclamAssur</span>
          </div>
          <div className="flex space-x-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Connexion
            </Button>
            <Button onClick={() => navigate('/register')} className="bg-blue-600 hover:bg-blue-700">
              Commencer
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Contestez les <span className="text-blue-600">refus</span> de votre assurance avec succès
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Notre plateforme utilise l'intelligence artificielle et l'expertise juridique pour vous aider à obtenir l'indemnisation que vous méritez.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/claim-form')}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4 h-auto"
            >
              Démarrer ma réclamation
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-4 h-auto border-2"
            >
              Comment ça marche ?
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">87%</div>
              <div className="text-gray-600">de taux de succès</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-600 mb-2">15j</div>
              <div className="text-gray-600">délai moyen de traitement</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">2500+</div>
              <div className="text-gray-600">dossiers traités</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Une solution complète pour vos réclamations
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              De l'analyse de votre dossier à l'envoi du courrier de contestation, nous vous accompagnons à chaque étape.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Comment ça fonctionne ?</h2>
            <p className="text-xl opacity-90">Un processus simple en 4 étapes</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Saisissez votre cas", desc: "Décrivez votre refus d'assurance" },
              { step: "2", title: "Téléchargez vos documents", desc: "Ajoutez vos justificatifs" },
              { step: "3", title: "Analyse par IA", desc: "Notre IA génère votre courrier" },
              { step: "4", title: "Validation & envoi", desc: "Nos experts valident et envoient" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="opacity-90">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-xl text-gray-600">Découvrez les témoignages de nos clients satisfaits</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <CardContent className="space-y-4">
                  <div className="flex text-yellow-400">
                    {[1,2,3,4,5].map((star) => (
                      <CheckCircle key={star} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 italic">"{testimonial.text}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.case}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-4">
            Prêt à récupérer ce qui vous revient de droit ?
          </h2>
          <p className="text-xl opacity-90 mb-8">
            Rejoignez les milliers d'assurés qui ont fait confiance à ReclamAssur pour contester leur refus d'assurance.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/claim-form')}
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4 h-auto"
          >
            Commencer ma réclamation gratuitement
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold">ReclamAssur</span>
              </div>
              <p className="text-gray-400">
                Votre partenaire pour contester les refus d'assurance avec succès.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Liens utiles</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Comment ça marche</a></li>
                <li><a href="#" className="hover:text-white">Tarifs</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">CGU</a></li>
                <li><a href="#" className="hover:text-white">Confidentialité</a></li>
                <li><a href="#" className="hover:text-white">Mentions légales</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ReclamAssur. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
