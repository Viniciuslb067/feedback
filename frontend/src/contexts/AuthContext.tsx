import Router from "next/router";
import { createContext, ReactNode, useState, useEffect } from "react";
import { destroyCookie, parseCookies, setCookie } from "nookies";

import { toast } from "react-toastify";
import { api } from "../services/api";

import "react-toastify/dist/ReactToastify.css";

toast.configure();

interface User {
  name: string;
  email?: string;
  role: string;
}

interface SignInCredentials {
  email: string;
  password: string;
}

interface AuthContextData {
  signIn(credentials: SignInCredentials): Promise<void>;
  user: User;
}

interface AuthProvidorProps {
  children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData);

export function signOut() {
  destroyCookie(undefined, "feedback.token");
  Router.push("/");
}

export function AuthProvider({ children }: AuthProvidorProps) {
  const [user, setUser] = useState<User>();

  useEffect(() => {
    const { "feedback.token": token } = parseCookies();

    if (token) {
      api.get("/auth/me/" + token).then((response) => {
        const { name, role } = response.data.user;
        setUser({ name, role });
      });
    }
  }, []);

  async function signIn({ email, password }: SignInCredentials) {
    try {
      const response = await api.post("/auth/authenticate", {
        email,
        password,
      });

      if (response.data.auth === true) {
        const { token, name, role } = response.data;

        setCookie(undefined, "feedback.token", token, {
          maxAge: 60 * 60 * 24 * 1, // 1 dia
          path: "/",
        });

        api.defaults.headers["Authorization"] = `Bearer ${token}`;

        setUser({ name, role });

        Router.push("/dashboard");
      }
      if (response.data.error) {
        const notify = () => toast.error(response.data.error);
        notify();
      }
    } catch (err) {
      alert(err)
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, user }}>
      {children}
    </AuthContext.Provider>
  );
}
