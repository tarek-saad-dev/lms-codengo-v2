"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Award, BookOpen, Clock, Zap, PencilLine, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getUserCourses } from "@/actions/get-user-courses";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


const LearningStyleQuiz = dynamic(
  () => import("@/components/LearningStyleQuiz"),
  { ssr: false }
);

interface UserProfile {
  id: number;
  name: string;
  email: string;
  date_of_birth: string;
  registration_date: string;
  knowledge_level: number;
  learning_goals: string[];
  knowledge_base: string[];
  learning_style_active_reflective: number;
  learning_style_visual_verbal: number;
  learning_style_sensing_intuitive: number;
  learning_style_sequential_global: number;
  preferred_learning_pace: string;
  engagement_score: number;
  feedback_history: string;
  last_active_date: string;
  Path: string | null;
}



const Card = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className || ''}`}>
    {children}
  </div>
);

const CardHeader = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <div className={`p-6 pb-2 ${className || ''}`}>
    {children}
  </div>
);

const CardContent = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <div className={`p-6 pt-2 ${className || ''}`}>
    {children}
  </div>
);

const CardTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-xl font-semibold">{children}</h2>
);

const ProfilePage = () => {
  const { user } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userCourses, setUserCourses] = useState<Awaited<ReturnType<typeof getUserCourses>> | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    date_of_birth: '',
  });
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.emailAddresses[0]?.emailAddress) {
        try {
          const [profileResponse, coursesResponse] = await Promise.all([
            fetch(`https://graduation-learners-module-backend.vercel.app/api/profile?email=${user.emailAddresses[0].emailAddress}`),
            getUserCourses()
          ]);
          const profileData = await profileResponse.json();
          setProfile(profileData);
          setUserCourses(coursesResponse);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  // Wait for both user and profile data to be available
  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!profile) {
    return <div className="flex min-h-screen items-center justify-center">Profile not found</div>;
  }
  return (
    <div className="flex min-h-screen">
      <div className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-gray-500">Manage your account and learning preferences</p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* User Profile Card */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mx-auto sm:mx-0">
                    {user && (
                      <Image 
                        src={user.imageUrl || "/placeholder-avatar.png"}
                        alt={user.fullName || "Profile"} 
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-sm text-gray-500">Name</label>
                        <p className="text-lg font-medium">{profile?.name ?? 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Email</label>
                        <p className="text-lg font-medium">{profile?.email ?? 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Date of Birth</label>
                        <p className="text-lg font-medium">{profile?.date_of_birth ? new Date(profile.date_of_birth).toISOString().split('T')[0] : 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Member since</label>
                        <p className="text-lg font-medium">{profile?.registration_date ? new Date(profile.registration_date).toISOString().split('T')[0] : 'Not set'}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button 
                        variant="primaryOutline" 
                        className="gap-2"
                        onClick={() => {
                          setEditForm({
                            name: profile?.name || '',
                            date_of_birth: profile?.date_of_birth ? new Date(profile.date_of_birth).toISOString().split('T')[0] : '',
                          });
                          setShowEditProfile(true);
                        }}
                      >
                        <PencilLine className="h-4 w-4" />
                        Edit Profile
                      </Button>
                    </div>

                    <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Profile</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                              id="name"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="date_of_birth">Date of Birth</Label>
                            <Input
                              id="date_of_birth"
                              type="date"
                              value={editForm.date_of_birth}
                              onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="primaryOutline"
                            onClick={() => setShowEditProfile(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={async () => {
                              if (!user?.emailAddresses[0]?.emailAddress) return;
                              
                              try {
                                const response = await fetch(
                                  `https://graduation-learners-module-backend.vercel.app/api/profile/${user.emailAddresses[0].emailAddress}`,
                                  {
                                    method: 'PUT',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      name: editForm.name,
                                      date_of_birth: editForm.date_of_birth,
                                    }),
                                  }
                                );

                                if (response.ok) {
                                  setProfile(prev => prev ? {
                                    ...prev,
                                    name: editForm.name,
                                    date_of_birth: editForm.date_of_birth,
                                  } : null);
                                  setShowEditProfile(false);
                                }
                              } catch (error) {
                                console.error('Error updating profile:', error);
                              }
                            }}
                          >
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Learning Stats Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Learning Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 items-center">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Knowledge Level</div>
                    <div className="font-bold text-xl">{profile?.knowledge_level ?? 0}/10</div>
                  </div>
                </div>
                
                <div className="flex gap-2 items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Learning Goals</div>
                    <div className="font-bold text-xl">{profile?.learning_goals?.length ?? 0}</div>
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Award className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Engagement Score</div>
                    <div className="font-bold text-xl">{Math.round((profile?.engagement_score ?? 0) * 100)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Learning Style Section */}
          <div className="mb-8">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle>Learning Style Preferences</CardTitle>
                <Button variant="secondary" className="gap-2" onClick={() => setShowQuiz(true)}>
                  <PencilLine className="h-4 w-4" />
                  Take Assessment
                </Button>

                <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
                  <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Learning Style Assessment</DialogTitle>
                      <Button 
                        variant="ghost" 
                        className="absolute right-4 top-4" 
                        onClick={() => setShowQuiz(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </DialogHeader>
                    <LearningStyleQuiz />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>
    <h3 className="font-medium mb-3 text-lg">Primary Learning Style</h3>
    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
      <div className="font-semibold text-lg text-emerald-600 mb-2">
        {(profile?.learning_style_visual_verbal ?? 0) > 0.5 ? 'Visual Learner' : 'Verbal Learner'}
      </div>
      <p className="text-gray-600">
        {(profile?.learning_style_visual_verbal ?? 0) > 0.5 
          ? "You excel at learning through visual aids like images, diagrams, and charts. We will prioritize visual content such as videos, diagrams, and infographics in your learning path."
          : "You thrive on verbal communication, whether through reading or listening. Your learning will focus on written materials and audio resources such as podcasts and lectures."}
      </p>
    </div>
  </div>

  <div>
    <h3 className="font-medium mb-3 text-lg">Secondary Learning Style</h3>
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <div className="font-semibold text-lg text-blue-600 mb-2">
        {(profile?.learning_style_active_reflective ?? 0) > 0.5 ? 'Active Learner' : 'Reflective Learner'}
      </div>
      <p className="text-gray-600">
        {(profile?.learning_style_active_reflective ?? 0) > 0.5
          ? "You learn best through hands-on experience and active participation. We will include interactive exercises, group activities, and real-world scenarios in your learning path."
          : "You excel at learning by thinking things through and reflecting. Your learning will include opportunities for observation, independent analysis, and quiet reflection."}
      </p>
    </div>
  </div>

  <div>
    <h3 className="font-medium mb-3 text-lg">Learning Approach</h3>
    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
      <div className="font-semibold text-lg text-purple-600 mb-2">
        {(profile?.learning_style_sensing_intuitive ?? 0) > 0.5 ? 'Sensing Learner' : 'Intuitive Learner'}
      </div>
      <p className="text-gray-600">
        {(profile?.learning_style_sensing_intuitive ?? 0) > 0.5
          ? "You prefer learning through practical examples, hands-on activities, and real-world applications. Your learning will focus on concrete details and step-by-step instructions."
          : "You enjoy exploring abstract concepts and theoretical ideas. We will include more conceptual discussions, focusing on patterns, theories, and relationships between ideas."}
      </p>
    </div>
  </div>



  <div>
    <h3 className="font-medium mb-3 text-lg">Information Processing</h3>
    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
      <div className="font-semibold text-lg text-orange-600 mb-2">
        {(profile?.learning_style_sequential_global ?? 0) > 0.5 ? 'Sequential Learner' : 'Global Learner'}
      </div>
      <p className="text-gray-600">
        {(profile?.learning_style_sequential_global ?? 0) > 0.5
          ? "You prefer learning in a structured, step-by-step manner with clear organization. We will present information in a logical sequence, building concepts gradually."
          : "You grasp the big picture quickly and make connections across different topics. We will provide overarching themes and holistic views to give you a broader understanding."}
      </p>
    </div>
  </div>
</div>


                <div className="mt-6">
                  <h3 className="font-medium mb-3 text-lg">Learning time preference</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-800">Learning Pace: {profile?.preferred_learning_pace ?? 'Not set'}</span>
                  </div>
                  <p className="text-gray-600">{profile?.feedback_history ?? 'No feedback available'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Progress */}
          <div>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Current Course Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {userCourses?.courses.map((course) => (
                    <div key={course.id}>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">{course.title}</h3>
                        <span className="text-sm text-gray-500">{course.progress}% complete</span>
                      </div>
                      <Progress value={course.progress} className="h-2 bg-gray-200" />
                      <div className="mt-2 text-sm text-gray-600">
                        {course.progress === 100 ? 'Completed' : course.progress === 0 ? 'Not Started Yet' : 'In Progress'}
                      </div>
                    </div>
                  ))}
                  {(!userCourses?.courses || userCourses.courses.length === 0) && (
                    <div className="text-center text-gray-500 py-4">
                      No courses enrolled yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
