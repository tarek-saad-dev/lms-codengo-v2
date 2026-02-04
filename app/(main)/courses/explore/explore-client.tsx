'use client';

import { useState } from 'react';
import { enrollInCourses } from './actions';
import Image from 'next/image';
import { Search, ShoppingCart, BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Toaster } from '@/components/ui/toaster';

interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  xp: number;
  image: string;
  category: string;
  demo: string | null;
}

interface ExploreClientProps {
  initialCourses: Course[];
  categories: string[];
}

const truncateWords = (text: string, wordLimit: number) => {
  const words = text.split(' ');
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(' ') + '...';
};

export default function ExploreClient({ initialCourses, categories }: ExploreClientProps) {
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState('all');
  const { toast } = useToast();

  const filteredCourses = initialCourses.filter(course => {
    // Filter by search query
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by category
    const matchesCategory = currentCategory === 'all' || course.category === currentCategory;
    
    return matchesSearch && matchesCategory;
  });

  const addToCart = (course: Course, buttonElement: HTMLElement) => {
    if (!cartItems.find(item => item.id === course.id)) {
      // Create floating element
      const floatingEl = document.createElement('div');
      floatingEl.innerHTML = `<div class="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden">
        <img src="${course.image}" alt="${course.title}" class="w-full h-full object-cover" />
      </div>`;
      floatingEl.style.position = 'fixed';
      floatingEl.style.zIndex = '50';
      document.body.appendChild(floatingEl);

      // Get positions
      const buttonRect = buttonElement.getBoundingClientRect();
      const cartIconEl = document.querySelector('.cart-icon');
      const cartRect = cartIconEl?.getBoundingClientRect();

      if (cartRect) {
        // Set initial position
        floatingEl.style.left = `${buttonRect.left}px`;
        floatingEl.style.top = `${buttonRect.top}px`;

        // Animate
        floatingEl.animate([
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(0.5)', opacity: 0.8, offset: 0.8 },
          { transform: 'scale(0.1)', opacity: 0, left: `${cartRect.left}px`, top: `${cartRect.top}px` }
        ], {
          duration: 800,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }).onfinish = () => {
          floatingEl.remove();
          // Update cart and show toast after animation
          setCartItems([...cartItems, course]);
          toast({
            title: '🎉 Added to cart!',
            description: `${course.title} has been added to your cart.`,
          });
        };
      }
    } else {
      toast({
        title: 'Already in cart',
        description: 'This course is already in your cart.',
        variant: 'destructive',
      });
    }
  };

  const removeFromCart = (courseId: number) => {
    setCartItems(cartItems.filter(item => item.id !== courseId));
    toast({
      title: 'Removed from cart',
      description: 'Course has been removed from your cart.',
    });
  };

  const checkout = async () => {
    try {
      const courseIds = cartItems.map(item => item.id);
      const result = await enrollInCourses(courseIds);

      if (result.success) {
        toast({
          title: '🎉 Enrollment successful!',
          description: `You've enrolled in ${cartItems.length} course${cartItems.length > 1 ? 's' : ''}!`,
        });
        setCartItems([]);
        setCartOpen(false);
      } else {
        toast({
          title: 'Enrollment failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Enrollment failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-full max-w-[912px] mx-auto px-3">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-700">
          Explore Courses
        </h1>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input 
              className="pl-10" 
              placeholder="Search courses..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ShoppingCart size={24} onClick={() => setCartOpen(true)} className="cursor-pointer cart-icon" />
        </div>
      </div>
      
      <Tabs defaultValue="all" className="mt-6" onValueChange={setCurrentCategory}>
        <TabsList>
          <TabsTrigger value="all">All Categories</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="overflow-hidden">
            <div className="relative h-40 bg-gray-200">
              <Image
                src={course.image}
                alt={course.title}
                fill
                className="object-cover"
              />
            </div>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-2">{course.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{truncateWords(course.description, 18)}</p>
              <div className="flex justify-between items-center">
                <div className="font-semibold text-green-600">{course.price} coins</div>
                <div className="text-sm text-gray-500">+{course.xp} XP</div>
              </div>
            </CardContent>
            <CardFooter className="border-t p-4 bg-gray-50 flex justify-between gap-2">
              <Button variant="default" size="xs" className="gap-2">
                <BookOpen size={16} />
                Preview
              </Button>
              <Button 
                onClick={(e) => addToCart(course, e.currentTarget)} 
                className="gap-2"
                size="xs"
                variant="secondary"
              >
                <Plus size={16} />
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent>
          <SheetHeader>
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} className="text-green-600" />
              <SheetTitle>Your Cart</SheetTitle>
              <span className="bg-app-green text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartItems.length}
              </span>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-6">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                <ShoppingCart size={48} strokeWidth={1} className="mb-4" />
                <p className="text-center">Your cart is empty</p>
                <p className="text-center text-sm mt-2">Add some courses to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 border-b pb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0 relative">
                      <Image 
                        src={item.image} 
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-medium text-gray-800 truncate">{item.title}</h3>
                        <Button 
                          variant="danger"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="text-green-600 font-medium mt-1">{item.price} coins</div>
                      <div className="text-xs text-gray-500">+{item.xp} XP</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {cartItems.length > 0 && (
            <div className="border-t pt-4 bg-white mt-auto">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Courses</span>
                  <span>{cartItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Coins</span>
                  <span className="font-medium text-green-600">
                    {cartItems.reduce((sum, item) => sum + item.price, 0)} coins
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total XP</span>
                  <span className="font-medium text-blue-500">
                    +{cartItems.reduce((sum, item) => sum + item.xp, 0)} XP
                  </span>
                </div>
              </div>
              <Button className="w-full" onClick={checkout}>
                Enroll Now
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
      <Toaster />
    </div>
  );
}
