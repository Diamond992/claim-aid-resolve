import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ClaimForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    contractType: "",
    incidentDate: null as Date | null,
    refusalDate: null as Date | null,
    refusalReason: "",
    claimedAmount: "",
    description: "",
    hasExpertise: "",
    previousExchanges: "",
    personalInfo: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      policyNumber: "",
      insuranceCompany: ""
    }
  });

  const contractTypes = [
    { value: "auto", label: "Assurance Automobile" },
    { value: "habitation", label: "Assurance Habitation" },
    { value: "sante", label: "Assurance Santé" },
    { value: "prevoyance", label: "Assurance Prévoyance" },
    { value: "vie", label: "Assurance Vie" },
    { value: "responsabilite", label: "Responsabilité Civile" },
    { value: "autre", label: "Autre" }
  ];

  const refusalReasons = [
    "Exclusion contractuelle",
    "Défaut de déclaration",
    "Carence de garantie",
    "Prescription",
    "Faute intentionnelle",
    "Défaut de paiement des cotisations",
    "Vice caché",
    "Usure normale",
    "Autre"
  ];

  const handleStepComplete = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Transform and save form data to match service expectations
      const transformedData = {
        contractType: formData.contractType,
        accidentDate: formData.incidentDate ? format(formData.incidentDate, "yyyy-MM-dd") : "",
        refusalDate: formData.refusalDate ? format(formData.refusalDate, "yyyy-MM-dd") : "",
        refusalReason: formData.refusalReason,
        claimedAmount: formData.claimedAmount,
        description: formData.description,
        hasExpertise: formData.hasExpertise,
        previousExchanges: formData.previousExchanges,
        // Flatten personal info
        firstName: formData.personalInfo.firstName,
        lastName: formData.personalInfo.lastName,
        email: formData.personalInfo.email,
        phone: formData.personalInfo.phone,
        address: formData.personalInfo.address,
        policyNumber: formData.personalInfo.policyNumber || "",
        insuranceCompany: formData.personalInfo.insuranceCompany || ""
      };
      
      console.log('💾 Saving transformed claim data:', transformedData);
      localStorage.setItem('claimFormData', JSON.stringify(transformedData));
      toast.success("Informations enregistrées avec succès !");
      navigate('/register?from=claim');
    }
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step < currentStep ? <CheckCircle className="h-6 w-6" /> : step}
            </div>
            {step < 3 && (
              <div className={`w-16 h-1 mx-2 ${
                step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Informations sur votre contrat</CardTitle>
        <CardDescription className="text-center">
          Commençons par les détails de votre assurance et du refus
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="contractType">Type de contrat d'assurance *</Label>
          <Select value={formData.contractType} onValueChange={(value) => 
            setFormData({...formData, contractType: value})
          }>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez le type de contrat" />
            </SelectTrigger>
            <SelectContent>
              {contractTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date du sinistre/événement *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.incidentDate ? 
                    format(formData.incidentDate, "PPP", { locale: fr }) : 
                    "Sélectionner une date"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.incidentDate}
                  onSelect={(date) => setFormData({...formData, incidentDate: date})}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Date du refus de l'assureur *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.refusalDate ? 
                    format(formData.refusalDate, "PPP", { locale: fr }) : 
                    "Sélectionner une date"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.refusalDate}
                  onSelect={(date) => setFormData({...formData, refusalDate: date})}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="refusalReason">Motif invoqué par l'assureur *</Label>
          <Select value={formData.refusalReason} onValueChange={(value) => 
            setFormData({...formData, refusalReason: value})
          }>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez le motif du refus" />
            </SelectTrigger>
            <SelectContent>
              {refusalReasons.map((reason) => (
                <SelectItem key={reason} value={reason}>
                  {reason}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="claimedAmount">Montant de la prestation refusée (€)</Label>
          <Input
            id="claimedAmount"
            type="number"
            placeholder="ex: 5000"
            value={formData.claimedAmount}
            onChange={(e) => setFormData({...formData, claimedAmount: e.target.value})}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Détails de votre dossier</CardTitle>
        <CardDescription className="text-center">
          Aidez-nous à comprendre votre situation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="description">Description détaillée de la situation *</Label>
          <Textarea
            id="description"
            placeholder="Décrivez les circonstances du sinistre, les échanges avec votre assureur, et tout élément important pour votre dossier..."
            className="min-h-32"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label>Y a-t-il eu une expertise ?</Label>
          <Select value={formData.hasExpertise} onValueChange={(value) => 
            setFormData({...formData, hasExpertise: value})
          }>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez une option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oui">Oui, il y a eu une expertise</SelectItem>
              <SelectItem value="non">Non, pas d'expertise</SelectItem>
              <SelectItem value="en_cours">Expertise en cours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="previousExchanges">Échanges précédents avec l'assureur</Label>
          <Textarea
            id="previousExchanges"
            placeholder="Décrivez vos échanges précédents (courriers, appels, emails) avec votre compagnie d'assurance..."
            className="min-h-24"
            value={formData.previousExchanges}
            onChange={(e) => setFormData({...formData, previousExchanges: e.target.value})}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Vos informations personnelles</CardTitle>
        <CardDescription className="text-center">
          Ces informations nous permettront de créer votre compte
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom *</Label>
            <Input
              id="firstName"
              placeholder="Votre prénom"
              value={formData.personalInfo.firstName}
              onChange={(e) => setFormData({
                ...formData, 
                personalInfo: {...formData.personalInfo, firstName: e.target.value}
              })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom *</Label>
            <Input
              id="lastName"
              placeholder="Votre nom"
              value={formData.personalInfo.lastName}
              onChange={(e) => setFormData({
                ...formData, 
                personalInfo: {...formData.personalInfo, lastName: e.target.value}
              })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="votre@email.com"
            value={formData.personalInfo.email}
            onChange={(e) => setFormData({
              ...formData, 
              personalInfo: {...formData.personalInfo, email: e.target.value}
            })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="06 12 34 56 78"
            value={formData.personalInfo.phone}
            onChange={(e) => setFormData({
              ...formData, 
              personalInfo: {...formData.personalInfo, phone: e.target.value}
            })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Adresse complète *</Label>
          <Textarea
            id="address"
            placeholder="Votre adresse complète..."
            value={formData.personalInfo.address}
            onChange={(e) => setFormData({
              ...formData, 
              personalInfo: {...formData.personalInfo, address: e.target.value}
            })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="policyNumber">Numéro de police d'assurance</Label>
          <Input
            id="policyNumber"
            placeholder="Numéro de votre contrat"
            value={formData.personalInfo.policyNumber}
            onChange={(e) => setFormData({
              ...formData, 
              personalInfo: {...formData.personalInfo, policyNumber: e.target.value}
            })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="insuranceCompany">Compagnie d'assurance</Label>
          <Input
            id="insuranceCompany"
            placeholder="Nom de votre compagnie d'assurance"
            value={formData.personalInfo.insuranceCompany}
            onChange={(e) => setFormData({
              ...formData, 
              personalInfo: {...formData.personalInfo, insuranceCompany: e.target.value}
            })}
          />
        </div>
      </CardContent>
    </Card>
  );

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.contractType && formData.incidentDate && formData.refusalDate && formData.refusalReason;
      case 2:
        return formData.description;
      case 3:
        return formData.personalInfo.firstName && formData.personalInfo.lastName && 
               formData.personalInfo.email && formData.personalInfo.address;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Démarrer votre réclamation
          </h1>
          <p className="text-xl text-gray-600">
            Suivez ces étapes pour créer votre dossier de contestation
          </p>
        </div>

        {renderStepIndicator()}

        <div className="mb-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        <div className="flex justify-between max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={() => currentStep === 1 ? navigate('/') : setCurrentStep(currentStep - 1)}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {currentStep === 1 ? 'Accueil' : 'Précédent'}
          </Button>

          <Button
            onClick={handleStepComplete}
            disabled={!canProceed()}
            className="bg-blue-600 hover:bg-blue-700 flex items-center"
          >
            {currentStep === 3 ? 'Créer mon compte' : 'Suivant'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClaimForm;
