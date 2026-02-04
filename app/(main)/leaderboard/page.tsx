import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Medal, Trophy, Award, Star, Zap, BookOpen } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getLeaderboard } from "@/actions/get-leaderboard";

interface LeaderboardUser {
  id: string;
  name: string;
  xp: number;
  rank: number;
  avatar: string;
  streak: number;
  courses: number;
  isCurrentUser: boolean;
}

export default async function LeaderboardPage() {
  const users: LeaderboardUser[] = await getLeaderboard();
  const topThree = users.slice(0, 3);

  return (
    <div className="flex-1 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
          <p className="text-gray-500">See who&apos;s leading the way in learning achievement</p>
        </header>

        {/* Top 3 podium - festive look */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-6">Top Achievers</h2>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-end">
            {/* Second Place */}
            <div className="flex-1 order-2 md:order-1">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-app-blue mb-2">
                    <Avatar className="w-full h-full">
                      <AvatarImage src={topThree[1]?.avatar} alt={topThree[1]?.name} />
                      <AvatarFallback>{topThree[1]?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-app-blue text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                      <Medal className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="font-medium text-center mt-2">{topThree[1]?.name}</p>
                  <p className="text-app-blue font-bold text-center">{topThree[1]?.xp.toLocaleString()} XP</p>
                </div>
                <div className="h-16 w-16 bg-app-blue rounded-t-lg mt-3 flex items-end justify-center pb-2">
                  <span className="text-white font-bold text-xl">2</span>
                </div>
              </div>
            </div>

            {/* First Place */}
            <div className="flex-1 order-1 md:order-2">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-app-green mb-2 shadow-xl">
                    <Avatar className="w-full h-full">
                      <AvatarImage src={topThree[0]?.avatar} alt={topThree[0]?.name} />
                      <AvatarFallback>{topThree[0]?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-app-green text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
                      <Trophy className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-full">
                    <svg className="w-full h-8" viewBox="0 0 100 20">
                      <path d="M50 0 L100 20 L0 20 Z" fill="#22C55E" />
                    </svg>
                    <Star className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-400 h-5 w-5" />
                  </div>
                  <p className="font-bold text-center mt-2">{topThree[0]?.name}</p>
                  <p className="text-app-green font-bold text-center text-lg">{topThree[0]?.xp.toLocaleString()} XP</p>
                </div>
                <div className="h-48 w-28 bg-app-green rounded-t-lg mt-3 flex items-end justify-center pb-2">
                  <span className="text-white font-bold text-2xl">1</span>
                </div>
              </div>
            </div>

            {/* Third Place */}
            <div className="flex-1 order-3">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-app-yellow mb-2">
                    <Avatar className="w-full h-full">
                      <AvatarImage src={topThree[2]?.avatar} alt={topThree[2]?.name} />
                      <AvatarFallback>{topThree[2]?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-app-yellow text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg">
                      <Award className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="font-medium text-center mt-2">{topThree[2]?.name}</p>
                  <p className="text-app-yellow font-bold text-center">{topThree[2]?.xp.toLocaleString()} XP</p>
                </div>
                <div className="h-16 w-16 bg-app-yellow rounded-t-lg mt-3 flex items-end justify-center pb-2">
                  <span className="text-white font-bold text-xl">3</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Leaderboard Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Full Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">XP</TableHead>
                  <TableHead className="text-right">Streak</TableHead>
                  <TableHead className="text-right">Courses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow 
                    key={user.id}
                    className={user.isCurrentUser ? "bg-app-green-light border-l-4 border-app-green" : ""}
                  >
                    <TableCell className="font-medium">
                      {index === 0 ? (
                        <div className="bg-app-green text-white w-7 h-7 rounded-full flex items-center justify-center">
                          1
                        </div>
                      ) : index === 1 ? (
                        <div className="bg-app-blue text-white w-7 h-7 rounded-full flex items-center justify-center">
                          2
                        </div>
                      ) : index === 2 ? (
                        <div className="bg-app-yellow text-white w-7 h-7 rounded-full flex items-center justify-center">
                          3
                        </div>
                      ) : (
                        <div className="text-gray-500 px-2">{index + 1}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium flex items-center gap-2">
                          {user.name}
                          {user.isCurrentUser && (
                            <Badge variant="outline" className="bg-app-green-light text-app-green border-app-green">
                              You
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {user.xp.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <div className="text-app-green">
                          <Zap className="inline-block h-4 w-4" />
                        </div>
                        <span>{user.streak} days</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <div className="text-app-blue">
                          <BookOpen className="inline-block h-4 w-4" />
                        </div>
                        <span>{user.courses}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
