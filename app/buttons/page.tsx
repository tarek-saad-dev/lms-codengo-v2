import { Button } from "@/components/ui/button";

export default function Buttons() {
  return (
    <div className="p-4 space-y-4 flex flex-col gap-4 max-w-[300px]">
      <Button variant="default">Default</Button>
      <Button variant="primary">Primary</Button>
      <Button variant="primaryOutline">Primary outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="secondaryOutline">Secondary outline</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="dangerOutline">Danger outline</Button>
      <Button variant="super">Super</Button>
      <Button variant="superOutline">Super outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="sidebar">Sidebar</Button>
      <Button variant="sidebarOutline">Sidebar outline</Button>
    </div>
  );
}
