import { Metadata } from "next";
import SigninPage from "../_components/SiginPage";

export const metadata: Metadata = {
  title: "Signin",
  description: "Sign in page for CIDE",
};

const Signin = () => {
  return <SigninPage />;
};

export default Signin;
