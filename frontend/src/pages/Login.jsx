import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Login = () => {
  const [input, setInput] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(
        auth,
        input.email,
        input.password
      );

      toast.success("Login successful");
      navigate("/app");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen px-4 pt-16 bg-slate-50">
        <Card className="w-full max-w-md border border-border shadow-md bg-card/40 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl font-bold">Login</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={(e) => e.preventDefault()}>
              <FieldGroup>
                <FieldSet>
                  <FieldLegend className="text-center">
                    Login to your account
                  </FieldLegend>
                  <FieldDescription className="text-center">
                    Enter your credentials to continue
                  </FieldDescription>

                  <FieldGroup className="mt-4">
                    <Field>
                      <FieldLabel htmlFor="login-email">
                        Email
                      </FieldLabel>
                      <Input
                        id="login-email"
                        type="email"
                        name="email"
                        placeholder="patel@gmail.com"
                        value={input.email}
                        onChange={handleChange}
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="login-password">
                        Password
                      </FieldLabel>
                      <Input
                        id="login-password"
                        type="password"
                        name="password"
                        placeholder="Enter your password"
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
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-800 text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </FieldGroup>

                <div className="text-center mt-4 text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <span
                    className="text-primary cursor-pointer hover:underline font-medium"
                    onClick={() => navigate("/register")}
                  >
                    Register here
                  </span>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Login;
