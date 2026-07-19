import { ChannelOsListPage } from "@/components/channels/channel-os-shell";

export default async function WhatsAppOsPage() {
  return <ChannelOsListPage os="whatsapp" />;
}

export const metadata = { title: "WhatsApp OS" };
