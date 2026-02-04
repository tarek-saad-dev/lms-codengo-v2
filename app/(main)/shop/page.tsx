"use client";

import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Coins, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { buyHeartsAction, spinWheelAction, getShopData } from '@/actions/shop';

export default function Shop() {
  const [coins, setCoins] = useState(0);
  const [hearts, setHearts] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      const data = await getShopData();
      if (data) {
        setCoins(data.coins);
        setHearts(data.hearts);
      }
    };
    loadUserData();
  }, []);

  // Prices for heart refills
  const prices = {
    oneHeart: 2,
    threeHearts: 6,
    fiveHearts: 10
  };

  const buyHearts = async (amount: number, price: number) => {
    const result = await buyHeartsAction(amount, price);

    if (result.success && result.data) {
      setCoins(result.data.coins);
      setHearts(result.data.hearts);
      toast.success(`You bought ${amount} heart${amount > 1 ? 's' : ''}!`);
    } else {
      toast.error(result.error || "Failed to purchase hearts");
    }
  };

  const spinWheel = async () => {
    if (coins >= 10) {
      setSpinning(true);
      setPrize(null);
      
      // Simulate wheel spinning
      setTimeout(async () => {
        const result = await spinWheelAction();

        if (result.success && result.data) {
          setPrize(result.data.prize);
          setCoins(result.data.currentCoins);
          setHearts(result.data.currentHearts);
          toast.success(`You won: ${result.data.prize}!`);
        } else {
          toast.error(result.error || "Failed to spin the wheel");
        }

        setSpinning(false);
      }, 3000);
    } else {
      toast.error("You need 10 coins to spin the wheel!");
    }
  };

  return (
    <div className="flex min-h-screen bg-app-gray-light">

      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Shop</h1>
          <p className="text-gray-600">Get more resources to boost your learning!</p>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <Card className="bg-white shadow-sm w-48">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-app-yellow" />
                <span>Coins</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-app-yellow">{coins}</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm w-48">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-app-red" />
                <span>Hearts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-app-red">{hearts}</p>
            </CardContent>
          </Card>
        </div>

        {/* Hearts Section */}
        <Card className="mb-8 bg-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Heart className="h-6 w-6 text-app-red" />
              Refill Hearts
            </CardTitle>
            <CardDescription>Use your coins to get more hearts</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-app-gray-light hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex justify-center">
                  <Heart className="h-10 w-10 text-app-red" />
                </CardTitle>
                <CardDescription className="text-center font-medium text-lg">1 Heart</CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4 text-app-yellow" />
                  <span className="font-bold">{prices.oneHeart}</span>
                </div>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => buyHearts(1, prices.oneHeart)}
                  disabled={coins < prices.oneHeart}
                >
                  Buy
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-app-gray-light hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex justify-center space-x-1">
                  <Heart className="h-10 w-10 text-app-red" />
                  <Heart className="h-10 w-10 text-app-red" />
                  <Heart className="h-10 w-10 text-app-red" />
                </CardTitle>
                <CardDescription className="text-center font-medium text-lg">3 Hearts</CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4 text-app-yellow" />
                  <span className="font-bold">{prices.threeHearts}</span>
                </div>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => buyHearts(3, prices.threeHearts)}
                  disabled={coins < prices.threeHearts}
                >
                  Buy
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-app-gray-light hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex justify-center flex-wrap gap-1">
                  <Heart className="h-8 w-8 text-app-red" />
                  <Heart className="h-8 w-8 text-app-red" />
                  <Heart className="h-8 w-8 text-app-red" />
                  <Heart className="h-8 w-8 text-app-red" />
                  <Heart className="h-8 w-8 text-app-red" />
                </CardTitle>
                <CardDescription className="text-center font-medium text-lg">5 Hearts</CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4 text-app-yellow" />
                  <span className="font-bold">{prices.fiveHearts}</span>
                </div>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => buyHearts(5, prices.fiveHearts)}
                  disabled={coins < prices.fiveHearts}
                >
                  Buy
                </Button>
              </CardFooter>
            </Card>
          </CardContent>
        </Card>

        {/* Prize Wheel Section */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Gift className="h-6 w-6 text-app-blue" />
              Prize Wheel
            </CardTitle>
            <CardDescription>Spin the wheel and win amazing prizes!</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative mb-8">
              <div className={`w-64 h-64 rounded-full border-4 border-app-blue overflow-hidden relative ${spinning ? 'animate-spin' : ''}`}>
                <div style={{ background: 'conic-gradient(from 0deg, #22C55E 0deg 45deg, #F59E0B 45deg 90deg, #EF4444 90deg 135deg, #0EA5E9 135deg 180deg, #D946EF 180deg 225deg, #22C55E 225deg 270deg, #F59E0B 270deg 315deg, #EF4444 315deg 360deg)' }} className="w-full h-full flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center z-10">
                    <Gift className="h-8 w-8 text-app-blue" />
                  </div>
                </div>
              </div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 w-6 h-8 bg-app-blue clip-path-triangle"></div>
            </div>
            
            {prize && (
              <div className="mb-4 text-center">
                <h3 className="text-xl font-bold mb-2">You won!</h3>
                <div className="bg-app-green-light text-app-green py-2 px-4 rounded-md font-bold">
                  {prize}
                </div>
              </div>
            )}

            <div className="flex flex-col items-center mt-4">
              <p className="flex items-center gap-2 mb-2">
                <Coins className="h-5 w-5 text-app-yellow" />
                <span className="font-bold">10 coins per spin</span>
              </p>
              <Button 
                onClick={spinWheel} 
                disabled={spinning || coins < 10}
                className="w-32"
              >
                {spinning ? "Spinning..." : "Spin"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
