import React from "react";
import { Settings, Mic, Brain, User, Sparkles } from "lucide-react";
import SidebarModal, { SidebarItem } from "./ui/SidebarModal";
import SettingsPage, { SettingsSectionType } from "./SettingsPage";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsModal({
  open,
  onOpenChange,
}: SettingsModalProps) {
  const sidebarItems: SidebarItem<SettingsSectionType>[] = [
    { id: "general", label: "General", icon: Settings },
    { id: "transcription", label: "Transcription Mode", icon: Mic },
    { id: "aiModels", label: "AI Models", icon: Brain },
    { id: "agentConfig", label: "Agent Configuration", icon: User },
    { id: "prompts", label: "AI Prompts", icon: Sparkles },
  ];

  const [activeSection, setActiveSection] =
    React.useState<SettingsSectionType>("general");

  class SettingsErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; message?: string }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false, message: undefined };
    }

    static getDerivedStateFromError(error: any) {
      return { hasError: true, message: error?.message || "Unknown error" };
    }

    componentDidCatch(error: any, info: any) {
      // Surface the error to the dev tools / console for debugging
      // without crashing the whole control panel.
      // eslint-disable-next-line no-console
      console.error("Settings page error:", error, info);
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="space-y-2 text-sm text-destructive">
            <p className="font-medium">Settings failed to load.</p>
            <p className="text-muted-foreground">
              {this.state.message || "An unexpected error occurred while rendering the Settings page."}
            </p>
          </div>
        );
      }
      return this.props.children;
    }
  }

  return (
    <SidebarModal<SettingsSectionType>
      open={open}
      onOpenChange={onOpenChange}
      title="Settings"
      sidebarItems={sidebarItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      <SettingsErrorBoundary>
        <SettingsPage activeSection={activeSection} />
      </SettingsErrorBoundary>
    </SidebarModal>
  );
}
