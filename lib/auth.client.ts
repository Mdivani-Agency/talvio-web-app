import { createAuthClient } from "better-auth/react";
import { nextCookies } from 'better-auth/next-js';
import { magicLinkClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_AUTH_BASE_URL,
    fetchOptions: {
        onSuccess: (ctx) => {
            const authToken = ctx.response.headers.get("set-auth-token") // get the token from the response headers

            if(authToken){
              document.cookie = `bearer_token=${authToken}; path=/;sameSite=strict`;

              if(typeof window !== 'undefined'){
                localStorage.setItem("bearer_token", authToken);
              }
            }
        }
    },
    plugins: [
        magicLinkClient(),
        nextCookies(),
    ],
});
