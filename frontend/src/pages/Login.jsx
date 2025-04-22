import Form from "../components/Form";
import "../styles/Login.css";

function Login() {
  return <Form route="/api/token/" method="login" />;
}

export default Login;
