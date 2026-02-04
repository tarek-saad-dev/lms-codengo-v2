import { auth } from "@clerk/nextjs/server";


const adminIds = [
  "user_2uxg2XpZJNLUMa3VcdoQLv6sCcb",
];

export const getIsAdmin = async () => {
  const { userId } = await auth();
  if (!userId) {
    return false;
  }
  return adminIds.indexOf(userId) !== -1;
};
