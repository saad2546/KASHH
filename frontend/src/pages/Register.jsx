import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "../firebase";
import Navbar from "../components/Navbar";

import { Button } from "../components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "../components/ui/field";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const [input, setInput] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setInput((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        input.email,
        input.password
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: input.name,
      });

      // OPTIONAL: Save user data to Firestore
      /*
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: input.name,
        email: input.email,
        role: "admin",
        createdAt: serverTimestamp(),
      });
      */

      toast.success("Registration successful!");
      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="flex items-center justify-center min-h-screen px-4 py-24 bg-slate-50">
        <Card className="w-full max-w-md border shadow-md bg-white/80 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Register</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={(e) => e.preventDefault()}>
              <FieldGroup>
                <FieldSet>
                  <FieldLegend className="text-center">
                    Create new account
                  </FieldLegend>

                  <FieldDescription className="text-center">
                    Fill in the details to create your account
                  </FieldDescription>

                  <FieldGroup className="mt-4">
                    <Field>
                      <FieldLabel>Full Name</FieldLabel>
                      <Input
                        type="text"
                        name="name"
                        placeholder="John Doe"
                        value={input.name}
                        onChange={handleChange}
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Email</FieldLabel>
                      <Input
                        type="email"
                        name="email"
                        placeholder="john@example.com"
                        value={input.email}
                        onChange={handleChange}
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Password</FieldLabel>
                      <Input
                        type="password"
                        name="password"
                        placeholder="Enter password"
                        value={input.password}
                        onChange={handleChange}
                        required
                      />
                    </Field>
                  </FieldGroup>
                </FieldSet>

                <FieldGroup className="pt-6">
                  <Button
                    type="button"
                    onClick={handleRegister}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-800 text-white w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Register"
                    )}
                  </Button>
                </FieldGroup>

                <div className="text-center mt-4 text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <span
                    className="text-primary cursor-pointer hover:underline font-medium"
                    onClick={() => navigate("/login")}
                  >
                    Login here
                  </span>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
