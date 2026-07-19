import { ChannelOsListPage } from "@/components/channels/channel-os-shell";

export default async function VoiceOsPage() {
  return <ChannelOsListPage os="voice" />;
}

export const metadata = { title: "Voice OS" };
