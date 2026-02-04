import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MenuIcon } from "lucide-react";
import Sidebar from "./sidebar";

export default function MobileSidebar() {
    return (
        <Sheet >
            <SheetTrigger>
                <MenuIcon className="text-white" />
            </SheetTrigger>
            <SheetContent side="left" className="p-0 z-50">
                <Sidebar className="w-full px-2" />
            </SheetContent>
       </Sheet>
    )
}   
