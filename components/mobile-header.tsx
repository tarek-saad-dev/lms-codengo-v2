import MobileSidebar from "./mobile-sidebar";

export default function MobileHeader() {
    return (
        <nav className="bg-green-500 h-[50px] w-full px-6 lg:hidden fixed top-0 left-0 flex items-center">
            <MobileSidebar />
        </nav>
    )
}
