
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourriersList from "./CourriersList";
import EcheancesList from "./EcheancesList";
import PaymentsList from "./PaymentsList";
import { WebhookLogsList } from "./WebhookLogsList";
import ActivityLogsList from "./ActivityLogsList";
import UserManagement from "./UserManagement";
import TemplatesList from "./TemplatesList";
import ConfigurationList from "./ConfigurationList";

interface AdminTabsContentProps {
  courriers: any[];
  echeances: any[];
  payments: any[];
  dossiers: any[];
}

export const AdminTabsContent = ({ courriers, echeances, payments, dossiers }: AdminTabsContentProps) => {
  return (
    <Tabs defaultValue="courriers" className="w-full">
      <TabsList className="grid w-full grid-cols-8">
        <TabsTrigger value="courriers">Courriers</TabsTrigger>
        <TabsTrigger value="echeances">Échéances</TabsTrigger>
        <TabsTrigger value="payments">Paiements</TabsTrigger>
        <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        <TabsTrigger value="activity">Activité</TabsTrigger>
        <TabsTrigger value="users">Utilisateurs</TabsTrigger>
        <TabsTrigger value="templates">Modèles</TabsTrigger>
        <TabsTrigger value="config">Configuration</TabsTrigger>
      </TabsList>
      
      <TabsContent value="courriers" className="mt-6">
        <CourriersList courriers={courriers} />
      </TabsContent>
      
      <TabsContent value="echeances" className="mt-6">
        <EcheancesList echeances={echeances} dossiers={dossiers} />
      </TabsContent>
      
      <TabsContent value="payments" className="mt-6">
        <PaymentsList payments={payments} />
      </TabsContent>
      
      <TabsContent value="webhooks" className="mt-6">
        <WebhookLogsList />
      </TabsContent>
      
      <TabsContent value="activity" className="mt-6">
        <ActivityLogsList />
      </TabsContent>
      
      <TabsContent value="users" className="mt-6">
        <UserManagement />
      </TabsContent>
      
      <TabsContent value="templates" className="mt-6">
        <TemplatesList />
      </TabsContent>
      
      <TabsContent value="config" className="mt-6">
        <ConfigurationList />
      </TabsContent>
    </Tabs>
  );
};

export default AdminTabsContent;
