import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Json } from "@/integrations/supabase/types";

interface TemplatePreviewProps {
  content: string;
  variables?: Json;
  title?: string;
  showVariables?: boolean;
  className?: string;
}

const TemplatePreview = ({ 
  content, 
  variables, 
  title, 
  showVariables = false,
  className = ""
}: TemplatePreviewProps) => {
  const getVariablesArray = (variables: Json): string[] => {
    if (Array.isArray(variables)) {
      return variables as string[];
    }
    return [];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {title && <h4 className="font-semibold">{title}</h4>}
      
      {showVariables && variables && (
        <div>
          <h5 className="font-medium mb-2 text-sm">Variables requises :</h5>
          <div className="flex flex-wrap gap-1">
            {getVariablesArray(variables).map((variable, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {`{{${variable}}}`}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="border rounded-lg bg-muted/50">
        <ScrollArea className="min-h-[400px] max-h-[60vh] w-full p-4">
          <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-foreground">
            {content}
          </pre>
        </ScrollArea>
      </div>
    </div>
  );
};

export default TemplatePreview;