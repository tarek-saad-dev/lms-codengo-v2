"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart, X } from "lucide-react";

interface Course {
  id: number;
  title: string;
  price: number;
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: Course[];
  removeFromCart: (id: number) => void;
  checkout: () => void;
}

const CartSidebar = ({
  isOpen,
  onClose,
  cartItems,
  removeFromCart,
  checkout,
}: CartSidebarProps) => {
  const total = cartItems.reduce((sum, item) => sum + item.price, 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-50 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <ShoppingCart size={24} />
            <h2 className="text-xl font-semibold">Your Cart</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={24} />
          </Button>
        </div>

        {cartItems.length === 0 ? (
          <p className="text-gray-500 text-center mt-8">Your cart is empty</p>
        ) : (
          <>
            <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-app-green">{item.price} coins</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between mb-4">
                <span className="font-semibold">Total:</span>
                <span className="text-app-green font-semibold">
                  {total} coins
                </span>
              </div>
              <Button
                className="w-full"
                onClick={checkout}
              >
                Purchase Courses
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CartSidebar;
