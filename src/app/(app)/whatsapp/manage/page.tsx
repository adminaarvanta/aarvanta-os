import { WhatsAppManageClient } from "@/components/whatsapp/whatsapp-manage-client";

export const metadata = { title: "WhatsApp Manager" };

export default function WhatsAppManagePage() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-surface">
      <WhatsAppManageClient />
    </div>
  );
}
